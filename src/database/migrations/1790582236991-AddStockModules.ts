import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStockModules1790582236991 implements MigrationInterface {
  name = 'AddStockModules1790582236991';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`stock_counts\` (\`id\` varchar(36) NOT NULL, \`locationId\` varchar(255) NOT NULL, \`status\` enum ('DRAFT', 'CONFIRMED') NOT NULL DEFAULT 'DRAFT', \`countDate\` date NOT NULL, \`createdByUserId\` varchar(255) NOT NULL, \`confirmedAt\` timestamp NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`stock_count_lines\` (\`id\` varchar(36) NOT NULL, \`stockCountId\` varchar(255) NOT NULL, \`variantId\` varchar(255) NOT NULL, \`productName\` varchar(200) NOT NULL, \`sku\` varchar(50) NOT NULL, \`expectedQuantity\` decimal(12,3) NOT NULL, \`countedQuantity\` decimal(12,3) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`stock_movements\` (\`id\` varchar(36) NOT NULL, \`type\` enum ('IN', 'OUT') NOT NULL, \`status\` enum ('DRAFT', 'CONFIRMED') NOT NULL DEFAULT 'DRAFT', \`locationId\` varchar(255) NOT NULL, \`reason\` varchar(255) NOT NULL, \`movementDate\` date NOT NULL, \`createdByUserId\` varchar(255) NOT NULL, \`confirmedAt\` timestamp NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`stock_movement_lines\` (\`id\` varchar(36) NOT NULL, \`stockMovementId\` varchar(255) NOT NULL, \`variantId\` varchar(255) NOT NULL, \`productName\` varchar(200) NOT NULL, \`sku\` varchar(50) NOT NULL, \`quantity\` decimal(12,3) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`stock_transfers\` (\`id\` varchar(36) NOT NULL, \`fromLocationId\` varchar(255) NOT NULL, \`toLocationId\` varchar(255) NOT NULL, \`status\` enum ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING', \`notes\` varchar(255) NULL, \`requestedByUserId\` varchar(255) NOT NULL, \`respondedByUserId\` varchar(255) NULL, \`respondedAt\` timestamp NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`stock_transfer_lines\` (\`id\` varchar(36) NOT NULL, \`stockTransferId\` varchar(255) NOT NULL, \`variantId\` varchar(255) NOT NULL, \`productName\` varchar(200) NOT NULL, \`sku\` varchar(50) NOT NULL, \`quantity\` decimal(12,3) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`stock_counts\` ADD CONSTRAINT \`FK_d42455cf228a85eb89ab39d99b4\` FOREIGN KEY (\`locationId\`) REFERENCES \`locations\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`stock_counts\` ADD CONSTRAINT \`FK_b8dc89f7dab87eb396fb7819fd1\` FOREIGN KEY (\`createdByUserId\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`stock_count_lines\` ADD CONSTRAINT \`FK_a83dc98939f51cdbc88497aef91\` FOREIGN KEY (\`stockCountId\`) REFERENCES \`stock_counts\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`stock_count_lines\` ADD CONSTRAINT \`FK_d833428c8bf6bb01af9897606c1\` FOREIGN KEY (\`variantId\`) REFERENCES \`product_variants\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`stock_movements\` ADD CONSTRAINT \`FK_50fab165d7aa9fea5f749b1574c\` FOREIGN KEY (\`locationId\`) REFERENCES \`locations\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`stock_movements\` ADD CONSTRAINT \`FK_1b050a639e023e0d806be50395f\` FOREIGN KEY (\`createdByUserId\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`stock_movement_lines\` ADD CONSTRAINT \`FK_2d381efdcd39b68610926c86b03\` FOREIGN KEY (\`stockMovementId\`) REFERENCES \`stock_movements\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`stock_movement_lines\` ADD CONSTRAINT \`FK_e55de5df9ccf9fbf141b779c379\` FOREIGN KEY (\`variantId\`) REFERENCES \`product_variants\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`stock_transfers\` ADD CONSTRAINT \`FK_9d907dcb6a05d1de15bee6750ee\` FOREIGN KEY (\`fromLocationId\`) REFERENCES \`locations\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`stock_transfers\` ADD CONSTRAINT \`FK_4784ba6b80985619dd5e4a2aa66\` FOREIGN KEY (\`toLocationId\`) REFERENCES \`locations\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`stock_transfers\` ADD CONSTRAINT \`FK_efd4cc6410f1562f053d2ed1e3b\` FOREIGN KEY (\`requestedByUserId\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`stock_transfers\` ADD CONSTRAINT \`FK_378fcf70c84242e2bed6512eb5d\` FOREIGN KEY (\`respondedByUserId\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`stock_transfer_lines\` ADD CONSTRAINT \`FK_e117b567ea18889b36c91250c48\` FOREIGN KEY (\`stockTransferId\`) REFERENCES \`stock_transfers\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`stock_transfer_lines\` ADD CONSTRAINT \`FK_eef00b1ef600c1396f3e9fc6e20\` FOREIGN KEY (\`variantId\`) REFERENCES \`product_variants\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`stock_transfer_lines\` DROP FOREIGN KEY \`FK_eef00b1ef600c1396f3e9fc6e20\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`stock_transfer_lines\` DROP FOREIGN KEY \`FK_e117b567ea18889b36c91250c48\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`stock_transfers\` DROP FOREIGN KEY \`FK_378fcf70c84242e2bed6512eb5d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`stock_transfers\` DROP FOREIGN KEY \`FK_efd4cc6410f1562f053d2ed1e3b\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`stock_transfers\` DROP FOREIGN KEY \`FK_4784ba6b80985619dd5e4a2aa66\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`stock_transfers\` DROP FOREIGN KEY \`FK_9d907dcb6a05d1de15bee6750ee\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`stock_movement_lines\` DROP FOREIGN KEY \`FK_e55de5df9ccf9fbf141b779c379\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`stock_movement_lines\` DROP FOREIGN KEY \`FK_2d381efdcd39b68610926c86b03\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`stock_movements\` DROP FOREIGN KEY \`FK_1b050a639e023e0d806be50395f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`stock_movements\` DROP FOREIGN KEY \`FK_50fab165d7aa9fea5f749b1574c\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`stock_count_lines\` DROP FOREIGN KEY \`FK_d833428c8bf6bb01af9897606c1\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`stock_count_lines\` DROP FOREIGN KEY \`FK_a83dc98939f51cdbc88497aef91\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`stock_counts\` DROP FOREIGN KEY \`FK_b8dc89f7dab87eb396fb7819fd1\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`stock_counts\` DROP FOREIGN KEY \`FK_d42455cf228a85eb89ab39d99b4\``,
    );
    await queryRunner.query(`DROP TABLE \`stock_transfer_lines\``);
    await queryRunner.query(`DROP TABLE \`stock_transfers\``);
    await queryRunner.query(`DROP TABLE \`stock_movement_lines\``);
    await queryRunner.query(`DROP TABLE \`stock_movements\``);
    await queryRunner.query(`DROP TABLE \`stock_count_lines\``);
    await queryRunner.query(`DROP TABLE \`stock_counts\``);
  }
}
