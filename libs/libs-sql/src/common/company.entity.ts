import {
  Column,
  Entity,
  Index,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { CompanyStatus } from './enums';
import { Department } from './department.entity';
import { Grade } from './grade.entity';
import { JobTitle } from './job-title.entity';
import { Location } from './location.entity';

@Entity('companies')
export class Company extends BaseEntity {
  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId?: string;

  @Column({ name: 'company_code', type: 'varchar', length: 64 })
  companyCode: string;

  @Column({ name: 'legal_name', type: 'varchar', length: 255 })
  legalName: string;

  @Column({ name: 'display_name', type: 'varchar', length: 255, nullable: true })
  displayName?: string | null;

  @Index('idx_company_status')
  @Column({
    name: 'status',
    type: 'varchar',
    length: 32,
    default: CompanyStatus.PENDING,
  })
  status: CompanyStatus;

  @Column({ name: 'is_template', type: 'boolean', default: false })
  isTemplate: boolean;

  @Column({ name: 'registration_number', type: 'varchar', length: 128, nullable: true })
  registrationNumber?: string | null;

  @Column({ name: 'tax_registration_number', type: 'varchar', length: 128, nullable: true })
  taxRegistrationNumber?: string | null;

  @Column({ name: 'country_code', type: 'char', length: 2, nullable: true })
  countryCode?: string | null;

  @Column({ name: 'legal_address', type: 'jsonb', nullable: true })
  legalAddress?: Record<string, unknown> | null;

  @Column({ name: 'timezone', type: 'varchar', length: 64, default: 'UTC' })
  timezone: string;

  @Column({ name: 'locale', type: 'varchar', length: 32, nullable: true })
  locale?: string | null;

  @Column({ name: 'currency_code', type: 'char', length: 3, nullable: true })
  currencyCode?: string | null;

  @Column({ name: 'information_completed_at', type: 'timestamptz', nullable: true })
  informationCompletedAt?: Date | null;

  @Column({ name: 'information_completed_by', type: 'uuid', nullable: true })
  informationCompletedBy?: string | null;

  @Column({ name: 'activated_at', type: 'timestamptz', nullable: true })
  activatedAt?: Date | null;

  @Column({ name: 'activated_by', type: 'uuid', nullable: true })
  activatedBy?: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy?: string | null;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy?: string | null;

  // Relationships
  @OneToMany(() => Department, (dept) => dept.company)
  departments?: Department[];

  @OneToMany(() => Location, (loc) => loc.company)
  locations?: Location[];

  @OneToMany(() => Grade, (grade) => grade.company)
  grades?: Grade[];

  @OneToMany(() => JobTitle, (jobTitle) => jobTitle.company)
  jobTitles?: JobTitle[];
}
