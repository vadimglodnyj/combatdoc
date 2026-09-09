import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { bindHttpPort, parsePort } from './common/bind-port';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.enableShutdownHooks();

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api', { exclude: ['health'] });

  const port = parsePort(process.env.PORT);
  await bindHttpPort(app, port, { logger });

  logger.log(`CombatDOC API running on: http://localhost:${port}/api`);
  logger.log(`Health check: http://localhost:${port}/health`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
