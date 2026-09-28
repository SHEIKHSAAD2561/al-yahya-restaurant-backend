import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CustomerGender } from './customer-gender.enum';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  /** Human-facing identifier shown at POS checkout and on the customer list —
   * distinct from `id`. Auto-generatable (GET /customers/generate-code) but
   * freely editable, same relationship as a product's SKU. */
  @Column({ type: 'varchar', length: 30, unique: true })
  code: string;

  /** One plain string, like User.phone — the country-code split only exists
   * in the UI (see core/phone/country-codes.ts). Not unique: nothing at POS
   * depends on phone being one-to-one with a customer. */
  @Column({ type: 'varchar', length: 30 })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'enum', enum: CustomerGender, nullable: true })
  gender: CustomerGender | null;

  @Column({ type: 'date', nullable: true })
  birthday: string | null;

  /** KSA format: 15 digits, starting and ending with 3 — validated in the DTO. */
  @Column({ type: 'varchar', length: 15, nullable: true })
  vatNumber: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  commercialRegisterNumber: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nationalId: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    default: 'Saudi Arabia',
  })
  country: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  district: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  street: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  buildingNumber: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  additionalNumber: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  postalCode: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
