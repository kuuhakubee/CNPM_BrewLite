import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentMethod } from '@prisma/client';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: PaymentsService;

  const mockPaymentsService = {
    processPayment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call processPayment and return response for PAID', async () => {
    const req = { user: { id: 1 } };
    const dto = {
      orderId: 10,
      amount: 45000,
      method: PaymentMethod.WALLET,
      idempotencyKey: 'idemp-uuid-1',
    };

    mockPaymentsService.processPayment.mockResolvedValueOnce({
      idempotent: false,
      payment: { id: 1, status: 'SUCCESS' },
      orderStatus: 'PAID',
      order: { id: 10, status: 'PAID' },
    });

    const result = await controller.createPayment(req, dto);

    expect(result.message).toBe('Thanh toán thành công');
    expect(result.orderStatus).toBe('PAID');
    expect(mockPaymentsService.processPayment).toHaveBeenCalledWith(1, dto);
  });

  it('should call processPayment and return response for PAYMENT_FAILED', async () => {
    const req = { user: { id: 1 } };
    const dto = {
      orderId: 10,
      amount: 45000,
      method: PaymentMethod.CARD,
      idempotencyKey: 'idemp-uuid-2',
    };

    mockPaymentsService.processPayment.mockResolvedValueOnce({
      idempotent: false,
      payment: { id: 2, status: 'FAILED' },
      orderStatus: 'PAYMENT_FAILED',
      order: { id: 10, status: 'PAYMENT_FAILED' },
    });

    const result = await controller.createPayment(req, dto);

    expect(result.message).toBe('Thanh toán thất bại');
    expect(result.orderStatus).toBe('PAYMENT_FAILED');
  });
});
