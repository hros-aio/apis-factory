import { Test } from '@nestjs/testing';
import { SqlModule } from '../src/sql.module';
import { TransactionService } from '../src/transaction.service';
import { UnitOfWork } from '../src/unit-of-work.service';
import { SqlHealthService } from '../src/sql-health.service';
import { CoreModule } from '@new-hros/libs-core';
import { EntityManager } from 'typeorm';

// Properly mock TypeOrmModule and export mock EntityManager provider
jest.mock('@nestjs/typeorm', () => {
  class MockTypeOrmModule {}
  const { EntityManager: TypeOrmEntityManager } = require('typeorm');
  const mockEntityManager = {
    query: jest.fn().mockResolvedValue([{ 1: 1 }]),
  };
  return {
    TypeOrmModule: Object.assign(MockTypeOrmModule, {
      forRoot: jest.fn().mockReturnValue({
        module: MockTypeOrmModule,
        providers: [{ provide: TypeOrmEntityManager, useValue: mockEntityManager }],
        exports: [TypeOrmEntityManager],
      }),
      forRootAsync: jest.fn().mockReturnValue({
        module: MockTypeOrmModule,
        providers: [{ provide: TypeOrmEntityManager, useValue: mockEntityManager }],
        exports: [TypeOrmEntityManager],
      }),
    }),
  };
});

describe('SqlModule', () => {
  it('should initialize and register dependencies in forRoot', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        CoreModule.forRoot(),
        SqlModule.forRoot({
          type: 'postgres',
          host: 'localhost',
          port: 5432,
          database: 'test',
          synchronize: false,
        }),
      ],
    }).compile();

    const transactionService = moduleRef.get(TransactionService);
    const unitOfWork = moduleRef.get(UnitOfWork);
    const healthService = moduleRef.get(SqlHealthService);

    expect(transactionService).toBeDefined();
    expect(unitOfWork).toBeDefined();
    expect(healthService).toBeDefined();

    // Verify healthService check works with mocked query
    const healthResult = await healthService.checkHealth();
    expect(healthResult.status).toBe('up');
  });
});
