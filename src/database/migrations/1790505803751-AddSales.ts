import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSales1790505803751 implements MigrationInterface {
  name = 'AddSales1790505803751';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`sales\` (\`id\` varchar(36) NOT NULL, \`invoiceNumber\` varchar(20) NULL, \`status\` enum ('PARKED', 'COMPLETED') NOT NULL DEFAULT 'PARKED', \`registerId\` varchar(255) NOT NULL, \`registerSessionId\` varchar(255) NOT NULL, \`customerId\` varchar(255) NULL, \`cashierUserId\` varchar(255) NOT NULL, \`sellAt\` enum ('RETAIL', 'WHOLESALE') NOT NULL DEFAULT 'RETAIL', \`discountType\` enum ('PERCENT', 'AMOUNT') NULL, \`discountValue\` decimal(12,2) NULL, \`note\` varchar(500) NULL, \`subtotal\` decimal(12,2) NOT NULL DEFAULT '0.00', \`discountAmount\` decimal(12,2) NOT NULL DEFAULT '0.00', \`taxAmount\` decimal(12,2) NOT NULL DEFAULT '0.00', \`total\` decimal(12,2) NOT NULL DEFAULT '0.00', \`paymentMethodId\` varchar(255) NULL, \`amountPaid\` decimal(12,2) NULL, \`amountTendered\` decimal(12,2) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`completedAt\` timestamp NULL, \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_4f4006dc362ea9cc6308b4fb23\` (\`invoiceNumber\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`sale_lines\` (\`id\` varchar(36) NOT NULL, \`saleId\` varchar(255) NOT NULL, \`variantId\` varchar(255) NOT NULL, \`productName\` varchar(200) NOT NULL, \`sku\` varchar(50) NOT NULL, \`quantity\` decimal(12,3) NOT NULL, \`unitPrice\` decimal(12,2) NOT NULL, \`taxId\` varchar(255) NULL, \`taxRate\` decimal(6,2) NOT NULL DEFAULT '0.00', \`lineSubtotal\` decimal(12,2) NOT NULL, \`lineTax\` decimal(12,2) NOT NULL, \`lineTotal\` decimal(12,2) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`sales\` ADD CONSTRAINT \`FK_4bc54d6ef4124246ab60cf1e0bc\` FOREIGN KEY (\`registerId\`) REFERENCES \`registers\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`sales\` ADD CONSTRAINT \`FK_338c06f5d29a755afaf5db915e2\` FOREIGN KEY (\`registerSessionId\`) REFERENCES \`register_sessions\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`sales\` ADD CONSTRAINT \`FK_3a92cf6add00043cef9833db1cd\` FOREIGN KEY (\`customerId\`) REFERENCES \`customers\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`sales\` ADD CONSTRAINT \`FK_26b0764e8808b7e0c1b4f0550e9\` FOREIGN KEY (\`cashierUserId\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`sales\` ADD CONSTRAINT \`FK_6e4fa4491d43eedf1a67332e9fc\` FOREIGN KEY (\`paymentMethodId\`) REFERENCES \`payment_methods\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`sale_lines\` ADD CONSTRAINT \`FK_b9839a37392398a402bc130e1a5\` FOREIGN KEY (\`saleId\`) REFERENCES \`sales\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`sale_lines\` ADD CONSTRAINT \`FK_e66d6844db6460e1757430b5e18\` FOREIGN KEY (\`variantId\`) REFERENCES \`product_variants\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`sale_lines\` ADD CONSTRAINT \`FK_31223f3b8b2c7281111186af3a2\` FOREIGN KEY (\`taxId\`) REFERENCES \`taxes\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`sale_lines\` DROP FOREIGN KEY \`FK_31223f3b8b2c7281111186af3a2\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`sale_lines\` DROP FOREIGN KEY \`FK_e66d6844db6460e1757430b5e18\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`sale_lines\` DROP FOREIGN KEY \`FK_b9839a37392398a402bc130e1a5\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`sales\` DROP FOREIGN KEY \`FK_6e4fa4491d43eedf1a67332e9fc\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`sales\` DROP FOREIGN KEY \`FK_26b0764e8808b7e0c1b4f0550e9\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`sales\` DROP FOREIGN KEY \`FK_3a92cf6add00043cef9833db1cd\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`sales\` DROP FOREIGN KEY \`FK_338c06f5d29a755afaf5db915e2\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`sales\` DROP FOREIGN KEY \`FK_4bc54d6ef4124246ab60cf1e0bc\``,
    );
    await queryRunner.query(`DROP TABLE \`sale_lines\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_4f4006dc362ea9cc6308b4fb23\` ON \`sales\``,
    );
    await queryRunner.query(`DROP TABLE \`sales\``);
  }
}
