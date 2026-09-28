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
import { ConfigurationModule } from './modules/configuration/configuration.module';
import { PaymentMethodsModule } from './modules/payment-methods/payment-methods.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { BrandsModule } from './modules/brands/brands.module';
import { ProductsModule } from './modules/products/products.module';
import { RegistersModule } from './modules/registers/registers.module';
import { CustomersModule } from './modules/customers/customers.module';
import { SalesModule } from './modules/sales/sales.module';
import { SaleSettingsModule } from './modules/sale-settings/sale-settings.module';
import { ReceiptSettingsModule } from './modules/receipt-settings/receipt-settings.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { PurchaseInvoicesModule } from './modules/purchase-invoices/purchase-invoices.module';
import { ReturnInvoicesModule } from './modules/return-invoices/return-invoices.module';
import { SupplierPaymentsModule } from './modules/supplier-payments/supplier-payments.module';
import { StockOperationsModule } from './modules/stock-operations/stock-operations.module';
import { StockCountModule } from './modules/stock-count/stock-count.module';
import { StockTransferModule } from './modules/stock-transfer/stock-transfer.module';
import { CustomerPaymentsModule } from './modules/customer-payments/customer-payments.module';
import { ChartOfAccountsModule } from './modules/chart-of-accounts/chart-of-accounts.module';
import { JournalEntriesModule } from './modules/journal-entries/journal-entries.module';
import { FixedAssetsModule } from './modules/fixed-assets/fixed-assets.module';
import { FinancialReportsModule } from './modules/financial-reports/financial-reports.module';
import { DigitalMenuModule } from './modules/digital-menu/digital-menu.module';

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
            synchronize:
              config.get<string>('DB_SYNCHRONIZE', 'false') === 'true',
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
    ConfigurationModule,
    PaymentMethodsModule,
    CategoriesModule,
    BrandsModule,
    ProductsModule,
    RegistersModule,
    CustomersModule,
    SalesModule,
    SaleSettingsModule,
    ReceiptSettingsModule,
    PromotionsModule,
    ExpensesModule,
    DashboardModule,
    ReportsModule,
    SuppliersModule,
    PurchaseInvoicesModule,
    ReturnInvoicesModule,
    SupplierPaymentsModule,
    StockOperationsModule,
    StockCountModule,
    StockTransferModule,
    CustomerPaymentsModule,
    ChartOfAccountsModule,
    JournalEntriesModule,
    FixedAssetsModule,
    FinancialReportsModule,
    DigitalMenuModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    {
      provide: APP_INTERCEPTOR,
      useFactory: (reflector: Reflector) =>
        new ClassSerializerInterceptor(reflector),
      inject: [Reflector],
    },
  ],
})
export class AppModule {}
