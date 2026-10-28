import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix theo kiến trúc: mọi endpoint nghiệp vụ nằm dưới /api/v1
  // Exclude health và auth để truy cập trực tiếp /health, /auth/register, /auth/login
  app.setGlobalPrefix('api/v1', { exclude: ['health', 'auth', 'auth/(.*)'] });

  // CORS – cho phép web (Next.js) gọi API. Ở production giới hạn bằng origin thật.
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
    credentials: true,
  });

  // Validate & sanitize input bằng class-validator cho mọi request body
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  // Log ra stdout để container thu lại (xem architecture.md §7)
  // eslint-disable-next-line no-console
  console.log(`BrewLite API listening on :${port}`);
}

bootstrap();
