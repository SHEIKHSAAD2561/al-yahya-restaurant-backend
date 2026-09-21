import { MigrationInterface, QueryRunner } from "typeorm";

export class InitAuthRbacSchema1789984320975 implements MigrationInterface {
    name = 'InitAuthRbacSchema1789984320975'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`locations\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(150) NOT NULL, \`address\` varchar(255) NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`permissions\` (\`id\` varchar(36) NOT NULL, \`module\` enum ('POS', 'CUSTOMERS', 'ECOMMERCE_ORDERS', 'PRODUCTS', 'STOCK', 'PURCHASES_SUPPLIERS', 'EXPENSES', 'ACCOUNTING', 'DASHBOARD', 'REPORTS', 'SETTINGS') NOT NULL, \`code\` varchar(100) NOT NULL, \`descriptionEn\` varchar(255) NOT NULL, \`descriptionAr\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_8b634526cdd01f2adba6c7ac07\` (\`module\`), UNIQUE INDEX \`IDX_8dad765629e83229da6feda1c1\` (\`code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`roles\` (\`id\` varchar(36) NOT NULL, \`nameEn\` varchar(100) NOT NULL, \`nameAr\` varchar(100) NOT NULL, \`type\` enum ('SUPER_ADMIN', 'ADMIN', 'DEFAULT', 'CUSTOM') NOT NULL DEFAULT 'CUSTOM', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_77fa0bc846270ab8092859072a\` (\`nameEn\`), INDEX \`IDX_ff503f858b61860b2b7d7a55ce\` (\`type\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(150) NOT NULL, \`email\` varchar(255) NOT NULL, \`phone\` varchar(30) NULL, \`passwordHash\` varchar(255) NULL, \`status\` enum ('PENDING', 'ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'PENDING', \`roleId\` varchar(255) NOT NULL, \`allLocations\` tinyint NOT NULL DEFAULT 1, \`preferredLanguage\` enum ('en', 'ar') NOT NULL DEFAULT 'en', \`passwordResetTokenHash\` varchar(64) NULL, \`passwordResetTokenExpiresAt\` timestamp NULL, \`lastLoginAt\` timestamp NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`refresh_tokens\` (\`id\` varchar(36) NOT NULL, \`userId\` varchar(255) NOT NULL, \`tokenHash\` varchar(64) NOT NULL, \`expiresAt\` timestamp NOT NULL, \`revokedAt\` timestamp NULL, \`replacedByTokenId\` varchar(255) NULL, \`userAgent\` varchar(255) NULL, \`ipAddress\` varchar(64) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_c25bc63d248ca90e8dcc1d92d0\` (\`tokenHash\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`role_permissions\` (\`roleId\` varchar(36) NOT NULL, \`permissionId\` varchar(36) NOT NULL, INDEX \`IDX_b4599f8b8f548d35850afa2d12\` (\`roleId\`), INDEX \`IDX_06792d0c62ce6b0203c03643cd\` (\`permissionId\`), PRIMARY KEY (\`roleId\`, \`permissionId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`user_locations\` (\`userId\` varchar(36) NOT NULL, \`locationId\` varchar(36) NOT NULL, INDEX \`IDX_58343d9d63e326037f304fde3c\` (\`userId\`), INDEX \`IDX_a2532b78fb97c733436438030f\` (\`locationId\`), PRIMARY KEY (\`userId\`, \`locationId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD CONSTRAINT \`FK_368e146b785b574f42ae9e53d5e\` FOREIGN KEY (\`roleId\`) REFERENCES \`roles\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`refresh_tokens\` ADD CONSTRAINT \`FK_610102b60fea1455310ccd299de\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`role_permissions\` ADD CONSTRAINT \`FK_b4599f8b8f548d35850afa2d12c\` FOREIGN KEY (\`roleId\`) REFERENCES \`roles\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`role_permissions\` ADD CONSTRAINT \`FK_06792d0c62ce6b0203c03643cdd\` FOREIGN KEY (\`permissionId\`) REFERENCES \`permissions\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`user_locations\` ADD CONSTRAINT \`FK_58343d9d63e326037f304fde3c5\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`user_locations\` ADD CONSTRAINT \`FK_a2532b78fb97c733436438030f0\` FOREIGN KEY (\`locationId\`) REFERENCES \`locations\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user_locations\` DROP FOREIGN KEY \`FK_a2532b78fb97c733436438030f0\``);
        await queryRunner.query(`ALTER TABLE \`user_locations\` DROP FOREIGN KEY \`FK_58343d9d63e326037f304fde3c5\``);
        await queryRunner.query(`ALTER TABLE \`role_permissions\` DROP FOREIGN KEY \`FK_06792d0c62ce6b0203c03643cdd\``);
        await queryRunner.query(`ALTER TABLE \`role_permissions\` DROP FOREIGN KEY \`FK_b4599f8b8f548d35850afa2d12c\``);
        await queryRunner.query(`ALTER TABLE \`refresh_tokens\` DROP FOREIGN KEY \`FK_610102b60fea1455310ccd299de\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_368e146b785b574f42ae9e53d5e\``);
        await queryRunner.query(`DROP INDEX \`IDX_a2532b78fb97c733436438030f\` ON \`user_locations\``);
        await queryRunner.query(`DROP INDEX \`IDX_58343d9d63e326037f304fde3c\` ON \`user_locations\``);
        await queryRunner.query(`DROP TABLE \`user_locations\``);
        await queryRunner.query(`DROP INDEX \`IDX_06792d0c62ce6b0203c03643cd\` ON \`role_permissions\``);
        await queryRunner.query(`DROP INDEX \`IDX_b4599f8b8f548d35850afa2d12\` ON \`role_permissions\``);
        await queryRunner.query(`DROP TABLE \`role_permissions\``);
        await queryRunner.query(`DROP INDEX \`IDX_c25bc63d248ca90e8dcc1d92d0\` ON \`refresh_tokens\``);
        await queryRunner.query(`DROP TABLE \`refresh_tokens\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_ff503f858b61860b2b7d7a55ce\` ON \`roles\``);
        await queryRunner.query(`DROP INDEX \`IDX_77fa0bc846270ab8092859072a\` ON \`roles\``);
        await queryRunner.query(`DROP TABLE \`roles\``);
        await queryRunner.query(`DROP INDEX \`IDX_8dad765629e83229da6feda1c1\` ON \`permissions\``);
        await queryRunner.query(`DROP INDEX \`IDX_8b634526cdd01f2adba6c7ac07\` ON \`permissions\``);
        await queryRunner.query(`DROP TABLE \`permissions\``);
        await queryRunner.query(`DROP TABLE \`locations\``);
    }

}
