import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoryHierarchy1790249995522 implements MigrationInterface {
  name = 'AddCategoryHierarchy1790249995522';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_8b0be371d28245da6e4f4b6187\` ON \`categories\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`categories\` ADD \`description\` varchar(500) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`categories\` ADD \`parentId\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`categories\` ADD CONSTRAINT \`FK_9a6f051e66982b5f0318981bcaa\` FOREIGN KEY (\`parentId\`) REFERENCES \`categories\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`categories\` DROP FOREIGN KEY \`FK_9a6f051e66982b5f0318981bcaa\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`categories\` DROP COLUMN \`parentId\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`categories\` DROP COLUMN \`description\``,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`IDX_8b0be371d28245da6e4f4b6187\` ON \`categories\` (\`name\`)`,
    );
  }
}
