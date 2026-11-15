import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateVnpayUrlDto } from './dto/create-vnpay-url.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * POST /api/v1/payments/create-url
   *
   * Tạo URL thanh toán VNPay Sandbox cho đơn hàng PENDING.
   * KHÔNG tự động chuyển trạng thái đơn hàng sang PAID.
   */
  @UseGuards(JwtAuthGuard)
  @Post('create-url')
  @HttpCode(HttpStatus.OK)
  async createVnpayUrl(@Request() req: any, @Body() dto: CreateVnpayUrlDto) {
    const userId: number = req.user.id;
    const ipAddr =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      '127.0.0.1';

    const result = await this.paymentsService.createVnpayPaymentUrl(
      userId,
      dto,
      ipAddr,
    );

    return {
      message: 'Khởi tạo giao dịch VNPay thành công',
      ...result,
    };
  }

  /**
   * GET /api/v1/payments/vnpay-ipn
   *
   * Webhook Server-to-Server do VNPay gọi để xác nhận giao dịch.
   * Bắt buộc kiểm tra chữ ký HMAC SHA-512 trước khi cập nhật đơn sang PAID.
   */
  @Get('vnpay-ipn')
  @HttpCode(HttpStatus.OK)
  async handleVnpayIpn(@Query() query: Record<string, any>) {
    return this.paymentsService.handleVnpayIpn(query);
  }

  /**
   * GET /api/v1/payments/vnpay-return
   *
   * Endpoint tiếp nhận và xác thực kết quả redirect từ trình duyệt của khách hàng.
   */
  @Get('vnpay-return')
  @HttpCode(HttpStatus.OK)
  async handleVnpayReturn(@Query() query: Record<string, any>) {
    return this.paymentsService.handleVnpayReturn(query);
  }

  /**
   * POST /api/v1/payments (Mock fallback)
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPayment(@Request() req: any, @Body() dto: CreatePaymentDto) {
    const userId: number = req.user.id;
    const result = await this.paymentsService.processPayment(userId, dto);

    return {
      message:
        result.orderStatus === 'PAID'
          ? 'Thanh toán thành công'
          : result.orderStatus === 'PAYMENT_FAILED'
            ? 'Thanh toán thất bại'
            : 'Đã xử lý',
      idempotent: result.idempotent,
      payment: result.payment,
      orderStatus: result.orderStatus,
      order: result.order,
    };
  }
}
