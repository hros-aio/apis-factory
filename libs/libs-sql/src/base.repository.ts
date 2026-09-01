import { RequestContextService } from '@new-hros/libs-core';
import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsSelect,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { PaginatedResult, PaginationOptions, buildPaginatedResult } from './pagination';
import { TransactionService } from './transaction.service';

export interface QueryOneOptions<Entity = any> extends FindOneOptions<Entity> {
  required?: boolean;
}

export interface QueryManyOptions<Entity = any> extends FindManyOptions<Entity> {
  onlyIds?: boolean;
  pagination?: PaginationOptions;
}

export abstract class BaseRepository<Entity extends BaseEntity> {
  constructor(
    protected readonly entityTarget: new () => Entity,
    protected readonly transactionService: TransactionService,
  ) {}

  protected get repository(): Repository<Entity> {
    return this.transactionService.getManager().getRepository(this.entityTarget);
  }

  protected get tenantCode(): string {
    const code = RequestContextService.getTenantCode();
    if (!code) {
      throw new Error('Tenant code is missing from active RequestContext');
    }
    return code;
  }

  private applyTenantScope(where?: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[]): FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[] {
    const scope = { tenantCode: this.tenantCode };
    if (Array.isArray(where)) {
      if (where.length === 0) {
        return scope as unknown as FindOptionsWhere<Entity>;
      }
      return where.map((w) => ({ ...w, ...scope } as FindOptionsWhere<Entity>));
    }
    return { ...(where || {}), ...scope } as FindOptionsWhere<Entity>;
  }

  async create(entityData: DeepPartial<Entity>): Promise<Entity> {
    const entity = this.repository.create({
      ...entityData,
      tenantCode: this.tenantCode,
    });

    return this.repository.save(entity as any) as unknown as Promise<Entity>;
  }

  async findOne(where: FindOptionsWhere<Entity>): Promise<Entity | null>;
  async findOne(
    where: FindOptionsWhere<Entity>,
    options: QueryOneOptions<Entity> & { required: true },
  ): Promise<Entity>;
  async findOne(
    where: FindOptionsWhere<Entity>,
    options?: QueryOneOptions<Entity>,
  ): Promise<Entity | null>;
  async findOne(
    where: FindOptionsWhere<Entity>,
    options?: QueryOneOptions<Entity>,
  ): Promise<Entity | null> {
    const { required, where: optionsWhere, ...restOptions } = options || {};
    const mergedWhere = optionsWhere || where;
    const data = await this.repository.findOne({
      ...restOptions,
      where: this.applyTenantScope(mergedWhere),
    });
    if (!data && required) {
      throw new Error(`Record not found with query: ${JSON.stringify(where)}`);
    }
    return data || null;
  }

  async findById(id: string): Promise<Entity | null>;
  async findById(id: string, options: QueryOneOptions<Entity> & { required: true }): Promise<Entity>;
  async findById(id: string, options?: QueryOneOptions<Entity>): Promise<Entity | null>;
  async findById(id: string, options?: QueryOneOptions<Entity>): Promise<Entity | null> {
    const { required, where: _ignoredWhere, ...restOptions } = options || {};
    const data = await this.repository.findOne({
      ...restOptions,
      where: this.applyTenantScope({ id } as unknown as FindOptionsWhere<Entity>),
    });
    if (!data && required) {
      throw new Error(`Record not found with ID: ${id}`);
    }
    return data || null;
  }

  async findPaginated(
    options: PaginationOptions,
    where?: FindOptionsWhere<Entity>,
  ): Promise<PaginatedResult<Entity>> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, options.limit || 10);
    const skip = (page - 1) * limit;

    const [data, total] = await this.repository.findAndCount({
      where: this.applyTenantScope(where),
      skip,
      take: limit,
    });

    return buildPaginatedResult(data, total, options);
  }

  async find(where: FindOptionsWhere<Entity>): Promise<Entity[]>;
  async find(
    where: FindOptionsWhere<Entity>,
    options: QueryManyOptions<Entity> & { onlyIds: true },
  ): Promise<string[]>;
  async find(
    where: FindOptionsWhere<Entity>,
    options: QueryManyOptions<Entity> & { pagination: PaginationOptions },
  ): Promise<PaginatedResult<Entity>>;
  async find(
    where: FindOptionsWhere<Entity>,
    options?: QueryManyOptions<Entity>,
  ): Promise<Entity[]>;
  async find(where: FindOptionsWhere<Entity>, options?: QueryManyOptions<Entity>) {
    if (options?.onlyIds) {
      const { onlyIds: _ignoredOnlyIds, pagination: _ignoredPagination, where: optionsWhere, ...restOptions } = options;
      const mergedWhere = optionsWhere || where;
      const data = await this.repository.find({
        ...restOptions,
        select: { id: true } as unknown as FindOptionsSelect<Entity>,
        where: this.applyTenantScope(mergedWhere),
      });
      return data.map((item) => item.id);
    }

    if (options?.pagination) {
      return this.findPaginated(options.pagination, where);
    }

    const { where: optionsWhere, ...restOptions } = options || {};
    const mergedWhere = optionsWhere || where;

    return this.repository.find({
      ...restOptions,
      where: this.applyTenantScope(mergedWhere),
    });
  }

  async update(id: string, entityData: DeepPartial<Entity>): Promise<Entity> {
    // Fetch entity first to ensure it belongs to the tenant
    const existing = await this.findById(id, { required: true });
    const updated = this.repository.merge(existing, entityData);

    return this.repository.save(updated);
  }

  async delete(id: string): Promise<void> {
    const isExist = await this.exists({ id } as FindOptionsWhere<Entity>);
    if (!isExist) {
      throw new Error(`Record not found with ID: ${id}`);
    }

    await this.repository.softDelete(id);
  }

  async forceDelete(id: string): Promise<void> {
    const isExist = await this.exists({ id } as FindOptionsWhere<Entity>);
    if (!isExist) {
      throw new Error(`Record not found with ID: ${id}`);
    }

    await this.repository.delete(id);
  }

  async restore(id: string): Promise<void> {
    const existing = await this.repository.findOne({
      where: this.applyTenantScope({ id } as FindOptionsWhere<Entity>),
      withDeleted: true,
    });
    if (!existing) {
      throw new Error(`Soft-deleted record not found with ID: ${id}`);
    }

    await this.repository.restore(id);
  }

  async exists(where: FindOptionsWhere<Entity>): Promise<boolean> {
    const count = await this.repository.count({
      where: this.applyTenantScope(where),
    });
    return count > 0;
  }
}
