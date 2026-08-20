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

describe('Department Entity', () => {
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
      tenantId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
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

  it('should successfully save and retrieve a department', async () => {
    const repository = dataSource.getRepository(Department);
    const department = repository.create({
      tenantCode: 'tenant-123',
      companyId: companyId,
      code: 'HR',
      name: 'Human Resources',
      description: 'HR Department',
      status: MasterDataStatus.ACTIVE,
      effectiveAt: new Date('2026-01-01'),
    });

    const saved = await repository.save(department);
    expect(saved.id).toBeDefined();

    const retrieved = await repository.findOneBy({ id: saved.id });
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Human Resources');
    expect(retrieved?.code).toBe('HR');
    expect(retrieved?.status).toBe(MasterDataStatus.ACTIVE);
  });

  it('should support parent-child self-referential relationship', async () => {
    const repository = dataSource.getRepository(Department);

    const parent = repository.create({
      tenantCode: 'tenant-123',
      companyId: companyId,
      code: 'ENG',
      name: 'Engineering',
      status: MasterDataStatus.ACTIVE,
      effectiveAt: new Date('2026-01-01'),
    });
    const savedParent = await repository.save(parent);

    const child = repository.create({
      tenantCode: 'tenant-123',
      companyId: companyId,
      code: 'QA',
      name: 'Quality Assurance',
      parentDepartmentId: savedParent.id,
      status: MasterDataStatus.ACTIVE,
      effectiveAt: new Date('2026-01-01'),
    });
    const savedChild = await repository.save(child);

    const retrievedChild = await repository.findOne({
      where: { id: savedChild.id },
      relations: ['parentDepartment'],
    });

    expect(retrievedChild).toBeDefined();
    expect(retrievedChild?.parentDepartment?.id).toBe(savedParent.id);
  });
});
