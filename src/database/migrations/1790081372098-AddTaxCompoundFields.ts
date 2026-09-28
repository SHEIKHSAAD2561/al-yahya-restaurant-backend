import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaxCompoundFields1790081372098 implements MigrationInterface {
  name = 'AddTaxCompoundFields1790081372098';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`taxes\` ADD \`compoundLabel\` varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`taxes\` ADD \`compoundRate\` decimal(6,2) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`taxes\` DROP COLUMN \`compoundRate\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`taxes\` DROP COLUMN \`compoundLabel\``,
    );
  }
}
