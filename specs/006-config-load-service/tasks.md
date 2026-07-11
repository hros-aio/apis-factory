# Tasks: Enterprise Configuration Service

**Input**: Design documents from `/specs/006-config-load-service/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are explicitly requested in the feature specification and will follow a Test-First approach.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Register exports and update module structure in libs/libs-core/src/configuration/index.ts
- [x] T002 [P] Configure Jest and test execution environment for workspace tests in libs/libs-core/jest.config.js

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Create configuration constants and interfaces in libs/libs-core/src/configuration/configuration.constants.ts and libs/libs-core/src/configuration/configuration.interface.ts
- [x] T004 [P] Implement utility helper functions (deepMerge and key masking utility) in libs/libs-core/src/configuration/configuration.utils.ts
- [x] T005 [P] Create custom exceptions (ConfigurationNotFoundException, ConfigurationValidationException, InvalidConfigurationException) in libs/libs-core/src/configuration/configuration.constants.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Layered Configuration Loading and Merging (Priority: P1) 🎯 MVP

**Goal**: Load configuration from multiple YAML files and environment variables, merging them with correct priorities, and auto-mapping flat envs to nested paths.

**Independent Test**: Verify that the environment variable values override YAML values in the merged output.

### Tests for User Story 1
- [x] T006 [US1] Write unit tests for the configuration loader in libs/libs-core/tests/configuration.spec.ts

### Implementation for User Story 1
- [x] T007 [US1] Implement environment variable mapper to convert flat envs (standard and double-underscore) to nested configuration objects in libs/libs-core/src/configuration/configuration.loader.ts
- [x] T008 [US1] Implement YAML files discoverer and loader using js-yaml in libs/libs-core/src/configuration/configuration.loader.ts
- [x] T009 [US1] Combine file loading and environment mapping with deep merging in libs/libs-core/src/configuration/configuration.loader.ts

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Startup Schema Validation and Fail-Fast (Priority: P1)

**Goal**: Validate configuration against schemas at startup, halting application bootstrap immediately if invalid.

**Independent Test**: Assert that the process exits with status code 1 when required configurations are missing or type-mismatched.

### Tests for User Story 2
- [x] T010 [US2] Write validation tests including fail-fast assertions in libs/libs-core/tests/configuration.spec.ts

### Implementation for User Story 2
- [x] T011 [P] [US2] Create Zod schemas for app, database, redis, kafka, and jwt in libs/libs-core/src/configuration/schemas/app.schema.ts, libs/libs-core/src/configuration/schemas/database.schema.ts, libs/libs-core/src/configuration/schemas/redis.schema.ts, libs/libs-core/src/configuration/schemas/kafka.schema.ts, and libs/libs-core/src/configuration/schemas/jwt.schema.ts
- [x] T012 [US2] Integrate Zod validation and process termination upon validation failure in libs/libs-core/src/configuration/configuration.loader.ts

**Checkpoint**: At this point, User Stories 1 and 2 are functional together

---

## Phase 5: User Story 3 - Injected, Cached, and Type-Safe Configuration Access (Priority: P2)

**Goal**: Access configuration from memory cache using ConfigurationService with type safety and NestJS DI module injection.

**Independent Test**: Inject ConfigurationService in a NestJS provider, call get() with dot-notation path, and assert value retrieval.

### Tests for User Story 3
- [x] T013 [US3] Write unit/integration tests for ConfigurationService path resolution and cache access in libs/libs-core/tests/configuration.spec.ts

### Implementation for User Story 3
- [x] T014 [US3] Implement ConfigurationService containing get(), getOrThrow(), has(), all(), isProduction(), etc. with caching in libs/libs-core/src/configuration/configuration.service.ts
- [x] T015 [US3] Implement ConfigurationModule as a global-scope dynamic NestJS module in libs/libs-core/src/configuration/configuration.module.ts
- [x] T016 [US3] Export ConfigurationModule and ConfigurationService in libs/libs-core/src/index.ts

**Checkpoint**: All core features are functional and integrated with NestJS

---

## Phase 6: User Story 4 - Runtime Hot Reloading (Priority: P3)

**Goal**: Reload YAML files from disk and update in-memory cache without restarting, rollback config if reload fails validation.

**Independent Test**: Update YAML file on disk, invoke reload(), and verify subsequent get() returns updated value.

### Tests for User Story 4
- [x] T017 [US4] Write reload and validation rollback tests in libs/libs-core/tests/configuration.spec.ts

### Implementation for User Story 4
- [x] T018 [US4] Implement atomic reload() method with validation rollback in libs/libs-core/src/configuration/configuration.service.ts

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Security masking, test coverage verification, and final validation.

- [x] T019 Implement secret masking logic for startup logging in libs/libs-core/src/configuration/configuration.utils.ts
- [x] T020 [P] Run full test suite and verify coverage > 90% in libs/libs-core
- [x] T021 Execute end-to-end scenarios from specs/006-config-load-service/quickstart.md to validate setup

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - Sequential priority: Phase 3 (US1) → Phase 4 (US2) → Phase 5 (US3) → Phase 6 (US4)
- **Polish (Phase 7)**: Depends on all user story phases being complete

### Parallel Opportunities

- Setup tasks (T001, T002) can run in parallel.
- Utility setup (T004) and exception classes (T005) can run in parallel.
- All Zod schemas (T011) can be created in parallel.
- Validation testing (T010) and schema creation (T011) can run in parallel.

---

## Parallel Example: Zod Schema Design

```bash
# Define all Zod schemas concurrently:
Task: "Create app.schema.ts"
Task: "Create database.schema.ts"
Task: "Create redis.schema.ts"
Task: "Create kafka.schema.ts"
Task: "Create jwt.schema.ts"
```

---

## Implementation Strategy

### MVP Scope (User Story 1 & 2)
The MVP scope consists of Setup, Foundational infrastructure, and **User Stories 1 & 2** (Layered loading and Startup Validation). This ensures we have a fully functional config engine that fails fast at start.
- Complete Setup + Foundational
- Complete User Story 1
- Complete User Story 2
- **Stop and Validate**: Verify loading and fail-fast validation behavior via tests.
