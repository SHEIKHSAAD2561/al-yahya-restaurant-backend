import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoleDescriptions1790084402253 implements MigrationInterface {
  name = 'AddRoleDescriptions1790084402253';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`roles\` ADD \`descriptionEn\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`roles\` ADD \`descriptionAr\` varchar(255) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`roles\` DROP COLUMN \`descriptionAr\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`roles\` DROP COLUMN \`descriptionEn\``,
    );
  }
}
