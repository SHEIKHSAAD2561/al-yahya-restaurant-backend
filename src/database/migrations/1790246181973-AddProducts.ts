import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProducts1790246181973 implements MigrationInterface {
  name = 'AddProducts1790246181973';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`brands\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(100) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_96db6bbbaa6f23cad26871339b\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`categories\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(100) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_8b0be371d28245da6e4f4b6187\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`variant_locations\` (\`id\` varchar(36) NOT NULL, \`variantId\` varchar(255) NOT NULL, \`locationId\` varchar(255) NOT NULL, \`quantity\` decimal(12,3) NOT NULL DEFAULT '0.000', \`retailPrice\` decimal(12,2) NULL, \`wholesalePrice\` decimal(12,2) NULL, \`buyPrice\` decimal(12,2) NULL, \`taxId\` varchar(255) NULL, UNIQUE INDEX \`IDX_3e9909665a5b600f17046a7e26\` (\`variantId\`, \`locationId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`product_variants\` (\`id\` varchar(36) NOT NULL, \`productId\` varchar(255) NOT NULL, \`optionValues\` json NULL, \`sku\` varchar(50) NOT NULL, \`barcode\` varchar(50) NULL, \`cost\` decimal(12,2) NOT NULL DEFAULT '0.00', \`sortOrder\` int NOT NULL DEFAULT '0', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_46f236f21640f9da218a063a86\` (\`sku\`), UNIQUE INDEX \`IDX_62124a7ca2686cbaed42f0d3a2\` (\`barcode\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`product_options\` (\`id\` varchar(36) NOT NULL, \`productId\` varchar(255) NOT NULL, \`name\` varchar(50) NOT NULL, \`values\` json NOT NULL, \`sortOrder\` int NOT NULL DEFAULT '0', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`product_images\` (\`id\` varchar(36) NOT NULL, \`productId\` varchar(255) NOT NULL, \`url\` varchar(500) NOT NULL, \`sortOrder\` int NOT NULL DEFAULT '0', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`products\` (\`id\` varchar(36) NOT NULL, \`type\` enum ('SIMPLE', 'VARIABLE', 'COMPOSITE') NOT NULL, \`name\` varchar(150) NOT NULL, \`description\` text NULL, \`isSellable\` tinyint NOT NULL DEFAULT 1, \`isPurchasable\` tinyint NOT NULL DEFAULT 1, \`trackQuantity\` tinyint NOT NULL DEFAULT 1, \`isWeighted\` tinyint NOT NULL DEFAULT 0, \`reorderPoint\` int UNSIGNED NULL, \`categoryId\` varchar(255) NULL, \`brandId\` varchar(255) NULL, \`shippingWeight\` decimal(10,3) NULL, \`shippingLength\` decimal(10,2) NULL, \`shippingWidth\` decimal(10,2) NULL, \`shippingHeight\` decimal(10,2) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`composite_components\` (\`id\` varchar(36) NOT NULL, \`productId\` varchar(255) NOT NULL, \`componentVariantId\` varchar(255) NOT NULL, \`quantity\` decimal(12,3) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`variant_locations\` ADD CONSTRAINT \`FK_8a81042880bd176ecf6f76ff41d\` FOREIGN KEY (\`variantId\`) REFERENCES \`product_variants\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`variant_locations\` ADD CONSTRAINT \`FK_7bac66dd222cefe059123aaeef8\` FOREIGN KEY (\`locationId\`) REFERENCES \`locations\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`variant_locations\` ADD CONSTRAINT \`FK_9ecb9ab06e9c888e83299c49d87\` FOREIGN KEY (\`taxId\`) REFERENCES \`taxes\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`product_variants\` ADD CONSTRAINT \`FK_f515690c571a03400a9876600b5\` FOREIGN KEY (\`productId\`) REFERENCES \`products\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`product_options\` ADD CONSTRAINT \`FK_96d8f73d05e681974c07b99ee5d\` FOREIGN KEY (\`productId\`) REFERENCES \`products\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`product_images\` ADD CONSTRAINT \`FK_b367708bf720c8dd62fc6833161\` FOREIGN KEY (\`productId\`) REFERENCES \`products\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`products\` ADD CONSTRAINT \`FK_ff56834e735fa78a15d0cf21926\` FOREIGN KEY (\`categoryId\`) REFERENCES \`categories\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`products\` ADD CONSTRAINT \`FK_ea86d0c514c4ecbb5694cbf57df\` FOREIGN KEY (\`brandId\`) REFERENCES \`brands\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`composite_components\` ADD CONSTRAINT \`FK_9e70116daba245cff25a8b07b1f\` FOREIGN KEY (\`productId\`) REFERENCES \`products\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`composite_components\` ADD CONSTRAINT \`FK_f6165ea626eb2eb4ccf1ec8cebe\` FOREIGN KEY (\`componentVariantId\`) REFERENCES \`product_variants\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`composite_components\` DROP FOREIGN KEY \`FK_f6165ea626eb2eb4ccf1ec8cebe\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`composite_components\` DROP FOREIGN KEY \`FK_9e70116daba245cff25a8b07b1f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`products\` DROP FOREIGN KEY \`FK_ea86d0c514c4ecbb5694cbf57df\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`products\` DROP FOREIGN KEY \`FK_ff56834e735fa78a15d0cf21926\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`product_images\` DROP FOREIGN KEY \`FK_b367708bf720c8dd62fc6833161\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`product_options\` DROP FOREIGN KEY \`FK_96d8f73d05e681974c07b99ee5d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`product_variants\` DROP FOREIGN KEY \`FK_f515690c571a03400a9876600b5\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`variant_locations\` DROP FOREIGN KEY \`FK_9ecb9ab06e9c888e83299c49d87\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`variant_locations\` DROP FOREIGN KEY \`FK_7bac66dd222cefe059123aaeef8\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`variant_locations\` DROP FOREIGN KEY \`FK_8a81042880bd176ecf6f76ff41d\``,
    );
    await queryRunner.query(`DROP TABLE \`composite_components\``);
    await queryRunner.query(`DROP TABLE \`products\``);
    await queryRunner.query(`DROP TABLE \`product_images\``);
    await queryRunner.query(`DROP TABLE \`product_options\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_62124a7ca2686cbaed42f0d3a2\` ON \`product_variants\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_46f236f21640f9da218a063a86\` ON \`product_variants\``,
    );
    await queryRunner.query(`DROP TABLE \`product_variants\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_3e9909665a5b600f17046a7e26\` ON \`variant_locations\``,
    );
    await queryRunner.query(`DROP TABLE \`variant_locations\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_8b0be371d28245da6e4f4b6187\` ON \`categories\``,
    );
    await queryRunner.query(`DROP TABLE \`categories\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_96db6bbbaa6f23cad26871339b\` ON \`brands\``,
    );
    await queryRunner.query(`DROP TABLE \`brands\``);
  }
}
