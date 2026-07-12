import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { Company } from './company.entity';
import { Department } from './department.entity';
import { Grade } from './grade.entity';

@Entity('job_titles')
export class JobTitle extends BaseEntity {
  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ name: 'department_id', type: 'uuid' })
  departmentId: string;

  @Column({ name: 'grade_id', type: 'uuid' })
  gradeId: string;

  @Column({ name: 'code', type: 'varchar', length: 64 })
  code: string;

  @Column({ name: 'name', type: 'varchar', length: 255, nullable: true })
  name?: string | null;

  // Relationships
  @ManyToOne(() => Company, (company) => company.jobTitles)
  @JoinColumn({ name: 'company_id' })
  company?: Company;

  @ManyToOne(() => Department, (dept) => dept.jobTitles)
  @JoinColumn({ name: 'department_id' })
  department?: Department;

  @ManyToOne(() => Grade, (grade) => grade.jobTitles)
  @JoinColumn({ name: 'grade_id' })
  grade?: Grade;
}
