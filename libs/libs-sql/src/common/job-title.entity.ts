import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { Company } from './company.entity';
import { Department } from './department.entity';
import { Grade } from './grade.entity';
import { MasterDataStatus } from './enums';

@Entity('job_titles')
export class JobTitle extends BaseEntity {
  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId?: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ name: 'department_id', type: 'uuid' })
  departmentId: string;

  @Column({ name: 'grade_id', type: 'uuid' })
  gradeId: string;

  @Column({ name: 'code', type: 'varchar', length: 64 })
  code: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'source_job_title_id', type: 'uuid', nullable: true })
  sourceJobTitleId?: string | null;

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
  @ManyToOne(() => Company, (company) => company.jobTitles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company?: Company;

  @ManyToOne(() => Department, (dept) => dept.jobTitles, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'department_id' })
  department?: Department;

  @ManyToOne(() => Grade, (grade) => grade.jobTitles, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'grade_id' })
  grade?: Grade;

  @ManyToOne(() => JobTitle, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'source_job_title_id' })
  sourceJobTitle?: JobTitle | null;
}
