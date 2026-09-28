import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('product_images')
export class ProductImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, (product) => product.images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: Product;

  /** Firebase download URL (see FirebaseStorageService). */
  @Column({ type: 'varchar', length: 500 })
  url: string;

  /** 0 = the thumbnail shown in the products list. */
  @Column({ type: 'int', default: 0 })
  sortOrder: number;
}
