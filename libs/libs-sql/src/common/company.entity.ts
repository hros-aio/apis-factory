import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { Department } from './department.entity';
import { Grade } from './grade.entity';
import { JobTitle } from './job-title.entity';
import { Location } from './location.entity';

@Entity('companies')
export class Company extends BaseEntity {
  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Index('idx_company_status')
  @Column({ name: 'status', type: 'varchar', length: 32, default: 'pending' })
  status: 'pending' | 'active' | 'inactive';

  @Column({ name: 'legal_name', type: 'varchar', length: 255 })
  legalName: string;

  @Column({ name: 'registration_no', type: 'varchar', length: 100 })
  registrationNo: string;

  @Column({ name: 'tax_id', type: 'varchar', length: 100 })
  taxId: string;

  @Column({ name: 'website', type: 'varchar', length: 255 })
  website: string;

  @Column({ name: 'industry', type: 'varchar', length: 64 })
  industry: string;

  @Column({ name: 'size', type: 'integer' })
  size: number;

  @Column({ name: 'logo', type: 'varchar', length: 256 })
  logo: string;

  @Column({ name: 'founded_date', type: 'date' })
  foundedDate: Date;

  @Column({ name: 'holding_id', type: 'uuid', nullable: true })
  holdingId?: string | null;

  // Embedded Contact
  @Column({ name: 'contact_name', type: 'varchar', length: 255, nullable: true })
  contactName?: string | null;

  @Column({ name: 'contact_email', type: 'varchar', length: 255, nullable: true })
  contactEmail?: string | null;

  @Column({ name: 'contact_phone', type: 'varchar', length: 64, nullable: true })
  contactPhone?: string | null;

  @Column({ name: 'contact_title', type: 'varchar', length: 255, nullable: true })
  contactTitle?: string | null;

  // Embedded Secondary Contact
  @Column({ name: 'secondary_contact_name', type: 'varchar', length: 255, nullable: true })
  secondaryContactName?: string | null;

  @Column({ name: 'secondary_contact_email', type: 'varchar', length: 255, nullable: true })
  secondaryContactEmail?: string | null;

  @Column({ name: 'secondary_contact_phone', type: 'varchar', length: 64, nullable: true })
  secondaryContactPhone?: string | null;

  @Column({ name: 'secondary_contact_title', type: 'varchar', length: 255, nullable: true })
  secondaryContactTitle?: string | null;

  // Relationships
  @ManyToOne(() => Company, (company) => company.subsidiaries, { nullable: true })
  @JoinColumn({ name: 'holding_id' })
  holding?: Company | null;

  @OneToMany(() => Company, (company) => company.holding)
  subsidiaries?: Company[];

  @OneToMany(() => Department, (dept) => dept.company)
  departments?: Department[];

  @OneToMany(() => Location, (loc) => loc.company)
  locations?: Location[];

  @OneToMany(() => Grade, (grade) => grade.company)
  grades?: Grade[];

  @OneToMany(() => JobTitle, (jobTitle) => jobTitle.company)
  jobTitles?: JobTitle[];
}
