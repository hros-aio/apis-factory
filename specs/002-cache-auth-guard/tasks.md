# Tasks: Two-Level Cache Foundation and Reusable Auth Guard

**Input**: Design documents from `/specs/002-cache-auth-guard/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Unit tests are required as specified below.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Paths are relative to the monorepo root (e.g., `libs/libs-core/...`, `libs/libs-apis/...`).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create caching directory structure inside libs-core package at libs/libs-core/src/cache
- [x] T002 Configure ioredis dependency in libs/libs-core/package.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core caching infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Define CacheModuleOptions configuration schema in libs/libs-core/src/cache/interfaces/cache-options.interface.ts
- [x] T004 Define ICacheProvider internal interface in libs/libs-core/src/cache/interfaces/cache-provider.interface.ts
- [x] T005 Implement L1 MemoryCacheProvider in libs/libs-core/src/cache/memory-cache.provider.ts
- [x] T006 Implement L2 RedisCacheProvider in libs/libs-core/src/cache/redis-cache.provider.ts
- [x] T007 Implement CacheService orchestrator coordinating L1 and L2 logic in libs/libs-core/src/cache/cache.service.ts
- [x] T008 Implement dynamic CacheModule using provider registry in libs/libs-core/src/cache/cache.module.ts
- [x] T009 Export CacheModule, CacheService, and options in libs/libs-core/src/index.ts
- [x] T010 Write unit tests for CacheService covering get, set, has, del, and flush operations in libs/libs-core/tests/cache.service.spec.ts

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Fast and Efficient API Call Performance (Priority: P1) 🎯 MVP

**Goal**: Deliver the basic CacheService two-level caching functionality, validating serialization/deserialization.

**Independent Test**: Verify that L1-first, L2-fallback, L1-hydration works via the CacheService unit tests.

### Implementation for User Story 1

- [x] T011 [US1] Define cache namespace constants and keys in libs/libs-core/src/cache/cache.constants.ts

**Checkpoint**: At this point, User Story 1 is fully functional and testable.

---

## Phase 4: User Story 2 - Secure Multi-Tenant Request Guarding (Priority: P1)

**Goal**: Protect endpoints with reusable AuthGuard, checking cached session and attaching UserContext.

**Independent Test**: Verify that request calls with valid/invalid/missing tokens and cached states are correctly processed or blocked.

### Implementation for User Story 2

- [x] T012 [P] [US2] Define Auth request user interfaces in libs/libs-apis/src/interfaces/auth.interface.ts
- [x] T013 [US2] Implement AuthGuard with JWT signature checks and cache state verification in libs/libs-apis/src/guards/auth.guard.ts
- [x] T014 [US2] Implement CurrentUser custom decorator in libs/libs-apis/src/decorators/current-user.decorator.ts
- [x] T015 [US2] Export AuthGuard and CurrentUser decorator in libs/libs-apis/src/index.ts
- [x] T016 [US2] Write unit tests for AuthGuard covering token parsing, verification, and caching checks in libs/libs-apis/tests/auth.guard.spec.ts

**Checkpoint**: User Stories 1 and 2 are fully functional and integrated.

---

## Phase 5: User Story 3 - Multi-Session Support & Seamless Logout (Priority: P2)

**Goal**: Provide examples for multi-session login/logout flow for downstream microservices.

**Independent Test**: Verify README integration examples cover all required logout and session-mapping scenarios.

### Implementation for User Story 3

- [x] T017 [US3] Create integration examples and documentation for auth-svc login and logout flow in libs/libs-apis/README.md

**Checkpoint**: All user stories are complete and documented.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, formatting, documentation, and final system integration validation.

- [x] T018 Update root documentation with cache and authentication usage guidelines in README.md
- [x] T019 Run full test suite and clean builds across all monorepo packages using npm run test and npm run build

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion. Blocks User Stories.
- **User Stories (Phases 3-5)**: Depend on Foundational completion.
- **Polish (Phase 6)**: Depends on all user stories completion.

### Parallel Opportunities

- Within **Phase 4**: T012 can run in parallel with other setup tasks.
- Once Phase 2 is complete, User Story 1 (Phase 3) and User Story 2 (Phase 4) could be developed in parallel, though US2 will depend on US1's cache exports.

---

## Parallel Example: User Story 2

```bash
# Define types and interfaces in parallel
Task: "Define Auth request user interfaces in libs/libs-apis/src/interfaces/auth.interface.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (Cache Service Core)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Run CacheService unit tests.

### Incremental Delivery

1. Complete Setup + Foundational Cache → Cache Foundation ready
2. Complete User Story 1 → Dynamic Cache Namespaces ready (MVP!)
3. Complete User Story 2 → Guarding & Decorators ready
4. Complete User Story 3 → Auth Service Integration guide ready
5. Run final verification checks.
