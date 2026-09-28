import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPromotions1790518476035 implements MigrationInterface {
  name = 'AddPromotions1790518476035';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`promotions\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(150) NOT NULL, \`type\` enum ('DISCOUNT_OFF_PRODUCTS', 'BUY_X_GET_Y') NOT NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`startAt\` datetime NOT NULL, \`endAt\` datetime NULL, \`applyToAllLocations\` tinyint NOT NULL DEFAULT 1, \`locationIds\` json NULL, \`targetType\` enum ('ALL_PRODUCTS', 'SPECIFIC_PRODUCTS', 'CATEGORIES') NULL, \`targetVariantIds\` json NULL, \`targetCategoryIds\` json NULL, \`discountType\` enum ('PERCENT', 'AMOUNT') NULL, \`discountValue\` decimal(12,2) NULL, \`buyQuantity\` int UNSIGNED NULL, \`buyTargetType\` enum ('ALL_PRODUCTS', 'SPECIFIC_PRODUCTS', 'CATEGORIES') NULL, \`buyVariantIds\` json NULL, \`buyCategoryIds\` json NULL, \`getQuantity\` int UNSIGNED NULL, \`getTargetType\` enum ('ALL_PRODUCTS', 'SPECIFIC_PRODUCTS', 'CATEGORIES') NULL, \`getVariantIds\` json NULL, \`getCategoryIds\` json NULL, \`getDiscountType\` enum ('PERCENT', 'AMOUNT') NULL, \`getDiscountValue\` decimal(12,2) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`promotions\``);
  }
}
