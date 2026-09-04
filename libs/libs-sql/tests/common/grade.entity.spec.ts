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

import { Company, CompanyStatus, Department, Location, Grade, JobTitle, MasterDataStatus } from '../../src/common';

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
      companyCode: 'COMP-001',
      legalName: 'Test Company Inc',
      status: CompanyStatus.ACTIVE,
      isTemplate: false,
      timezone: 'UTC',
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
      description: 'Junior level',
      rankOrder: 1,
      status: MasterDataStatus.ACTIVE,
      effectiveAt: new Date('2026-01-01'),
    });

    const saved = await repository.save(grade);
    expect(saved.id).toBeDefined();

    const retrieved = await repository.findOneBy({ id: saved.id });
    expect(retrieved).toBeDefined();
    expect(retrieved?.code).toBe('G1');
    expect(retrieved?.name).toBe('Grade 1');
    expect(retrieved?.rankOrder).toBe(1);
    expect(retrieved?.status).toBe(MasterDataStatus.ACTIVE);
  });
});
