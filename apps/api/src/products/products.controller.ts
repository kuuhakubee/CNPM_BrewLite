import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Task 2 – API danh sách sản phẩm (GET /products):
   * Trả về JSON menu gồm id, tên, giá, ảnh.
   * Endpoint công khai: Next.js frontend gọi trực tiếp khi render menu.
   */
  @Get()
  async findAll() {
    return this.productsService.findAll();
  }

  /**
   * Task 2 – API chi tiết sản phẩm (GET /products/:id):
   * Trả về chi tiết sản phẩm theo id.
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }
}
