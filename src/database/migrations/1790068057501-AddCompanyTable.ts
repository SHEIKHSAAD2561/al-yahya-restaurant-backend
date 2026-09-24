import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCompanyTable1790068057501 implements MigrationInterface {
    name = 'AddCompanyTable1790068057501'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`company\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(150) NULL, \`vatNumber\` varchar(50) NULL, \`email\` varchar(255) NULL, \`phone\` varchar(30) NULL, \`website\` varchar(255) NULL, \`businessType\` enum ('RESTAURANT', 'CAFE', 'BAKERY', 'FOOD_TRUCK', 'CLOUD_KITCHEN', 'CATERING', 'OTHER') NULL, \`address\` varchar(255) NULL, \`commercialRegister\` varchar(100) NULL, \`logoUrl\` varchar(500) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`company\``);
    }

}
