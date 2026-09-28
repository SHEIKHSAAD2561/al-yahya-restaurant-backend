import { MigrationInterface, QueryRunner } from 'typeorm';

export class LocationDefaultFlag1789993816784 implements MigrationInterface {
  name = 'LocationDefaultFlag1789993816784';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`locations\` ADD \`isDefault\` tinyint NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`locations\` DROP COLUMN \`isDefault\``,
    );
  }
}
