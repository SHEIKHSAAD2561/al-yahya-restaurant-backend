import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCustomerPayments1790590189729 implements MigrationInterface {
    name = 'AddCustomerPayments1790590189729'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`customer_payments\` (\`id\` varchar(36) NOT NULL, \`customerId\` varchar(255) NOT NULL, \`amount\` decimal(12,2) NOT NULL, \`paymentMethodId\` varchar(255) NULL, \`paymentDate\` date NOT NULL, \`notes\` varchar(255) NULL, \`createdByUserId\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`customer_payments\` ADD CONSTRAINT \`FK_ff937f82f18ea0f86fb528fb6ad\` FOREIGN KEY (\`customerId\`) REFERENCES \`customers\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`customer_payments\` ADD CONSTRAINT \`FK_d003d6d43f84c7d245102141a11\` FOREIGN KEY (\`paymentMethodId\`) REFERENCES \`payment_methods\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`customer_payments\` ADD CONSTRAINT \`FK_fdde5a9a58bb7927db7393b5bcf\` FOREIGN KEY (\`createdByUserId\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`customer_payments\` DROP FOREIGN KEY \`FK_fdde5a9a58bb7927db7393b5bcf\``);
        await queryRunner.query(`ALTER TABLE \`customer_payments\` DROP FOREIGN KEY \`FK_d003d6d43f84c7d245102141a11\``);
        await queryRunner.query(`ALTER TABLE \`customer_payments\` DROP FOREIGN KEY \`FK_ff937f82f18ea0f86fb528fb6ad\``);
        await queryRunner.query(`DROP TABLE \`customer_payments\``);
    }

}
