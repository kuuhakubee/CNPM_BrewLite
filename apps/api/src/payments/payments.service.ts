/**
 * PaymentsService – nghiệp vụ thanh toán (VNPay Sandbox & Mock Gateway).
 *
 * Quy trình thanh toán chuẩn VNPay Sandbox:
 * 1. Client gọi POST /payments/create-url { orderId }
 *    -> Backend kiểm tra đơn PENDING, sinh URL thanh toán VNPay có chữ ký HMAC-SHA512.
 *    -> Đơn hàng VẪN Ở TRẠNG THÁI PENDING (tuyệt đối không tự đổi PAID).
 * 2. Khách quét QR / nhập thẻ test NCB + OTP test trên cổng VNPay.
 * 3. VNPay gửi Webhook/IPN tới GET /payments/vnpay-ipn
 *    -> Backend verify chữ ký HMAC-SHA512.
 *    -> Kiểm tra mã đơn, số tiền, trạng thái đơn.
 *    -> Đổi Order.status -> PAID (nếu vnp_ResponseCode == '00') hoặc PAYMENT_FAILED.
 *    -> Trả về { RspCode: '00', Message: 'Confirm Success' } cho VNPay.
 * 4. Khi redirect về ReturnUrl (GET /payments/vnpay-return):
 *    -> Backend verify chữ ký và đồng bộ trạng thái đơn cho giao diện khách hàng.
 */

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateVnpayUrlDto } from './dto/create-vnpay-url.dto';
import { MockPaymentGateway } from './gateway/mock-payment.gateway';
import { VNPayGateway } from './gateway/vnpay.gateway';
import { Order, OrderStatus, Payment, PaymentStatus } from '@prisma/client';
import { assertTransition } from '../orders/order-state-machine';

@Injectable()
export class PaymentsService {
  private readonly mockGateway = new MockPaymentGateway();
  private readonly vnpayGateway = new VNPayGateway();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo URL thanh toán VNPay Sandbox cho đơn hàng PENDING
   */
  async createVnpayPaymentUrl(
    userId: number,
    dto: CreateVnpayUrlDto,
    ipAddr: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng #${dto.orderId}.`);
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền thanh toán đơn này.');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException(
        `Đơn hàng #${dto.orderId} đang ở trạng thái ${order.status}, không thể tạo liên kết thanh toán.`,
      );
    }

    const paymentUrl = this.vnpayGateway.createPaymentUrl({
      orderId: order.id,
      amount: Number(order.total),
      orderInfo: `Thanh toan don hang ${order.code}`,
      ipAddr: ipAddr || '127.0.0.1',
      bankCode: dto.bankCode,
    });

    return {
      orderId: order.id,
      orderCode: order.code,
      amount: Number(order.total),
      paymentUrl,
    };
  }

  /**
   * Xử lý Webhook / IPN từ VNPay (Server-to-Server)
   * Tuyệt đối bảo mật: Verify chữ ký HMAC SHA-512 trước khi cập nhật DB.
   */
  async handleVnpayIpn(query: Record<string, any>) {
    // 1. Kiểm tra chữ ký HMAC
    const isValidSignature = this.vnpayGateway.verifyChecksum(query);
    if (!isValidSignature) {
      return { RspCode: '97', Message: 'Fail checksum' };
    }

    // 2. Tìm đơn hàng tương ứng
    const txnRef = String(query.vnp_TxnRef || '');
    const orderId = parseInt(txnRef.split('_')[0], 10);

    if (isNaN(orderId)) {
      return { RspCode: '01', Message: 'Order not found' };
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return { RspCode: '01', Message: 'Order not found' };
    }

    // 3. Kiểm tra số tiền
    const vnpAmount = Number(query.vnp_Amount);
    const expectedAmount = Math.round(Number(order.total) * 100);
    if (vnpAmount !== expectedAmount) {
      return { RspCode: '04', Message: 'Amount invalid' };
    }

    // 4. Kiểm tra trạng thái đơn
    if (order.status === 'PAID') {
      return { RspCode: '02', Message: 'Order already confirmed' };
    }

    const isSuccess = query.vnp_ResponseCode === '00';
    const newOrderStatus: OrderStatus = isSuccess ? 'PAID' : 'PAYMENT_FAILED';
    const paymentStatus: PaymentStatus = isSuccess ? 'SUCCESS' : 'FAILED';
    const idempotencyKey = `vnp_${query.vnp_TransactionNo || txnRef}`;

    try {
      assertTransition(order.status, newOrderStatus);

      await this.prisma.$transaction([
        this.prisma.payment.create({
          data: {
            orderId: order.id,
            idempotencyKey,
            amount: order.total,
            method: 'CARD',
            status: paymentStatus,
            transactionRef: String(query.vnp_TransactionNo || txnRef),
            failureReason: isSuccess
              ? null
              : `VNPAY_ERR_${query.vnp_ResponseCode}`,
          },
        }),
        this.prisma.order.update({
          where: { id: order.id },
          data: { status: newOrderStatus },
        }),
        this.prisma.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: order.status,
            toStatus: newOrderStatus,
            actorId: null, // Hệ thống cập nhật qua Webhook
          },
        }),
      ]);

      // ── 4. Loyalty: Cộng điểm sau khi PAID ───────────────────────────
      if (isSuccess) {
        try {
          const points = Math.floor(Number(order.total) / 1000);
          if (points > 0 && this.prisma.user && this.prisma.loyaltyTransaction) {
            await this.prisma.$transaction([
              this.prisma.user.update({
                where: { id: order.userId },
                data: { loyaltyPoints: { increment: points } },
              }),
              this.prisma.loyaltyTransaction.create({
                data: {
                  userId: order.userId,
                  orderId: order.id,
                  type: 'EARN',
                  points,
                  description: `Tích điểm đơn hàng #${order.id}: +${points} điểm`,
                },
              }),
            ]);
          }
        } catch (loyaltyErr) {
          // Ghi nhận lỗi nhưng không chặn webhook xác nhận thanh toán
          console.warn('Lỗi cộng điểm loyalty:', loyaltyErr);
        }
      }

      return { RspCode: '00', Message: 'Confirm Success' };
    } catch (err: any) {
      // Đã được xử lý hoặc lỗi transition
      if (err?.code === 'P2002') {
        return { RspCode: '02', Message: 'Order already confirmed' };
      }
      return { RspCode: '99', Message: 'Unknown error' };
    }
  }

  /**
   * Xử lý khi VNPay redirect người dùng về Return URL (Browser Return)
   */
  async handleVnpayReturn(query: Record<string, any>) {
    const isValidSignature = this.vnpayGateway.verifyChecksum(query);
    if (!isValidSignature) {
      return {
        success: false,
        message: 'Chữ ký VNPay không hợp lệ (Fail Checksum).',
      };
    }

    const txnRef = String(query.vnp_TxnRef || '');
    const orderId = parseInt(txnRef.split('_')[0], 10);
    const isSuccess = query.vnp_ResponseCode === '00';

    if (isNaN(orderId)) {
      return {
        success: false,
        message: 'Mã đơn hàng không hợp lệ.',
      };
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (!order) {
      return {
        success: false,
        message: 'Không tìm thấy thông tin đơn hàng.',
      };
    }

    // Nếu đơn hàng đang PENDING mà chưa kịp nhận IPN, đồng bộ trạng thái an toàn
    if (order.status === 'PENDING') {
      const newOrderStatus: OrderStatus = isSuccess ? 'PAID' : 'PAYMENT_FAILED';
      const paymentStatus: PaymentStatus = isSuccess ? 'SUCCESS' : 'FAILED';
      const idempotencyKey = `vnp_${query.vnp_TransactionNo || txnRef}`;

      try {
        await this.prisma.$transaction([
          this.prisma.payment.create({
            data: {
              orderId: order.id,
              idempotencyKey,
              amount: order.total,
              method: 'CARD',
              status: paymentStatus,
              transactionRef: String(query.vnp_TransactionNo || txnRef),
              failureReason: isSuccess
                ? null
                : `VNPAY_ERR_${query.vnp_ResponseCode}`,
            },
          }),
          this.prisma.order.update({
            where: { id: order.id },
            data: { status: newOrderStatus },
          }),
          this.prisma.orderStatusHistory.create({
            data: {
              orderId: order.id,
              fromStatus: order.status,
              toStatus: newOrderStatus,
              actorId: order.userId,
            },
          }),
        ]);
        return {
          success: isSuccess,
          orderId: order.id,
          orderCode: order.code,
          orderStatus: newOrderStatus,
          transactionRef: query.vnp_TransactionNo,
          message: isSuccess ? 'Thanh toán thành công' : 'Thanh toán thất bại',
        };
      } catch (e) {
        // Đã cập nhật song song bởi IPN
      }
    }

    const latestOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    return {
      success: latestOrder?.status === 'PAID',
      orderId: order.id,
      orderCode: order.code,
      orderStatus: latestOrder?.status || order.status,
      transactionRef: query.vnp_TransactionNo,
      message:
        latestOrder?.status === 'PAID'
          ? 'Thanh toán thành công'
          : 'Thanh toán thất bại',
    };
  }

  /**
   * Phương thức processPayment cũ (giữ cho backward-compatibility & unit test)
   */
  async processPayment(userId: number, dto: CreatePaymentDto) {
    const existing = await this.prisma.payment.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
      include: { order: true },
    });
    if (existing) {
      return {
        idempotent: true,
        payment: existing,
        order: existing.order,
        orderStatus: existing.order.status,
      };
    }

    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });
    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng #${dto.orderId}.`);
    }
    if (order.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền thanh toán đơn này.');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException(
        `Đơn hàng đang ở trạng thái ${order.status}, không thể thanh toán.`,
      );
    }

    const gatewayResult = await this.mockGateway.charge({
      orderId: dto.orderId,
      amount: dto.amount,
      method: dto.method,
      idempotencyKey: dto.idempotencyKey,
    });

    const newOrderStatus: OrderStatus = gatewayResult.success
      ? 'PAID'
      : 'PAYMENT_FAILED';
    const paymentStatus: PaymentStatus = gatewayResult.success
      ? 'SUCCESS'
      : 'FAILED';

    assertTransition(order.status, newOrderStatus);

    let payment: Payment;
    let updatedOrder: Order;

    try {
      const [newPayment, newOrder] = await this.prisma.$transaction([
        this.prisma.payment.create({
          data: {
            orderId: dto.orderId,
            idempotencyKey: dto.idempotencyKey,
            amount: dto.amount,
            method: dto.method,
            status: paymentStatus,
            transactionRef: gatewayResult.transactionRef ?? null,
            failureReason: gatewayResult.failureReason ?? null,
          },
        }),
        this.prisma.order.update({
          where: { id: dto.orderId },
          data: { status: newOrderStatus },
        }),
        this.prisma.orderStatusHistory.create({
          data: {
            orderId: dto.orderId,
            fromStatus: order.status,
            toStatus: newOrderStatus,
            actorId: userId,
          },
        }),
      ]);
      payment = newPayment;
      updatedOrder = newOrder;
    } catch (err: any) {
      if (err?.code === 'P2002') {
        const found = await this.prisma.payment.findUnique({
          where: { idempotencyKey: dto.idempotencyKey },
          include: { order: true },
        });
        return {
          idempotent: true,
          payment: found,
          order: found?.order,
          orderStatus: found?.order?.status,
        };
      }
      throw err;
    }

    return {
      idempotent: false,
      payment,
      order: updatedOrder,
      orderStatus: newOrderStatus,
    };
  }
}
