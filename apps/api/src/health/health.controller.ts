import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    // Kiểm tra kết nối DB bằng một query nhẹ
    let database: 'up' | 'down' = 'down';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = 'up';
    } catch {
      database = 'down';
    }

    const body = {
      status: database === 'up' ? 'ok' : 'error',
      database,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };

    // Nếu DB down → trả 503 để health check / smoke test fail (đúng AC-N04)
    if (database === 'down') {
      throw new ServiceUnavailableException(body);
    }
    return body;
  }
}
