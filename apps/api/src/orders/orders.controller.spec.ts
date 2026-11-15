import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

describe('OrdersController', () => {
  let controller: OrdersController;

  const mockTx = {
    product: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    ingredient: {
      updateMany: jest.fn(),
    },
    order: {
      create: jest.fn(),
    },
  };

  const mockPrismaService = {
    $transaction: jest.fn((cb) => cb(mockTx)),
    order: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createOrder', () => {
    const req = { user: { id: 1 } };
    const dto: CreateOrderDto = {
      items: [{ productId: 1, qty: 2, sizeCode: 'M' }],
      subtotal: 70000,
      total: 70000,
      discount: 0,
    };

    it('should successfully create an order and deduct ingredient & product stock', async () => {
      mockTx.product.findUnique.mockResolvedValueOnce({
        id: 1,
        name: 'Cà phê sữa',
        price: 35000,
        version: 0,
        stock: 20,
        recipes: [
          {
            quantity: 1,
            ingredient: { id: 10, name: 'Espresso', unit: 'shot', stock: 20 },
          },
          {
            quantity: 1,
            ingredient: { id: 11, name: 'Sữa tươi', unit: 'ly', stock: 50 },
          },
        ],
      });

      mockTx.ingredient.updateMany
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 1 });

      mockTx.product.updateMany.mockResolvedValueOnce({ count: 1 });

      const createdOrder = {
        id: 101,
        code: '#1234',
        userId: 1,
        status: 'PENDING',
        total: 70000,
        items: [
          {
            productId: 1,
            sizeCode: 'M',
            qty: 2,
            unitPrice: 35000,
            lineTotal: 70000,
          },
        ],
      };
      mockTx.order.create.mockResolvedValueOnce(createdOrder);

      const result = await controller.createOrder(req, dto);

      expect(result.message).toBe('Đặt đơn hàng thành công');
      expect(result.order).toEqual(createdOrder);

      // Verify ingredient deductions: 2 products * 1 unit each = 2 units
      expect(mockTx.ingredient.updateMany).toHaveBeenCalledWith({
        where: { id: 10, stock: { gte: 2 } },
        data: { stock: { decrement: 2 } },
      });
      expect(mockTx.ingredient.updateMany).toHaveBeenCalledWith({
        where: { id: 11, stock: { gte: 2 } },
        data: { stock: { decrement: 2 } },
      });

      // Verify product version increment
      expect(mockTx.product.updateMany).toHaveBeenCalledWith({
        where: { id: 1, version: 0 },
        data: { stock: { decrement: 2 }, version: { increment: 1 } },
      });
    });

    it('should throw NotFoundException if product is not found', async () => {
      mockTx.product.findUnique.mockResolvedValueOnce(null);

      await expect(controller.createOrder(req, dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if ingredient stock is insufficient', async () => {
      mockTx.product.findUnique.mockResolvedValueOnce({
        id: 1,
        name: 'Cà phê sữa',
        price: 35000,
        version: 0,
        stock: 20,
        recipes: [
          {
            quantity: 1,
            ingredient: { id: 10, name: 'Espresso', unit: 'shot', stock: 1 }, // Only 1 shot left, needs 2
          },
        ],
      });

      await expect(controller.createOrder(req, dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('getMyOrders', () => {
    it('should return orders for current user', async () => {
      const mockOrders = [{ id: 1, code: '#1001', userId: 1, status: 'COMPLETED' }];
      mockPrismaService.order.findMany.mockResolvedValueOnce(mockOrders);

      const result = await controller.getMyOrders({ user: { id: 1 } });
      expect(result).toEqual(mockOrders);
      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        include: {
          items: {
            include: { product: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});
