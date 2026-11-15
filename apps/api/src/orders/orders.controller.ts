import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  NotFoundException,
  ConflictException,
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
   * Mở transaction: kiểm tra tồn kho (sản phẩm + nguyên liệu theo recipe)
   * rồi trừ kho trước khi tạo đơn (NFR-03, ADR-004).
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@Request() req: any, @Body() dto: CreateOrderDto) {
    const userId = req.user.id;
    const orderCode = `#${Math.floor(1000 + Math.random() * 9000)}`;

    const order = await this.prisma.$transaction(async (tx) => {
      const orderItemsData: any[] = [];

      // Kiểm tra & trừ tồn kho cho từng dòng sản phẩm
      for (const item of dto.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: {
            recipes: {
              include: { ingredient: true },
            },
          },
        });
        if (!product) {
          throw new NotFoundException(`Product with id "${item.productId}" not found`);
        }

        const unitPrice = Number(product.price);
        const lineTotal = unitPrice * item.qty;
        orderItemsData.push({
          productId: item.productId,
          sizeCode: item.sizeCode || 'M',
          qty: item.qty,
          unitPrice,
          lineTotal,
        });

        // Nếu sản phẩm có công thức (recipe), kiểm tra tồn kho nguyên liệu khả dụng
        if (product.recipes && product.recipes.length > 0) {
          const ingredientDeductions: { id: number; name: string; quantity: number }[] = [];
          for (const recipe of product.recipes) {
            const ingredient = recipe.ingredient;
            if (!ingredient) {
              throw new ConflictException(`Sản phẩm "${product.name}" chưa cấu hình nguyên liệu`);
            }
            const needed = item.qty * recipe.quantity;
            if (ingredient.stock < needed) {
              throw new ConflictException(
                `Nguyên liệu "${ingredient.name}" không đủ cho ${recipe.quantity} ${ingredient.unit} mỗi món (còn ${ingredient.stock} ${ingredient.unit}, cần ${needed} ${ingredient.unit})`,
              );
            }
            ingredientDeductions.push({
              id: ingredient.id,
              name: ingredient.name,
              quantity: needed,
            });
          }

          // Trừ kho nguyên liệu nguyên tử
          for (const d of ingredientDeductions) {
            const updatedIng = await tx.ingredient.updateMany({
              where: { id: d.id, stock: { gte: d.quantity } },
              data: { stock: { decrement: d.quantity } },
            });
            if (updatedIng.count === 0) {
              throw new ConflictException(
                `Nguyên liệu "${d.name}" vừa hết tồn kho, vui lòng thử lại`,
              );
            }
          }
        } else {
          // Fallback khi sản phẩm chưa có recipe: kiểm tra trực tiếp product.stock
          if (product.stock < item.qty) {
            throw new ConflictException(
              `Sản phẩm "${product.name}" không đủ tồn kho (còn ${product.stock}, cần ${item.qty})`,
            );
          }
        }

        // Trừ kho sản phẩm (optimistic locking theo ADR-004: version check)
        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,
            version: product.version,
          },
          data: { stock: { decrement: item.qty }, version: { increment: 1 } },
        });
        if (updated.count === 0) {
          throw new ConflictException('Sản phẩm vừa được cập nhật, vui lòng thử lại');
        }
      }

      return tx.order.create({
        data: {
          code: orderCode,
          userId: userId,
          status: 'PENDING',
          subtotal: dto.subtotal,
          discount: dto.discount || 0,
          total: dto.total,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: true,
        },
      });
    });

    return {
      message: 'Đặt đơn hàng thành công',
      order,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyOrders(@Request() req: any) {
    const userId = req.user.id;
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
