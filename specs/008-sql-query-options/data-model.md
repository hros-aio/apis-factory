# Data Model: Generic Query Options in libs-sql

## Conceptual Entities & Type Contracts

### 1. `QueryOneOptions<Entity = any>`
Extends TypeORM's `FindOneOptions<Entity>`.
Provides typed configuration for querying a single entity.

```typescript
export interface QueryOneOptions<Entity = any> extends FindOneOptions<Entity> {
  /**
   * If true, throws an Error when no record matching the query criteria is found.
   */
  required?: boolean;
}
```

#### Fields Inherited from `FindOneOptions<Entity>`:
- `select?: FindOptionsSelect<Entity> | FindOptionsSelectByString<Entity>`
- `where?: FindOptionsWhere<Entity>[] | FindOptionsWhere<Entity>`
- `relations?: FindOptionsRelations<Entity> | string[]`
- `relationLoadStrategy?: 'join' | 'query'`
- `order?: FindOptionsOrder<Entity>`
- `lock?: { mode: 'optimistic' | 'pessimistic_read' | 'pessimistic_write' | 'dirty_read' | 'pessimistic_partial_write' | 'pessimistic_write_or_fail' | 'for_no_key_update' | 'for_key_share' }`
- `withDeleted?: boolean`
- `cache?: boolean | number | { id: any; milliseconds: number }`
- `transaction?: boolean`
- `comment?: string`

---

### 2. `QueryManyOptions<Entity = any>`
Extends TypeORM's `FindManyOptions<Entity>`.
Provides typed configuration for querying multiple entities, with custom framework pagination and projection options.

```typescript
export interface QueryManyOptions<Entity = any> extends FindManyOptions<Entity> {
  /**
   * If true, returns an array of entity ID strings instead of full entities.
   */
  onlyIds?: boolean;

  /**
   * Pagination parameters (page, limit, order, etc.). When provided, find returns PaginatedResult<Entity>.
   */
  pagination?: PaginationOptions;
}
```

#### Fields Inherited from `FindManyOptions<Entity>`:
- All fields in `FindOneOptions<Entity>`
- `skip?: number`
- `take?: number`

---

### 3. `BaseRepository<Entity extends BaseEntity>` Method Signatures

```typescript
export abstract class BaseRepository<Entity extends BaseEntity> {
  // Single Entity
  async findOne(
    where: FindOptionsWhere<Entity>,
    options: QueryOneOptions<Entity> & { required: true },
  ): Promise<Entity>;
  async findOne(
    where: FindOptionsWhere<Entity>,
    options?: QueryOneOptions<Entity>,
  ): Promise<Entity | null>;

  // By ID
  async findById(
    id: string,
    options: QueryOneOptions<Entity> & { required: true },
  ): Promise<Entity>;
  async findById(
    id: string,
    options?: QueryOneOptions<Entity>,
  ): Promise<Entity | null>;

  // Multi Entity
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
