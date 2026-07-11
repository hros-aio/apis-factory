import { RequestContextService } from '@new-hros/libs-core';
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';
import { BaseEntity } from './base.entity';
import { PaginatedResult, PaginationOptions, buildPaginatedResult } from './pagination';
import { TransactionService } from './transaction.service';

export interface QueryOneOptions {
  required?: boolean;
}

export interface QueryManyOptions {
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

  private applyTenantScope(where?: FindOptionsWhere<Entity>): FindOptionsWhere<Entity> {
    const scope: any = { tenantCode: this.tenantCode };
    return { ...(where || {}), ...scope } as FindOptionsWhere<Entity>;
  }

  async create(entityData: DeepPartial<Entity>): Promise<Entity> {
    const entity = this.repository.create({
      ...entityData,
      tenantCode: this.tenantCode,
    });

    return this.repository.save(entity as any) as unknown as Promise<Entity>;
  }

  async findById(id: string): Promise<Entity | null>;
  async findById(id: string, options: QueryOneOptions & { required: true }): Promise<Entity>;
  async findById(id: string, options?: QueryOneOptions): Promise<Entity | null> {
    const data = await this.repository.findOne({
      where: this.applyTenantScope({ id } as FindOptionsWhere<Entity>),
    });
    if (!data && options?.required) {
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

  async update(id: string, entityData: DeepPartial<Entity>): Promise<Entity> {
    // Fetch entity first to ensure it belongs to the tenant
    const existing = await this.findById(id, { required: true });
    const updated = this.repository.merge(existing, entityData);

    return this.repository.save(updated);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id, { required: true });

    await this.repository.softDelete(id);
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
}

