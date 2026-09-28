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
import { StockTransferLine } from './stock-transfer-line.entity';
import { StockTransferStatus } from '../stock-transfer-status.enum';

@Entity('stock_transfers')
export class StockTransfer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  fromLocationId: string;

  @ManyToOne(() => Location, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'fromLocationId' })
  fromLocation?: Location;

  @Column({ type: 'uuid' })
  toLocationId: string;

  @ManyToOne(() => Location, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'toLocationId' })
  toLocation?: Location;

  @Column({
    type: 'enum',
    enum: StockTransferStatus,
    default: StockTransferStatus.PENDING,
  })
  status: StockTransferStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  notes: string | null;

  @Column({ type: 'uuid' })
  requestedByUserId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'requestedByUserId' })
  requestedBy?: User;

  @Column({ type: 'uuid', nullable: true })
  respondedByUserId: string | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'respondedByUserId' })
  respondedBy?: User | null;

  @Column({ type: 'timestamp', nullable: true })
  respondedAt: Date | null;

  @OneToMany(() => StockTransferLine, (line) => line.stockTransfer, {
    cascade: true,
  })
  lines: StockTransferLine[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
