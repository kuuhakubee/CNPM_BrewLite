import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';
import { VNPayGateway } from './gateway/vnpay.gateway';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: PrismaService;
  const vnpayGateway = new VNPayGateway();

  const mockPrismaService = {
    payment: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    orderStatusHistory: {
      create: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
    loyaltyTransaction: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createVnpayPaymentUrl', () => {
    it('should generate valid VNPay payment URL for a PENDING order', async () => {
      mockPrismaService.order.findUnique.mockResolvedValueOnce({
        id: 15,
        code: '#1015',
        userId: 1,
        status: 'PENDING',
        total: 65000,
      });

      const result = await service.createVnpayPaymentUrl(
        1,
        { orderId: 15 },
        '127.0.0.1',
      );

      expect(result.orderId).toBe(15);
      expect(result.amount).toBe(65000);
      expect(result.paymentUrl).toContain('sandbox.vnpayment.vn');
      expect(result.paymentUrl).toContain('vnp_SecureHash');
      expect(result.paymentUrl).toContain('vnp_Amount=6500000');
    });

    it('should throw NotFoundException if order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.createVnpayPaymentUrl(1, { orderId: 999 }, '127.0.0.1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if order belongs to another user', async () => {
      mockPrismaService.order.findUnique.mockResolvedValueOnce({
        id: 15,
        userId: 99,
        status: 'PENDING',
        total: 50000,
      });

      await expect(
        service.createVnpayPaymentUrl(1, { orderId: 15 }, '127.0.0.1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if order status is not PENDING', async () => {
      mockPrismaService.order.findUnique.mockResolvedValueOnce({
        id: 15,
        userId: 1,
        status: 'PAID',
        total: 50000,
      });

      await expect(
        service.createVnpayPaymentUrl(1, { orderId: 15 }, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('handleVnpayIpn', () => {
    it('should return RspCode 97 when checksum is invalid', async () => {
      const result = await service.handleVnpayIpn({
        vnp_TxnRef: '15_123456',
        vnp_Amount: '5000000',
        vnp_SecureHash: 'invalid_hash_signature',
      });

      expect(result.RspCode).toBe('97');
      expect(result.Message).toBe('Fail checksum');
    });

    it('should return RspCode 01 when order does not exist', async () => {
      // Generate real signed URL query params using vnpayGateway
      const payUrl = vnpayGateway.createPaymentUrl({
        orderId: 999,
        amount: 50000,
        orderInfo: 'Thanh toan test',
        ipAddr: '127.0.0.1',
        txnRef: '999_test',
      });
      const url = new URL(payUrl);
      const queryObj: Record<string, string> = {};
      url.searchParams.forEach((v, k) => {
        queryObj[k] = v;
      });
      queryObj.vnp_ResponseCode = '00';
      // Re-sign with response code
      const deleteHash: any = { ...queryObj };
      delete deleteHash.vnp_SecureHash;
      // We can mock verifyChecksum or test invalid order with mocked verifyChecksum
      jest.spyOn((service as any).vnpayGateway, 'verifyChecksum').mockReturnValue(true);
      mockPrismaService.order.findUnique.mockResolvedValueOnce(null);

      const result = await service.handleVnpayIpn(queryObj);
      expect(result.RspCode).toBe('01');
      expect(result.Message).toBe('Order not found');
    });

    it('should return RspCode 04 when amount is invalid', async () => {
      jest.spyOn((service as any).vnpayGateway, 'verifyChecksum').mockReturnValue(true);
      mockPrismaService.order.findUnique.mockResolvedValueOnce({
        id: 15,
        total: 100000, // 100,000 VND
        status: 'PENDING',
      });

      const result = await service.handleVnpayIpn({
        vnp_TxnRef: '15_123',
        vnp_Amount: '5000000', // 50,000 VND -> mismatch
        vnp_ResponseCode: '00',
        vnp_SecureHash: 'valid_mock_hash',
      });

      expect(result.RspCode).toBe('04');
      expect(result.Message).toBe('Amount invalid');
    });

    it('should return RspCode 00 and update order to PAID on successful IPN', async () => {
      jest.spyOn((service as any).vnpayGateway, 'verifyChecksum').mockReturnValue(true);
      mockPrismaService.order.findUnique.mockResolvedValueOnce({
        id: 15,
        total: 50000,
        status: 'PENDING',
        userId: 1,
      });
      mockPrismaService.$transaction.mockResolvedValue([{}, {}, {}]);

      const result = await service.handleVnpayIpn({
        vnp_TxnRef: '15_123',
        vnp_Amount: '5000000',
        vnp_TransactionNo: '14592000',
        vnp_ResponseCode: '00',
        vnp_SecureHash: 'valid_mock_hash',
      });

      expect(result.RspCode).toBe('00');
      expect(result.Message).toBe('Confirm Success');
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });
  });

  describe('processPayment (legacy mock)', () => {
    it('should return existing payment if idempotencyKey already exists', async () => {
      const existingPayment = {
        id: 1,
        orderId: 10,
        idempotencyKey: 'idemp-key-12345',
        amount: 50000,
        method: PaymentMethod.WALLET,
        status: 'SUCCESS',
        order: { id: 10, status: 'PAID' },
      };
      mockPrismaService.payment.findUnique.mockResolvedValueOnce(existingPayment);

      const result = await service.processPayment(1, {
        orderId: 10,
        amount: 50000,
        method: PaymentMethod.WALLET,
        idempotencyKey: 'idemp-key-12345',
      });

      expect(result.idempotent).toBe(true);
      expect(result.orderStatus).toBe('PAID');
    });

    it('should update order to PAID when payment succeeds (amount = 1 deterministically succeeds in gateway)', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.order.findUnique.mockResolvedValueOnce({
        id: 10,
        userId: 1,
        status: 'PENDING',
      });

      mockPrismaService.$transaction.mockResolvedValueOnce([
        { id: 101, status: 'SUCCESS' },
        { id: 10, status: 'PAID' },
        {},
      ]);

      const result = await service.processPayment(1, {
        orderId: 10,
        amount: 1,
        method: PaymentMethod.WALLET,
        idempotencyKey: 'idemp-key-success',
      });

      expect(result.idempotent).toBe(false);
      expect(result.orderStatus).toBe('PAID');
    });

    it('should update order to PAYMENT_FAILED when gateway fails (amount = 2 deterministically fails in gateway)', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.order.findUnique.mockResolvedValueOnce({
        id: 10,
        userId: 1,
        status: 'PENDING',
      });

      mockPrismaService.$transaction.mockResolvedValueOnce([
        { id: 102, status: 'FAILED' },
        { id: 10, status: 'PAYMENT_FAILED' },
        {},
      ]);

      const result = await service.processPayment(1, {
        orderId: 10,
        amount: 2,
        method: PaymentMethod.CARD,
        idempotencyKey: 'idemp-key-fail',
      });

      expect(result.idempotent).toBe(false);
      expect(result.orderStatus).toBe('PAYMENT_FAILED');
    });

    // ── Tiêu chí (b) bắt buộc: Idempotency ──────────────────────────────
    it('(b) Idempotency: gửi 2 lần cùng key – lần 2 trả đơn cũ, KHÔNG tạo payment mới', async () => {
      const IKEY = 'idempotency-unique-key-999';
      const existingPayment = {
        id: 55,
        orderId: 10,
        idempotencyKey: IKEY,
        amount: 65000,
        method: PaymentMethod.WALLET,
        status: 'SUCCESS',
        order: { id: 10, status: 'PAID' },
      };

      // Lần 1: payment chưa tồn tại → tạo mới
      mockPrismaService.payment.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.order.findUnique.mockResolvedValueOnce({
        id: 10,
        userId: 1,
        status: 'PENDING',
      });
      mockPrismaService.$transaction.mockResolvedValueOnce([
        existingPayment,
        { id: 10, status: 'PAID' },
        {},
      ]);

      const result1 = await service.processPayment(1, {
        orderId: 10,
        amount: 65000,
        method: PaymentMethod.WALLET,
        idempotencyKey: IKEY,
      });
      expect(result1.idempotent).toBe(false);
      expect(result1.orderStatus).toBe('PAID');

      // Reset mock cho lần 2
      jest.clearAllMocks();

      // Lần 2: payment ĐÃ tồn tại với cùng key → trả về idempotent
      mockPrismaService.payment.findUnique.mockResolvedValueOnce(existingPayment);

      const result2 = await service.processPayment(1, {
        orderId: 10,
        amount: 65000,
        method: PaymentMethod.WALLET,
        idempotencyKey: IKEY,
      });

      expect(result2.idempotent).toBe(true);
      expect(result2.orderStatus).toBe('PAID');
      // Không được gọi order.findUnique lần 2 (đã lấy từ payment.findUnique)
      expect(mockPrismaService.order.findUnique).not.toHaveBeenCalled();
      // Không được gọi $transaction lần 2
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });
  });
});
