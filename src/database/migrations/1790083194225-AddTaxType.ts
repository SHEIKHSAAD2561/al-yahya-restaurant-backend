import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaxType1790083194225 implements MigrationInterface {
  name = 'AddTaxType1790083194225';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`taxes\` ADD \`type\` enum ('SYSTEM_LOCKED', 'SYSTEM_TOGGLABLE', 'CUSTOM') NOT NULL DEFAULT 'CUSTOM'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`taxes\` DROP COLUMN \`type\``);
  }
}
