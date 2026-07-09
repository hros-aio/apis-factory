import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { Company } from './company.entity';
import { JobTitle } from './job-title.entity';

@Entity('grades')
export class Grade extends BaseEntity {
  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ name: 'code', type: 'varchar', length: 64 })
  code: string;

  @Column({ name: 'name', type: 'varchar', length: 255, nullable: true })
  name?: string | null;

  // Relationships
  @ManyToOne(() => Company, (company) => company.grades)
  @JoinColumn({ name: 'company_id' })
  company?: Company;

  @OneToMany(() => JobTitle, (jobTitle) => jobTitle.grade)
  jobTitles?: JobTitle[];
}
