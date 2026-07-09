# Research and Design Decisions: Common SQL Models

This document details the architectural choices, alternatives considered, and design decisions for implementing the common entities in `libs-sql`.

## 1. Context and Requirements

The objective is to establish common reusable database entities for five core structures in a PostgreSQL multi-tenant database:
1. **Company**
2. **Department**
3. **Location**
4. **Grade**
5. **JobTitle**

These entities must integrate with the existing `BaseEntity` from `libs-sql`, supporting multi-tenant partitioning via `tenantCode` (mapping to the SQL schema `tenant_id` field), standard UUID primary keys, and soft deletion (`deleted_at`/`is_deleted`).

---

## 2. Core Decisions

### Decision 1: Model Placement and Exports
- **Choice**: Place all new entities under `libs/libs-sql/src/common/` and export them via `libs/libs-sql/src/index.ts`.
- **Rationale**: Keeps common reusable entities modularly separated from the base library plumbing (repositories, transactions, unit-of-work) while making them globally accessible to any consumer API importing `libs-sql`.

### Decision 2: Inheritance from `BaseEntity`
- **Choice**: All five entities will extend the existing abstract `BaseEntity` in `libs-sql/src/base.entity.ts`.
- **Rationale**: Reuses the core columns:
  - `id` (UUID Primary Key)
  - `tenantCode` (maps to database column `tenant_code` / GORM schema's `tenant_id`)
  - `createdAt`, `updatedAt`, `deletedAt` (timestamps)
  - `isDeleted` (boolean soft-delete indicator)
  - `version` (optimistic locking version column)
  - `createdBy`, `updatedBy` (audit logs)

### Decision 3: Soft-Delete Cascading Policy
- **Choice**: Soft delete is applied independently per entity at the database model level (using TypeORM `@DeleteDateColumn` and standard soft-delete queries). No database-level cascading triggers or constraints will be registered.
- **Rationale**: Direct user instruction: *"I will move validate and check in business code, keep simple in model sql."* Complex relational delete lifecycle policies will be evaluated in the application service layer.

### Decision 4: Recursive Hierarchy Implementations
- **Choice**: Implement parent-child references using TypeORM self-referencing relationships:
  - **Company**: Self-referencing `@ManyToOne` relation on `holdingId` (`holding_id`).
  - **Department**: Self-referencing `@ManyToOne` relation on `parentId` (`parent_id`).
- **Rationale**: Standard TypeORM pattern for modeling trees or adjacency lists.

---

## 3. Technology Choices & Configurations

- **ORM**: TypeORM v0.3.x (already configured in the monorepo).
- **Database Engine**: PostgreSQL 15+.
- **Database Column Types**:
  - UUIDs for all primary/foreign keys (`uuid`).
  - Timestamps with timezone for all temporal columns (`timestamptz`).
  - Varchars for codes, strings, status, etc.

---

## 4. Alternatives Considered

### Alternative A: Database-level Cascading Constraints
- **Details**: Add `ON DELETE CASCADE` or soft-delete triggers to SQL files to automatically soft-delete children when a parent is deleted.
- **Rejected because**: It introduces implicit database behavior that can be hard to track, debug, or override. Handling this in the application logic offers greater control and alignment with business rules.

### Alternative B: Storing embedded structures as JSONB
- **Details**: Storing contact info or address info as PostgreSQL JSONB columns.
- **Rejected because**: Flat columns (e.g. `address_line`, `city`, `zip_code`) allow better query performance, indexing, and strict schema validation than unstructured JSONB, matching the GORM models provided.
