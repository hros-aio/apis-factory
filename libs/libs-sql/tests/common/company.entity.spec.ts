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
      name: 'Acme Corp',
      status: 'pending',
      legalName: 'Acme Corporation Inc.',
      registrationNo: 'REG12345',
      taxId: 'TAX9999',
      website: 'https://acme.com',
      industry: 'Manufacturing',
      size: 500,
      logo: 'logo.png',
      foundedDate: new Date('2020-01-01'),
      contactName: 'John Doe',
      contactEmail: 'john@acme.com',
      contactPhone: '+12345678',
      contactTitle: 'CEO',
    });

    const savedCompany = await repository.save(company);
    expect(savedCompany.id).toBeDefined();
    expect(savedCompany.createdAt).toBeDefined();

    const retrieved = await repository.findOneBy({ id: savedCompany.id });
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Acme Corp');
    expect(retrieved?.status).toBe('pending');
  });

  it('should support parent-subsidiary (holding) relationship', async () => {
    const repository = dataSource.getRepository(Company);
    
    const holding = repository.create({
      tenantCode: 'tenant-123',
      name: 'Holding Co',
      status: 'active',
      legalName: 'Holding Co Ltd',
      registrationNo: 'HOLD1',
      taxId: 'TAXHOLD',
      website: 'https://holding.com',
      industry: 'Finance',
      size: 50,
      logo: 'logo2.png',
      foundedDate: new Date('2010-01-01'),
    });
    const savedHolding = await repository.save(holding);

    const subsidiary = repository.create({
      tenantCode: 'tenant-123',
      name: 'Subsidiary Co',
      status: 'active',
      legalName: 'Subsidiary Co Ltd',
      registrationNo: 'SUB1',
      taxId: 'TAXSUB',
      website: 'https://sub.com',
      industry: 'Retail',
      size: 10,
      logo: 'logo3.png',
      foundedDate: new Date('2022-01-01'),
      holdingId: savedHolding.id,
    });
    const savedSubsidiary = await repository.save(subsidiary);

    const retrievedSub = await repository.findOne({
      where: { id: savedSubsidiary.id },
      relations: ['holding'],
    });

    expect(retrievedSub).toBeDefined();
    expect(retrievedSub?.holding?.id).toBe(savedHolding.id);
  });
});
