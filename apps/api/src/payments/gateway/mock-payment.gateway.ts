/**
 * MockPaymentGateway
 * ──────────────────
 * Mô phỏng cổng thanh toán theo ADR-004.
 *
 * - Thành công với xác suất PAYMENT_SUCCESS_RATE (mặc định 0.9 = 90 %).
 * - Trong môi trường test:
 *   khi amount === 2 → luôn FAILED để test deterministic;
 *   khi amount === 1 hoặc NODE_ENV=test (mặc định) → luôn SUCCESS.
 * - Trả về transactionRef khi thành công; failureReason khi thất bại.
 */

export interface GatewayChargeResult {
  success: boolean;
  transactionRef?: string;
  failureReason?: string;
}

export class MockPaymentGateway {
  /** Xác suất thành công lấy từ biến môi trường, mặc định 0.9 */
  private readonly successRate: number;

  constructor() {
    const rate = parseFloat(process.env.PAYMENT_SUCCESS_RATE ?? '0.9');
    this.successRate = isNaN(rate) ? 0.9 : Math.min(1, Math.max(0, rate));
  }

  async charge(params: {
    orderId: number;
    amount: number;
    method: string;
    idempotencyKey: string;
  }): Promise<GatewayChargeResult> {
    const isTest = process.env.NODE_ENV === 'test';

    // Deterministic trong môi trường test
    if (params.amount === 2) {
      return {
        success: false,
        failureReason: 'MOCK_FORCED_FAILURE',
      };
    }
    if (isTest || params.amount === 1) {
      return {
        success: true,
        transactionRef: `MOCK-TXN-${Date.now()}-${params.idempotencyKey.slice(0, 8)}`,
      };
    }

    // Production: ngẫu nhiên theo successRate
    const isSuccess = Math.random() < this.successRate;
    if (isSuccess) {
      return {
        success: true,
        transactionRef: `MOCK-TXN-${Date.now()}-${params.idempotencyKey.slice(0, 8)}`,
      };
    }

    const reasons = [
      'INSUFFICIENT_BALANCE',
      'CARD_DECLINED',
      'TIMEOUT',
      'INVALID_ACCOUNT',
    ];
    return {
      success: false,
      failureReason: reasons[Math.floor(Math.random() * reasons.length)],
    };
  }
}
