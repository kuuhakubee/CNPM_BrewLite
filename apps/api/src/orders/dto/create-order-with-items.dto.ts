import {
  IsNumber,
  IsPositive,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  Min,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsInt()
  @IsPositive()
  productId: number;

  @IsString()
  sizeCode: string;

  @IsOptional()
  @IsInt()
  productSizeId?: number;

  @IsInt()
  @IsPositive()
  qty: number;

  @IsNumber()
  @IsPositive()
  unitPrice: number;

  @IsNumber()
  @IsPositive()
  lineTotal: number;

  @IsOptional()
  @IsArray()
  toppingIds?: number[];
}

export class CreateOrderWithItemsDto {
  @IsNumber()
  @IsPositive()
  @Min(1)
  subtotal: number;

  @IsNumber()
  @IsPositive()
  @Min(1)
  total: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsString()
  promotionCode?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items?: OrderItemDto[];
}
