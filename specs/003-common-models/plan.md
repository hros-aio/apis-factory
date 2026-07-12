# Implementation Plan: Common SQL Models

**Branch**: `003-common-models` | **Date**: 2026-07-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-common-models/spec.md`

## Summary

Design and implement five common SQL entities (`Company`, `Department`, `Location`, `Grade`, `JobTitle`) in `libs-sql`. These models will extend the existing `BaseEntity` in `libs-sql` to inherit standard attributes like tenant isolation (`tenantCode` mapping to GORM's `tenant_id`), UUID primary keys, and soft deletion. They will be placed in a dedicated `common` directory within the library and exported publicly for reuse across monorepo services.

---

## Technical Context

**Language/Version**: TypeScript / Node.js >= v20.0.0

**Primary Dependencies**: TypeORM v0.3.x, PostgreSQL 15+

**Storage**: PostgreSQL

**Testing**: Jest, `@nestjs/testing`, ts-jest

**Target Platform**: Node.js containerized environment (Linux)

**Project Type**: Monorepo Shared Libraries (published/linked npm packages)

**Performance Goals**: Entity read/write database queries in <5ms.

**Constraints**: Strict multi-tenant isolation via `tenantCode`. Soft deletion mapping directly to the `deletedAt` / `isDeleted` fields in the base entity. Validation/cascade checks are shifted to the application business logic, keeping database models clean.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Library-First**: Passed. The models are implemented inside `libs-sql` as a shared core library package, not duplicated across services.
- **API Interface**: Passed. The models will be publicly exported from `libs/libs-sql/src/index.ts` to allow easy importing.
- **Test-First**: Passed. Unit tests verifying entity mappings, relations, and validation rules will be created.
- **Observability**: Passed. Standard TypeORM logging and existing database error wrapping (`sql-error.mapper.ts`) will handle operational visibility.
- **Simplicity / Extensibility**: Passed. Simple independent soft delete models without DB-level cascade delete operations, meeting the user's requirement to keep SQL simple.

---

## Project Structure

### Documentation (this feature)

```text
specs/003-common-models/
├── plan.md              # This file
├── research.md          # Technology choices and soft-delete strategy
├── data-model.md        # Entity definitions and relationships
├── quickstart.md        # Validation commands and Docker pre-reqs
├── contracts/           
│   └── common-models-contracts.md # TypeScript class contracts
└── checklists/
    └── requirements.md  # Specification Quality Checklist
```

### Source Code

The implementation will introduce the following files into the existing `libs-sql` monorepo structure:

```text
libs/
└── libs-sql/
    ├── src/
    │   ├── common/
    │   │   ├── company.entity.ts      # Company TypeORM entity
    │   │   ├── department.entity.ts   # Department TypeORM entity
    │   │   ├── location.entity.ts     # Location TypeORM entity
    │   │   ├── grade.entity.ts        # Grade TypeORM entity
    │   │   ├── job-title.entity.ts    # JobTitle TypeORM entity
    │   │   └── index.ts               # Local common exports
    │   └── index.ts                   # Export common entities (modified)
    └── tests/
        └── common/
            ├── company.entity.spec.ts # Test cases for Company entity mappings
            ├── department.entity.spec.ts
            ├── location.entity.spec.ts
            ├── grade.entity.spec.ts
            └── job-title.entity.spec.ts
```

**Structure Decision**: Place all shared database models under `libs/libs-sql/src/common/` as part of the existing shared SQL library.

---

## Complexity Tracking

No violations detected. The structure complies fully with the monorepo architecture rules.
