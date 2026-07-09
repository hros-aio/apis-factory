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
    const savedCompany = await companyRepo.save(company);
    companyId = savedCompany.id;

    const departmentRepo = dataSource.getRepository(Department);
    const department = departmentRepo.create({
      tenantCode: 'tenant-123',
      companyId: companyId,
      code: 'ENG',
      name: 'Engineering',
    });
    const savedDept = await departmentRepo.save(department);
    departmentId = savedDept.id;

    const gradeRepo = dataSource.getRepository(Grade);
    const grade = gradeRepo.create({
      tenantCode: 'tenant-123',
      companyId: companyId,
      code: 'G1',
      name: 'Senior',
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
  });
});
