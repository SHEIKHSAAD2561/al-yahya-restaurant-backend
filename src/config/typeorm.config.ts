import { DataSourceOptions } from 'typeorm';

export interface TypeOrmConfigInput {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  synchronize: boolean;
  logging?: boolean;
}

/**
 * Single source of truth for MySQL connection options, shared by the NestJS
 * runtime (app.module.ts) and the TypeORM CLI (database/data-source.ts) so
 * the two never drift apart.
 *
 * charset is forced to utf8mb4 (not MySQL's legacy 3-byte "utf8") so Arabic
 * text — and anything else outside the BMP — round-trips correctly.
 */
export function buildTypeOrmOptions(
  input: TypeOrmConfigInput,
  entitiesAndMigrations: Pick<DataSourceOptions, 'entities' | 'migrations'>,
): DataSourceOptions {
  return {
    type: 'mysql',
    host: input.host,
    port: input.port,
    username: input.username,
    password: input.password,
    database: input.database,
    charset: 'utf8mb4',
    synchronize: input.synchronize,
    logging: input.logging ?? false,
    ...entitiesAndMigrations,
  };
}
