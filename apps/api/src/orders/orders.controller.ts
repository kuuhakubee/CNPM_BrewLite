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

@Controller('orders')
export class OrdersController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Route đặt đơn hàng – được bảo vệ nghiêm ngặt bởi JwtAuthGuard.
   * Yêu cầu client phải gửi Header: Authorization: Bearer <jwt_token>
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@Request() req: any, @Body() body: any) {
    const userId = req.user.id;
    const orderCode = `#${Math.floor(1000 + Math.random() * 9000)}`;

    const order = await this.prisma.order.create({
      data: {
        code: orderCode,
        userId: userId,
        status: 'PENDING',
        subtotal: body.subtotal || 175000,
        discount: body.discount || 0,
        total: body.total || 175000,
      },
    });

    return {
      message: 'Đặt đơn hàng thành công',
      order,
    };
  }

  /**
   * Route xem danh sách đơn hàng của người dùng đang đăng nhập
   */
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
