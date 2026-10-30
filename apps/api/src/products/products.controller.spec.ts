import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsController;

  const mockProductsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: mockProductsService }],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return the product list for Task 2 (GET /products)', async () => {
    const products = [
      { id: 1, name: 'Cà phê sữa', price: 35000, imageUrl: '' },
      { id: 2, name: 'Americano', price: 40000, imageUrl: '' },
    ];
    mockProductsService.findAll.mockResolvedValueOnce(products);

    expect(await controller.findAll()).toEqual(products);
    expect(mockProductsService.findAll).toHaveBeenCalledTimes(1);
  });

  it('should return a single product for GET /products/:id', async () => {
    const product = { id: 1, name: 'Cà phê sữa', price: 35000, imageUrl: '' };
    mockProductsService.findOne.mockResolvedValueOnce(product);

    expect(await controller.findOne(1)).toEqual(product);
    expect(mockProductsService.findOne).toHaveBeenCalledWith(1);
  });

  it('should propagate NotFound when product does not exist', async () => {
    mockProductsService.findOne.mockRejectedValueOnce(new Error('not found'));

    await expect(controller.findOne(999)).rejects.toThrow('not found');
  });
});
