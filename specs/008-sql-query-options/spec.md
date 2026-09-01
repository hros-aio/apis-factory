# Feature Specification: Generics for QueryOptions in libs-sql

**Feature Branch**: `008-sql-query-options`

**Created**: 2026-09-01

**Status**: Draft

**Input**: User description: "In libs/sql I want update QueryOptions example QueryOneOptions to QueryOneOptions<T> extends FindOneOptions<T>, QueryManyOptions<T> extends FindOptions<T>"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Type-Safe and Flexible Single-Entity Querying (Priority: P1)

As a backend developer consuming `libs-sql` repository APIs, I want `QueryOneOptions<Entity>` to inherit and support native ORM query capabilities (such as selecting specific fields, including relations, locking modes, or custom orderings) with full generic entity type safety while retaining existing helper controls like `required: true`.

**Why this priority**: Developers frequently need to control relations, partial field selection, and query locks when fetching a single entity. Currently `QueryOneOptions` only accepts `{ required?: boolean }`, forcing awkward workarounds or raw repository access.

**Independent Test**: Can be tested independently by calling `baseRepository.findOne(where, { select: ['id', 'name'], relations: ['roles'], required: true })` or `findById(id, { select: ['id'] })` and verifying compile-time TypeScript type checking as well as correct runtime query execution and error handling.

**Acceptance Scenarios**:

1. **Given** a repository extending `BaseRepository<User>`, **When** querying with `findOne(where, { select: ['id'], relations: { profile: true } })`, **Then** the ORM executes the query respecting selected fields and relations within the active tenant scope.
2. **Given** a query with `{ required: true }`, **When** no entity matches the criteria, **Then** an error is thrown indicating the record was not found.
3. **Given** an invalid property name passed to `select` or `order`, **When** TypeScript compiles, **Then** a type compilation error is emitted preventing invalid column selections.

---

### User Story 2 - Type-Safe and Expressive Multi-Entity Querying (Priority: P1)

As a backend developer consuming `libs-sql` repository APIs, I want `QueryManyOptions<Entity>` to extend standard ORM find options (`FindOptions<Entity>` / `FindManyOptions<Entity>`) while maintaining library-specific options (`onlyIds`, `pagination`, `cache`, `withDeleted`).

**Why this priority**: Enables developers to perform sorting, joins/relations, filtering, and field selection in list/multi-record queries without losing custom framework features such as ID-only projections and cursor/offset pagination.

**Independent Test**: Can be tested by invoking `baseRepository.find(where, { order: { createdAt: 'DESC' }, relations: ['department'], onlyIds: true })` or with `pagination` options, confirming valid TypeScript inference and correct runtime behavior.

**Acceptance Scenarios**:

1. **Given** a repository extending `BaseRepository<Entity>`, **When** invoking `find(where, { order: { createdAt: 'DESC' }, relations: { items: true } })`, **Then** the multi-entity results are retrieved with specified sorting and joined relations.
2. **Given** a query specifying `{ onlyIds: true }` alongside additional ORM options (e.g. `order` or `withDeleted`), **When** executed, **Then** only an array of entity ID strings is returned.
3. **Given** a query specifying `pagination` options alongside find options, **When** executed, **Then** a `PaginatedResult<Entity>` is returned with pagination metadata properly computed.

---

### User Story 3 - Backward Compatibility for Existing Repository Calls (Priority: P2)

As a developer maintaining existing services that already use `findOne`, `findById`, or `find`, I want default generic parameter fallbacks (e.g. `QueryOneOptions<T = any>` or `QueryOneOptions<Entity>`) and optional options parameters so existing calls without explicit generic overrides continue to work seamlessly without breaking changes.

**Why this priority**: Prevents breaking existing module implementations across the codebase when upgrading `libs-sql`.

**Independent Test**: Can be tested by running existing unit tests and checking that call sites using parameterless `QueryOneOptions` or `QueryManyOptions` compile cleanly.

**Acceptance Scenarios**:

1. **Given** existing repository calls using `QueryOneOptions` or `QueryManyOptions` without specifying generic type arguments, **When** the codebase is built, **Then** all code compiles without type errors.
2. **Given** existing usages of `{ required: true }`, `{ onlyIds: true }`, or `{ pagination: ... }`, **When** executed, **Then** existing runtime behaviors remain identical.

---

### Edge Cases

- **Tenant Scoping Precedence**: When caller supplies custom `where` clauses or options via generic find options, tenant isolation (`tenantCode`) MUST remain strictly enforced and not be overwritten or bypassed.
- **`onlyIds` Conflict Resolution**: When `onlyIds: true` is combined with custom `select` options, `select` is overridden to `{ id: true }` to guarantee string ID extraction.
- **`pagination` Conflict Resolution**: When `pagination` is provided along with `skip` or `take` in find options, `pagination.page` and `pagination.limit` take precedence.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `QueryOneOptions<T>` MUST be a generic interface that extends TypeORM's `FindOneOptions<T>` while retaining optional `required?: boolean`.
- **FR-002**: `QueryManyOptions<T>` MUST be a generic interface that extends TypeORM's `FindManyOptions<T>` (or `FindOptions<T>`) while retaining `onlyIds?: boolean`, `pagination?: PaginationOptions`, `cache?: boolean`, and `withDeleted?: boolean`.
- **FR-003**: Generic type parameters on `QueryOneOptions<T>` and `QueryManyOptions<T>` MUST default to a sensible fallback (e.g., `any` or `Record<string, any>`) so consumers can use the interface without mandatory type arguments.
- **FR-004**: `BaseRepository<Entity>` methods (`findOne`, `findById`, `find`) MUST use `QueryOneOptions<Entity>` and `QueryManyOptions<Entity>` in their signatures.
- **FR-005**: `BaseRepository.findOne` and `BaseRepository.findById` MUST forward all ORM find options (such as `select`, `relations`, `order`, `lock`, `comment`) to the underlying repository call while applying the mandatory tenant scope filter.
- **FR-006**: `BaseRepository.find` MUST forward ORM find options (such as `select`, `relations`, `order`, `skip`, `take`, `lock`) to the underlying repository when `onlyIds` or `pagination` modes are executed or when standard multi-entity query mode is used.
- **FR-007**: Tenant isolation scoping MUST always be applied to the query conditions even when custom query options and where clauses are passed.

### Key Entities

- **QueryOneOptions<T>**: Generic configuration object for single-record retrieval extending standard ORM single-entity options with requirement assertions (`required`).
- **QueryManyOptions<T>**: Generic configuration object for multi-record retrieval extending standard ORM multi-entity options with custom projection (`onlyIds`), pagination (`pagination`), and soft-delete/cache controls.
- **BaseRepository<Entity>**: Abstract base data access layer encapsulating tenant scoping, transactions, and type-safe query helpers.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of existing repository unit tests pass without regressions.
- **SC-002**: Zero TypeScript compilation errors when using TypeORM find options (`select`, `relations`, `order`) with `QueryOneOptions<T>` and `QueryManyOptions<T>`.
- **SC-003**: Type safety verification: Passing non-existent field names to `select` or `order` in `QueryOneOptions<Entity>` fails compilation in strict TypeScript mode.
- **SC-004**: 100% tenant scoping enforcement across all variations of `findOne`, `findById`, and `find` options.

## Assumptions

- `libs-sql` uses TypeORM as its underlying ORM, where `FindOneOptions<T>` and `FindManyOptions<T>` are the standard query option types.
- The default generic parameter `T` should default to `any` or `Record<string, unknown>` to ensure backward compatibility for non-parameterized references.
- `BaseRepository<Entity extends BaseEntity>` will pass `Entity` as the generic type argument to `QueryOneOptions<Entity>` and `QueryManyOptions<Entity>`.
