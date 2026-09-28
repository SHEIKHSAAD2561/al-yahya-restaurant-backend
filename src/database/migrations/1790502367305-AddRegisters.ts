import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRegisters1790502367305 implements MigrationInterface {
  name = 'AddRegisters1790502367305';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`registers\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(35) NOT NULL, \`locationId\` varchar(255) NOT NULL, \`printerType\` enum ('THERMAL', 'A4') NOT NULL DEFAULT 'THERMAL', \`sellLayout\` enum ('QUICK_SALE') NOT NULL DEFAULT 'QUICK_SALE', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`register_sessions\` (\`id\` varchar(36) NOT NULL, \`registerId\` varchar(255) NOT NULL, \`status\` enum ('OPEN', 'CLOSED') NOT NULL DEFAULT 'OPEN', \`openedByUserId\` varchar(255) NOT NULL, \`openedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`openingAmount\` decimal(12,2) NOT NULL, \`openingDenominations\` json NULL, \`closedByUserId\` varchar(255) NULL, \`closedAt\` timestamp NULL, \`closingAmount\` decimal(12,2) NULL, \`closingDenominations\` json NULL, \`expectedAmount\` decimal(12,2) NULL, \`difference\` decimal(12,2) NULL, \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`cash_movements\` (\`id\` varchar(36) NOT NULL, \`registerSessionId\` varchar(255) NOT NULL, \`type\` enum ('IN', 'OUT') NOT NULL, \`amount\` decimal(12,2) NOT NULL, \`reason\` varchar(255) NULL, \`createdByUserId\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`register_cashiers\` (\`registerId\` varchar(36) NOT NULL, \`userId\` varchar(36) NOT NULL, INDEX \`IDX_86d7bac21724bd25a762049765\` (\`registerId\`), INDEX \`IDX_456332df60705bd4c3e99c99f7\` (\`userId\`), PRIMARY KEY (\`registerId\`, \`userId\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`register_payment_methods\` (\`registerId\` varchar(36) NOT NULL, \`paymentMethodId\` varchar(36) NOT NULL, INDEX \`IDX_597c1ac69bd664181065a7158e\` (\`registerId\`), INDEX \`IDX_798079baa9999cd5303b800153\` (\`paymentMethodId\`), PRIMARY KEY (\`registerId\`, \`paymentMethodId\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`registers\` ADD CONSTRAINT \`FK_51fd5a322c2d17d06a13e0a9253\` FOREIGN KEY (\`locationId\`) REFERENCES \`locations\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`register_sessions\` ADD CONSTRAINT \`FK_53a655fbf00e47b9743b99af855\` FOREIGN KEY (\`registerId\`) REFERENCES \`registers\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`register_sessions\` ADD CONSTRAINT \`FK_613e63beaba38863bf2c1a5a46d\` FOREIGN KEY (\`openedByUserId\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`register_sessions\` ADD CONSTRAINT \`FK_b4fffbdca1581409a2f2dbe0f99\` FOREIGN KEY (\`closedByUserId\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`cash_movements\` ADD CONSTRAINT \`FK_084b4cf395c186a784a362c8981\` FOREIGN KEY (\`registerSessionId\`) REFERENCES \`register_sessions\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`cash_movements\` ADD CONSTRAINT \`FK_43eae5d6dfc53a21894eff01073\` FOREIGN KEY (\`createdByUserId\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`register_cashiers\` ADD CONSTRAINT \`FK_86d7bac21724bd25a7620497657\` FOREIGN KEY (\`registerId\`) REFERENCES \`registers\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`register_cashiers\` ADD CONSTRAINT \`FK_456332df60705bd4c3e99c99f71\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`register_payment_methods\` ADD CONSTRAINT \`FK_597c1ac69bd664181065a7158ec\` FOREIGN KEY (\`registerId\`) REFERENCES \`registers\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`register_payment_methods\` ADD CONSTRAINT \`FK_798079baa9999cd5303b8001530\` FOREIGN KEY (\`paymentMethodId\`) REFERENCES \`payment_methods\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`register_payment_methods\` DROP FOREIGN KEY \`FK_798079baa9999cd5303b8001530\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`register_payment_methods\` DROP FOREIGN KEY \`FK_597c1ac69bd664181065a7158ec\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`register_cashiers\` DROP FOREIGN KEY \`FK_456332df60705bd4c3e99c99f71\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`register_cashiers\` DROP FOREIGN KEY \`FK_86d7bac21724bd25a7620497657\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`cash_movements\` DROP FOREIGN KEY \`FK_43eae5d6dfc53a21894eff01073\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`cash_movements\` DROP FOREIGN KEY \`FK_084b4cf395c186a784a362c8981\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`register_sessions\` DROP FOREIGN KEY \`FK_b4fffbdca1581409a2f2dbe0f99\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`register_sessions\` DROP FOREIGN KEY \`FK_613e63beaba38863bf2c1a5a46d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`register_sessions\` DROP FOREIGN KEY \`FK_53a655fbf00e47b9743b99af855\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`registers\` DROP FOREIGN KEY \`FK_51fd5a322c2d17d06a13e0a9253\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_798079baa9999cd5303b800153\` ON \`register_payment_methods\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_597c1ac69bd664181065a7158e\` ON \`register_payment_methods\``,
    );
    await queryRunner.query(`DROP TABLE \`register_payment_methods\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_456332df60705bd4c3e99c99f7\` ON \`register_cashiers\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_86d7bac21724bd25a762049765\` ON \`register_cashiers\``,
    );
    await queryRunner.query(`DROP TABLE \`register_cashiers\``);
    await queryRunner.query(`DROP TABLE \`cash_movements\``);
    await queryRunner.query(`DROP TABLE \`register_sessions\``);
    await queryRunner.query(`DROP TABLE \`registers\``);
  }
}
