# Tasks: Event Handling Library (libs-events)

**Input**: Design documents from `/specs/007-libs-events/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Included as requested by the integration testing scenarios defined in the feature spec and quickstart.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Paths are relative to the monorepo root (e.g. `libs/libs-events/src/`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create directory structure for the library under `libs/libs-events/src/` and `libs/libs-events/test/`
- [X] T002 Initialize `libs/libs-events/package.json` with Kafka and NestJS microservices dependencies
- [X] T003 [P] Configure TypeScript configurations in `libs/libs-events/tsconfig.json`, `libs/libs-events/tsconfig.lib.json`, and `libs/libs-events/tsconfig.spec.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Implement centralized connection manager in `libs/libs-events/src/connection/kafka-connection.manager.ts`
- [X] T005 [P] Implement connection module in `libs/libs-events/src/connection/kafka-connection.module.ts`
- [X] T006 [P] Define core interface and configuration models in `libs/libs-events/src/interfaces/events-config.interface.ts` and `libs/libs-events/src/interfaces/event-payload.interface.ts`
- [X] T007 Implement main entry module `libs/libs-events/src/events.module.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Reliable Event Publishing (Priority: P1) 🎯 MVP

**Goal**: Allow services to publish domain events wrapped in EventEnvelope to Kafka.

**Independent Test**: Verify that a test event payload published via the EventPublisher is written to the Kafka broker topic.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T008 [P] [US1] Create unit tests for publisher in `libs/libs-events/test/unit/event-publisher.spec.ts`

### Implementation for User Story 1

- [X] T009 [US1] Implement custom exceptions in `libs/libs-events/src/exceptions/event-processing.exception.ts`
- [X] T010 [US1] Implement the publishing service in `libs/libs-events/src/publisher/event-publisher.service.ts`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Automated Event Subscription via `@EventPattern` (Priority: P1)

**Goal**: Allow microservices to subscribe to topics using native NestJS `@EventPattern` decorators via an application-level microservice bootstrapper.

**Independent Test**: Connect a test controller decorated with `@EventPattern` using the bootstrapper and verify it triggers on published events.

### Tests for User Story 2

- [X] T011 [P] [US2] Create unit tests for microservice bootstrapper in `libs/libs-events/test/unit/setup-kafka-microservice.spec.ts`

### Implementation for User Story 2

- [X] T012 [US2] Implement the `setupKafkaMicroservice` helper function in `libs/libs-events/src/transporter/setup-kafka-microservice.ts`
- [X] T013 [US2] Create end-to-end integration test in `libs/libs-events/test/integration/kafka-flow.spec.ts` mapping basic pub/sub functionality

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - Resilient Event Processing and DLQ Fallback (Priority: P2)

**Goal**: Support non-blocking retry configuration and automatic routing of poisoned messages to DLQ topic suffixing original name with `.DLQ`.

**Independent Test**: Throw an exception from an event pattern handler and verify retries occur before routing the message to the DLQ topic non-blockingly.

### Tests for User Story 3

- [X] T014 [P] [US3] Create unit/mock tests for retry interceptor in `libs/libs-events/test/unit/kafka-retry.interceptor.spec.ts`

### Implementation for User Story 3

- [X] T015 [US3] Implement the global interceptor in `libs/libs-events/src/interceptors/kafka-retry.interceptor.ts`
- [X] T016 [US3] Wire the global interceptor registration inside `setupKafkaMicroservice` in `libs/libs-events/src/transporter/setup-kafka-microservice.ts`
- [X] T017 [US3] Create integration test in `libs/libs-events/test/integration/dlq-retry.spec.ts` verifying non-blocking retries and DLQ routing

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T018 Export public elements in `libs/libs-events/src/index.ts`
- [X] T019 [P] Create developer readme file in `libs/libs-events/README.md`
- [X] T020 Run the entire test suite locally to verify tests pass cleanly
- [X] T021 Execute validation scenarios outlined in `specs/007-libs-events/quickstart.md` using local broker setup

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
  - User Story 1 (Publishing) and User Story 2 (Subscription) are both P1 and can proceed in parallel once Foundation is complete.
  - User Story 3 (Retry/DLQ) integrates retry behavior on top of Subscription routing, depending on User Story 2 completion.
- **Polish (Final Phase)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories.
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories.
- **User Story 3 (P3)**: Depends on User Story 2 (transporter wrapper must exist to attach retry interceptor).

---

## Parallel Example: User Stories 1 and 2

```bash
# Developers A and B can work in parallel after Phase 2 is complete:
Developer A: "Implement EventPublisher service in libs/libs-events/src/publisher/event-publisher.service.ts"
Developer B: "Implement setupKafkaMicroservice bootstrapper in libs/libs-events/src/transporter/setup-kafka-microservice.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 & 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3 & 4: User Story 1 & 2
4. **STOP and VALIDATE**: Test basic publisher and subscriber flow independently (using `kafka-flow.spec.ts`)
5. Validate MVP is fully operational

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 & 2 → Test basic pub/sub flow → MVP operational
3. Add User Story 3 → Attach interceptor → Test retries & DLQ routing
