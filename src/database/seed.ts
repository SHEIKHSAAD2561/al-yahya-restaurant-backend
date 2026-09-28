import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import AppDataSource from './data-source';
import { Role } from '../modules/roles/role.entity';
import { RoleType } from '../modules/roles/role-type.enum';
import { Permission } from '../modules/permissions/permission.entity';
import { PERMISSION_CATALOG } from '../modules/permissions/permission-catalog';
import { User } from '../modules/users/user.entity';
import { UserStatus } from '../modules/users/user-status.enum';
import { Language } from '../modules/users/language.enum';
import { Tax } from '../modules/taxes/tax.entity';
import { TaxLine } from '../modules/taxes/tax-line.entity';
import { TaxType } from '../modules/taxes/tax-type.enum';
import { SYSTEM_TAX_CODES } from '../modules/taxes/system-tax-codes';
import { BankAccount } from '../modules/payment-methods/bank-account.entity';
import { PaymentMethod } from '../modules/payment-methods/payment-method.entity';
import { PaymentMethodType } from '../modules/payment-methods/payment-method-type.enum';
import {
  SYSTEM_BANK_ACCOUNT_CODES,
  SYSTEM_PAYMENT_METHOD_CODES,
} from '../modules/payment-methods/system-codes';
import { Account } from '../modules/chart-of-accounts/account.entity';
import { AccountType } from '../modules/chart-of-accounts/account-type.enum';

const BCRYPT_ROUNDS = 12;

interface SystemTaxDefinition {
  name: string;
  code: string;
  type: TaxType;
  isActive: boolean;
  hasCompoundTax: boolean;
  compoundLabel?: string;
  compoundRate?: number;
  lines: { label: string | null; rate: number }[];
}

// Mirrors Rewaa's own KSA tax presets: the two baseline taxes are mandatory
// (locked on, can't be turned off), the tobacco scheme is optional (starts
// off, toggle-able). None of the three are editable — only their on/off
// state can change, and only for the toggle-able one.
const SYSTEM_TAXES: SystemTaxDefinition[] = [
  {
    name: 'Not Subject to Tax',
    code: SYSTEM_TAX_CODES.NOT_SUBJECT_TO_TAX,
    type: TaxType.SYSTEM_LOCKED,
    isActive: true,
    hasCompoundTax: false,
    lines: [{ label: null, rate: 0 }],
  },
  {
    name: 'VAT',
    code: SYSTEM_TAX_CODES.VAT,
    type: TaxType.SYSTEM_LOCKED,
    isActive: true,
    hasCompoundTax: false,
    lines: [{ label: null, rate: 15 }],
  },
  {
    name: 'VAT + Tobacco Tax',
    code: SYSTEM_TAX_CODES.VAT_TOBACCO,
    type: TaxType.SYSTEM_TOGGLABLE,
    isActive: false,
    hasCompoundTax: true,
    compoundLabel: 'VAT',
    compoundRate: 15,
    lines: [{ label: 'Tobacco Tax', rate: 100 }],
  },
];

const SYSTEM_ROLES: {
  type: RoleType;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
}[] = [
  {
    type: RoleType.SUPER_ADMIN,
    nameEn: 'Super Admin',
    nameAr: 'المدير الأعلى',
    descriptionEn:
      'Has unrestricted access to every feature and setting, including managing other Admins.',
    descriptionAr:
      'يتمتع بصلاحية وصول كاملة وغير مقيدة إلى جميع الميزات والإعدادات، بما في ذلك إدارة المدراء الآخرين.',
  },
  {
    type: RoleType.ADMIN,
    nameEn: 'Admin',
    nameAr: 'المدير',
    descriptionEn:
      'The Admin role has full control over the system, allowing for configuration and management of all settings.',
    descriptionAr:
      'يتمتع دور المدير بالتحكم الكامل في النظام، مما يتيح تكوين وإدارة جميع الإعدادات.',
  },
  {
    type: RoleType.DEFAULT,
    nameEn: 'Cashier',
    nameAr: 'أمين الصندوق',
    descriptionEn:
      'The Cashier role is responsible for processing transactions and managing customer payments at the point of sale.',
    descriptionAr:
      'يتولى أمين الصندوق مسؤولية معالجة المعاملات وإدارة مدفوعات العملاء في نقطة البيع.',
  },
  {
    type: RoleType.DEFAULT,
    nameEn: 'Store Manager',
    nameAr: 'مدير المتجر',
    descriptionEn:
      'The Supervisor monitors staff performance, coordinates daily operations, and ensures customer satisfaction.',
    descriptionAr:
      'يتابع المشرف أداء الموظفين، وينسّق العمليات اليومية، ويضمن رضا العملاء.',
  },
  {
    type: RoleType.DEFAULT,
    nameEn: 'Inventory Manager',
    nameAr: 'مدير المخزون',
    descriptionEn:
      'The Inventory Manager maintains financial records, oversees transactions, and ensures compliance with financial regulations.',
    descriptionAr:
      'يحافظ مدير المخزون على السجلات المالية، ويراقب المعاملات، ويضمن الامتثال للأنظمة المالية.',
  },
  {
    type: RoleType.DEFAULT,
    nameEn: 'Accountant',
    nameAr: 'محاسب',
    descriptionEn:
      'The Accountant manages financial records, oversees transactions, and ensures compliance with financial regulations.',
    descriptionAr:
      'يدير المحاسب السجلات المالية، ويراقب المعاملات، ويضمن الامتثال للأنظمة المالية.',
  },
];

async function seed() {
  await AppDataSource.initialize();
  console.log('Database connection established.');

  const roleRepo = AppDataSource.getRepository(Role);
  const permissionRepo = AppDataSource.getRepository(Permission);
  const userRepo = AppDataSource.getRepository(User);
  const taxRepo = AppDataSource.getRepository(Tax);
  const taxLineRepo = AppDataSource.getRepository(TaxLine);
  const bankAccountRepo = AppDataSource.getRepository(BankAccount);
  const paymentMethodRepo = AppDataSource.getRepository(PaymentMethod);
  const accountRepo = AppDataSource.getRepository(Account);

  // 1. Permission catalog — idempotent upsert by code.
  await permissionRepo.upsert(
    PERMISSION_CATALOG.map((entry) => ({
      module: entry.module,
      code: entry.code,
      descriptionEn: entry.descriptionEn,
      descriptionAr: entry.descriptionAr,
    })),
    ['code'],
  );
  console.log(`Upserted ${PERMISSION_CATALOG.length} permissions.`);

  // 2. System roles — idempotent upsert by nameEn. Cashier/Store Manager/
  //    Inventory Manager/Accountant intentionally start with NO permissions:
  //    they're meant to be configured by Super Admin/Admin after first run,
  //    not seeded with an opinionated guess.
  await roleRepo.upsert(
    SYSTEM_ROLES.map((r) => ({
      nameEn: r.nameEn,
      nameAr: r.nameAr,
      descriptionEn: r.descriptionEn,
      descriptionAr: r.descriptionAr,
      type: r.type,
    })),
    ['nameEn'],
  );
  console.log(`Upserted ${SYSTEM_ROLES.length} system roles.`);

  // 3. Super Admin and Admin get every permission — uniform data, not guard special-casing.
  const allPermissions = await permissionRepo.find();
  for (const type of [RoleType.SUPER_ADMIN, RoleType.ADMIN]) {
    const role = await roleRepo.findOne({
      where: { type },
      relations: { permissions: true },
    });
    if (!role) continue;
    role.permissions = allPermissions;
    await roleRepo.save(role);
  }
  console.log('Granted full permissions to Super Admin and Admin roles.');

  // 4. Bootstrap the initial Super Admin user, if one doesn't already exist.
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
  const superAdminNameEn = process.env.SUPER_ADMIN_NAME_EN;
  const superAdminNameAr = process.env.SUPER_ADMIN_NAME_AR;

  if (
    !superAdminEmail ||
    !superAdminPassword ||
    !superAdminNameEn ||
    !superAdminNameAr
  ) {
    console.warn(
      'SUPER_ADMIN_NAME_EN / SUPER_ADMIN_NAME_AR / SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD not set — skipping initial Super Admin user creation.',
    );
  } else {
    const existing = await userRepo.findOne({
      where: { email: superAdminEmail },
    });
    if (existing) {
      console.log(
        `Super Admin user ${superAdminEmail} already exists — leaving it untouched.`,
      );
    } else {
      const superAdminRole = await roleRepo.findOne({
        where: { type: RoleType.SUPER_ADMIN },
      });
      if (!superAdminRole) {
        throw new Error(
          'Super Admin role was not seeded — cannot create Super Admin user.',
        );
      }

      const passwordHash = await bcrypt.hash(superAdminPassword, BCRYPT_ROUNDS);
      const user = userRepo.create({
        nameEn: superAdminNameEn,
        nameAr: superAdminNameAr,
        email: superAdminEmail,
        phone: process.env.SUPER_ADMIN_PHONE ?? null,
        roleId: superAdminRole.id,
        status: UserStatus.ACTIVE,
        passwordHash,
        allLocations: true,
        preferredLanguage:
          (process.env.DEFAULT_LOCALE as Language) ?? Language.EN,
      });
      await userRepo.save(user);
      console.log(`Created initial Super Admin user: ${superAdminEmail}`);
    }
  }

  // 5. System taxes — idempotent upsert by code. Always fully re-synced
  //    (name/type/rate/lines overwritten from the definition above) since
  //    these aren't user-editable in the first place; a future tweak to the
  //    definitions here should apply cleanly on the next seed run.
  for (const definition of SYSTEM_TAXES) {
    let tax = await taxRepo.findOne({ where: { code: definition.code } });
    if (!tax) {
      tax = taxRepo.create({
        code: definition.code,
        isActive: definition.isActive,
      });
    } else if (definition.type !== TaxType.SYSTEM_TOGGLABLE) {
      tax.isActive = definition.isActive;
    }
    // A SYSTEM_TOGGLABLE tax's on/off state is the user's choice (and
    // Configuration depends on it) — only its initial value comes from here.
    tax.name = definition.name;
    tax.type = definition.type;
    tax.hasCompoundTax = definition.hasCompoundTax;
    tax.compoundLabel = definition.compoundLabel ?? null;
    tax.compoundRate = definition.compoundRate ?? null;
    tax = await taxRepo.save(tax);

    await taxLineRepo.delete({ taxId: tax.id });
    tax.lines = definition.lines.map((line, index) =>
      taxLineRepo.create({
        taxId: tax.id,
        label: line.label,
        rate: line.rate,
        sortOrder: index,
      }),
    );
    await taxRepo.save(tax);
  }
  console.log(`Upserted ${SYSTEM_TAXES.length} system taxes.`);

  // 6. System payment methods — create-if-missing only (by systemCode), never
  //    overwritten: unlike system taxes, their name/description/linked
  //    account are user-editable. Same rows the AddPaymentMethods migration
  //    creates; this just covers a DB where they were removed or never made.
  let otherBankAccounts = await bankAccountRepo.findOne({
    where: { systemCode: SYSTEM_BANK_ACCOUNT_CODES.OTHER_BANK_ACCOUNTS },
  });
  if (!otherBankAccounts) {
    otherBankAccounts = await bankAccountRepo.save(
      bankAccountRepo.create({
        name: 'Other Bank Accounts',
        accountNumber: null,
        systemCode: SYSTEM_BANK_ACCOUNT_CODES.OTHER_BANK_ACCOUNTS,
      }),
    );
  }
  const systemPaymentMethods = [
    {
      systemCode: SYSTEM_PAYMENT_METHOD_CODES.CASH,
      name: 'Cash',
      type: PaymentMethodType.CASH,
      bankAccountId: null,
    },
    {
      systemCode: SYSTEM_PAYMENT_METHOD_CODES.CREDIT_CARD,
      name: 'Credit Card',
      type: PaymentMethodType.CARD,
      bankAccountId: otherBankAccounts.id,
    },
  ];
  for (const definition of systemPaymentMethods) {
    if (
      !(await paymentMethodRepo.exists({
        where: { systemCode: definition.systemCode },
      }))
    ) {
      await paymentMethodRepo.save(paymentMethodRepo.create(definition));
    }
  }
  console.log(`Ensured ${systemPaymentMethods.length} system payment methods.`);

  // 7. Default chart of accounts — create-if-missing only (by code), same
  //    reasoning as system payment methods: name is freely user-editable
  //    after creation, only `type` and the `isSystem` (can't
  //    deactivate/delete) flag come from here. A restaurant would normally
  //    customize this list; these are a reasonable starting point covering
  //    every account this app's other modules reference by default (Fixed
  //    Assets' account pickers, and whatever a bookkeeper manually posts
  //    sales/purchases/expenses against — none of that is auto-posted yet,
  //    see the backend CLAUDE.md's Accounting section).
  const DEFAULT_ACCOUNTS: { code: string; name: string; type: AccountType }[] =
    [
      { code: '1000', name: 'Cash', type: AccountType.ASSET },
      { code: '1010', name: 'Bank', type: AccountType.ASSET },
      { code: '1100', name: 'Accounts Receivable', type: AccountType.ASSET },
      { code: '1200', name: 'Inventory', type: AccountType.ASSET },
      { code: '1500', name: 'Fixed Assets', type: AccountType.ASSET },
      {
        code: '1510',
        name: 'Accumulated Depreciation',
        type: AccountType.ASSET,
      },
      { code: '2000', name: 'Accounts Payable', type: AccountType.LIABILITY },
      { code: '2100', name: 'Tax Payable', type: AccountType.LIABILITY },
      { code: '3000', name: "Owner's Equity", type: AccountType.EQUITY },
      { code: '3900', name: 'Retained Earnings', type: AccountType.EQUITY },
      { code: '4000', name: 'Sales Revenue', type: AccountType.REVENUE },
      { code: '5000', name: 'Cost of Goods Sold', type: AccountType.EXPENSE },
      { code: '5100', name: 'Rent Expense', type: AccountType.EXPENSE },
      { code: '5200', name: 'Salaries Expense', type: AccountType.EXPENSE },
      { code: '5300', name: 'Utilities Expense', type: AccountType.EXPENSE },
      { code: '5400', name: 'Depreciation Expense', type: AccountType.EXPENSE },
      { code: '5900', name: 'Other Expense', type: AccountType.EXPENSE },
    ];
  for (const definition of DEFAULT_ACCOUNTS) {
    if (!(await accountRepo.exists({ where: { code: definition.code } }))) {
      await accountRepo.save(
        accountRepo.create({
          code: definition.code,
          name: definition.name,
          type: definition.type,
          isSystem: true,
        }),
      );
    }
  }
  console.log(
    `Ensured ${DEFAULT_ACCOUNTS.length} default chart-of-accounts entries.`,
  );

  await AppDataSource.destroy();
  console.log('Seed complete.');
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
