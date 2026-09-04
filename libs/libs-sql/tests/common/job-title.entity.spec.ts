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

describe('JobTitle Entity', () => {
  let dataSource: DataSource;
  let companyId: string;
  let departmentId: string;
  let gradeId: string;

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
    const savedCompany = await companyRepo.save(company);
    companyId = savedCompany.id;

    const departmentRepo = dataSource.getRepository(Department);
    const department = departmentRepo.create({
      tenantCode: 'tenant-123',
      companyId: companyId,
      code: 'ENG',
      name: 'Engineering',
      status: MasterDataStatus.ACTIVE,
      effectiveAt: new Date('2026-01-01'),
    });
    const savedDept = await departmentRepo.save(department);
    departmentId = savedDept.id;

    const gradeRepo = dataSource.getRepository(Grade);
    const grade = gradeRepo.create({
      tenantCode: 'tenant-123',
      companyId: companyId,
      code: 'G1',
      name: 'Senior',
      status: MasterDataStatus.ACTIVE,
      effectiveAt: new Date('2026-01-01'),
    });
    const savedGrade = await gradeRepo.save(grade);
    gradeId = savedGrade.id;
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('should successfully save and retrieve a job title with its associations', async () => {
    const repository = dataSource.getRepository(JobTitle);
    const jobTitle = repository.create({
      tenantCode: 'tenant-123',
      companyId: companyId,
      departmentId: departmentId,
      gradeId: gradeId,
      code: 'SWE',
      name: 'Software Engineer',
      description: 'Software Engineer role',
      status: MasterDataStatus.ACTIVE,
      effectiveAt: new Date('2026-01-01'),
    });

    const saved = await repository.save(jobTitle);
    expect(saved.id).toBeDefined();

    const retrieved = await repository.findOne({
      where: { id: saved.id },
      relations: ['company', 'department', 'grade'],
    });

    expect(retrieved).toBeDefined();
    expect(retrieved?.code).toBe('SWE');
    expect(retrieved?.name).toBe('Software Engineer');
    expect(retrieved?.company?.id).toBe(companyId);
    expect(retrieved?.department?.id).toBe(departmentId);
    expect(retrieved?.grade?.id).toBe(gradeId);
    expect(retrieved?.status).toBe(MasterDataStatus.ACTIVE);
  });
});
