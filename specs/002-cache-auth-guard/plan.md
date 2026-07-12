# Implementation Plan: Two-Level Cache Foundation and Reusable Auth Guard

**Branch**: `002-cache-auth-guard` | **Date**: 2026-07-07 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-cache-auth-guard/spec.md`

## Summary

Design and implement a reusable two-level cache foundation (`CacheModule` and `CacheService`) in `libs-core` and a reusable request authentication guard (`AuthGuard` and `@CurrentUser()` decorator) in `libs-apis`.

The `CacheService` orchestrates calls between a fast local in-memory L1 cache (custom Map implementation with lazy and scheduled TTL eviction) and a distributed L2 cache (Redis via `ioredis`). Read operations check L1 first, fall back to L2, and hydrate L1 on L2 hits. Write/delete/flush operations propagate to both levels.

The `AuthGuard` extracts Bearer JWT tokens, performs RS256 signature verification locally, retrieves user session state from the `CacheService` using the key `auth:session:{sessionId}`, and attaches the authenticated user context to the request.

---

## Technical Context

**Language/Version**: TypeScript / Node.js >= v20.0.0

**Primary Dependencies**: NestJS v10+, ioredis v5+, jsonwebtoken v9+, ts-jest, jest

**Storage**: Redis (via ioredis)

**Testing**: Jest, `@nestjs/testing`

**Target Platform**: Node.js containerized environment (Linux)

**Project Type**: Monorepo Shared Libraries (published/linked npm packages)

**Performance Goals**: L1 cache reads in <2ms, AuthGuard authorization validation in <5ms.

**Constraints**: Local signature verification without external auth-svc roundtrips, strict multi-tenant context isolation, dynamic/injectable Redis connection.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Library-First**: Passed. Caching belongs to `libs-core`; auth gating belongs to `libs-apis`.
- **API Interface**: Passed. Public exports are cleanly exposed via each library's `index.ts`.
- **Test-First**: Passed. Unit tests verifying L1/L2 orchestration and AuthGuard validation will be created.
- **Observability**: Passed. Logs are generated for Redis errors and guard validation failures.
- **Simplicity / Extensibility**: Passed. Leverages standard NestJS patterns (modules, guards, dynamic providers) without over-engineering custom wrappers.

---

## Project Structure

### Documentation (this feature)

```text
specs/002-cache-auth-guard/
├── plan.md              # This file
├── research.md          # Technology choices and L1/L2 strategy
├── data-model.md        # SessionState and UserContext structures
├── quickstart.md        # Validation commands and Docker pre-reqs
└── contracts/           
    └── cache-auth-contracts.md # TypeScript interfaces and models
```

### Source Code

The implementation will introduce the following files into the existing monorepo structure:

```text
libs/
├── libs-core/
│   └── src/
│       ├── cache/
│       │   ├── cache.module.ts          # Dynamic NestJS CacheModule
│       │   ├── cache.service.ts         # Two-level cache coordinator
│       │   ├── cache.constants.ts       # Provider tokens and namespaces
│       │   ├── memory-cache.provider.ts # L1 In-Memory implementation
│       │   ├── redis-cache.provider.ts  # L2 Redis client implementation
│       │   └── interfaces/
│       │       ├── cache-provider.interface.ts # Internal provider contract
│       │       └── cache-options.interface.ts  # Module injection options
│       └── index.ts                     # Export CacheModule & CacheService
│
└── libs-apis/
    └── src/
        ├── guards/
        │   └── auth.guard.ts            # Reusable AuthGuard
        ├── decorators/
        │   └── current-user.decorator.ts # Custom CurrentUser decorator
        └── index.ts                     # Export AuthGuard & CurrentUser
```

**Structure Decision**: Fully integrated package extensions. Caching logic is encapsulated under a new `cache` directory in `libs-core`. Authentication logic resides under new `guards` and `decorators` directories in `libs-apis`.

---

## Complexity Tracking

No violations detected. The structure complies fully with the monorepo architecture rules.
