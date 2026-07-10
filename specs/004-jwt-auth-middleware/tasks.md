# Tasks: JWT Authentication Middleware

**Input**: Design documents from `/specs/004-jwt-auth-middleware/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Unit tests are required per specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create the directories for the auth feature under `libs/libs-apis/src/auth/`
- [x] T002 Initialize type definitions and declare the express request extension in `libs/libs-apis/src/auth/types/express-request.d.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 [P] Define the `AuthContext` interface in `libs/libs-apis/src/auth/interfaces/auth-context.interface.ts`
- [x] T004 [P] Implement `JwtService` skeleton with basic verification structure in `libs/libs-apis/src/auth/jwt.service.ts`
- [x] T005 [P] Implement `AuthMiddleware` skeleton with NestMiddleware interface structure in `libs/libs-apis/src/auth/auth.middleware.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Secure API Access with Valid JWT (Priority: P1) 🎯 MVP

**Goal**: Validate a correct Bearer JWT signed with RS256, extract `sessionId` and `tenantCode`, and attach them to the request context.

**Independent Test**: Mock a valid RS256 token and verify it correctly parses and attaches context to `req.authContent`.

### Tests for User Story 1
> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T006 [P] [US1] Write unit test cases for valid RS256 tokens in `libs/libs-apis/tests/auth.middleware.spec.ts`

### Implementation for User Story 1

- [x] T007 [US1] Implement RS256 token signature verification and claim extraction in `libs/libs-apis/src/auth/jwt.service.ts`
- [x] T008 [US1] Implement middleware request interception, header parsing, and attaching `authContent` context to the request object in `libs/libs-apis/src/auth/auth.middleware.ts`

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - Reject Unauthorized and Invalid Formats (Priority: P2)

**Goal**: Throw `UnauthorizedException` for missing headers, wrong prefixes, invalid signatures, expired tokens, or wrong algorithms.

**Independent Test**: Mock unauthorized request scenarios and verify they throw the expected `UnauthorizedException`.

### Tests for User Story 2

- [x] T009 [P] [US2] Write unit test cases for missing, expired, invalidly signed, or wrong-algorithm tokens in `libs/libs-apis/tests/auth.middleware.spec.ts`

### Implementation for User Story 2

- [x] T010 [US2] Enforce algorithm checks (`RS256` only) and verify token expiration in `libs/libs-apis/src/auth/jwt.service.ts`
- [x] T011 [US2] Validate authorization header format and throw `UnauthorizedException` when missing or invalid in `libs/libs-apis/src/auth/auth.middleware.ts`

**Checkpoint**: User Stories 1 and 2 work independently.

---

## Phase 5: User Story 3 - Reject Validly Signed JWT with Missing Context Claims (Priority: P3)

**Goal**: Throw `UnauthorizedException` if either `sessionId` or `tenantCode` claims are missing in the valid token.

**Independent Test**: Mock missing `sessionId` or `tenantCode` in a signed token and verify it throws `UnauthorizedException`.

### Tests for User Story 3

- [x] T012 [P] [US3] Write unit test cases for missing `sessionId` and `tenantCode` claims in `libs/libs-apis/tests/auth.middleware.spec.ts`

### Implementation for User Story 3

- [x] T013 [US3] Add validations for required claims (`sessionId`, `tenantCode`) in `libs/libs-apis/src/auth/jwt.service.ts`

**Checkpoint**: All user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T014 [P] Export `AuthMiddleware`, `JwtService`, and `AuthContext` from the main library entrypoint `libs/libs-apis/src/index.ts`
- [x] T015 [P] Register `JwtService` and `AuthMiddleware` in the module exports of `libs/libs-apis/src/apis.module.ts`
- [x] T016 Run quickstart validation guide scenarios in `specs/004-jwt-auth-middleware/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Models/Interfaces before services
- Services before endpoints/middleware
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch test cases for User Story 1:
Task: "Write unit test cases for valid RS256 tokens in libs/libs-apis/tests/auth.middleware.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories
