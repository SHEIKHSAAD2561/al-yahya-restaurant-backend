import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaxesTables1790080285489 implements MigrationInterface {
  name = 'AddTaxesTables1790080285489';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`taxes\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(150) NOT NULL, \`code\` varchar(50) NOT NULL, \`hasCompoundTax\` tinyint NOT NULL DEFAULT 0, \`isActive\` tinyint NOT NULL DEFAULT 0, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`tax_lines\` (\`id\` varchar(36) NOT NULL, \`taxId\` varchar(255) NOT NULL, \`label\` varchar(100) NULL, \`rate\` decimal(6,2) NOT NULL, \`sortOrder\` int NOT NULL DEFAULT '0', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tax_lines\` ADD CONSTRAINT \`FK_374fcdfd597f7a178293278c7d4\` FOREIGN KEY (\`taxId\`) REFERENCES \`taxes\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`tax_lines\` DROP FOREIGN KEY \`FK_374fcdfd597f7a178293278c7d4\``,
    );
    await queryRunner.query(`DROP TABLE \`tax_lines\``);
    await queryRunner.query(`DROP TABLE \`taxes\``);
  }
}
