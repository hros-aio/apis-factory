import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { Company } from './company.entity';
import { JobTitle } from './job-title.entity';

@Entity('departments')
export class Department extends BaseEntity {
  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ name: 'code', type: 'varchar', length: 64 })
  code: string;

  @Column({ name: 'name', type: 'varchar', length: 255, nullable: true })
  name?: string | null;

  @Column({ name: 'is_division', type: 'boolean', default: false })
  isDivision: boolean;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId?: string | null;

  // Relationships
  @ManyToOne(() => Company, (company) => company.departments)
  @JoinColumn({ name: 'company_id' })
  company?: Company;

  @ManyToOne(() => Department, (dept) => dept.subDepartments, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent?: Department | null;

  @OneToMany(() => Department, (dept) => dept.parent)
  subDepartments?: Department[];

  @OneToMany(() => JobTitle, (jobTitle) => jobTitle.department)
  jobTitles?: JobTitle[];
}
