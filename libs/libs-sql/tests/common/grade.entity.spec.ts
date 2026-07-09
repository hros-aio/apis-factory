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

describe('Grade Entity', () => {
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

  it('should successfully save and retrieve a grade', async () => {
    const repository = dataSource.getRepository(Grade);
    const grade = repository.create({
      tenantCode: 'tenant-123',
      companyId: companyId,
      code: 'G1',
      name: 'Grade 1',
    });

    const saved = await repository.save(grade);
    expect(saved.id).toBeDefined();

    const retrieved = await repository.findOneBy({ id: saved.id });
    expect(retrieved).toBeDefined();
    expect(retrieved?.code).toBe('G1');
    expect(retrieved?.name).toBe('Grade 1');
  });
});
