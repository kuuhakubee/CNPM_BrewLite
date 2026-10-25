import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// @Global: chỉ cần inject PrismaService ở bất kỳ module nào mà không import lại
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
