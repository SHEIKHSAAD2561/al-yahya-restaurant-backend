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
import { StockCountLine } from './stock-count-line.entity';
import { StockCountStatus } from '../stock-count-status.enum';

@Entity('stock_counts')
export class StockCount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  locationId: string;

  @ManyToOne(() => Location, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'locationId' })
  location?: Location;

  @Column({
    type: 'enum',
    enum: StockCountStatus,
    default: StockCountStatus.DRAFT,
  })
  status: StockCountStatus;

  @Column({ type: 'date' })
  countDate: string;

  @Column({ type: 'uuid' })
  createdByUserId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy?: User;

  @Column({ type: 'timestamp', nullable: true })
  confirmedAt: Date | null;

  @OneToMany(() => StockCountLine, (line) => line.stockCount, {
    cascade: true,
  })
  lines: StockCountLine[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
