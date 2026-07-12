# Tasks: Reusable API Infrastructure Options

**Input**: Design documents from `/specs/005-setup-apis-options/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/library-exports.md, quickstart.md

**Tests**: Test-driven development is required per project principles. Test tasks are written first and must fail before the corresponding implementation tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency updates

- [x] T001 Configure devDependency and peerDependency for `@nestjs/swagger` in `libs/libs-apis/package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Set up empty folders, index files, and top-level exports before writing code

- [x] T002 Create directory structure and index.ts files for `cors`, `swagger`, `versioning`, and `pagination` under `libs/libs-apis/src/`
- [x] T003 Update main index file `libs/libs-apis/src/index.ts` to export everything from the new submodules

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - CORS Configuration (Priority: P1) 🎯 MVP

**Goal**: Create reusable `createCorsOptions()` helper supporting env configuration and custom overrides.

**Independent Test**: Run CORS unit tests: `npm run test -w @new-hros/libs-apis -- tests/cors.spec.ts`

### Tests for User Story 1

- [x] T004 [P] [US1] Create unit tests for CORS options in `libs/libs-apis/tests/cors.spec.ts`

### Implementation for User Story 1

- [x] T005 [P] [US1] Implement `createCorsOptions` function in `libs/libs-apis/src/cors/cors.config.ts`
- [x] T006 [P] [US1] Export CORS options from the `cors` submodule in `libs/libs-apis/src/cors/index.ts`

**Checkpoint**: CORS Configuration is fully testable and operational.

---

## Phase 4: User Story 2 - Swagger Configuration (Priority: P1) 🎯 MVP

**Goal**: Create reusable `setupSwagger()` helper supporting title, description, and Bearer authentication.

**Independent Test**: Run Swagger setup tests: `npm run test -w @new-hros/libs-apis -- tests/swagger.spec.ts`

### Tests for User Story 2

- [x] T007 [P] [US2] Create unit/integration tests for Swagger setup in `libs/libs-apis/tests/swagger.spec.ts`

### Implementation for User Story 2

- [x] T008 [P] [US2] Define Swagger options interfaces in `libs/libs-apis/src/swagger/interfaces.ts`
- [x] T009 [US2] Implement `setupSwagger` utility in `libs/libs-apis/src/swagger/swagger.setup.ts` (depends on T008)
- [x] T010 [P] [US2] Export Swagger utility and interfaces from `swagger` submodule in `libs/libs-apis/src/swagger/index.ts`

**Checkpoint**: Swagger Configuration is fully testable and operational.

---

## Phase 5: User Story 3 - API Versioning (Priority: P2)

**Goal**: Create reusable API versioning setup utility forcing the Media Type versioning strategy.

**Independent Test**: Run versioning setup tests: `npm run test -w @new-hros/libs-apis -- tests/versioning.spec.ts`

### Tests for User Story 3

- [x] T011 [P] [US3] Create unit/integration tests for Media Type Versioning setup in `libs/libs-apis/tests/versioning.spec.ts`

### Implementation for User Story 3

- [x] T012 [P] [US3] Define Versioning options interfaces in `libs/libs-apis/src/versioning/interfaces.ts`
- [x] T013 [US3] Implement `setupVersioning` utility in `libs/libs-apis/src/versioning/versioning.setup.ts` (depends on T012)
- [x] T014 [P] [US3] Export Versioning functions and interfaces from `versioning` submodule in `libs/libs-apis/src/versioning/index.ts`

**Checkpoint**: API Versioning setup is fully testable and operational.

---

## Phase 6: User Story 4 - Pagination Utilities (Priority: P2)

**Goal**: Create pagination DTOs (with `@IsInt({ min: 0 })` validation constraints on page/limit) and calculation/formatting helpers.

**Independent Test**: Run pagination tests: `npm run test -w @new-hros/libs-apis -- tests/pagination.spec.ts`

### Tests for User Story 4

- [x] T015 [P] [US4] Create unit tests for pagination DTO validation and utility calculations in `libs/libs-apis/tests/pagination.spec.ts`

### Implementation for User Story 4

- [x] T016 [P] [US4] Implement `PaginationQueryDto`, `PaginationMetaDto`, and `PaginationResponseDto` classes in `libs/libs-apis/src/pagination/pagination.dto.ts`
- [x] T017 [US4] Implement `calculateSkip`, `createPaginationMeta`, and `createPaginationResponse` helper functions in `libs/libs-apis/src/pagination/pagination.utils.ts` (depends on T016)
- [x] T018 [P] [US4] Export pagination DTOs and utilities from `pagination` submodule in `libs/libs-apis/src/pagination/index.ts`

**Checkpoint**: Pagination utilities are fully testable and operational.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Build confirmation and end-to-end verification

- [x] T019 Run build script to compile the TypeScript library: `npm run build -w @new-hros/libs-apis`
- [x] T020 Run all library tests together to verify regression-free state: `npm run test -w @new-hros/libs-apis`
- [x] T021 Run quickstart verification scenarios described in `specs/005-setup-apis-options/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phases 3 to 6)**: All depend on Foundational phase completion.
  - User stories can then proceed in parallel or sequentially in priority order:
    - User Story 1 (CORS) and User Story 2 (Swagger) have Priority P1.
    - User Story 3 (Versioning) and User Story 4 (Pagination) have Priority P2.
- **Polish (Phase 7)**: Depends on all user stories being complete.

### User Story Dependencies

- **User Story 1 (CORS)**: Can start after Foundational (Phase 2) - No dependencies on other stories.
- **User Story 2 (Swagger)**: Can start after Foundational (Phase 2) - No dependencies on other stories.
- **User Story 3 (Versioning)**: Can start after Foundational (Phase 2) - No dependencies on other stories.
- **User Story 4 (Pagination)**: Can start after Foundational (Phase 2) - No dependencies on other stories.

### Parallel Opportunities

- All Setup and Foundational setup tasks can run in parallel where marked with `[P]`.
- Once Phase 2 is complete, User Story 1, User Story 2, User Story 3, and User Story 4 can all be developed in parallel since they don't depend on each other.
- Within each story, test tasks (`[P]`) and basic models/interfaces (`[P]`) can be written in parallel.

---

## Parallel Example: User Story 1 & 2 Development

```bash
# Developer A works on User Story 1:
# 1. Writes tests in libs/libs-apis/tests/cors.spec.ts
# 2. Implements cors.config.ts

# Developer B works on User Story 2 in parallel:
# 1. Writes tests in libs/libs-apis/tests/swagger.spec.ts
# 2. Defines interfaces in libs/libs-apis/src/swagger/interfaces.ts
# 3. Implements swagger.setup.ts
```

---

## Implementation Strategy

### MVP First (Priority P1 Stories Only)

1. Complete Phase 1 (Setup) and Phase 2 (Foundational).
2. Complete Phase 3 (User Story 1: CORS) and Phase 4 (User Story 2: Swagger).
3. **Validate MVP**: Run both `cors.spec.ts` and `swagger.spec.ts` tests.

### Incremental Delivery

1. Setup + Foundation ready.
2. Add CORS (US1) & Swagger (US2) → Validate MVP.
3. Add API Versioning (US3) → Validate.
4. Add Pagination (US4) → Validate.
5. Run full build & test verification.
