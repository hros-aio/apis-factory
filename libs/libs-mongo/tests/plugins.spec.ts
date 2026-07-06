import { BaseMongoRepository } from '../src/base-mongo.repository';
import { BaseDocument } from '../src/base-mongo.document';
import { RequestContextService, RequestContext } from '@new-hros/libs-core';
import { Model } from 'mongoose';

class TestDocument extends BaseDocument {
  name!: string;
}

class TestRepository extends BaseMongoRepository<TestDocument> {
  constructor(model: Model<TestDocument>) {
    super(model);
  }
}

describe('Mongoose Tenant and Soft Delete Plugins', () => {
  let repository: TestRepository;
  let mockModel: any;

  beforeEach(() => {
    mockModel = jest.fn().mockImplementation(() => {
      return {
        save: jest.fn().mockResolvedValue({ _id: 'mock-id', name: 'Test' }),
      };
    });
    mockModel.findOne = jest.fn();
    mockModel.find = jest.fn();
    mockModel.countDocuments = jest.fn();
    mockModel.findOneAndUpdate = jest.fn();
    mockModel.updateOne = jest.fn();

    repository = new TestRepository(mockModel as any);
  });

  it('should create and save document within active tenant scope', async () => {
    const ctx: RequestContext = {
      traceId: 'trace-123',
      requestId: 'req-456',
      serviceName: 'test',
      tenantCode: 'tenant-abc',
      requestTimestamp: new Date(),
      clientMetadata: { ip: '127.0.0.1' },
    };

    await RequestContextService.run(ctx, async () => {
      const result = await repository.create({ name: 'Test' } as any);
      expect(result).toBeDefined();
      expect(mockModel).toHaveBeenCalledWith({
        name: 'Test',
        tenantCode: 'tenant-abc',
      });
    });
  });

  it('should find document by ID', async () => {
    const mockDoc = { _id: 'id-123', name: 'Test' };
    const mockExec = { exec: jest.fn().mockResolvedValue(mockDoc) };
    mockModel.findOne.mockReturnValue(mockExec);

    const ctx: RequestContext = {
      traceId: 'trace-123',
      requestId: 'req-456',
      serviceName: 'test',
      tenantCode: 'tenant-abc',
      requestTimestamp: new Date(),
      clientMetadata: { ip: '127.0.0.1' },
    };

    await RequestContextService.run(ctx, async () => {
      const result = await repository.findById('id-123');
      expect(result).toEqual(mockDoc);
      expect(mockModel.findOne).toHaveBeenCalledWith({ _id: 'id-123' });
    });
  });
});
