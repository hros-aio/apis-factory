# Quickstart & Verification Guide: Generic QueryOptions in libs-sql

## Purpose
Verify that `QueryOneOptions<T>` and `QueryManyOptions<T>` in `@new-hros/libs-sql` provide compile-time type safety and correct runtime execution when specifying TypeORM find options (`select`, `relations`, `order`, etc.).

## Verification Scenarios

### 1. Single Entity Querying with TypeORM Options
```typescript
// Testing findOne with relations, select, and required flag
const department = await departmentRepository.findOne(
  { code: 'ENG' },
  {
    select: ['id', 'name', 'code'],
    relations: ['company'],
    required: true,
  },
);
// Type check: department.code is typed string, department.id is string
```

### 2. Multi-Entity Querying with Sorting, Relations, and Pagination
```typescript
// Testing find with order, relations, and pagination
const result = await departmentRepository.find(
  { status: 'ACTIVE' },
  {
    order: { name: 'ASC' },
    relations: ['company'],
    pagination: { page: 1, limit: 10 },
  },
);
// Type check: result is PaginatedResult<DepartmentEntity>
```

### 3. Multi-Entity ID Projection (`onlyIds`)
```typescript
// Testing find with onlyIds: true and custom order
const ids = await departmentRepository.find(
  { status: 'ACTIVE' },
  {
    order: { createdAt: 'DESC' },
    onlyIds: true,
  },
);
// Type check: ids is string[]
```

## Running Verification Tests
Run unit tests for `@new-hros/libs-sql`:
```bash
npm test -w @new-hros/libs-sql
```
Build verification:
```bash
npm run build -w @new-hros/libs-sql
```
