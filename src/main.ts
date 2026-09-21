import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const dataSource = app.get<DataSource>(getDataSourceToken());
  if (dataSource.isInitialized) {
    Logger.log('Database connection established', 'TypeORM');
  }

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
