# TypeScript Contract: libs-sql QueryOptions

## Target Package
`@new-hros/libs-sql` (`libs/libs-sql/src/base.repository.ts`)

## Exported Interfaces Contract

```typescript
import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsSelect,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { PaginatedResult, PaginationOptions } from './pagination';

export interface QueryOneOptions<Entity = any> extends FindOneOptions<Entity> {
  required?: boolean;
}

export interface QueryManyOptions<Entity = any> extends FindManyOptions<Entity> {
  onlyIds?: boolean;
  pagination?: PaginationOptions;
}
```

## Abstract BaseRepository Method Contract

```typescript
export abstract class BaseRepository<Entity extends BaseEntity> {
  // Querying
  async findOne(
    where: FindOptionsWhere<Entity>,
    options: QueryOneOptions<Entity> & { required: true },
  ): Promise<Entity>;
  async findOne(
    where: FindOptionsWhere<Entity>,
    options?: QueryOneOptions<Entity>,
  ): Promise<Entity | null>;

  async findById(
    id: string,
    options: QueryOneOptions<Entity> & { required: true },
  ): Promise<Entity>;
  async findById(
    id: string,
    options?: QueryOneOptions<Entity>,
  ): Promise<Entity | null>;

  async findPaginated(
    options: PaginationOptions,
    where?: FindOptionsWhere<Entity>,
  ): Promise<PaginatedResult<Entity>>;

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
}
```
