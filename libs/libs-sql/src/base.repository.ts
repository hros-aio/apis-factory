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
  withTenancy?: false;
}

export interface QueryManyOptions<Entity = any> extends FindManyOptions<Entity> {
  onlyIds?: boolean;
  pagination?: PaginationOptions;
  withTenancy?: false;
}

export interface ExistsOptions<Entity = any> extends FindOneOptions<Entity> {
  throwIfExists?: boolean;
  withTenancy?: false;
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
    return RequestContextService.getTenantCode();
  }

  private applyTenantScope(
    where?: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[],
  ): FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[] {
    const scope = { tenantCode: this.tenantCode };
    if (Array.isArray(where)) {
      if (where.length === 0) {
        return scope as unknown as FindOptionsWhere<Entity>;
      }
      return where.map((w) => ({ ...w, ...scope }) as FindOptionsWhere<Entity>);
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
    const combinedWhere = optionsWhere
      ? Array.isArray(optionsWhere)
        ? optionsWhere.map((w) => ({ ...(where || {}), ...w }))
        : { ...(where || {}), ...optionsWhere }
      : where;
    let mergedWhere = combinedWhere;
    if (restOptions.withTenancy !== false) {
      mergedWhere = this.applyTenantScope(combinedWhere);
    }

    const data = await this.repository.findOne({
      ...restOptions,
      where: mergedWhere,
    });
    if (!data && required) {
      throw new Error(`Record not found with query: ${JSON.stringify(where)}`);
    }
    return data || null;
  }

  async findById(id: string): Promise<Entity | null>;
  async findById(
    id: string,
    options: QueryOneOptions<Entity> & { required: true },
  ): Promise<Entity>;
  async findById(id: string, options?: QueryOneOptions<Entity>): Promise<Entity | null>;
  async findById(id: string, options?: QueryOneOptions<Entity>): Promise<Entity | null> {
    try {
      return await this.findOne({ id } as FindOptionsWhere<Entity>, options);
    } catch (error: any) {
      if (options?.required) {
        throw new Error(`Record not found with ID: ${id}`);
      }
      throw error;
    }
  }

  async findPaginated(
    options: PaginationOptions,
    where?: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[],
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
    const { where: optionsWhere, onlyIds, pagination, ...restOptions } = options || {};
    const combinedWhere = optionsWhere
      ? Array.isArray(optionsWhere)
        ? optionsWhere.map((w) => ({ ...(where || {}), ...w }))
        : { ...(where || {}), ...optionsWhere }
      : where;
    let mergedWhere = combinedWhere;
    if (restOptions.withTenancy !== false) {
      mergedWhere = this.applyTenantScope(combinedWhere);
    }

    if (onlyIds) {
      const data = await this.repository.find({
        ...restOptions,
        select: { id: true } as unknown as FindOptionsSelect<Entity>,
        where: mergedWhere,
      });
      return data.map((item) => item.id);
    }

    if (pagination) {
      return this.findPaginated(pagination, mergedWhere);
    }

    return this.repository.find({
      ...restOptions,
      where: mergedWhere,
    });
  }

  async update(id: string, entityData: DeepPartial<Entity>): Promise<Entity> {
    return this.repository.save({ ...entityData, id });
  }

  async delete(id: string): Promise<void> {
    await this.exists({ id, withTenancy: false, throwIfExists: true } as ExistsOptions<Entity>);

    await this.repository.softDelete(id);
  }

  async forceDelete(id: string): Promise<void> {
    await this.exists({ id, withTenancy: false, throwIfExists: true } as ExistsOptions<Entity>);

    await this.repository.delete(id);
  }

  async restore(id: string): Promise<void> {
    await this.exists({ id, withTenancy: false, throwIfExists: true, withDeleted: true } as ExistsOptions<Entity>);

    await this.repository.restore(id);
  }

  async exists(options: ExistsOptions<Entity>): Promise<boolean>;
  async exists(options: ExistsOptions<Entity> & { throwIfExists: true }): Promise<true>;
  async exists(options: ExistsOptions<Entity>): Promise<boolean> {
    let where = options.where;
    if (options.withTenancy !== false) {
      where = this.applyTenantScope(options.where);
    }

    const count = await this.repository.count({
      ...options,
      where,
    });

    if (count === 0 && options.throwIfExists) {
      throw new Error(`Record not found with query ${JSON.stringify(where)}`);
    }
    return count > 0;
  }
}
