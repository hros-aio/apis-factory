import { DataSource } from 'typeorm';

// Mock the TypeORM date/time column decorators to be compatible with SQLite (ignoring timestamptz)
jest.mock('typeorm', () => {
  const original = jest.requireActual('typeorm');
  return {
    ...original,
    CreateDateColumn: (options: any = {}) => {
      return original.CreateDateColumn({ ...options, type: undefined });
    },
    UpdateDateColumn: (options: any = {}) => {
      return original.UpdateDateColumn({ ...options, type: undefined });
    },
    DeleteDateColumn: (options: any = {}) => {
      return original.DeleteDateColumn({ ...options, type: undefined });
    },
  };
});

import { Company, Department, Location, Grade, JobTitle } from '../../src/common';

describe('Location Entity', () => {
  let dataSource: DataSource;
  let companyId: string;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      dropSchema: true,
      entities: [Company, Department, Location, Grade, JobTitle],
      synchronize: true,
      logging: false,
    });
    await dataSource.initialize();

    // Create a dummy company for foreign key reference
    const companyRepo = dataSource.getRepository(Company);
    const company = companyRepo.create({
      tenantCode: 'tenant-123',
      name: 'Test Company',
      status: 'active',
      legalName: 'Test Company Inc',
      registrationNo: '123',
      taxId: 'T123',
      website: 'test.com',
      industry: 'IT',
      size: 10,
      logo: 'logo.png',
      foundedDate: new Date(),
    });
    const saved = await companyRepo.save(company);
    companyId = saved.id;
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('should successfully save and retrieve a location', async () => {
    const repository = dataSource.getRepository(Location);
    const location = repository.create({
      tenantCode: 'tenant-123',
      companyId: companyId,
      name: 'HQ Office',
      addressLine: '123 Main St',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      zipCode: '10001',
      timezone: 'America/New_York',
      contactName: 'Jane Smith',
      contactEmail: 'jane@test.com',
      contactPhone: '+123456',
      contactTitle: 'Office Manager',
      mapUrl: 'https://maps.google.com/hq',
      isHeadquarter: true,
      regionCoverMeters: 500,
    });

    const saved = await repository.save(location);
    expect(saved.id).toBeDefined();

    const retrieved = await repository.findOneBy({ id: saved.id });
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('HQ Office');
    expect(retrieved?.addressLine).toBe('123 Main St');
    expect(retrieved?.city).toBe('New York');
    expect(retrieved?.isHeadquarter).toBe(true);
    expect(Number(retrieved?.regionCoverMeters)).toBe(500);
  });
});
