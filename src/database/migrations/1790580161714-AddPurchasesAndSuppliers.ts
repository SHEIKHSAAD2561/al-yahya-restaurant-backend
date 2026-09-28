import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPurchasesAndSuppliers1790580161714 implements MigrationInterface {
  name = 'AddPurchasesAndSuppliers1790580161714';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`suppliers\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(150) NOT NULL, \`phone\` varchar(30) NULL, \`email\` varchar(255) NULL, \`vatNumber\` varchar(15) NULL, \`address\` varchar(255) NULL, \`notes\` text NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`purchase_invoices\` (\`id\` varchar(36) NOT NULL, \`invoiceNumber\` varchar(20) NULL, \`status\` enum ('DRAFT', 'CONFIRMED') NOT NULL DEFAULT 'DRAFT', \`supplierId\` varchar(255) NOT NULL, \`locationId\` varchar(255) NOT NULL, \`invoiceDate\` date NOT NULL, \`subtotal\` decimal(12,2) NOT NULL DEFAULT '0.00', \`taxAmount\` decimal(12,2) NOT NULL DEFAULT '0.00', \`total\` decimal(12,2) NOT NULL DEFAULT '0.00', \`notes\` text NULL, \`createdByUserId\` varchar(255) NOT NULL, \`confirmedAt\` timestamp NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_4e0ba6ceaf1ea7f09cfb9bf69e\` (\`invoiceNumber\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`purchase_invoice_lines\` (\`id\` varchar(36) NOT NULL, \`purchaseInvoiceId\` varchar(255) NOT NULL, \`variantId\` varchar(255) NOT NULL, \`productName\` varchar(200) NOT NULL, \`sku\` varchar(50) NOT NULL, \`quantity\` decimal(12,3) NOT NULL, \`unitCost\` decimal(12,2) NOT NULL, \`taxId\` varchar(255) NULL, \`taxRate\` decimal(6,2) NOT NULL DEFAULT '0.00', \`lineSubtotal\` decimal(12,2) NOT NULL, \`lineTax\` decimal(12,2) NOT NULL, \`lineTotal\` decimal(12,2) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`return_invoices\` (\`id\` varchar(36) NOT NULL, \`returnNumber\` varchar(20) NULL, \`status\` enum ('DRAFT', 'CONFIRMED') NOT NULL DEFAULT 'DRAFT', \`supplierId\` varchar(255) NOT NULL, \`locationId\` varchar(255) NOT NULL, \`purchaseInvoiceId\` varchar(255) NULL, \`returnDate\` date NOT NULL, \`subtotal\` decimal(12,2) NOT NULL DEFAULT '0.00', \`taxAmount\` decimal(12,2) NOT NULL DEFAULT '0.00', \`total\` decimal(12,2) NOT NULL DEFAULT '0.00', \`notes\` text NULL, \`createdByUserId\` varchar(255) NOT NULL, \`confirmedAt\` timestamp NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_2c98078c9c992a5ddb948578e5\` (\`returnNumber\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`return_invoice_lines\` (\`id\` varchar(36) NOT NULL, \`returnInvoiceId\` varchar(255) NOT NULL, \`variantId\` varchar(255) NOT NULL, \`productName\` varchar(200) NOT NULL, \`sku\` varchar(50) NOT NULL, \`quantity\` decimal(12,3) NOT NULL, \`unitCost\` decimal(12,2) NOT NULL, \`taxId\` varchar(255) NULL, \`taxRate\` decimal(6,2) NOT NULL DEFAULT '0.00', \`lineSubtotal\` decimal(12,2) NOT NULL, \`lineTax\` decimal(12,2) NOT NULL, \`lineTotal\` decimal(12,2) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`supplier_payments\` (\`id\` varchar(36) NOT NULL, \`supplierId\` varchar(255) NOT NULL, \`amount\` decimal(12,2) NOT NULL, \`paymentMethodId\` varchar(255) NULL, \`paymentDate\` date NOT NULL, \`notes\` varchar(255) NULL, \`createdByUserId\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_invoices\` ADD CONSTRAINT \`FK_4f6a26a09f42a06f4ab7174238c\` FOREIGN KEY (\`supplierId\`) REFERENCES \`suppliers\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_invoices\` ADD CONSTRAINT \`FK_d74fe1f15a7eafbf5f219724617\` FOREIGN KEY (\`locationId\`) REFERENCES \`locations\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_invoices\` ADD CONSTRAINT \`FK_e02e5588889048b29181a7ca70c\` FOREIGN KEY (\`createdByUserId\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_invoice_lines\` ADD CONSTRAINT \`FK_6f49b884f7431e17dc06a29a448\` FOREIGN KEY (\`purchaseInvoiceId\`) REFERENCES \`purchase_invoices\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_invoice_lines\` ADD CONSTRAINT \`FK_afd882909d28dae4f05008fb048\` FOREIGN KEY (\`variantId\`) REFERENCES \`product_variants\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_invoice_lines\` ADD CONSTRAINT \`FK_fc3c94ea0eee00fc0f31cebb2ba\` FOREIGN KEY (\`taxId\`) REFERENCES \`taxes\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`return_invoices\` ADD CONSTRAINT \`FK_a45ebd765c75d31e619633d0bf0\` FOREIGN KEY (\`supplierId\`) REFERENCES \`suppliers\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`return_invoices\` ADD CONSTRAINT \`FK_bdefca49a3471f427caa70fbea2\` FOREIGN KEY (\`locationId\`) REFERENCES \`locations\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`return_invoices\` ADD CONSTRAINT \`FK_0f5e4c091e0ab6f9eae8b2501da\` FOREIGN KEY (\`purchaseInvoiceId\`) REFERENCES \`purchase_invoices\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`return_invoices\` ADD CONSTRAINT \`FK_01bba33e0084becaa4b84ccec85\` FOREIGN KEY (\`createdByUserId\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`return_invoice_lines\` ADD CONSTRAINT \`FK_020b62ae6934d889d9f172a00d3\` FOREIGN KEY (\`returnInvoiceId\`) REFERENCES \`return_invoices\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`return_invoice_lines\` ADD CONSTRAINT \`FK_ae42f20f7b93d9b9e561088d6d7\` FOREIGN KEY (\`variantId\`) REFERENCES \`product_variants\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`return_invoice_lines\` ADD CONSTRAINT \`FK_5356ac21bee48857cb74572e284\` FOREIGN KEY (\`taxId\`) REFERENCES \`taxes\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`supplier_payments\` ADD CONSTRAINT \`FK_a9606c250851fd546b0669925a4\` FOREIGN KEY (\`supplierId\`) REFERENCES \`suppliers\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`supplier_payments\` ADD CONSTRAINT \`FK_ecb05dd11db0fc9a35e83519c2c\` FOREIGN KEY (\`paymentMethodId\`) REFERENCES \`payment_methods\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`supplier_payments\` ADD CONSTRAINT \`FK_2f22d544e6b98f65acbe1a41815\` FOREIGN KEY (\`createdByUserId\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`supplier_payments\` DROP FOREIGN KEY \`FK_2f22d544e6b98f65acbe1a41815\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`supplier_payments\` DROP FOREIGN KEY \`FK_ecb05dd11db0fc9a35e83519c2c\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`supplier_payments\` DROP FOREIGN KEY \`FK_a9606c250851fd546b0669925a4\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`return_invoice_lines\` DROP FOREIGN KEY \`FK_5356ac21bee48857cb74572e284\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`return_invoice_lines\` DROP FOREIGN KEY \`FK_ae42f20f7b93d9b9e561088d6d7\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`return_invoice_lines\` DROP FOREIGN KEY \`FK_020b62ae6934d889d9f172a00d3\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`return_invoices\` DROP FOREIGN KEY \`FK_01bba33e0084becaa4b84ccec85\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`return_invoices\` DROP FOREIGN KEY \`FK_0f5e4c091e0ab6f9eae8b2501da\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`return_invoices\` DROP FOREIGN KEY \`FK_bdefca49a3471f427caa70fbea2\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`return_invoices\` DROP FOREIGN KEY \`FK_a45ebd765c75d31e619633d0bf0\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_invoice_lines\` DROP FOREIGN KEY \`FK_fc3c94ea0eee00fc0f31cebb2ba\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_invoice_lines\` DROP FOREIGN KEY \`FK_afd882909d28dae4f05008fb048\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_invoice_lines\` DROP FOREIGN KEY \`FK_6f49b884f7431e17dc06a29a448\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_invoices\` DROP FOREIGN KEY \`FK_e02e5588889048b29181a7ca70c\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_invoices\` DROP FOREIGN KEY \`FK_d74fe1f15a7eafbf5f219724617\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`purchase_invoices\` DROP FOREIGN KEY \`FK_4f6a26a09f42a06f4ab7174238c\``,
    );
    await queryRunner.query(`DROP TABLE \`supplier_payments\``);
    await queryRunner.query(`DROP TABLE \`return_invoice_lines\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_2c98078c9c992a5ddb948578e5\` ON \`return_invoices\``,
    );
    await queryRunner.query(`DROP TABLE \`return_invoices\``);
    await queryRunner.query(`DROP TABLE \`purchase_invoice_lines\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_4e0ba6ceaf1ea7f09cfb9bf69e\` ON \`purchase_invoices\``,
    );
    await queryRunner.query(`DROP TABLE \`purchase_invoices\``);
    await queryRunner.query(`DROP TABLE \`suppliers\``);
  }
}
