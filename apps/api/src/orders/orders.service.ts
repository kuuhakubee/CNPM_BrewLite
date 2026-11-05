/**
 * OrdersService
 * ─────────────
 * Hiện thực 4 nghiệp vụ cốt lõi theo Task 10:
 *
 * 1. Order State Machine – assertTransition() chặn chuyển trạng thái sai.
 * 2. Idempotent createOrder – trùng idempotency-key => trả đơn cũ, không tạo mới.
 * 3. Kiểm soát tồn kho (Optimistic Locking) – SELECT version → trừ stock trong
 *    cùng một transaction, kiểm tra version không đổi (WHERE id=X AND version=V).
 *    Nếu race condition → ném ConflictException → client retry.
 * 4. Khuyến mãi & Điểm thưởng (Loyalty) – áp mã giảm giá PERCENT/FIXED_AMOUNT,
 *    cộng 1 point / 1.000 VNĐ sau khi đơn chuyển sang PAID.
 */

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';
import { assertTransition } from './order-state-machine';
import { CreateOrderWithItemsDto } from './dto/create-order-with-items.dto';

/** Điểm thưởng: 1 điểm cho mỗi 1.000 VNĐ thanh toán */
const POINTS_PER_1000_VND = 1;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────────────
  // 1 & 2: Tạo đơn hàng (Idempotent + Inventory Lock)
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Tạo đơn hàng mới với idempotency và kiểm soát tồn kho.
   *
   * @param userId       ID người dùng đang đặt hàng
   * @param dto          Thông tin đơn hàng
   * @param idempotencyKey UUID do client tạo; nếu đã tồn tại => trả đơn cũ
   */
  async createOrder(
    userId: number,
    dto: CreateOrderWithItemsDto,
    idempotencyKey?: string,
  ) {
    // ── 2. Idempotency Check ──────────────────────────────────────────
    if (idempotencyKey) {
      const existingOrder = await this.prisma.order.findFirst({
        where: { idempotencyKey },
        include: { items: true, payments: true },
      });
      if (existingOrder) {
        return { idempotent: true, order: existingOrder };
      }
    }

    // ── 3. Áp mã khuyến mãi (nếu có) ────────────────────────────────
    let promotionId: number | null = null;
    let discount = dto.discount ?? 0;
    let total = dto.subtotal - discount;

    if (dto.promotionCode) {
      const promo = await this.validateAndApplyPromotion(
        dto.promotionCode,
        dto.subtotal,
      );
      promotionId = promo.id;
      discount = Number(promo.computedDiscount);
      total = dto.subtotal - discount;
      if (total < 0) total = 0;
    }

    // ── 3. Kiểm soát tồn kho (Optimistic Locking) ────────────────────
    if (dto.items && dto.items.length > 0) {
      await this.deductStockWithOptimisticLock(dto.items);
    }

    // ── Tạo đơn trong transaction ─────────────────────────────────────
    const orderCode = `#${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString(36).toUpperCase()}`;

    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          code: orderCode,
          userId,
          status: 'PENDING',
          subtotal: dto.subtotal,
          discount,
          total,
          promotionId,
          idempotencyKey: idempotencyKey ?? null,
          statusHistory: {
            create: {
              fromStatus: 'PENDING',
              toStatus: 'PENDING',
              actorId: userId,
            },
          },
          ...(dto.items && dto.items.length > 0
            ? {
                items: {
                  create: dto.items.map((item) => ({
                    productId: item.productId,
                    sizeCode: item.sizeCode,
                    productSizeId: item.productSizeId ?? null,
                    qty: item.qty,
                    unitPrice: item.unitPrice,
                    lineTotal: item.lineTotal,
                    ...(item.toppingIds && item.toppingIds.length > 0
                      ? {
                          toppings: {
                            create: item.toppingIds.map((tid) => ({
                              toppingId: tid,
                              price: 0, // snapshot giá topping (đơn giản hoá)
                            })),
                          },
                        }
                      : {}),
                  })),
                },
              }
            : {}),
        },
        include: { items: true },
      });

      // Tăng usedCount của promotion (nếu có)
      if (promotionId) {
        await tx.promotion.update({
          where: { id: promotionId },
          data: { usedCount: { increment: 1 } },
        });
      }

      return newOrder;
    });

    return { idempotent: false, order };
  }

  // ─────────────────────────────────────────────────────────────────────
  // 1: Chuyển trạng thái đơn (State Machine)
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Cập nhật trạng thái đơn hàng theo state machine.
   * Sau khi chuyển sang PAID: cộng điểm loyalty tự động.
   *
   * @param orderId   ID đơn hàng
   * @param newStatus Trạng thái mới (phải hợp lệ theo state machine)
   * @param actorId   ID người thực hiện (staff/admin/system)
   */
  async updateOrderStatus(
    orderId: number,
    newStatus: OrderStatus,
    actorId?: number,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng #${orderId}.`);
    }

    // ── 1. State Machine Guard ────────────────────────────────────────
    assertTransition(order.status, newStatus);

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: newStatus },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: newStatus,
          actorId: actorId ?? null,
        },
      });

      return updated;
    });

    // ── 4. Loyalty: Cộng điểm khi đơn chuyển sang PAID ───────────────
    if (newStatus === 'PAID') {
      await this.awardLoyaltyPoints(orderId, order.userId, Number(order.total));
    }

    return updatedOrder;
  }

  // ─────────────────────────────────────────────────────────────────────
  // 3: Trừ tồn kho với Optimistic Locking
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Trừ stock cho từng sản phẩm trong đơn hàng bằng optimistic locking.
   * Nếu race condition (version không khớp hoặc stock không đủ)
   * => ném ConflictException (HTTP 409), client phải thử lại.
   */
  async deductStockWithOptimisticLock(
    items: Array<{ productId: number; qty: number }>,
  ): Promise<void> {
    // Nhóm theo productId để tính tổng qty
    const qtyMap = new Map<number, number>();
    for (const item of items) {
      qtyMap.set(item.productId, (qtyMap.get(item.productId) ?? 0) + item.qty);
    }

    for (const [productId, qty] of qtyMap) {
      await this.deductOneProduct(productId, qty);
    }
  }

  private async deductOneProduct(
    productId: number,
    qty: number,
  ): Promise<void> {
    // Lấy version hiện tại (snapshot)
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, stock: true, version: true, name: true },
    });

    if (!product) {
      throw new NotFoundException(`Sản phẩm #${productId} không tồn tại.`);
    }

    if (product.stock < qty) {
      throw new ConflictException(
        `Sản phẩm "${product.name}" chỉ còn ${product.stock} trong kho, bạn đặt ${qty}.`,
      );
    }

    // UPDATE với điều kiện version = snapshot => nếu race condition thì count = 0
    const result = await this.prisma.$executeRaw`
      UPDATE products
      SET    stock   = stock - ${qty},
             version = version + 1
      WHERE  id      = ${productId}
        AND  version = ${product.version}
        AND  stock  >= ${qty}
    `;

    if (result === 0) {
      // Version đã thay đổi hoặc stock đã hết do request đồng thời
      throw new ConflictException(
        `Tồn kho sản phẩm #${productId} đã thay đổi đồng thời. Vui lòng thử lại.`,
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // 4a: Áp mã khuyến mãi
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Kiểm tra tính hợp lệ của mã khuyến mãi và tính số tiền giảm.
   * Không ghi vào DB (việc đó được thực hiện bên trong transaction createOrder).
   */
  async validateAndApplyPromotion(
    code: string,
    orderSubtotal: number,
  ): Promise<{ id: number; computedDiscount: number }> {
    const promo = await this.prisma.promotion.findUnique({ where: { code } });

    if (!promo) {
      throw new BadRequestException(`Mã khuyến mãi "${code}" không tồn tại.`);
    }
    if (!promo.isActive) {
      throw new BadRequestException(`Mã khuyến mãi "${code}" đã bị vô hiệu hoá.`);
    }

    const now = new Date();
    if (now < promo.startsAt || now > promo.expiresAt) {
      throw new BadRequestException(`Mã khuyến mãi "${code}" đã hết hạn hoặc chưa đến ngày áp dụng.`);
    }

    if (promo.maxUsage !== null && promo.usedCount >= promo.maxUsage) {
      throw new BadRequestException(`Mã khuyến mãi "${code}" đã hết lượt sử dụng.`);
    }

    if (orderSubtotal < Number(promo.minOrderTotal)) {
      throw new BadRequestException(
        `Đơn hàng tối thiểu ${Number(promo.minOrderTotal).toLocaleString('vi-VN')} VNĐ để áp dụng mã này.`,
      );
    }

    let computedDiscount = 0;
    if (promo.discountType === 'PERCENT') {
      computedDiscount = (orderSubtotal * Number(promo.discountValue)) / 100;
    } else if (promo.discountType === 'FIXED_AMOUNT') {
      computedDiscount = Number(promo.discountValue);
    }
    // FREE_SHIPPING: miễn phí vận chuyển – không áp dụng giảm giá tiền hàng

    return { id: promo.id, computedDiscount };
  }

  // ─────────────────────────────────────────────────────────────────────
  // 4b: Cộng điểm Loyalty
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Cộng điểm tích luỹ cho khách sau khi đơn được PAID.
   * 1 điểm = 1.000 VNĐ (làm tròn xuống).
   */
  async awardLoyaltyPoints(
    orderId: number,
    userId: number,
    paidAmount: number,
  ): Promise<void> {
    const points = Math.floor((paidAmount / 1000) * POINTS_PER_1000_VND);
    if (points <= 0) return;

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { loyaltyPoints: { increment: points } },
      }),
      this.prisma.loyaltyTransaction.create({
        data: {
          userId,
          orderId,
          type: 'EARN',
          points,
          description: `Tích điểm đơn hàng #${orderId}: +${points} điểm`,
        },
      }),
    ]);
  }

  // ─────────────────────────────────────────────────────────────────────
  // Truy vấn đơn hàng
  // ─────────────────────────────────────────────────────────────────────

  async getMyOrders(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { payments: true, items: { include: { product: true } } },
    });
  }

  async getOrderById(orderId: number, userId: number, isAdmin: boolean) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payments: true,
        items: { include: { product: true } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        loyaltyTransactions: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng #${orderId}.`);
    }

    if (order.userId !== userId && !isAdmin) {
      throw new ForbiddenException('Bạn không có quyền xem đơn hàng này.');
    }

    return order;
  }
}
