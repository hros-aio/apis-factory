import { FindOptionsWhere, Repository } from 'typeorm';
import { TransactionService } from './transaction.service';
import { RequestContextService } from '@new-hros/libs-core';
import { PaginationOptions, PaginatedResult, buildPaginatedResult } from './pagination';
import { BaseEntity } from './base.entity';

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
    const scope: any = { tenantCode: this.tenantCode, isDeleted: false };
    return { ...(where || {}), ...scope } as FindOptionsWhere<Entity>;
  }

  async create(entityData: Partial<Entity>): Promise<Entity> {
    const user = RequestContextService.getUser();
    const entity = this.repository.create({
      ...entityData,
      tenantCode: this.tenantCode,
      createdBy: user?.userId || undefined,
      updatedBy: user?.userId || undefined,
    } as any);

    return this.repository.save(entity);
  }

  async findById(id: string): Promise<Entity | null> {
    return this.repository.findOne({
      where: this.applyTenantScope({ id } as any),
    });
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

  async update(id: string, entityData: Partial<Entity>): Promise<Entity> {
    const user = RequestContextService.getUser();
    
    // Fetch entity first to ensure it belongs to the tenant
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Record not found with ID: ${id}`);
    }

    const updated = this.repository.merge(existing, {
      ...entityData,
      updatedBy: user?.userId || undefined,
    });

    return this.repository.save(updated);
  }

  async delete(id: string): Promise<void> {
    const user = RequestContextService.getUser();
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Record not found with ID: ${id}`);
    }

    existing.isDeleted = true;
    existing.deletedAt = new Date();
    existing.updatedBy = user?.userId || undefined;

    await this.repository.save(existing);
  }

  async restore(id: string): Promise<void> {
    const user = RequestContextService.getUser();
    const existing = await this.repository.findOne({
      where: { id, tenantCode: this.tenantCode, isDeleted: true } as any,
    });
    if (!existing) {
      throw new Error(`Soft-deleted record not found with ID: ${id}`);
    }

    existing.isDeleted = false;
    existing.deletedAt = undefined;
    existing.updatedBy = user?.userId || undefined;

    await this.repository.save(existing);
  }
}
