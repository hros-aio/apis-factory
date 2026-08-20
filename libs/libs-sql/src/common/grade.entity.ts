import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { Company } from './company.entity';
import { JobTitle } from './job-title.entity';
import { MasterDataStatus } from './enums';

@Entity('grades')
export class Grade extends BaseEntity {
  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId?: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ name: 'code', type: 'varchar', length: 64 })
  code: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'rank_order', type: 'integer', nullable: true })
  rankOrder?: number | null;

  @Column({ name: 'source_grade_id', type: 'uuid', nullable: true })
  sourceGradeId?: string | null;

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
  @ManyToOne(() => Company, (company) => company.grades, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company?: Company;

  @ManyToOne(() => Grade, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'source_grade_id' })
  sourceGrade?: Grade | null;

  @OneToMany(() => JobTitle, (jobTitle) => jobTitle.grade)
  jobTitles?: JobTitle[];
}
