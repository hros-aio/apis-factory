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

  it('should successfully save and retrieve a department', async () => {
    const repository = dataSource.getRepository(Department);
    const department = repository.create({
      tenantCode: 'tenant-123',
      companyId: companyId,
      code: 'HR',
      name: 'Human Resources',
      isDivision: false,
    });

    const saved = await repository.save(department);
    expect(saved.id).toBeDefined();

    const retrieved = await repository.findOneBy({ id: saved.id });
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Human Resources');
    expect(retrieved?.code).toBe('HR');
    expect(retrieved?.isDivision).toBe(false);
  });

  it('should support parent-child self-referential relationship', async () => {
    const repository = dataSource.getRepository(Department);

    const parent = repository.create({
      tenantCode: 'tenant-123',
      companyId: companyId,
      code: 'ENG',
      name: 'Engineering',
      isDivision: true,
    });
    const savedParent = await repository.save(parent);

    const child = repository.create({
      tenantCode: 'tenant-123',
      companyId: companyId,
      code: 'QA',
      name: 'Quality Assurance',
      isDivision: false,
      parentId: savedParent.id,
    });
    const savedChild = await repository.save(child);

    const retrievedChild = await repository.findOne({
      where: { id: savedChild.id },
      relations: ['parent'],
    });

    expect(retrievedChild).toBeDefined();
    expect(retrievedChild?.parent?.id).toBe(savedParent.id);
  });
});
