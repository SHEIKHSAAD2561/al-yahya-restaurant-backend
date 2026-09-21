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

const BCRYPT_ROUNDS = 12;

const SYSTEM_ROLES: { type: RoleType; nameEn: string; nameAr: string }[] = [
  { type: RoleType.SUPER_ADMIN, nameEn: 'Super Admin', nameAr: 'المدير الأعلى' },
  { type: RoleType.ADMIN, nameEn: 'Admin', nameAr: 'المدير' },
  { type: RoleType.DEFAULT, nameEn: 'Cashier', nameAr: 'أمين الصندوق' },
  { type: RoleType.DEFAULT, nameEn: 'Store Manager', nameAr: 'مدير المتجر' },
  { type: RoleType.DEFAULT, nameEn: 'Inventory Manager', nameAr: 'مدير المخزون' },
  { type: RoleType.DEFAULT, nameEn: 'Accountant', nameAr: 'محاسب' },
];

async function seed() {
  await AppDataSource.initialize();
  console.log('Database connection established.');

  const roleRepo = AppDataSource.getRepository(Role);
  const permissionRepo = AppDataSource.getRepository(Permission);
  const userRepo = AppDataSource.getRepository(User);

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
    SYSTEM_ROLES.map((r) => ({ nameEn: r.nameEn, nameAr: r.nameAr, type: r.type })),
    ['nameEn'],
  );
  console.log(`Upserted ${SYSTEM_ROLES.length} system roles.`);

  // 3. Super Admin and Admin get every permission — uniform data, not guard special-casing.
  const allPermissions = await permissionRepo.find();
  for (const type of [RoleType.SUPER_ADMIN, RoleType.ADMIN]) {
    const role = await roleRepo.findOne({ where: { type }, relations: { permissions: true } });
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

  if (!superAdminEmail || !superAdminPassword || !superAdminNameEn || !superAdminNameAr) {
    console.warn(
      'SUPER_ADMIN_NAME_EN / SUPER_ADMIN_NAME_AR / SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD not set — skipping initial Super Admin user creation.',
    );
  } else {
    const existing = await userRepo.findOne({ where: { email: superAdminEmail } });
    if (existing) {
      console.log(`Super Admin user ${superAdminEmail} already exists — leaving it untouched.`);
    } else {
      const superAdminRole = await roleRepo.findOne({ where: { type: RoleType.SUPER_ADMIN } });
      if (!superAdminRole) {
        throw new Error('Super Admin role was not seeded — cannot create Super Admin user.');
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
        preferredLanguage: (process.env.DEFAULT_LOCALE as Language) ?? Language.EN,
      });
      await userRepo.save(user);
      console.log(`Created initial Super Admin user: ${superAdminEmail}`);
    }
  }

  await AppDataSource.destroy();
  console.log('Seed complete.');
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
