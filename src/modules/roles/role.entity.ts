import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RoleType } from './role-type.enum';
import { Permission } from '../permissions/permission.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  nameEn: string;

  @Column({ type: 'varchar', length: 100 })
  nameAr: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descriptionEn: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descriptionAr: string | null;

  @Index()
  @Column({ type: 'enum', enum: RoleType, default: RoleType.CUSTOM })
  type: RoleType;

  @ManyToMany(() => Permission, (permission) => permission.roles, { eager: false })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'roleId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permissionId', referencedColumnName: 'id' },
  })
  permissions: Permission[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
