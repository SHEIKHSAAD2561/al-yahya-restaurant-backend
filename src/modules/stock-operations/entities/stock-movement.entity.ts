import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Location } from '../../locations/location.entity';
import { User } from '../../users/user.entity';
import { StockMovementLine } from './stock-movement-line.entity';
import {
  StockMovementStatus,
  StockMovementType,
} from '../stock-movement.enums';

/** A manual stock-in/stock-out voucher — no cost is recorded (this isn't a
 * purchase), just a quantity adjustment with a reason on file. */
@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: StockMovementType })
  type: StockMovementType;

  @Column({
    type: 'enum',
    enum: StockMovementStatus,
    default: StockMovementStatus.DRAFT,
  })
  status: StockMovementStatus;

  @Column({ type: 'uuid' })
  locationId: string;

  @ManyToOne(() => Location, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'locationId' })
  location?: Location;

  @Column({ type: 'varchar', length: 255 })
  reason: string;

  @Column({ type: 'date' })
  movementDate: string;

  @Column({ type: 'uuid' })
  createdByUserId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy?: User;

  @Column({ type: 'timestamp', nullable: true })
  confirmedAt: Date | null;

  @OneToMany(() => StockMovementLine, (line) => line.stockMovement, {
    cascade: true,
  })
  lines: StockMovementLine[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
