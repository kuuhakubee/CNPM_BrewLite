import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface ProductInput {
  id: number;
  name: string;
  description?: string;
  price: any;
  imageUrl?: string;
  category?: string;
  stock?: number;
  isAvailable?: boolean;
  sizes?: {
    code: string;
    name: string;
    priceDelta: any;
    isDefault: boolean;
  }[];
  toppings?: {
    id: number;
    name: string;
    price: any;
    isAvailable: boolean;
  }[];
  recipes?: {
    ingredientId: number;
    quantity: number;
    ingredient?: {
      name: string;
      unit: string;
      stock: number;
    };
  }[];
}

export interface ProductDto {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  stock: number;
  isAvailable: boolean;
  sizes?: {
    code: string;
    name: string;
    priceDelta: number;
    isDefault: boolean;
  }[];
  toppings?: {
    id: number;
    name: string;
    price: number;
    isAvailable: boolean;
  }[];
  recipes?: {
    ingredientId: number;
    name?: string;
    quantity: number;
    unit?: string;
  }[];
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Task 2 – API danh sách sản phẩm (GET /products):
   * Trả về JSON menu (id, tên, giá, ảnh) từ dữ liệu trong CSDL (seed data).
   * Tồn kho (stock) được tính động dựa trên số lượng nguyên liệu trong CSDL theo recipe.
   */
  async findAll(): Promise<ProductDto[]> {
    const products = await this.prisma.product.findMany({
      where: { isAvailable: true },
      include: {
        recipes: {
          include: {
            ingredient: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    return products.map((p) => this.toProductDto(p as ProductInput));
  }

  /**
   * Task 2 – API chi tiết sản phẩm (GET /products/:id):
   * Trả về một sản phẩm theo id kèm size, topping và công thức nguyên liệu.
   * Không tồn tại thì ném NotFoundException.
   */
  async findOne(id: number): Promise<ProductDto> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        sizes: { orderBy: { priceDelta: 'asc' } },
        toppings: { where: { isAvailable: true }, orderBy: { name: 'asc' } },
        recipes: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }

    return this.toProductDto(product as ProductInput);
  }

  /**
   * Tính tồn kho khả dụng của sản phẩm dựa trên số lượng nguyên liệu hiện có trong CSDL theo recipe.
   * Nếu sản phẩm không có recipe, giữ nguyên product.stock.
   */
  private calculateStock(p: ProductInput): number {
    if (!p.recipes || p.recipes.length === 0) {
      return p.stock ?? 0;
    }

    const maxServings = p.recipes.map((r) => {
      if (!r.ingredient || r.quantity <= 0) return 0;
      return Math.floor(r.ingredient.stock / r.quantity);
    });

    return Math.max(0, Math.min(...maxServings));
  }

  /**
   * Map model Prisma -> DTO JSON thuần (price Decimal -> Number để JSON serialize đúng).
   */
  private toProductDto(p: ProductInput): ProductDto {
    const effectiveStock = this.calculateStock(p);
    const result: ProductDto = {
      id: p.id,
      name: p.name,
      description: p.description ?? '',
      price: p.price
        ? Number((p.price as any).toNumber ? (p.price as any).toNumber() : p.price)
        : 0,
      imageUrl: p.imageUrl ?? '',
      category: p.category ?? 'coffee',
      stock: effectiveStock,
      isAvailable: (p.isAvailable ?? true) && effectiveStock > 0,
    };
    if (p.sizes) {
      result.sizes = p.sizes.map((s) => ({
        code: s.code,
        name: s.name,
        priceDelta: s.priceDelta
          ? Number((s.priceDelta as any).toNumber ? (s.priceDelta as any).toNumber() : s.priceDelta)
          : 0,
        isDefault: s.isDefault,
      }));
    }
    if (p.toppings) {
      result.toppings = p.toppings.map((t) => ({
        id: t.id,
        name: t.name,
        price: t.price
          ? Number((t.price as any).toNumber ? (t.price as any).toNumber() : t.price)
          : 0,
        isAvailable: t.isAvailable,
      }));
    }
    if (p.recipes) {
      result.recipes = p.recipes.map((r) => ({
        ingredientId: r.ingredientId,
        name: r.ingredient?.name,
        quantity: r.quantity,
        unit: r.ingredient?.unit,
      }));
    }
    return result;
  }
}
