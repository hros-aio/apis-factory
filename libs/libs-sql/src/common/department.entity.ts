import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { Company } from './company.entity';
import { JobTitle } from './job-title.entity';
import { MasterDataStatus } from './enums';

@Entity('departments')
@Index('idx_departments_parent', ['parentDepartmentId'])
export class Department extends BaseEntity {
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

  @Column({ name: 'parent_department_id', type: 'uuid', nullable: true })
  parentDepartmentId?: string | null;

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
  @ManyToOne(() => Company, (company) => company.departments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company?: Company;

  @ManyToOne(() => Department, (dept) => dept.children, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'parent_department_id' })
  parentDepartment?: Department | null;

  @OneToMany(() => Department, (dept) => dept.parentDepartment)
  children?: Department[];

  @OneToMany(() => JobTitle, (jobTitle) => jobTitle.department)
  jobTitles?: JobTitle[];
}
