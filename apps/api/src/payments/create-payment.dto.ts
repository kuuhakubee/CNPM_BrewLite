import {
  IsEnum,
  IsInt,
  IsPositive,
  IsString,
  IsNumber,
  MinLength,
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  /** ID của đơn hàng cần thanh toán */
  @IsInt({ message: 'orderId phải là số nguyên' })
  @IsPositive({ message: 'orderId phải lớn hơn 0' })
  orderId: number;

  /** Số tiền thanh toán */
  @IsNumber({}, { message: 'amount phải là số' })
  @IsPositive({ message: 'amount phải lớn hơn 0' })
  amount: number;

  /** Phương thức: WALLET (ví điện tử) hoặc CARD (thẻ ngân hàng) */
  @IsEnum(PaymentMethod, {
    message: 'method phải là WALLET hoặc CARD',
  })
  method: PaymentMethod;

  /**
   * Idempotency key do client sinh (UUID v4).
   * Ràng buộc UNIQUE ở DB đảm bảo mỗi key chỉ tạo 1 Payment.
   * Xem ADR-004.
   */
  @IsString({ message: 'idempotencyKey phải là chuỗi' })
  @MinLength(8, { message: 'idempotencyKey quá ngắn' })
  idempotencyKey: string;
}
