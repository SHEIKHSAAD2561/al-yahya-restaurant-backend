import { Body, Controller, Get, Post } from '@nestjs/common';
import { PaymentMethodsService } from './payment-methods.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

/** Only managed from Settings → Payment Methods ("Add New Bank"), so it
 * shares that page's permission. */
@Controller('bank-accounts')
export class BankAccountsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Get()
  @RequirePermissions('settings.financial_settings')
  findAll() {
    return this.paymentMethodsService.findAllBankAccounts();
  }

  @Post()
  @RequirePermissions('settings.financial_settings')
  create(@Body() dto: CreateBankAccountDto) {
    return this.paymentMethodsService.createBankAccount(dto);
  }
}
