import { join } from 'node:path';
import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  I18nJsonLoader,
  QueryResolver,
} from 'nestjs-i18n';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validateEnv } from './config/env.validation';
import { buildTypeOrmOptions } from './config/typeorm.config';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { RolesModule } from './modules/roles/roles.module';
import { UsersModule } from './modules/users/users.module';
import { LocationsModule } from './modules/locations/locations.module';
import { AuthModule } from './modules/auth/auth.module';
import { MailModule } from './modules/mail/mail.module';
import { CompanyModule } from './modules/company/company.module';
import { TaxesModule } from './modules/taxes/taxes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    I18nModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        fallbackLanguage: config.get<string>('DEFAULT_LOCALE', 'en'),
        loaderOptions: {
          path: join(__dirname, 'i18n'),
          watch: true,
        },
      }),
      inject: [ConfigService],
      loader: I18nJsonLoader,
      resolvers: [
        new QueryResolver(['lang']),
        new HeaderResolver(['x-lang']),
        AcceptLanguageResolver,
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...buildTypeOrmOptions(
          {
            host: config.get<string>('DB_HOST')!,
            port: config.get<number>('DB_PORT')!,
            username: config.get<string>('DB_USERNAME')!,
            password: config.get<string>('DB_PASSWORD', ''),
            database: config.get<string>('DB_DATABASE')!,
            synchronize: config.get<string>('DB_SYNCHRONIZE', 'false') === 'true',
          },
          {},
        ),
        autoLoadEntities: true,
      }),
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
    }),
    PermissionsModule,
    RolesModule,
    UsersModule,
    LocationsModule,
    AuthModule,
    MailModule,
    CompanyModule,
    TaxesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    {
      provide: APP_INTERCEPTOR,
      useFactory: (reflector: Reflector) => new ClassSerializerInterceptor(reflector),
      inject: [Reflector],
    },
  ],
})
export class AppModule {}
