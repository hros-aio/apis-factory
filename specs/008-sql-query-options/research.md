# Phase 0 Research: Generic QueryOptions for BaseRepository in libs-sql

## Context & Problem Statement
In `libs/libs-sql/src/base.repository.ts`, `QueryOneOptions` and `QueryManyOptions` are currently non-generic interfaces with limited custom fields:
- `QueryOneOptions` only defined `{ required?: boolean }`.
- `QueryManyOptions` defined `{ onlyIds?: boolean; pagination?: PaginationOptions; cache?: boolean; withDeleted?: boolean }`.

Consumers of `BaseRepository<Entity>` could not pass standard TypeORM query options (such as `select`, `relations`, `order`, `lock`, `comment`, etc.) in a type-safe manner.

## Research Findings & Decisions

### Decision 1: Type Definitions & Inheritance Hierarchy
- **Choice**:
  - `export interface QueryOneOptions<Entity = any> extends FindOneOptions<Entity> { required?: boolean; }`
  - `export interface QueryManyOptions<Entity = any> extends FindManyOptions<Entity> { onlyIds?: boolean; pagination?: PaginationOptions; cache?: boolean; withDeleted?: boolean; }`
- **Rationale**:
  - `FindOneOptions<Entity>` and `FindManyOptions<Entity>` are TypeORM's official generic options interfaces for single and multiple record queries.
  - Setting default generic parameter `<Entity = any>` ensures backwards compatibility for existing code that references `QueryOneOptions` or `QueryManyOptions` without a type parameter.
  - Extending TypeORM options enables full autocomplete and compile-time type checking for `select`, `relations`, `order`, `where`, `lock`, etc.
- **Alternatives Considered**:
  - `FindOptions<Entity>` (deprecated in modern TypeORM in favor of `FindManyOptions<Entity>`). `FindManyOptions<Entity>` is the accurate modern TypeORM type.

### Decision 2: Merging Options and Tenant Scoping in BaseRepository Methods
- **Choice**:
  - In `findOne(where, options)`:
    - Pass all fields of `options` (excluding or including `where` properly combined with `applyTenantScope(where)` or `options.where`) to `this.repository.findOne(...)`.
    - Tenant isolation: `applyTenantScope(where)` must always merge `where` parameter and `options?.where`, enforcing `{ tenantCode: this.tenantCode }`.
  - In `findById(id, options)`:
    - Target `{ id }` combined with `this.applyTenantScope()`, preserving additional `options` (`select`, `relations`, etc.).
  - In `find(where, options)`:
    - When `onlyIds: true`: merge options while forcing `select: { id: true }`.
    - When `pagination` is provided: merge `skip`/`take` calculation from pagination with any relations/order specified in `options`.
    - Standard `find`: pass `options` merged with scoped `where`.
- **Rationale**:
  - Guarantees strict multi-tenant isolation (Constitution Principle IV) while giving complete flexibility for projections (`select`) and joins (`relations`).

### Decision 3: TypeScript Method Signatures & Overloads
- **Choice**:
  - Update `BaseRepository<Entity extends BaseEntity>` method overloads to:
    - `findOne(where: FindOptionsWhere<Entity>, options: QueryOneOptions<Entity> & { required: true }): Promise<Entity>`
    - `findOne(where: FindOptionsWhere<Entity>, options?: QueryOneOptions<Entity>): Promise<Entity | null>`
    - `findById(id: string, options: QueryOneOptions<Entity> & { required: true }): Promise<Entity>`
    - `findById(id: string, options?: QueryOneOptions<Entity>): Promise<Entity | null>`
    - `find(where: FindOptionsWhere<Entity>, options: QueryManyOptions<Entity> & { onlyIds: true }): Promise<string[]>`
    - `find(where: FindOptionsWhere<Entity>, options: QueryManyOptions<Entity> & { pagination: PaginationOptions }): Promise<PaginatedResult<Entity>>`
    - `find(where: FindOptionsWhere<Entity>, options?: QueryManyOptions<Entity>): Promise<Entity[]>`
- **Rationale**:
  - Strong compile-time return type inference based on `required`, `onlyIds`, and `pagination` flags while fully typed to `Entity`.
