import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { i18nValidationErrorFactory, I18nValidationExceptionFilter } from 'nestjs-i18n';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: i18nValidationErrorFactory,
    }),
  );
  app.useGlobalFilters(new I18nValidationExceptionFilter());

  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', '').split(',').filter(Boolean),
    credentials: true,
  });

  const dataSource = app.get<DataSource>(getDataSourceToken());
  if (dataSource.isInitialized) {
    Logger.log('Database connection established', 'TypeORM');
  }

  const port = configService.get<string>('PORT', '3001');
  await app.listen(port);
}
bootstrap();
