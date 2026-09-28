import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomers1790504872130 implements MigrationInterface {
  name = 'AddCustomers1790504872130';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`customers\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(150) NOT NULL, \`code\` varchar(30) NOT NULL, \`phone\` varchar(30) NOT NULL, \`email\` varchar(255) NULL, \`gender\` enum ('MALE', 'FEMALE') NULL, \`birthday\` date NULL, \`vatNumber\` varchar(15) NULL, \`commercialRegisterNumber\` varchar(100) NULL, \`nationalId\` varchar(50) NULL, \`country\` varchar(100) NULL DEFAULT 'Saudi Arabia', \`city\` varchar(100) NULL, \`district\` varchar(100) NULL, \`street\` varchar(150) NULL, \`buildingNumber\` varchar(10) NULL, \`additionalNumber\` varchar(10) NULL, \`postalCode\` varchar(10) NULL, \`notes\` text NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_f2eee14aa1fe3e956fe193c142\` (\`code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_f2eee14aa1fe3e956fe193c142\` ON \`customers\``,
    );
    await queryRunner.query(`DROP TABLE \`customers\``);
  }
}
