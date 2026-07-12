import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { Company } from './company.entity';

@Entity('locations')
export class Location extends BaseEntity {
  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ name: 'name', type: 'varchar', length: 64 })
  name: string;

  // Embedded Address info (flat columns as defined in SQL schema)
  @Column({ name: 'address_line', type: 'varchar', length: 255 })
  addressLine: string;

  @Column({ name: 'city', type: 'varchar', length: 255 })
  city: string;

  @Column({ name: 'state', type: 'varchar', length: 100 })
  state: string;

  @Column({ name: 'country', type: 'varchar', length: 100 })
  country: string;

  @Column({ name: 'zip_code', type: 'varchar', length: 64 })
  zipCode: string;

  @Column({ name: 'timezone', type: 'varchar', length: 64 })
  timezone: string;

  // Embedded Contact Info (prefix contact_)
  @Column({ name: 'contact_name', type: 'varchar', length: 255, nullable: true })
  contactName?: string | null;

  @Column({ name: 'contact_email', type: 'varchar', length: 255, nullable: true })
  contactEmail?: string | null;

  @Column({ name: 'contact_phone', type: 'varchar', length: 64, nullable: true })
  contactPhone?: string | null;

  @Column({ name: 'contact_title', type: 'varchar', length: 255, nullable: true })
  contactTitle?: string | null;

  @Column({ name: 'map_url', type: 'varchar', length: 255, nullable: true })
  mapUrl?: string | null;

  @Column({ name: 'is_headquarter', type: 'boolean', default: false })
  isHeadquarter: boolean;

  @Column({ name: 'region_cover_meters', type: 'bigint', default: 100 })
  regionCoverMeters: number;

  // Relationships
  @ManyToOne(() => Company, (company) => company.locations)
  @JoinColumn({ name: 'company_id' })
  company?: Company;
}
