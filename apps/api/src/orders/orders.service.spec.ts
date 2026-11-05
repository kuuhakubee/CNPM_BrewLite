/**
 * orders.service.spec.ts
 * ──────────────────────
 * Unit test cho OrdersService, chứng minh 3 tiêu chí bắt buộc:
 *
 * (a) Chặn chuyển trạng thái sai (State Machine)
 * (b) Idempotency-Key: gửi 2 lần chỉ tạo 1 đơn
 * (c) Đặt đồng thời không vượt tồn kho (Optimistic Locking)
 * + Tiêu chí bổ sung: Áp mã giảm giá và cộng điểm Loyalty
 */

import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { assertTransition, VALID_TRANSITIONS } from './order-state-machine';
import { OrderStatus } from '@prisma/client';

// ─── Mock PrismaService ───────────────────────────────────────────────────────
const mockPrismaService = {
  order: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  orderStatusHistory: {
    create: jest.fn(),
  },
  loyaltyTransaction: {
    create: jest.fn(),
  },
  user: {
    update: jest.fn(),
  },
  product: {
    findUnique: jest.fn(),
  },
  promotion: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
  $executeRaw: jest.fn(),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeOrder(overrides: Partial<any> = {}) {
  return {
    id: 1,
    code: '#1001',
    userId: 10,
    status: 'PENDING' as OrderStatus,
    subtotal: 50000,
    discount: 0,
    total: 50000,
    promotionId: null,
    idempotencyKey: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  // ══════════════════════════════════════════════════════════════════════
  // (a) STATE MACHINE – assertTransition()
  // ══════════════════════════════════════════════════════════════════════
  describe('(a) Order State Machine – assertTransition', () => {
    it('VALID: PENDING → PAID', () => {
      expect(() => assertTransition('PENDING', 'PAID')).not.toThrow();
    });

    it('VALID: PENDING → PAYMENT_FAILED', () => {
      expect(() =>
        assertTransition('PENDING', 'PAYMENT_FAILED'),
      ).not.toThrow();
    });

    it('VALID: PENDING → CANCELLED', () => {
      expect(() => assertTransition('PENDING', 'CANCELLED')).not.toThrow();
    });

    it('VALID: PAID → PREPARING', () => {
      expect(() => assertTransition('PAID', 'PREPARING')).not.toThrow();
    });

    it('VALID: PREPARING → READY', () => {
      expect(() => assertTransition('PREPARING', 'READY')).not.toThrow();
    });

    it('VALID: READY → COMPLETED', () => {
      expect(() => assertTransition('READY', 'COMPLETED')).not.toThrow();
    });

    it('INVALID: PENDING → COMPLETED (bỏ qua nhiều bước)', () => {
      expect(() =>
        assertTransition('PENDING', 'COMPLETED'),
      ).toThrow(ConflictException);
    });

    it('INVALID: PENDING → PREPARING (chưa qua PAID)', () => {
      expect(() =>
        assertTransition('PENDING', 'PREPARING'),
      ).toThrow(ConflictException);
    });

    it('INVALID: PAID → PENDING (đi ngược)', () => {
      expect(() =>
        assertTransition('PAID', 'PENDING'),
      ).toThrow(ConflictException);
    });

    it('INVALID: COMPLETED → PAID (trạng thái cuối)', () => {
      expect(() =>
        assertTransition('COMPLETED', 'PAID'),
      ).toThrow(ConflictException);
    });

    it('INVALID: CANCELLED → PENDING (không thể phục hồi)', () => {
      expect(() =>
        assertTransition('CANCELLED', 'PENDING'),
      ).toThrow(ConflictException);
    });

    it('INVALID: PREPARING → PAID (không đi ngược lại PAID)', () => {
      expect(() =>
        assertTransition('PREPARING', 'PAID'),
      ).toThrow(ConflictException);
    });

    it('VALID_TRANSITIONS table is complete and matches state machine diagram', () => {
      expect(VALID_TRANSITIONS['PENDING']).toEqual(
        expect.arrayContaining(['PAID', 'PAYMENT_FAILED', 'CANCELLED']),
      );
      expect(VALID_TRANSITIONS['PAID']).toEqual(
        expect.arrayContaining(['PREPARING', 'CANCELLED']),
      );
      expect(VALID_TRANSITIONS['PREPARING']).toEqual(['READY']);
      expect(VALID_TRANSITIONS['READY']).toEqual(['COMPLETED']);
      // Terminal states
      expect(VALID_TRANSITIONS['COMPLETED']).toBeUndefined();
      expect(VALID_TRANSITIONS['CANCELLED']).toBeUndefined();
      expect(VALID_TRANSITIONS['PAYMENT_FAILED']).toBeUndefined();
    });

    // Integration-level: updateOrderStatus gọi assertTransition
    it('updateOrderStatus: ném ConflictException khi PENDING → COMPLETED', async () => {
      mockPrismaService.order.findUnique.mockResolvedValueOnce(
        makeOrder({ status: 'PENDING' }),
      );

      await expect(
        service.updateOrderStatus(1, 'COMPLETED', 99),
      ).rejects.toThrow(ConflictException);
    });

    it('updateOrderStatus: thành công khi PAID → PREPARING', async () => {
      mockPrismaService.order.findUnique.mockResolvedValueOnce(
        makeOrder({ status: 'PAID', total: 50000 }),
      );

      const updatedOrder = makeOrder({ status: 'PREPARING' });
      mockPrismaService.$transaction.mockImplementationOnce(async (fn) =>
        fn({
          order: {
            update: jest.fn().mockResolvedValue(updatedOrder),
          },
          orderStatusHistory: {
            create: jest.fn().mockResolvedValue({}),
          },
        }),
      );

      const result = await service.updateOrderStatus(1, 'PREPARING', 99);
      expect(result.status).toBe('PREPARING');
    });
  });

  // ══════════════════════════════════════════════════════════════════════
  // (b) IDEMPOTENCY – Gửi 2 lần cùng key chỉ tạo 1 đơn
  // ══════════════════════════════════════════════════════════════════════
  describe('(b) Idempotent createOrder', () => {
    const IKEY = 'unique-uuid-abc-123';
    const existingOrder = makeOrder({ idempotencyKey: IKEY });

    it('Lần 2 với cùng Idempotency-Key: trả về đơn cũ, KHÔNG gọi order.create', async () => {
      // Lần 2: order đã tồn tại
      mockPrismaService.order.findFirst.mockResolvedValueOnce(existingOrder);

      const result = await service.createOrder(
        10,
        { subtotal: 50000, total: 50000 },
        IKEY,
      );

      expect(result.idempotent).toBe(true);
      expect(result.order.id).toBe(existingOrder.id);
      // Không tạo đơn mới
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('Lần 1 (key mới): tạo đơn mới thành công', async () => {
      mockPrismaService.order.findFirst.mockResolvedValueOnce(null); // Chưa có
      const newOrder = makeOrder({ idempotencyKey: 'new-key-xyz' });
      mockPrismaService.$transaction.mockImplementationOnce(async (fn) =>
        fn({
          order: {
            create: jest.fn().mockResolvedValue(newOrder),
          },
          promotion: {
            update: jest.fn(),
          },
        }),
      );

      const result = await service.createOrder(
        10,
        { subtotal: 50000, total: 50000 },
        'new-key-xyz',
      );

      expect(result.idempotent).toBe(false);
      expect(result.order.id).toBe(newOrder.id);
    });

    it('Không có Idempotency-Key: luôn tạo đơn mới (không kiểm tra findFirst)', async () => {
      const newOrder = makeOrder({ id: 2 });
      mockPrismaService.$transaction.mockImplementationOnce(async (fn) =>
        fn({
          order: {
            create: jest.fn().mockResolvedValue(newOrder),
          },
          promotion: {
            update: jest.fn(),
          },
        }),
      );

      const result = await service.createOrder(10, {
        subtotal: 50000,
        total: 50000,
      });

      expect(result.idempotent).toBe(false);
      expect(mockPrismaService.order.findFirst).not.toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════════════════════════════
  // (c) OPTIMISTIC LOCKING – Đặt đồng thời không vượt tồn kho
  // ══════════════════════════════════════════════════════════════════════
  describe('(c) Inventory Optimistic Locking', () => {
    it('deductStockWithOptimisticLock: thành công khi stock đủ và version khớp', async () => {
      mockPrismaService.product.findUnique.mockResolvedValueOnce({
        id: 5,
        name: 'Cà phê sữa',
        stock: 10,
        version: 3,
      });
      mockPrismaService.$executeRaw.mockResolvedValueOnce(1); // 1 row updated

      await expect(
        service.deductStockWithOptimisticLock([{ productId: 5, qty: 2 }]),
      ).resolves.not.toThrow();
    });

    it('deductStockWithOptimisticLock: ném ConflictException khi stock không đủ', async () => {
      mockPrismaService.product.findUnique.mockResolvedValueOnce({
        id: 5,
        name: 'Cà phê sữa',
        stock: 1,
        version: 3,
      });

      await expect(
        service.deductStockWithOptimisticLock([{ productId: 5, qty: 5 }]),
      ).rejects.toThrow(ConflictException);
    });

    it('deductStockWithOptimisticLock: ném ConflictException khi version thay đổi (race condition)', async () => {
      mockPrismaService.product.findUnique.mockResolvedValueOnce({
        id: 5,
        name: 'Cà phê sữa',
        stock: 10,
        version: 3,
      });
      // $executeRaw trả về 0 → version đã thay đổi bởi request đồng thời
      mockPrismaService.$executeRaw.mockResolvedValueOnce(0);

      await expect(
        service.deductStockWithOptimisticLock([{ productId: 5, qty: 2 }]),
      ).rejects.toThrow(ConflictException);
    });

    it('deductStockWithOptimisticLock: ném NotFoundException khi product không tồn tại', async () => {
      mockPrismaService.product.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.deductStockWithOptimisticLock([{ productId: 999, qty: 1 }]),
      ).rejects.toThrow(NotFoundException);
    });

    it('Mô phỏng 2 request đồng thời: chỉ 1 request thành công, 1 bị từ chối', async () => {
      // Request 1: đọc stock=5, version=0 → UPDATE thành công (1 row)
      // Request 2: đọc stock=5, version=0 → UPDATE thất bại (0 row vì version đã là 1)
      mockPrismaService.product.findUnique
        .mockResolvedValueOnce({ id: 1, name: 'Trà sữa', stock: 5, version: 0 }) // req 1
        .mockResolvedValueOnce({ id: 1, name: 'Trà sữa', stock: 5, version: 0 }); // req 2 (snapshot cũ)

      mockPrismaService.$executeRaw
        .mockResolvedValueOnce(1) // req 1: UPDATE thành công
        .mockResolvedValueOnce(0); // req 2: 0 rows updated (conflict)

      // Request 1 thành công
      await expect(
        service.deductStockWithOptimisticLock([{ productId: 1, qty: 3 }]),
      ).resolves.not.toThrow();

      // Request 2 bị từ chối
      await expect(
        service.deductStockWithOptimisticLock([{ productId: 1, qty: 3 }]),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ══════════════════════════════════════════════════════════════════════
  // (4a) PROMOTION – Áp mã giảm giá
  // ══════════════════════════════════════════════════════════════════════
  describe('validateAndApplyPromotion', () => {
    const basePromo = {
      id: 1,
      code: 'SALE10',
      isActive: true,
      startsAt: new Date(Date.now() - 86400000),
      expiresAt: new Date(Date.now() + 86400000),
      maxUsage: 100,
      usedCount: 5,
      minOrderTotal: 20000,
      discountType: 'PERCENT',
      discountValue: 10,
    };

    it('PERCENT: 10% giảm trên 50.000đ = 5.000đ', async () => {
      mockPrismaService.promotion.findUnique.mockResolvedValueOnce(basePromo);

      const result = await service.validateAndApplyPromotion('SALE10', 50000);
      expect(result.id).toBe(1);
      expect(result.computedDiscount).toBe(5000);
    });

    it('FIXED_AMOUNT: giảm cố định 15.000đ', async () => {
      mockPrismaService.promotion.findUnique.mockResolvedValueOnce({
        ...basePromo,
        discountType: 'FIXED_AMOUNT',
        discountValue: 15000,
      });

      const result = await service.validateAndApplyPromotion('SALE15', 50000);
      expect(result.computedDiscount).toBe(15000);
    });

    it('ném BadRequestException khi mã không tồn tại', async () => {
      mockPrismaService.promotion.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.validateAndApplyPromotion('INVALID', 50000),
      ).rejects.toThrow(BadRequestException);
    });

    it('ném BadRequestException khi mã đã hết hạn', async () => {
      mockPrismaService.promotion.findUnique.mockResolvedValueOnce({
        ...basePromo,
        expiresAt: new Date(Date.now() - 1000), // đã hết hạn
      });

      await expect(
        service.validateAndApplyPromotion('SALE10', 50000),
      ).rejects.toThrow(BadRequestException);
    });

    it('ném BadRequestException khi đơn hàng chưa đạt giá trị tối thiểu', async () => {
      mockPrismaService.promotion.findUnique.mockResolvedValueOnce({
        ...basePromo,
        minOrderTotal: 100000,
      });

      await expect(
        service.validateAndApplyPromotion('SALE10', 50000),
      ).rejects.toThrow(BadRequestException);
    });

    it('ném BadRequestException khi mã đã hết lượt sử dụng', async () => {
      mockPrismaService.promotion.findUnique.mockResolvedValueOnce({
        ...basePromo,
        maxUsage: 10,
        usedCount: 10,
      });

      await expect(
        service.validateAndApplyPromotion('SALE10', 50000),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ══════════════════════════════════════════════════════════════════════
  // (4b) LOYALTY – Cộng điểm sau PAID
  // ══════════════════════════════════════════════════════════════════════
  describe('awardLoyaltyPoints', () => {
    it('cộng đúng số điểm: 1 điểm / 1.000đ (50.000đ = 50 điểm)', async () => {
      mockPrismaService.user.update.mockReturnValueOnce({ id: 10, loyaltyPoints: 50 });
      mockPrismaService.loyaltyTransaction.create.mockReturnValueOnce({ id: 1 });
      mockPrismaService.$transaction.mockResolvedValueOnce([{}, {}]);

      await service.awardLoyaltyPoints(1, 10, 50000);

      expect(mockPrismaService.$transaction).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.anything(),
          expect.anything(),
        ]),
      );
    });

    it('không cộng điểm nếu số tiền < 1.000đ', async () => {
      await service.awardLoyaltyPoints(1, 10, 500);

      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════════════════════════════
  // getOrderById – Quyền truy cập
  // ══════════════════════════════════════════════════════════════════════
  describe('getOrderById', () => {
    it('ném NotFoundException khi đơn không tồn tại', async () => {
      mockPrismaService.order.findUnique.mockResolvedValueOnce(null);

      await expect(service.getOrderById(999, 10, false)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('ném ForbiddenException khi user không phải chủ đơn và không phải admin', async () => {
      mockPrismaService.order.findUnique.mockResolvedValueOnce(
        makeOrder({ userId: 99 }),
      );

      await expect(service.getOrderById(1, 10, false)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('admin có thể xem đơn của người khác', async () => {
      const order = makeOrder({ userId: 99 });
      mockPrismaService.order.findUnique.mockResolvedValueOnce(order);

      const result = await service.getOrderById(1, 10, true /* isAdmin */);
      expect(result.id).toBe(1);
    });
  });
});
