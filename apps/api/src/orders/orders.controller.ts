import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { CreateOrderWithItemsDto } from './dto/create-order-with-items.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * POST /api/v1/orders
   *
   * Tạo đơn hàng mới.
   * - Hỗ trợ Idempotency-Key header để tránh tạo đơn trùng.
   * - Áp mã khuyến mãi nếu có promotionCode trong body.
   * - Trừ tồn kho với optimistic locking nếu có items.
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrder(
    @Request() req: any,
    @Body() dto: CreateOrderWithItemsDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const userId = req.user.id;
    const result = await this.ordersService.createOrder(
      userId,
      dto,
      idempotencyKey,
    );

    return {
      message: result.idempotent
        ? 'Đơn hàng đã tồn tại (Idempotent)'
        : 'Đặt đơn hàng thành công',
      idempotent: result.idempotent,
      order: result.order,
    };
  }

  /**
   * GET /api/v1/orders
   *
   * Lấy danh sách đơn hàng của khách hàng hiện tại.
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyOrders(@Request() req: any) {
    return this.ordersService.getMyOrders(req.user.id);
  }

  /**
   * GET /api/v1/orders/:id
   *
   * Lấy chi tiết đơn hàng (kèm items, payments, statusHistory).
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOrderById(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ordersService.getOrderById(
      id,
      req.user.id,
      req.user.role === 'ADMIN',
    );
  }

  /**
   * PATCH /api/v1/orders/:id/status
   *
   * Cập nhật trạng thái đơn hàng (State Machine).
   * Dùng bởi staff/admin hoặc hệ thống nội bộ.
   * Chặn chuyển trạng thái không hợp lệ (ConflictException 409).
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  async updateOrderStatus(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const updatedOrder = await this.ordersService.updateOrderStatus(
      id,
      dto.status,
      req.user.id,
    );

    return {
      message: `Đơn hàng #${id} đã chuyển sang trạng thái ${dto.status}`,
      order: updatedOrder,
    };
  }
}
