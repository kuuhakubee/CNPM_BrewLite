import {
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
  IsString,
  IsInt,
  IsArray,
  ArrayMinSize,
} from 'class-validator';

export class CreateOrderItemDto {
  @IsInt({ message: 'productId phải là số nguyên' })
  @Min(1, { message: 'productId phải lớn hơn 0' })
  productId: number;

  @IsOptional()
  @IsString({ message: 'sizeCode phải là chuỗi' })
  sizeCode?: string;

  @IsInt({ message: 'qty phải là số nguyên' })
  @Min(1, { message: 'qty phải lớn hơn 0' })
  qty: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  unitPrice?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  lineTotal?: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'items phải có ít nhất một dòng sản phẩm' })
  items: CreateOrderItemDto[];

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
