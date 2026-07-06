import { Model } from 'mongoose';
import { BaseDocument } from './base-mongo.document';
import { RequestContextService } from '@new-hros/libs-core';
import { MongoPaginationOptions, MongoPaginatedResult, buildMongoPaginatedResult } from './pagination';

export abstract class BaseMongoRepository<T extends BaseDocument> {
  constructor(protected readonly model: Model<T>) {}

  protected get tenantCode(): string {
    const code = RequestContextService.getTenantCode();
    if (!code) {
      throw new Error('Tenant code is missing from active RequestContext');
    }
    return code;
  }

  async create(doc: Partial<T>): Promise<T> {
    const created = new this.model({
      ...doc,
      tenantCode: this.tenantCode,
    });
    return created.save();
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findOne({ _id: id } as any).exec();
  }

  async findPaginated(
    options: MongoPaginationOptions,
    filter: Record<string, any> = {},
  ): Promise<MongoPaginatedResult<T>> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, options.limit || 10);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model.find(filter).skip(skip).limit(limit).exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    return buildMongoPaginatedResult(data, total, options);
  }

  async update(id: string, doc: Partial<T>): Promise<T> {
    const user = RequestContextService.getUser();
    
    const updated = await this.model.findOneAndUpdate(
      { _id: id } as any,
      {
        $set: {
          ...doc,
          updatedBy: user?.userId || undefined,
          updatedAt: new Date(),
        },
      },
      { new: true },
    ).exec();

    if (!updated) {
      throw new Error(`Record not found with ID: ${id}`);
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    const user = RequestContextService.getUser();

    const result = await this.model.updateOne(
      { _id: id } as any,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          updatedBy: user?.userId || undefined,
        },
      },
    ).exec();

    if (result.matchedCount === 0) {
      throw new Error(`Record not found with ID: ${id}`);
    }
  }

  async restore(id: string): Promise<void> {
    const user = RequestContextService.getUser();

    const result = await this.model.updateOne(
      { _id: id, isDeleted: true } as any,
      {
        $set: {
          isDeleted: false,
          deletedAt: undefined,
          updatedBy: user?.userId || undefined,
        },
      },
    ).exec();

    if (result.matchedCount === 0) {
      throw new Error(`Soft-deleted record not found with ID: ${id}`);
    }
  }
}
