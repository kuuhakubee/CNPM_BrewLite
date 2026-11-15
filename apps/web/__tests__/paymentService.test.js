import { paymentService } from '../services/paymentService';

describe('paymentService', () => {
  beforeEach(() => {
    // Clear mock session storage
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
    }
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('getOrCreateIdempotencyKey creates and stores a key', () => {
    const key1 = paymentService.getOrCreateIdempotencyKey();
    expect(typeof key1).toBe('string');
    expect(key1.length).toBeGreaterThan(10);

    const key2 = paymentService.getOrCreateIdempotencyKey();
    expect(key2).toBe(key1);

    paymentService.resetPaymentKey();
    const key3 = paymentService.getOrCreateIdempotencyKey();
    expect(key3).toBeDefined();
  });

  test('pay sends POST /api/v1/payments with correct payload and headers', async () => {
    const mockResponse = {
      message: 'Thanh toán thành công',
      idempotent: false,
      payment: { id: 1, status: 'SUCCESS' },
      orderStatus: 'PAID',
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await paymentService.pay(
      {
        orderId: 10,
        amount: 50000,
        method: 'WALLET',
        idempotencyKey: 'test-key-uuid',
      },
      'valid-jwt-token',
    );

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/payments'),
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-jwt-token',
        },
        body: JSON.stringify({
          orderId: 10,
          amount: 50000,
          method: 'WALLET',
          idempotencyKey: 'test-key-uuid',
        }),
      }),
    );
    expect(result.orderStatus).toBe('PAID');
  });

  test('pay handles error response properly', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Đơn hàng không tồn tại' }),
    });

    await expect(
      paymentService.pay(
        {
          orderId: 999,
          amount: 50000,
          method: 'CARD',
          idempotencyKey: 'test-key-uuid',
        },
        'token',
      ),
    ).rejects.toThrow('Đơn hàng không tồn tại');
  });
});
