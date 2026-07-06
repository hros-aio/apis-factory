import { Test } from '@nestjs/testing';
import { MongoModule } from '../src/mongo.module';
import { MongoHealthService } from '../src/mongo-health.service';
import { CoreModule } from '@new-hros/libs-core';
import { getConnectionToken } from '@nestjs/mongoose';

jest.mock('@nestjs/mongoose', () => {
  const actual = jest.requireActual('@nestjs/mongoose');
  class MockMongooseModule {}
  return {
    ...actual,
    MongooseModule: Object.assign(MockMongooseModule, {
      forRoot: jest.fn().mockImplementation((uri, options) => {
        const connToken = actual.getConnectionToken(options?.connectionName);
        return {
          module: MockMongooseModule,
          providers: [{ provide: connToken, useValue: { readyState: 1 } }],
          exports: [connToken],
        };
      }),
      forRootAsync: jest.fn().mockImplementation((options) => {
        const connToken = actual.getConnectionToken(options?.connectionName);
        return {
          module: MockMongooseModule,
          providers: [{ provide: connToken, useValue: { readyState: 1 } }],
          exports: [connToken],
        };
      }),
    }),
  };
});

describe('MongoModule', () => {
  it('should initialize and register health service in forRoot', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        CoreModule.forRoot(),
        MongoModule.forRoot({
          uri: 'mongodb://localhost:27017/test',
        }),
      ],
    }).compile();

    const healthService = moduleRef.get(MongoHealthService);
    expect(healthService).toBeDefined();

    const check = await healthService.checkHealth();
    expect(check.status).toBe('up');
  });
});
