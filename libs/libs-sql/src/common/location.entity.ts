import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { Company } from './company.entity';
import { MasterDataStatus } from './enums';

@Entity('locations')
export class Location extends BaseEntity {
  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ name: 'code', type: 'varchar', length: 64 })
  code: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'country_code', type: 'char', length: 2, nullable: true })
  countryCode?: string | null;

  @Column({ name: 'timezone', type: 'varchar', length: 64, nullable: true })
  timezone?: string | null;

  @Column({ name: 'address', type: 'jsonb', nullable: true })
  address?: Record<string, unknown> | null;

  @Column({ name: 'is_headquarter', type: 'boolean', default: false })
  isHeadquarter: boolean;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 32,
    default: MasterDataStatus.SCHEDULED,
  })
  status: MasterDataStatus;

  @Column({ name: 'effective_at', type: 'timestamptz', nullable: true })
  effectiveAt: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy?: string | null;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy?: string | null;

  // Relationships
  @ManyToOne(() => Company, (company) => company.locations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company?: Company;
}
