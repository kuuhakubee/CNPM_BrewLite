import { IsNumber, IsOptional, IsPositive, Min, IsString } from 'class-validator';

export class CreateOrderDto {
  @IsNumber({}, { message: 'subtotal phải là số' })
  @IsPositive({ message: 'subtotal phải lớn hơn 0' })
  @Min(1, { message: 'subtotal tối thiểu 1' })
  subtotal: number;

  @IsNumber({}, { message: 'total phải là số' })
  @IsPositive({ message: 'total phải lớn hơn 0' })
  @Min(1, { message: 'total tối thiểu 1' })
  total: number;

  @IsOptional()
  @IsNumber({}, { message: 'discount phải là số' })
  @Min(0, { message: 'discount không được âm' })
  discount?: number;

  @IsOptional()
  @IsString({ message: 'promotionCode phải là chuỗi' })
  promotionCode?: string;
}
