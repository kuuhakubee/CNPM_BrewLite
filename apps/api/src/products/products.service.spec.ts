import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProductsService', () => {
  let service: ProductsService;

  const mockPrismaService = {
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should compute dynamic stock from recipes and ingredients with proper units', async () => {
      const mockProductsFromDb = [
        {
          id: 1,
          name: 'Cà phê sữa',
          description: 'Cà phê pha sữa đặc',
          price: 35000,
          imageUrl: '',
          category: 'coffee',
          stock: 100, // DB static column
          isAvailable: true,
          recipes: [
            {
              ingredientId: 1,
              quantity: 1,
              ingredient: { name: 'Espresso', unit: 'shot', stock: 20 },
            },
            {
              ingredientId: 2,
              quantity: 1,
              ingredient: { name: 'Sữa tươi', unit: 'ly', stock: 100 },
            },
          ],
        },
        {
          id: 2,
          name: 'Americano',
          description: 'Cà phê đen đậm đà',
          price: 40000,
          imageUrl: '',
          category: 'coffee',
          stock: 100,
          isAvailable: true,
          recipes: [
            {
              ingredientId: 1,
              quantity: 2,
              ingredient: { name: 'Espresso', unit: 'shot', stock: 20 },
            },
            {
              ingredientId: 3,
              quantity: 1,
              ingredient: { name: 'Nước', unit: 'ly', stock: 50 },
            },
          ],
        },
      ];

      mockPrismaService.product.findMany.mockResolvedValueOnce(mockProductsFromDb);

      const result = await service.findAll();

      expect(result).toHaveLength(2);

      // Cà phê sữa: min(20/1, 100/1) = 20
      expect(result[0].stock).toBe(20);
      expect(result[0].isAvailable).toBe(true);
      expect(result[0].recipes).toEqual([
        { ingredientId: 1, name: 'Espresso', quantity: 1, unit: 'shot' },
        { ingredientId: 2, name: 'Sữa tươi', quantity: 1, unit: 'ly' },
      ]);

      // Americano: min(floor(20/2), 50/1) = min(10, 50) = 10
      expect(result[1].stock).toBe(10);
      expect(result[1].isAvailable).toBe(true);
      expect(result[1].recipes).toEqual([
        { ingredientId: 1, name: 'Espresso', quantity: 2, unit: 'shot' },
        { ingredientId: 3, name: 'Nước', quantity: 1, unit: 'ly' },
      ]);
    });

    it('should set stock to 0 and isAvailable to false when any ingredient is depleted', async () => {
      const mockProductOut = [
        {
          id: 6,
          name: 'Trà sữa trân châu',
          price: 42000,
          isAvailable: true,
          recipes: [
            {
              ingredientId: 5,
              quantity: 1,
              ingredient: { name: 'Trà', unit: 'túi', stock: 30 },
            },
            {
              ingredientId: 8,
              quantity: 1,
              ingredient: { name: 'Trân châu', unit: 'muỗng', stock: 0 }, // Out of boba!
            },
          ],
        },
      ];

      mockPrismaService.product.findMany.mockResolvedValueOnce(mockProductOut);

      const [result] = await service.findAll();
      expect(result.stock).toBe(0);
      expect(result.isAvailable).toBe(false);
    });

    it('should fall back to product.stock if no recipes are configured', async () => {
      const mockProductNoRecipe = [
        {
          id: 99,
          name: 'Bánh mì',
          price: 25000,
          stock: 15,
          isAvailable: true,
          recipes: [],
        },
      ];

      mockPrismaService.product.findMany.mockResolvedValueOnce(mockProductNoRecipe);

      const [result] = await service.findAll();
      expect(result.stock).toBe(15);
      expect(result.isAvailable).toBe(true);
    });
  });

  describe('findOne', () => {
    it('should return product details with calculated stock and recipes', async () => {
      const mockProduct = {
        id: 1,
        name: 'Cà phê sữa',
        price: 35000,
        stock: 100,
        isAvailable: true,
        sizes: [{ code: 'M', name: 'Vừa', priceDelta: 4000, isDefault: true }],
        toppings: [{ id: 1, name: 'Trân châu', price: 5000, isAvailable: true }],
        recipes: [
          {
            ingredientId: 1,
            quantity: 1,
            ingredient: { name: 'Espresso', unit: 'shot', stock: 5 },
          },
        ],
      };

      mockPrismaService.product.findUnique.mockResolvedValueOnce(mockProduct);

      const result = await service.findOne(1);
      expect(result.id).toBe(1);
      expect(result.stock).toBe(5);
      expect(result.sizes).toHaveLength(1);
      expect(result.toppings).toHaveLength(1);
      expect(result.recipes).toEqual([
        { ingredientId: 1, name: 'Espresso', quantity: 1, unit: 'shot' },
      ]);
    });

    it('should throw NotFoundException when product does not exist', async () => {
      mockPrismaService.product.findUnique.mockResolvedValueOnce(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
