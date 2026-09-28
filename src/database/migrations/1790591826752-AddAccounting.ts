import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAccounting1790591826752 implements MigrationInterface {
    name = 'AddAccounting1790591826752'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`accounts\` (\`id\` varchar(36) NOT NULL, \`code\` varchar(20) NOT NULL, \`name\` varchar(150) NOT NULL, \`type\` enum ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE') NOT NULL, \`parentId\` varchar(255) NULL, \`isSystem\` tinyint NOT NULL DEFAULT 0, \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_490319656e54a7957dc1fed027\` (\`code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`fixed_assets\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(150) NOT NULL, \`category\` varchar(100) NULL, \`locationId\` varchar(255) NULL, \`assetAccountId\` varchar(255) NOT NULL, \`accumulatedDepreciationAccountId\` varchar(255) NOT NULL, \`depreciationExpenseAccountId\` varchar(255) NOT NULL, \`purchaseDate\` date NOT NULL, \`purchaseCost\` decimal(12,2) NOT NULL, \`usefulLifeMonths\` int NOT NULL, \`salvageValue\` decimal(12,2) NOT NULL DEFAULT '0.00', \`status\` enum ('ACTIVE', 'DISPOSED') NOT NULL DEFAULT 'ACTIVE', \`disposedAt\` date NULL, \`notes\` text NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`journal_entry_lines\` (\`id\` varchar(36) NOT NULL, \`journalEntryId\` varchar(255) NOT NULL, \`accountId\` varchar(255) NOT NULL, \`debit\` decimal(12,2) NOT NULL DEFAULT '0.00', \`credit\` decimal(12,2) NOT NULL DEFAULT '0.00', \`description\` varchar(255) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`journal_entries\` (\`id\` varchar(36) NOT NULL, \`entryNumber\` varchar(20) NULL, \`entryDate\` date NOT NULL, \`memo\` varchar(500) NULL, \`status\` enum ('DRAFT', 'POSTED') NOT NULL DEFAULT 'DRAFT', \`createdByUserId\` varchar(255) NOT NULL, \`postedAt\` timestamp NULL, \`reversalOfEntryId\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_4b3b30432878ce7cc7882e919b\` (\`entryNumber\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`fixed_asset_depreciation_entries\` (\`id\` varchar(36) NOT NULL, \`fixedAssetId\` varchar(255) NOT NULL, \`journalEntryId\` varchar(255) NOT NULL, \`periodDate\` date NOT NULL, \`amount\` decimal(12,2) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`accounts\` ADD CONSTRAINT \`FK_e1496dabea319842640e45fb3ed\` FOREIGN KEY (\`parentId\`) REFERENCES \`accounts\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`fixed_assets\` ADD CONSTRAINT \`FK_4d8d1391303d52b9bce5443f0a8\` FOREIGN KEY (\`locationId\`) REFERENCES \`locations\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`fixed_assets\` ADD CONSTRAINT \`FK_76f33dc66621bd0bbe30b38faae\` FOREIGN KEY (\`assetAccountId\`) REFERENCES \`accounts\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`fixed_assets\` ADD CONSTRAINT \`FK_2bd63fcdacb8336e277f79a5ce0\` FOREIGN KEY (\`accumulatedDepreciationAccountId\`) REFERENCES \`accounts\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`fixed_assets\` ADD CONSTRAINT \`FK_b28d7ed9e9e1ffad98bd762d48a\` FOREIGN KEY (\`depreciationExpenseAccountId\`) REFERENCES \`accounts\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`journal_entry_lines\` ADD CONSTRAINT \`FK_b06b5322d679be6e2559132857d\` FOREIGN KEY (\`journalEntryId\`) REFERENCES \`journal_entries\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`journal_entry_lines\` ADD CONSTRAINT \`FK_34d5d6a407b7724da2e2766b15e\` FOREIGN KEY (\`accountId\`) REFERENCES \`accounts\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`journal_entries\` ADD CONSTRAINT \`FK_889b387da9e286f1ff29c034239\` FOREIGN KEY (\`createdByUserId\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`journal_entries\` ADD CONSTRAINT \`FK_5aec57a7834dc5e04e921948f21\` FOREIGN KEY (\`reversalOfEntryId\`) REFERENCES \`journal_entries\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`fixed_asset_depreciation_entries\` ADD CONSTRAINT \`FK_ac110c77d607b68d631d3c55fbb\` FOREIGN KEY (\`fixedAssetId\`) REFERENCES \`fixed_assets\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`fixed_asset_depreciation_entries\` ADD CONSTRAINT \`FK_cd1e9ecc06451cc55002947b0a7\` FOREIGN KEY (\`journalEntryId\`) REFERENCES \`journal_entries\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`fixed_asset_depreciation_entries\` DROP FOREIGN KEY \`FK_cd1e9ecc06451cc55002947b0a7\``);
        await queryRunner.query(`ALTER TABLE \`fixed_asset_depreciation_entries\` DROP FOREIGN KEY \`FK_ac110c77d607b68d631d3c55fbb\``);
        await queryRunner.query(`ALTER TABLE \`journal_entries\` DROP FOREIGN KEY \`FK_5aec57a7834dc5e04e921948f21\``);
        await queryRunner.query(`ALTER TABLE \`journal_entries\` DROP FOREIGN KEY \`FK_889b387da9e286f1ff29c034239\``);
        await queryRunner.query(`ALTER TABLE \`journal_entry_lines\` DROP FOREIGN KEY \`FK_34d5d6a407b7724da2e2766b15e\``);
        await queryRunner.query(`ALTER TABLE \`journal_entry_lines\` DROP FOREIGN KEY \`FK_b06b5322d679be6e2559132857d\``);
        await queryRunner.query(`ALTER TABLE \`fixed_assets\` DROP FOREIGN KEY \`FK_b28d7ed9e9e1ffad98bd762d48a\``);
        await queryRunner.query(`ALTER TABLE \`fixed_assets\` DROP FOREIGN KEY \`FK_2bd63fcdacb8336e277f79a5ce0\``);
        await queryRunner.query(`ALTER TABLE \`fixed_assets\` DROP FOREIGN KEY \`FK_76f33dc66621bd0bbe30b38faae\``);
        await queryRunner.query(`ALTER TABLE \`fixed_assets\` DROP FOREIGN KEY \`FK_4d8d1391303d52b9bce5443f0a8\``);
        await queryRunner.query(`ALTER TABLE \`accounts\` DROP FOREIGN KEY \`FK_e1496dabea319842640e45fb3ed\``);
        await queryRunner.query(`DROP TABLE \`fixed_asset_depreciation_entries\``);
        await queryRunner.query(`DROP INDEX \`IDX_4b3b30432878ce7cc7882e919b\` ON \`journal_entries\``);
        await queryRunner.query(`DROP TABLE \`journal_entries\``);
        await queryRunner.query(`DROP TABLE \`journal_entry_lines\``);
        await queryRunner.query(`DROP TABLE \`fixed_assets\``);
        await queryRunner.query(`DROP INDEX \`IDX_490319656e54a7957dc1fed027\` ON \`accounts\``);
        await queryRunner.query(`DROP TABLE \`accounts\``);
    }

}
