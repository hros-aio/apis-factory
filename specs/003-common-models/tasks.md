# Tasks: Common SQL Models

**Input**: Design documents from `/specs/003-common-models/`

**Prerequisites**: [plan.md](plan.md) (required), [spec.md](spec.md) (required for user stories), [research.md](research.md), [data-model.md](data-model.md), [contracts/common-models-contracts.md](contracts/common-models-contracts.md)

**Tests**: Unit tests are required to ensure correctness of entity configurations, validations, multi-tenant boundaries, and relationships in TypeORM.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Single project / Monorepo shared library**: `libs/libs-sql/src/`, `libs/libs-sql/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create common folder structure in libs/libs-sql/src/common

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Update main entrypoint to export common folder in libs/libs-sql/src/index.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Multi-Tenant Company Management (Priority: P1) 🎯 MVP

**Goal**: Implement the primary `Company` TypeORM entity with embedded contact details, status validation, and parent-subsidiary self-referential relations.

**Independent Test**: Run unit tests verifying `Company` model configurations, default values, status check constraints, and holding association.

### Tests for User Story 1
> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T003 [P] [US1] Create unit tests for Company mappings and status checks in libs/libs-sql/tests/common/company.entity.spec.ts

### Implementation for User Story 1

- [x] T004 [P] [US1] Implement Company TypeORM entity with embedded contacts and self-referencing holdingId in libs/libs-sql/src/common/company.entity.ts

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - Departmental Hierarchy Configuration (Priority: P2)

**Goal**: Implement the `Department` TypeORM entity with division flag and self-referential parent-child relations.

**Independent Test**: Run unit tests verifying `Department` model configurations, division flag defaults, and parent-child association.

### Tests for User Story 2
> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T005 [P] [US2] Create unit tests for Department parent-child and division checks in libs/libs-sql/tests/common/department.entity.spec.ts

### Implementation for User Story 2

- [x] T006 [P] [US2] Implement Department TypeORM entity with self-referencing parentId and company relation in libs/libs-sql/src/common/department.entity.ts

**Checkpoint**: User Stories 1 and 2 work independently.

---

## Phase 5: User Story 3 - Multi-Site Location Management (Priority: P3)

**Goal**: Implement the `Location` TypeORM entity with embedded address information, contact details, and location metadata.

**Independent Test**: Run unit tests verifying `Location` model configurations, embedded address layout, and company association.

### Tests for User Story 3
> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T007 [P] [US3] Create unit tests for Location address, contact, and headquarter checks in libs/libs-sql/tests/common/location.entity.spec.ts

### Implementation for User Story 3

- [x] T008 [P] [US3] Implement Location TypeORM entity with embedded address, contact, and company relation in libs/libs-sql/src/common/location.entity.ts

**Checkpoint**: User Stories 1, 2, and 3 are functional and testable.

---

## Phase 6: User Story 4 - Job Title Definition and Grading (Priority: P3)

**Goal**: Implement the `Grade` and `JobTitle` TypeORM entities, establishing correct relationships with `Company` and `Department`.

**Independent Test**: Run unit tests verifying `Grade` and `JobTitle` entity properties, codes, and their references.

### Tests for User Story 4
> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T009 [P] [US4] Create unit tests for Grade code and name checks in libs/libs-sql/tests/common/grade.entity.spec.ts
- [x] T010 [P] [US4] Create unit tests for JobTitle associations with Company, Department, and Grade in libs/libs-sql/tests/common/job-title.entity.spec.ts

### Implementation for User Story 4

- [x] T011 [P] [US4] Implement Grade TypeORM entity with company relation in libs/libs-sql/src/common/grade.entity.ts
- [x] T012 [P] [US4] Implement JobTitle TypeORM entity with company, department, and grade relations in libs/libs-sql/src/common/job-title.entity.ts

**Checkpoint**: All user stories are independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Expose entities in a common package and perform a final check of all test suites.

- [x] T013 [P] Export all entities in libs/libs-sql/src/common/index.ts
- [x] T014 Run quickstart.md validation script and check all test suites pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phases 3-6)**: Depend on Foundational phase completion. Once Phase 2 is complete, user stories can proceed in parallel or sequentially.
- **Polish (Phase 7)**: Depends on all user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 - no dependencies on other stories.
- **User Story 2 (P2)**: Can start after Phase 2.
- **User Story 3 (P3)**: Can start after Phase 2.
- **User Story 4 (P3)**: Can start after Phase 2, but depends on Department (US2) and Grade (US4). Because JobTitle depends on Grade and Department, Grade must be implemented (T011) and Department must be implemented (T006) before JobTitle (T012) is implemented.

### Parallel Opportunities

- Unit tests (T003, T005, T007, T009, T010) are parallelizable and can be written concurrently.
- Entity implementations (T004, T006, T008, T011) can run in parallel since they reside in different files.

---

## Parallel Example: User Story 1

```bash
# Launch test and entity files concurrently:
Task: "Create unit tests for Company mappings and status checks in libs/libs-sql/tests/common/company.entity.spec.ts"
Task: "Implement Company TypeORM entity in libs/libs-sql/src/common/company.entity.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. **VALIDATE**: Run company spec tests (`npm run test --prefix libs/libs-sql`).

### Incremental Delivery

1. Complete Setup + Foundational.
2. Add User Story 1 (MVP) -> Validate.
3. Add User Story 2 -> Validate.
4. Add User Story 3 -> Validate.
5. Add User Story 4 -> Validate.
6. Perform Phase 7 Polish.
