import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserBilingualName1789993338898 implements MigrationInterface {
  name = 'UserBilingualName1789993338898';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`name\``);
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`nameEn\` varchar(150) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`nameAr\` varchar(150) NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`nameAr\``);
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`nameEn\``);
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`name\` varchar(150) NOT NULL`,
    );
  }
}
