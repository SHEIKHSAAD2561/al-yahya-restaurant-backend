import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSaleSettingsAndReceiptSettings1790516120923 implements MigrationInterface {
  name = 'AddSaleSettingsAndReceiptSettings1790516120923';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`receipt_settings\` (\`id\` varchar(36) NOT NULL, \`showLogo\` tinyint NOT NULL DEFAULT 1, \`showCompanyName\` tinyint NOT NULL DEFAULT 1, \`showCompanyAddress\` tinyint NOT NULL DEFAULT 1, \`showCompanyPhone\` tinyint NOT NULL DEFAULT 1, \`showVatNumber\` tinyint NOT NULL DEFAULT 1, \`showCrNumber\` tinyint NOT NULL DEFAULT 0, \`showSku\` tinyint NOT NULL DEFAULT 0, \`showBarcode\` tinyint NOT NULL DEFAULT 0, \`showQuantity\` tinyint NOT NULL DEFAULT 1, \`showUnitPrice\` tinyint NOT NULL DEFAULT 1, \`showDiscount\` tinyint NOT NULL DEFAULT 1, \`showTaxPerLine\` tinyint NOT NULL DEFAULT 0, \`showSubtotal\` tinyint NOT NULL DEFAULT 1, \`showTaxSummary\` tinyint NOT NULL DEFAULT 1, \`showTotal\` tinyint NOT NULL DEFAULT 1, \`showAmountPaid\` tinyint NOT NULL DEFAULT 1, \`showChangeDue\` tinyint NOT NULL DEFAULT 1, \`showPaymentMethod\` tinyint NOT NULL DEFAULT 1, \`showCashierName\` tinyint NOT NULL DEFAULT 1, \`showCustomerName\` tinyint NOT NULL DEFAULT 1, \`showQrCode\` tinyint NOT NULL DEFAULT 0, \`showThankYouNote\` tinyint NOT NULL DEFAULT 1, \`salesNote\` varchar(500) NULL, \`commentImageUrl\` varchar(1000) NULL, \`printLayout\` enum ('THERMAL', 'A4') NOT NULL DEFAULT 'THERMAL', \`language\` enum ('EN', 'AR') NOT NULL DEFAULT 'EN', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`sale_settings\` (\`id\` varchar(36) NOT NULL, \`allowSalesman\` tinyint NOT NULL DEFAULT 0, \`allowQuotation\` tinyint NOT NULL DEFAULT 0, \`activateKitchenTicket\` tinyint NOT NULL DEFAULT 0, \`sellWhenQuantityZeroOrBelow\` tinyint NOT NULL DEFAULT 0, \`sellBelowCost\` tinyint NOT NULL DEFAULT 0, \`taxableInvoiceB2b\` tinyint NOT NULL DEFAULT 0, \`numberDialog\` tinyint NOT NULL DEFAULT 0, \`enableWhatsappMessages\` tinyint NOT NULL DEFAULT 0, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`sale_settings\``);
    await queryRunner.query(`DROP TABLE \`receipt_settings\``);
  }
}
