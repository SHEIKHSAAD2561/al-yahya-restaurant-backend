import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserStatus } from './user-status.enum';
import { Language } from './language.enum';
import { Role } from '../roles/role.entity';
import { Location } from '../locations/location.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  nameEn: string;

  @Column({ type: 'varchar', length: 150 })
  nameAr: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Exclude()
  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordHash: string | null;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.PENDING })
  status: UserStatus;

  @Column({ type: 'uuid' })
  roleId: string;

  @ManyToOne(() => Role, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @Column({ type: 'boolean', default: true })
  allLocations: boolean;

  @ManyToMany(() => Location, { eager: false })
  @JoinTable({
    name: 'user_locations',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'locationId', referencedColumnName: 'id' },
  })
  locations: Location[];

  @Column({ type: 'enum', enum: Language, default: Language.EN })
  preferredLanguage: Language;

  @Exclude()
  @Column({ type: 'varchar', length: 64, nullable: true })
  passwordResetTokenHash: string | null;

  @Exclude()
  @Column({ type: 'timestamp', nullable: true })
  passwordResetTokenExpiresAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
