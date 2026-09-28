import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Location } from '../../locations/location.entity';
import { User } from '../../users/user.entity';
import { PaymentMethod } from '../../payment-methods/payment-method.entity';
import { RegisterSession } from './register-session.entity';
import { PrinterType, SellLayout } from '../register-enums';

/**
 * A POS register's *settings* — a name, who may operate it, how it prints
 * and takes payment. Selling itself happens in a `RegisterSession` (open →
 * close), not here; a Register has at most one open session at a time
 * (enforced in RegistersService, not the schema).
 */
@Entity('registers')
export class Register {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 35 })
  name: string;

  @Column({ type: 'uuid' })
  locationId: string;

  @ManyToOne(() => Location, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'locationId' })
  location?: Location;

  @Column({ type: 'enum', enum: PrinterType, default: PrinterType.THERMAL })
  printerType: PrinterType;

  @Column({ type: 'enum', enum: SellLayout, default: SellLayout.QUICK_SALE })
  sellLayout: SellLayout;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'register_cashiers',
    joinColumn: { name: 'registerId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  cashiers: User[];

  @ManyToMany(() => PaymentMethod)
  @JoinTable({
    name: 'register_payment_methods',
    joinColumn: { name: 'registerId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'paymentMethodId', referencedColumnName: 'id' },
  })
  paymentMethods: PaymentMethod[];

  @OneToMany(() => RegisterSession, (session) => session.register)
  sessions: RegisterSession[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
