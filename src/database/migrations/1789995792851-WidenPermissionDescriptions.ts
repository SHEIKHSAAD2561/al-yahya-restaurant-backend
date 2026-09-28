import { MigrationInterface, QueryRunner } from 'typeorm';

export class WidenPermissionDescriptions1789995792851 implements MigrationInterface {
  name = 'WidenPermissionDescriptions1789995792851';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // MODIFY (not DROP+ADD) to widen varchar(255) -> text in place without
    // touching existing rows' data.
    await queryRunner.query(
      `ALTER TABLE \`permissions\` MODIFY \`descriptionEn\` text NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`permissions\` MODIFY \`descriptionAr\` text NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`permissions\` MODIFY \`descriptionAr\` varchar(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`permissions\` MODIFY \`descriptionEn\` varchar(255) NOT NULL`,
    );
  }
}
