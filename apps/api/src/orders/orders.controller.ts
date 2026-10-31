import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Task 6 – API tạo đơn hàng (POST /orders):
   * Nhận giỏ hàng, validate bằng class-validator (CreateOrderDto),
   * lưu đơn trạng thái PENDING và trả mã đơn.
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@Request() req: any, @Body() dto: CreateOrderDto) {
    const userId = req.user.id;
    const orderCode = `#${Math.floor(1000 + Math.random() * 9000)}`;

    const order = await this.prisma.order.create({
      data: {
        code: orderCode,
        userId: userId,
        status: 'PENDING',
        subtotal: dto.subtotal,
        discount: dto.discount || 0,
        total: dto.total,
      },
    });

    return {
      message: 'Đặt đơn hàng thành công',
      order,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getMyOrders(@Request() req: any) {
    const userId = req.user.id;
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
