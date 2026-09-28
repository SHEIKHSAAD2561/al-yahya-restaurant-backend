import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Up to 3 levels deep (parent → child → sub-child) — see MAX_CATEGORY_DEPTH
 * in categories.service.ts. Sibling names (same parentId) must be unique;
 * checked in the service, not a DB constraint, since MySQL's unique index
 * treats every NULL as distinct and can't enforce "unique among top-level
 * categories" on its own. */
@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  // Raw FK column is the only thing ever mutated — the relation exists for
  // the FK constraint and is never loaded (see CLAUDE.md's TypeORM gotcha).
  @Column({ type: 'uuid', nullable: true })
  parentId: string | null;

  @ManyToOne(() => Category, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'parentId' })
  parent?: Category;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
