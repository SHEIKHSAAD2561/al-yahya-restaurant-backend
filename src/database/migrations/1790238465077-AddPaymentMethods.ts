import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Hand-edited from the generated version: the generator dropped and re-added
 * `configuration.defaultPaymentMethod`, losing the saved choice. Instead this
 * creates the system rows (Cash, Credit Card → "Other Bank Accounts") and maps
 * the old enum value onto the matching row before dropping the old column.
 * seed.ts re-creates the same system rows (by systemCode) if they're missing.
 */
export class AddPaymentMethods1790238465077 implements MigrationInterface {
  name = 'AddPaymentMethods1790238465077';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`bank_accounts\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(100) NOT NULL, \`accountNumber\` varchar(50) NULL, \`systemCode\` varchar(30) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_78237756b3dad116a3f5f6398e\` (\`accountNumber\`), UNIQUE INDEX \`IDX_e09d324b561172dfda71be7c11\` (\`systemCode\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`payment_methods\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(100) NOT NULL, \`type\` enum ('CASH', 'CARD', 'BANK_TRANSFER', 'OTHER') NOT NULL, \`bankAccountId\` varchar(255) NULL, \`description\` varchar(255) NULL, \`systemCode\` varchar(30) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_a793d7354d7c3aaf76347ee5a6\` (\`name\`), UNIQUE INDEX \`IDX_7d4b931e2721e762d5d9795031\` (\`systemCode\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`payment_methods\` ADD CONSTRAINT \`FK_6bf6aeacd883dfb645b4de8e9ca\` FOREIGN KEY (\`bankAccountId\`) REFERENCES \`bank_accounts\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );

    // System rows.
    await queryRunner.query(
      `INSERT INTO \`bank_accounts\` (\`id\`, \`name\`, \`accountNumber\`, \`systemCode\`) VALUES (UUID(), 'Other Bank Accounts', NULL, 'OTHER_BANK_ACCOUNTS')`,
    );
    await queryRunner.query(
      `INSERT INTO \`payment_methods\` (\`id\`, \`name\`, \`type\`, \`bankAccountId\`, \`systemCode\`) VALUES (UUID(), 'Cash', 'CASH', NULL, 'CASH')`,
    );
    await queryRunner.query(
      `INSERT INTO \`payment_methods\` (\`id\`, \`name\`, \`type\`, \`bankAccountId\`, \`systemCode\`) SELECT UUID(), 'Credit Card', 'CARD', \`id\`, 'CREDIT_CARD' FROM \`bank_accounts\` WHERE \`systemCode\` = 'OTHER_BANK_ACCOUNTS'`,
    );

    // configuration.defaultPaymentMethod (enum) → defaultPaymentMethodId (row id).
    await queryRunner.query(
      `ALTER TABLE \`configuration\` ADD \`defaultPaymentMethodId\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `UPDATE \`configuration\` c JOIN \`payment_methods\` pm ON pm.\`systemCode\` = c.\`defaultPaymentMethod\` SET c.\`defaultPaymentMethodId\` = pm.\`id\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`configuration\` DROP COLUMN \`defaultPaymentMethod\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`configuration\` ADD \`defaultPaymentMethod\` enum ('CASH', 'CREDIT_CARD') NOT NULL DEFAULT 'CASH'`,
    );
    await queryRunner.query(
      `UPDATE \`configuration\` c JOIN \`payment_methods\` pm ON pm.\`id\` = c.\`defaultPaymentMethodId\` SET c.\`defaultPaymentMethod\` = pm.\`systemCode\` WHERE pm.\`systemCode\` IN ('CASH', 'CREDIT_CARD')`,
    );
    await queryRunner.query(
      `ALTER TABLE \`configuration\` DROP COLUMN \`defaultPaymentMethodId\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`payment_methods\` DROP FOREIGN KEY \`FK_6bf6aeacd883dfb645b4de8e9ca\``,
    );
    await queryRunner.query(`DROP TABLE \`payment_methods\``);
    await queryRunner.query(`DROP TABLE \`bank_accounts\``);
  }
}
