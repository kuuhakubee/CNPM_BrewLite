import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Task 2 – API danh sách sản phẩm (GET /products):
   * Trả về JSON menu (id, tên, giá, ảnh) từ dữ liệu trong CSDL (seed data).
   */
  async findAll() {
    const products = await this.prisma.product.findMany({
      where: { isAvailable: true },
      orderBy: { id: 'asc' },
    });

    return products.map((p: any) => this.toProductDto(p));
  }

  /**
   * Task 2 – API chi tiết sản phẩm (GET /products/:id):
   * Trả về một sản phẩm theo id, không tồn tại thì ném NotFoundException.
   */
  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        sizes: { orderBy: { priceDelta: 'asc' } },
        toppings: { where: { isAvailable: true }, orderBy: { name: 'asc' } },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }

    return this.toProductDto(product);
  }

  /**
   * Map model Prisma -> DTO JSON thuần (price Decimal -> Number để JSON serialize đúng).
   */
  private toProductDto(p: any) {
    const result: any = {
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price ? Number(p.price.toNumber ? p.price.toNumber() : p.price) : 0,
      imageUrl: p.imageUrl,
      category: p.category,
      stock: p.stock,
      isAvailable: p.isAvailable,
    };
    if (p.sizes) {
      result.sizes = p.sizes.map((s: any) => ({
        code: s.code,
        name: s.name,
        priceDelta: s.priceDelta ? Number(s.priceDelta.toNumber ? s.priceDelta.toNumber() : s.priceDelta) : 0,
        isDefault: s.isDefault,
      }));
    }
    if (p.toppings) {
      result.toppings = p.toppings.map((t: any) => ({
        id: t.id,
        name: t.name,
        price: t.price ? Number(t.price.toNumber ? t.price.toNumber() : t.price) : 0,
        isAvailable: t.isAvailable,
      }));
    }
    return result;
  }
}
