import { RequestContextService } from '@new-hros/libs-core';
import { BaseRepository, QueryOneOptions, QueryManyOptions } from '../src/base.repository';
import { BaseEntity } from '../src/base.entity';
import { TransactionService } from '../src/transaction.service';
import { EntityManager, Repository } from 'typeorm';

class TestEntity extends BaseEntity {
  name: string;
  code: string;
  company?: any;
}

class TestRepository extends BaseRepository<TestEntity> {
  constructor(transactionService: TransactionService) {
    super(TestEntity, transactionService);
  }
}

describe('BaseRepository Generic QueryOptions', () => {
  let mockTypeOrmRepo: Partial<Repository<TestEntity>>;
  let mockEntityManager: Partial<EntityManager>;
  let mockTransactionService: Partial<TransactionService>;
  let repository: TestRepository;

  beforeEach(() => {
    jest.spyOn(RequestContextService, 'getTenantCode').mockReturnValue('tenant-123');

    mockTypeOrmRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      merge: jest.fn(),
      softDelete: jest.fn(),
      delete: jest.fn(),
      restore: jest.fn(),
      count: jest.fn(),
    };

    mockEntityManager = {
      getRepository: jest.fn().mockReturnValue(mockTypeOrmRepo),
    };

    mockTransactionService = {
      getManager: jest.fn().mockReturnValue(mockEntityManager),
    };

    repository = new TestRepository(mockTransactionService as TransactionService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('QueryOneOptions & findOne / findById', () => {
    it('should forward TypeORM findOne options and enforce tenantCode', async () => {
      const mockResult: TestEntity = {
        id: '1',
        name: 'Test',
        code: 'T1',
        tenantCode: 'tenant-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      };
      (mockTypeOrmRepo.findOne as jest.Mock).mockResolvedValue(mockResult);

      const options: QueryOneOptions<TestEntity> = {
        select: { id: true, name: true },
        relations: { company: true },
        order: { name: 'ASC' },
      };

      const result = await repository.findOne({ code: 'T1' }, options);

      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        select: { id: true, name: true },
        relations: { company: true },
        order: { name: 'ASC' },
        where: { code: 'T1', tenantCode: 'tenant-123' },
      });
      expect(result).toEqual(mockResult);
    });

    it('should throw error when required is true and record is not found in findOne', async () => {
      (mockTypeOrmRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        repository.findOne({ code: 'NOT_EXIST' }, { required: true }),
      ).rejects.toThrow('Record not found with query: {"code":"NOT_EXIST"}');
    });

    it('should forward TypeORM options in findById', async () => {
      const mockResult: TestEntity = {
        id: 'id-100',
        name: 'Test',
        code: 'T1',
        tenantCode: 'tenant-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      };
      (mockTypeOrmRepo.findOne as jest.Mock).mockResolvedValue(mockResult);

      const result = await repository.findById('id-100', {
        select: { id: true },
        relations: ['company'],
      });

      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        select: { id: true },
        relations: ['company'],
        where: { id: 'id-100', tenantCode: 'tenant-123' },
      });
      expect(result).toEqual(mockResult);
    });

    it('should throw error when required is true and record is not found in findById', async () => {
      (mockTypeOrmRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(repository.findById('non-existent', { required: true })).rejects.toThrow(
        'Record not found with ID: non-existent',
      );
    });
  });

  describe('QueryManyOptions & find', () => {
    it('should forward TypeORM find options and enforce tenantCode', async () => {
      const mockList: TestEntity[] = [
        {
          id: '1',
          name: 'Alpha',
          code: 'A',
          tenantCode: 'tenant-123',
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
        },
      ];
      (mockTypeOrmRepo.find as jest.Mock).mockResolvedValue(mockList);

      const options: QueryManyOptions<TestEntity> = {
        order: { name: 'ASC' },
        relations: { company: true },
        take: 5,
      };

      const result = await repository.find({ name: 'Alpha' }, options);

      expect(mockTypeOrmRepo.find).toHaveBeenCalledWith({
        order: { name: 'ASC' },
        relations: { company: true },
        take: 5,
        where: { name: 'Alpha', tenantCode: 'tenant-123' },
      });
      expect(result).toEqual(mockList);
    });

    it('should return only IDs when onlyIds is true and forward other options', async () => {
      (mockTypeOrmRepo.find as jest.Mock).mockResolvedValue([{ id: 'id-1' }, { id: 'id-2' }]);

      const ids = await repository.find(
        { name: 'Alpha' },
        { onlyIds: true, order: { createdAt: 'DESC' } },
      );

      expect(mockTypeOrmRepo.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        select: { id: true },
        where: { name: 'Alpha', tenantCode: 'tenant-123' },
      });
      expect(ids).toEqual(['id-1', 'id-2']);
    });

    it('should delegate to pagination when pagination options are provided', async () => {
      const mockList: TestEntity[] = [
        {
          id: '1',
          name: 'Alpha',
          code: 'A',
          tenantCode: 'tenant-123',
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
        },
      ];
      (mockTypeOrmRepo.findAndCount as jest.Mock).mockResolvedValue([mockList, 1]);

      const result = await repository.find(
        { name: 'Alpha' },
        { pagination: { page: 1, limit: 10 } },
      );

      expect(mockTypeOrmRepo.findAndCount).toHaveBeenCalledWith({
        where: { name: 'Alpha', tenantCode: 'tenant-123' },
        skip: 0,
        take: 10,
      });
      expect(result.data).toEqual(mockList);
      expect(result.total).toBe(1);
    });
  });

  describe('Backwards Compatibility', () => {
    it('should support QueryOneOptions and QueryManyOptions without type arguments', async () => {
      (mockTypeOrmRepo.findOne as jest.Mock).mockResolvedValue(null);
      (mockTypeOrmRepo.find as jest.Mock).mockResolvedValue([]);

      const legacyOneOptions: QueryOneOptions = { required: false };
      const legacyManyOptions: QueryManyOptions = { withDeleted: true };

      const one = await repository.findOne({ code: 'ABC' }, legacyOneOptions);
      const many = await repository.find({ code: 'ABC' }, legacyManyOptions);

      expect(one).toBeNull();
      expect(many).toEqual([]);
    });
  });
});
