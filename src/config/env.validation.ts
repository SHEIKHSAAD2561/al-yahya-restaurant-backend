import { plainToInstance } from 'class-transformer';
import {
  IsBooleanString,
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
  MinLength,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsOptional()
  @IsNumberString()
  PORT?: string;

  @IsString()
  DB_HOST: string;

  @IsNumberString()
  DB_PORT: string;

  @IsString()
  DB_USERNAME: string;

  @IsOptional()
  @IsString()
  DB_PASSWORD?: string;

  @IsString()
  DB_DATABASE: string;

  @IsOptional()
  @IsBooleanString()
  DB_SYNCHRONIZE?: string;

  @IsString()
  @MinLength(32)
  JWT_ACCESS_SECRET: string;

  @IsString()
  JWT_ACCESS_EXPIRES_IN: string;

  @IsString()
  @MinLength(32)
  JWT_REFRESH_SECRET: string;

  @IsString()
  JWT_REFRESH_EXPIRES_IN: string;

  @IsString()
  CORS_ORIGIN: string;

  @IsString()
  APP_URL: string;

  @IsNumberString()
  INVITE_TOKEN_EXPIRES_IN_HOURS: string;

  @IsString()
  SMTP_HOST: string;

  @IsNumberString()
  SMTP_PORT: string;

  @IsBooleanString()
  SMTP_SECURE: string;

  @IsString()
  SMTP_USER: string;

  @IsString()
  SMTP_PASS: string;

  @IsString()
  MAIL_FROM: string;

  @IsOptional()
  @IsIn(['en', 'ar'])
  DEFAULT_LOCALE?: string;

  @IsOptional()
  @IsString()
  SUPER_ADMIN_NAME_EN?: string;

  @IsOptional()
  @IsString()
  SUPER_ADMIN_NAME_AR?: string;

  @IsOptional()
  @IsString()
  SUPER_ADMIN_EMAIL?: string;

  @IsOptional()
  @IsString()
  SUPER_ADMIN_PASSWORD?: string;

  @IsOptional()
  @IsString()
  SUPER_ADMIN_PHONE?: string;

  @IsString()
  FIREBASE_PROJECT_ID: string;

  @IsString()
  FIREBASE_CLIENT_EMAIL: string;

  @IsString()
  FIREBASE_PRIVATE_KEY: string;

  @IsString()
  FIREBASE_STORAGE_BUCKET: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(
      `Invalid environment configuration:\n${errors.map((e) => Object.values(e.constraints ?? {}).join(', ')).join('\n')}`,
    );
  }

  return validatedConfig;
}
