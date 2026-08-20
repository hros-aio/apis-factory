import { DataSource } from 'typeorm';

// Mock the TypeORM column decorators to be compatible with SQLite
jest.mock('typeorm', () => {
  const original = jest.requireActual('typeorm');
  const typeMap: Record<string, string> = {
    timestamptz: 'datetime',
    jsonb: 'simple-json',
    char: 'varchar',
    uuid: 'varchar',
  };
  return {
    ...original,
    Column: (optionsOrType: any = {}, maybeOptions: any = {}) => {
      if (typeof optionsOrType === 'object' && optionsOrType !== null) {
        const type = typeMap[optionsOrType.type] || optionsOrType.type;
        return original.Column({ ...optionsOrType, type });
      }
      return original.Column(optionsOrType, maybeOptions);
    },
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

import { Company, CompanyStatus, Department, Location, Grade, JobTitle } from '../../src/common';

describe('Company Entity', () => {
  let dataSource: DataSource;

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
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('should successfully save and retrieve a company', async () => {
    const repository = dataSource.getRepository(Company);
    const company = repository.create({
      tenantCode: 'tenant-123',
      tenantId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      companyCode: 'COMP-001',
      legalName: 'Acme Corporation Inc.',
      displayName: 'Acme Corp',
      status: CompanyStatus.PENDING,
      isTemplate: false,
      registrationNumber: 'REG12345',
      taxRegistrationNumber: 'TAX9999',
      countryCode: 'US',
      legalAddress: { street: '123 Main St', city: 'Metropolis' },
      timezone: 'UTC',
      locale: 'en_US',
      currencyCode: 'USD',
    });

    const savedCompany = await repository.save(company);
    expect(savedCompany.id).toBeDefined();
    expect(savedCompany.createdAt).toBeDefined();

    const retrieved = await repository.findOneBy({ id: savedCompany.id });
    expect(retrieved).toBeDefined();
    expect(retrieved?.companyCode).toBe('COMP-001');
    expect(retrieved?.legalName).toBe('Acme Corporation Inc.');
    expect(retrieved?.displayName).toBe('Acme Corp');
    expect(retrieved?.status).toBe(CompanyStatus.PENDING);
    expect(retrieved?.countryCode).toBe('US');
  });
});
