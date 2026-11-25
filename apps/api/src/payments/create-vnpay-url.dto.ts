import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateVnpayUrlDto {
  @IsInt({ message: 'orderId phải là số nguyên' })
  @IsPositive({ message: 'orderId phải lớn hơn 0' })
  orderId: number;

  @IsOptional()
  @IsString({ message: 'bankCode phải là chuỗi' })
  bankCode?: string;
}
