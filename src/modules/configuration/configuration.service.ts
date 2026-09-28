import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';
import { Configuration } from './configuration.entity';
import { TaxStatus } from './configuration.enums';
import { UpdateTaxConfigurationDto } from './dto/update-tax-configuration.dto';
import { UpdateLocationConfigurationDto } from './dto/update-location-configuration.dto';
import { UpdateWeightedProductConfigurationDto } from './dto/update-weighted-product-configuration.dto';
import { UpdateShippingConfigurationDto } from './dto/update-shipping-configuration.dto';
import { UpdatePaymentConfigurationDto } from './dto/update-payment-configuration.dto';
import { Tax } from '../taxes/tax.entity';
import { SYSTEM_TAX_CODES } from '../taxes/system-tax-codes';
import { Location } from '../locations/location.entity';
import { LocationsService } from '../locations/locations.service';
import { PaymentMethod } from '../payment-methods/payment-method.entity';
import { SYSTEM_PAYMENT_METHOD_CODES } from '../payment-methods/system-codes';

/** Weighted-product barcodes always encode 3 decimal digits (grams in a kg,
 * halalas in a riyal) — shown read-only in the UI, not configurable. */
const WEIGHT_DECIMAL_DIGITS = 3;

export interface ConfigurationResponse {
  defaultTaxId: string | null;
  sellTaxStatus: TaxStatus;
  /** Always EXCLUSIVE — purchase costs are recorded tax-exclusive. */
  costTaxStatus: TaxStatus;
  /** True while "VAT + Tobacco Tax" is active; sellTaxStatus is then fixed
   * to EXCLUSIVE. */
  sellTaxStatusLocked: boolean;
  defaultLocationId: string | null;
  weightUnit: Configuration['weightUnit'];
  barcodeValueType: Configuration['barcodeValueType'];
  barcodePrefix: number;
  weightDecimalDigits: number;
  barcodeHasCheckDigit: boolean;
  shippingWeightUnit: Configuration['shippingWeightUnit'];
  shippingDimensionUnit: Configuration['shippingDimensionUnit'];
  defaultPaymentMethodId: string | null;
  updatedAt: Date;
}

@Injectable()
export class ConfigurationService {
  constructor(
    @InjectRepository(Configuration)
    private readonly configurationRepository: Repository<Configuration>,
    @InjectRepository(Tax)
    private readonly taxRepository: Repository<Tax>,
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
    private readonly locationsService: LocationsService,
  ) {}

  private t(key: string): string {
    return I18nContext.current()?.t(key) ?? key;
  }

  /** Single row, auto-created on first access with VAT and Cash as defaults. */
  private async findOrCreate(): Promise<Configuration> {
    const [existing] = await this.configurationRepository.find({ take: 1 });
    if (existing) return existing;

    const [vat, cash] = await Promise.all([
      this.taxRepository.findOne({ where: { code: SYSTEM_TAX_CODES.VAT } }),
      this.paymentMethodRepository.findOne({
        where: { systemCode: SYSTEM_PAYMENT_METHOD_CODES.CASH },
      }),
    ]);
    const created = this.configurationRepository.create({
      defaultTaxId: vat?.id ?? null,
      defaultPaymentMethodId: cash?.id ?? null,
    });
    return this.configurationRepository.save(created);
  }

  private async isSellTaxStatusLocked(): Promise<boolean> {
    return this.taxRepository.exists({
      where: { code: SYSTEM_TAX_CODES.VAT_TOBACCO, isActive: true },
    });
  }

  private async toResponse(
    configuration: Configuration,
  ): Promise<ConfigurationResponse> {
    const [sellTaxStatusLocked, defaultLocation] = await Promise.all([
      this.isSellTaxStatusLocked(),
      this.locationRepository.findOne({ where: { isDefault: true } }),
    ]);

    return {
      defaultTaxId: configuration.defaultTaxId,
      // TaxesService already persists EXCLUSIVE when the tobacco tax is
      // activated; this just guarantees the response can never disagree.
      sellTaxStatus: sellTaxStatusLocked
        ? TaxStatus.EXCLUSIVE
        : configuration.sellTaxStatus,
      costTaxStatus: TaxStatus.EXCLUSIVE,
      sellTaxStatusLocked,
      defaultLocationId: defaultLocation?.id ?? null,
      weightUnit: configuration.weightUnit,
      barcodeValueType: configuration.barcodeValueType,
      barcodePrefix: configuration.barcodePrefix,
      weightDecimalDigits: WEIGHT_DECIMAL_DIGITS,
      barcodeHasCheckDigit: configuration.barcodeHasCheckDigit,
      shippingWeightUnit: configuration.shippingWeightUnit,
      shippingDimensionUnit: configuration.shippingDimensionUnit,
      defaultPaymentMethodId: configuration.defaultPaymentMethodId,
      updatedAt: configuration.updatedAt,
    };
  }

  async get(): Promise<ConfigurationResponse> {
    return this.toResponse(await this.findOrCreate());
  }

  /** Narrow `{id, name}` projection of active locations for the Default
   * Location dropdown — so this page doesn't need `settings.locations.manage`
   * just to read the list. */
  listLocationOptions(): Promise<Pick<Location, 'id' | 'name'>[]> {
    return this.locationRepository.find({
      select: { id: true, name: true },
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async updateTax(
    dto: UpdateTaxConfigurationDto,
  ): Promise<ConfigurationResponse> {
    const tax = await this.taxRepository.findOne({
      where: { id: dto.defaultTaxId },
    });
    if (!tax) {
      throw new BadRequestException(
        this.t('configuration.default_tax_not_found'),
      );
    }
    if (!tax.isActive) {
      throw new BadRequestException(
        this.t('configuration.default_tax_inactive'),
      );
    }
    if (
      dto.sellTaxStatus === TaxStatus.INCLUSIVE &&
      (await this.isSellTaxStatusLocked())
    ) {
      throw new BadRequestException(
        this.t('configuration.sell_tax_status_locked'),
      );
    }

    const configuration = await this.findOrCreate();
    configuration.defaultTaxId = dto.defaultTaxId;
    configuration.sellTaxStatus = dto.sellTaxStatus;
    return this.toResponse(
      await this.configurationRepository.save(configuration),
    );
  }

  async updateLocation(
    dto: UpdateLocationConfigurationDto,
  ): Promise<ConfigurationResponse> {
    const location = await this.locationsService.findOneOrFail(
      dto.defaultLocationId,
    );
    if (!location.isActive) {
      throw new BadRequestException(
        this.t('configuration.default_location_inactive'),
      );
    }
    await this.locationsService.update(location.id, { isDefault: true });
    return this.get();
  }

  async updateWeightedProduct(
    dto: UpdateWeightedProductConfigurationDto,
  ): Promise<ConfigurationResponse> {
    return this.saveFields(dto);
  }

  async updateShipping(
    dto: UpdateShippingConfigurationDto,
  ): Promise<ConfigurationResponse> {
    return this.saveFields(dto);
  }

  async updatePayment(
    dto: UpdatePaymentConfigurationDto,
  ): Promise<ConfigurationResponse> {
    const exists = await this.paymentMethodRepository.exists({
      where: { id: dto.defaultPaymentMethodId },
    });
    if (!exists) {
      throw new BadRequestException(
        this.t('configuration.default_payment_method_not_found'),
      );
    }
    return this.saveFields(dto);
  }

  private async saveFields(
    fields: Partial<Configuration>,
  ): Promise<ConfigurationResponse> {
    const configuration = await this.findOrCreate();
    Object.assign(configuration, fields);
    return this.toResponse(
      await this.configurationRepository.save(configuration),
    );
  }
}
