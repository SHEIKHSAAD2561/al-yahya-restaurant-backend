import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRegisterSessionPaymentSummaries1790514209989 implements MigrationInterface {
  name = 'AddRegisterSessionPaymentSummaries1790514209989';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`register_session_payment_summaries\` (\`id\` varchar(36) NOT NULL, \`registerSessionId\` varchar(255) NOT NULL, \`paymentMethodId\` varchar(255) NOT NULL, \`expectedAmount\` decimal(12,2) NOT NULL, \`countedAmount\` decimal(12,2) NOT NULL, \`difference\` decimal(12,2) NOT NULL, \`denominations\` json NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`register_session_payment_summaries\` ADD CONSTRAINT \`FK_f97484b534a6e7ce73189337a90\` FOREIGN KEY (\`registerSessionId\`) REFERENCES \`register_sessions\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`register_session_payment_summaries\` ADD CONSTRAINT \`FK_1aacde47a4b36b882080d6a989e\` FOREIGN KEY (\`paymentMethodId\`) REFERENCES \`payment_methods\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`register_session_payment_summaries\` DROP FOREIGN KEY \`FK_1aacde47a4b36b882080d6a989e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`register_session_payment_summaries\` DROP FOREIGN KEY \`FK_f97484b534a6e7ce73189337a90\``,
    );
    await queryRunner.query(
      `DROP TABLE \`register_session_payment_summaries\``,
    );
  }
}
