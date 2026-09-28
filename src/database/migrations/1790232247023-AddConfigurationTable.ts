import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConfigurationTable1790232247023 implements MigrationInterface {
  name = 'AddConfigurationTable1790232247023';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`configuration\` (\`id\` varchar(36) NOT NULL, \`defaultTaxId\` varchar(255) NULL, \`sellTaxStatus\` enum ('INCLUSIVE', 'EXCLUSIVE') NOT NULL DEFAULT 'EXCLUSIVE', \`weightUnit\` enum ('KG', 'G', 'LB', 'OZ') NOT NULL DEFAULT 'KG', \`barcodeValueType\` enum ('WEIGHT', 'PRICE') NOT NULL DEFAULT 'WEIGHT', \`barcodePrefix\` tinyint UNSIGNED NOT NULL DEFAULT '21', \`barcodeHasCheckDigit\` tinyint NOT NULL DEFAULT 0, \`shippingWeightUnit\` enum ('KG', 'G', 'LB', 'OZ') NOT NULL DEFAULT 'KG', \`shippingDimensionUnit\` enum ('CM', 'M', 'FT', 'IN') NOT NULL DEFAULT 'CM', \`defaultPaymentMethod\` enum ('CASH', 'CREDIT_CARD') NOT NULL DEFAULT 'CASH', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`configuration\``);
  }
}
