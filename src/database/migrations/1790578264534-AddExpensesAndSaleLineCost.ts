import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExpensesAndSaleLineCost1790578264534 implements MigrationInterface {
  name = 'AddExpensesAndSaleLineCost1790578264534';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`expenses\` (\`id\` varchar(36) NOT NULL, \`category\` enum ('RENT', 'SALARIES', 'UTILITIES', 'OTHER') NOT NULL, \`description\` varchar(255) NOT NULL, \`amount\` decimal(12,2) NOT NULL, \`locationId\` varchar(255) NULL, \`expenseDate\` date NOT NULL, \`createdByUserId\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`sale_lines\` ADD \`unitCost\` decimal(12,2) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`expenses\` ADD CONSTRAINT \`FK_734625515655ae54e730e368d88\` FOREIGN KEY (\`locationId\`) REFERENCES \`locations\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`expenses\` ADD CONSTRAINT \`FK_c0a7c67f243fea2f1d7e3285a22\` FOREIGN KEY (\`createdByUserId\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`expenses\` DROP FOREIGN KEY \`FK_c0a7c67f243fea2f1d7e3285a22\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`expenses\` DROP FOREIGN KEY \`FK_734625515655ae54e730e368d88\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`sale_lines\` DROP COLUMN \`unitCost\``,
    );
    await queryRunner.query(`DROP TABLE \`expenses\``);
  }
}
