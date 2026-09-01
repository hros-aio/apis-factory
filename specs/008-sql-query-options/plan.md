# Implementation Plan: Generic QueryOptions in libs-sql

**Branch**: `008-sql-query-options` | **Date**: 2026-09-01 | **Spec**: [`specs/008-sql-query-options/spec.md`](file:///home/ren0503/new-hros/api-factory/specs/008-sql-query-options/spec.md)

**Input**: Feature specification from `specs/008-sql-query-options/spec.md`

## Summary

Enhance `@new-hros/libs-sql`'s `QueryOneOptions` and `QueryManyOptions` interfaces into generic types extending TypeORM's `FindOneOptions<T>` and `FindManyOptions<T>`. Update `BaseRepository<Entity>` to propagate TypeORM find options (`select`, `relations`, `order`, `lock`, etc.) while ensuring strict multi-tenant isolation and preserving framework-specific features (`required`, `onlyIds`, `pagination`).

## Technical Context

**Language/Version**: TypeScript 5.3+ (`strict: true`)

**Primary Dependencies**: `@nestjs/common`, `@nestjs/typeorm`, `typeorm` (^0.3.0), `@new-hros/libs-core`

**Storage**: PostgreSQL / TypeORM (with multi-tenant isolation)

**Testing**: Jest (`ts-jest`) unit tests

**Target Platform**: Node.js / NestJS Monorepo Library

**Project Type**: TypeScript Shared Library (`@new-hros/libs-sql`)

**Performance Goals**: Zero runtime overhead on option merging; single SQL query generation with requested relations and column projections

**Constraints**: Strict compliance with Constitution Principle II (strict typing, no `any` in application code except default generic fallbacks for backwards compatibility) and Principle III / IV (strict tenant scoping isolation)

**Scale/Scope**: `libs/libs-sql/src/base.repository.ts`, `libs/libs-sql/tests/base.repository.spec.ts`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (Clean Architecture & Modular Domain Design)**: PASS. Changes are confined to the foundation repository layer (`BaseRepository`) in `libs-sql`.
- **Principle II (Strict TypeScript & Coding Conventions)**: PASS. Full type inference with generics `<T = any>` for backwards compatibility, explicit return types on all methods, kebab-case file conventions.
- **Principle III (Database, Caching, and Migration Discipline)**: PASS. No N+1 queries introduced; enhances ability to declare joined relations directly in `find` / `findOne`.
- **Principle IV (Edge-to-Edge Security & Robust Validation)**: PASS. Tenant scoping (`applyTenantScope`) is strictly applied to all single and multi-entity queries.
- **Principle V (Automated Quality Gates & Standardized Logging)**: PASS. Verified via Jest unit tests.

## Project Structure

### Documentation (this feature)

```text
specs/008-sql-query-options/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── base-repository.contract.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
libs/libs-sql/
├── src/
│   ├── base.repository.ts     # Core implementation of QueryOneOptions, QueryManyOptions, and BaseRepository
│   ├── base.entity.ts
│   ├── pagination.ts
│   └── index.ts
└── tests/
    ├── base.repository.spec.ts # Comprehensive unit tests for generic query options
    └── sql-module.spec.ts
```

**Structure Decision**: Monorepo library component in `libs/libs-sql`.

## Complexity Tracking

*No violations.*
