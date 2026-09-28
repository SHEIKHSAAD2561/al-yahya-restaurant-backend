import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';
import { PaymentMethod } from './payment-method.entity';
import { PaymentMethodType } from './payment-method-type.enum';
import { BankAccount } from './bank-account.entity';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';

@Injectable()
export class PaymentMethodsService {
  constructor(
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
    @InjectRepository(BankAccount)
    private readonly bankAccountRepository: Repository<BankAccount>,
  ) {}

  private t(key: string): string {
    return I18nContext.current()?.t(key) ?? key;
  }

  findAll(): Promise<PaymentMethod[]> {
    return this.paymentMethodRepository.find({ order: { createdAt: 'ASC' } });
  }

  async findOneOrFail(id: string): Promise<PaymentMethod> {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id },
    });
    if (!paymentMethod) {
      throw new NotFoundException(this.t('payment_methods.not_found'));
    }
    return paymentMethod;
  }

  async create(dto: CreatePaymentMethodDto): Promise<PaymentMethod> {
    await this.assertNameAvailable(dto.name);
    const bankAccountId = await this.resolveBankAccountId(
      dto.type,
      dto.bankAccountId,
    );

    const paymentMethod = this.paymentMethodRepository.create({
      name: dto.name,
      type: dto.type,
      bankAccountId,
      description: dto.description || null,
    });
    return this.paymentMethodRepository.save(paymentMethod);
  }

  async update(
    id: string,
    dto: UpdatePaymentMethodDto,
  ): Promise<PaymentMethod> {
    const paymentMethod = await this.findOneOrFail(id);

    if (
      dto.type !== undefined &&
      dto.type !== paymentMethod.type &&
      paymentMethod.systemCode
    ) {
      throw new ForbiddenException(
        this.t('payment_methods.system_type_locked'),
      );
    }
    if (dto.name !== undefined && dto.name !== paymentMethod.name) {
      await this.assertNameAvailable(dto.name, id);
      paymentMethod.name = dto.name;
    }
    if (dto.description !== undefined)
      paymentMethod.description = dto.description || null;

    const type = dto.type ?? paymentMethod.type;
    const requestedBankAccountId =
      dto.bankAccountId !== undefined
        ? dto.bankAccountId
        : paymentMethod.bankAccountId;
    paymentMethod.bankAccountId = await this.resolveBankAccountId(
      type,
      requestedBankAccountId,
    );
    paymentMethod.type = type;

    return this.paymentMethodRepository.save(paymentMethod);
  }

  findAllBankAccounts(): Promise<BankAccount[]> {
    return this.bankAccountRepository.find({ order: { createdAt: 'ASC' } });
  }

  async createBankAccount(dto: CreateBankAccountDto): Promise<BankAccount> {
    if (
      await this.bankAccountRepository.exists({
        where: { accountNumber: dto.accountNumber },
      })
    ) {
      throw new ConflictException(
        this.t('payment_methods.bank_account_number_taken'),
      );
    }
    const bankAccount = this.bankAccountRepository.create({
      name: dto.name,
      accountNumber: dto.accountNumber,
    });
    return this.bankAccountRepository.save(bankAccount);
  }

  private async assertNameAvailable(
    name: string,
    exceptId?: string,
  ): Promise<void> {
    const taken = await this.paymentMethodRepository.exists({
      where: { name, ...(exceptId ? { id: Not(exceptId) } : {}) },
    });
    if (taken) {
      throw new ConflictException(this.t('payment_methods.name_taken'));
    }
  }

  /** CASH → always null; any other type → must reference an existing bank account. */
  private async resolveBankAccountId(
    type: PaymentMethodType,
    bankAccountId: string | null | undefined,
  ): Promise<string | null> {
    if (type === PaymentMethodType.CASH) return null;

    if (!bankAccountId) {
      throw new BadRequestException(
        this.t('payment_methods.bank_account_required'),
      );
    }
    if (
      !(await this.bankAccountRepository.exists({
        where: { id: bankAccountId },
      }))
    ) {
      throw new BadRequestException(
        this.t('payment_methods.bank_account_not_found'),
      );
    }
    return bankAccountId;
  }
}
