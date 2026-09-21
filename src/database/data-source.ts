import 'dotenv/config';
import { DataSource } from 'typeorm';
import { buildTypeOrmOptions } from '../config/typeorm.config';

/**
 * CLI-only DataSource, used by the migration:* npm scripts. Shares
 * buildTypeOrmOptions with app.module.ts so connection settings can't drift
 * between the running app and the migration tooling.
 */
const AppDataSource = new DataSource(
  buildTypeOrmOptions(
    {
      host: process.env.DB_HOST!,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME!,
      password: process.env.DB_PASSWORD ?? '',
      database: process.env.DB_DATABASE!,
      synchronize: false,
    },
    {
      entities: ['src/**/*.entity.ts'],
      migrations: ['src/database/migrations/*.ts'],
    },
  ),
);

export default AppDataSource;
