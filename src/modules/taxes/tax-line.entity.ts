import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Tax } from './tax.entity';

const decimalTransformer = {
  to: (value?: number) => value,
  from: (value?: string) => (value === undefined || value === null ? value : parseFloat(value)),
};

@Entity('tax_lines')
export class TaxLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  taxId: string;

  @ManyToOne(() => Tax, (tax) => tax.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taxId' })
  tax: Tax;

  @Column({ type: 'varchar', length: 100, nullable: true })
  label: string | null;

  @Column({ type: 'decimal', precision: 6, scale: 2, transformer: decimalTransformer })
  rate: number;

  /** Preserves the order tax lines were entered in (e.g. "100% + 15%" reads
   * left-to-right the same way they were added on the create form). */
  @Column({ type: 'int', default: 0 })
  sortOrder: number;
}
