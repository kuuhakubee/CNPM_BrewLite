/**
 * order-state-machine.ts
 * ──────────────────────
 * Nguồn sự thật duy nhất cho bảng chuyển trạng thái đơn hàng (ADR-004 §4).
 *
 * Luồng chính (happy path):
 *   PENDING → PAID → PREPARING → READY → COMPLETED
 *
 * Ngoại lệ:
 *   PENDING → PAYMENT_FAILED  (thanh toán thất bại, có thể thử lại)
 *   PENDING → CANCELLED
 *   PAID    → CANCELLED       (huỷ trước khi pha chế)
 */

import { ConflictException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

/** Bảng chuyển trạng thái hợp lệ */
export const VALID_TRANSITIONS: Readonly<
  Partial<Record<OrderStatus, OrderStatus[]>>
> = {
  PENDING: ['PAID', 'PAYMENT_FAILED', 'CANCELLED'],
  PAID: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY'],
  READY: ['COMPLETED'],
  // PAYMENT_FAILED / COMPLETED / CANCELLED – trạng thái cuối, không chuyển tiếp
};

/**
 * Kiểm tra và ném ConflictException nếu chuyển trạng thái không hợp lệ.
 * Dùng ở mọi nơi cần đổi Order.status.
 */
export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  const allowed = VALID_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new ConflictException(
      `Không thể chuyển trạng thái đơn từ ${from} sang ${to}. ` +
        `Trạng thái hợp lệ tiếp theo: [${(VALID_TRANSITIONS[from] ?? []).join(', ') || 'không có'}].`,
    );
  }
}
