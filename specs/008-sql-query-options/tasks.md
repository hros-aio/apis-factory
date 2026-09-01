# Tasks: Generic QueryOptions in libs-sql

**Input**: Design documents from `specs/008-sql-query-options/`

**Prerequisites**: [`specs/008-sql-query-options/plan.md`](file:///home/ren0503/new-hros/api-factory/specs/008-sql-query-options/plan.md), [`specs/008-sql-query-options/spec.md`](file:///home/ren0503/new-hros/api-factory/specs/008-sql-query-options/spec.md), [`specs/008-sql-query-options/data-model.md`](file:///home/ren0503/new-hros/api-factory/specs/008-sql-query-options/data-model.md), [`specs/008-sql-query-options/contracts/base-repository.contract.md`](file:///home/ren0503/new-hros/api-factory/specs/008-sql-query-options/contracts/base-repository.contract.md)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify repository build and test pipeline baseline before making modifications

- [X] T001 Inspect `libs/libs-sql/src/base.repository.ts` and test suite dependencies in `libs/libs-sql/package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish generic interfaces in `base.repository.ts` that all query operations depend upon

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 Update `QueryOneOptions<Entity = any>` interface in `libs/libs-sql/src/base.repository.ts` to extend `FindOneOptions<Entity>` while preserving `required?: boolean`
- [X] T003 Update `QueryManyOptions<Entity = any>` interface in `libs/libs-sql/src/base.repository.ts` to extend `FindManyOptions<Entity>` while preserving `onlyIds?: boolean`, `pagination?: PaginationOptions`, `cache?: boolean`, and `withDeleted?: boolean`

**Checkpoint**: Foundation ready - generic query option interfaces are in place.

---

## Phase 3: User Story 1 - Type-Safe and Flexible Single-Entity Querying (Priority: P1) 🎯 MVP

**Goal**: Support TypeORM `FindOneOptions` (`select`, `relations`, `order`, `lock`, etc.) in `findOne` and `findById` on `BaseRepository<Entity>` with generic entity type safety and tenant isolation.

**Independent Test**: Can be tested independently by calling `findOne` and `findById` with `select`, `relations`, and `{ required: true }`, ensuring proper parameter merging and tenant scoping.

### Tests for User Story 1
- [X] T004 [P] [US1] Create unit tests for generic `QueryOneOptions<Entity>` with `findOne` and `findById` in `libs/libs-sql/tests/base.repository.spec.ts`

### Implementation for User Story 1
- [X] T005 [US1] Update `BaseRepository.findOne` method overloads and implementation in `libs/libs-sql/src/base.repository.ts` to accept `QueryOneOptions<Entity>` and forward find options with tenant scope
- [X] T006 [US1] Update `BaseRepository.findById` method overloads and implementation in `libs/libs-sql/src/base.repository.ts` to accept `QueryOneOptions<Entity>` and forward find options with tenant scope

**Checkpoint**: At this point, User Story 1 is fully functional and independently testable.

---

## Phase 4: User Story 2 - Type-Safe and Expressive Multi-Entity Querying (Priority: P1)

**Goal**: Support TypeORM `FindManyOptions` (`select`, `relations`, `order`, etc.) in `find` on `BaseRepository<Entity>` while preserving `onlyIds`, `pagination`, soft-deletes, and tenant isolation.

**Independent Test**: Can be tested by invoking `find` with `order`, `relations`, `onlyIds: true`, or `pagination` options, verifying return types and scoped queries.

### Tests for User Story 2
- [X] T007 [P] [US2] Add unit tests for generic `QueryManyOptions<Entity>` covering `find` with `relations`, `order`, `onlyIds`, and `pagination` in `libs/libs-sql/tests/base.repository.spec.ts`

### Implementation for User Story 2
- [X] T008 [US2] Update `BaseRepository.find` method overloads and implementation in `libs/libs-sql/src/base.repository.ts` to accept `QueryManyOptions<Entity>` and merge find options with tenant scope

**Checkpoint**: User Stories 1 and 2 are functional and provide complete generic query options coverage.

---

## Phase 5: User Story 3 - Backward Compatibility for Existing Repository Calls (Priority: P2)

**Goal**: Ensure existing call sites using non-parameterized options or default find methods compile and execute without breaking changes.

**Independent Test**: Run full test suites across `libs-sql` and verify building the package generates valid type definitions without breaking existing usages.

### Tests for User Story 3
- [X] T009 [P] [US3] Add backwards-compatibility regression tests in `libs/libs-sql/tests/base.repository.spec.ts` testing untyped / parameterless options usage

### Implementation for User Story 3
- [X] T010 [US3] Verify exports in `libs/libs-sql/src/index.ts` and ensure clean typescript compilation across `libs/libs-sql`

**Checkpoint**: All user stories functional with 100% backwards compatibility preserved.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, build testing, and documentation

- [X] T011 [P] Run unit test suite `npm test -w @new-hros/libs-sql` and build verification `npm run build -w @new-hros/libs-sql`
- [X] T012 Run quickstart validation scenarios from `specs/008-sql-query-options/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - starts immediately
- **Foundational (Phase 2)**: Depends on Phase 1 - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2
- **User Story 2 (Phase 4)**: Depends on Phase 2 (can run in parallel or sequentially with US1)
- **User Story 3 (Phase 5)**: Depends on US1 and US2 completion
- **Polish (Phase 6)**: Depends on all user stories being complete

### Parallel Opportunities

- T004 [US1], T007 [US2], and T009 [US3] test scaffolding can be authored in parallel
- T011 and T012 verification tasks can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1 & 2 (Setup & Foundational)
2. Implement and test User Story 1 (Single-entity generic `QueryOneOptions`)
3. Validate single-entity retrieval with relations and column selection

### Incremental Delivery
1. Extend to User Story 2 (Multi-entity generic `QueryManyOptions`)
2. Verify backwards compatibility (User Story 3)
3. Execute end-to-end build and test suite
