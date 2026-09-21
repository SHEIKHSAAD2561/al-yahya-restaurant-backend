import { Column, CreateDateColumn, Entity, Index, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PermissionModule } from './permission-module.enum';
import { Role } from '../roles/role.entity';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'enum', enum: PermissionModule })
  module: PermissionModule;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  code: string;

  @Column({ type: 'text' })
  descriptionEn: string;

  @Column({ type: 'text' })
  descriptionAr: string;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];

  @CreateDateColumn()
  createdAt: Date;
}
