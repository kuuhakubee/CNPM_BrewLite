import { IsEnum } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus, {
    message: `status phải là một trong: ${Object.values(OrderStatus).join(', ')}`,
  })
  status: OrderStatus;
}
