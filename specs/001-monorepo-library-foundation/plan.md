# Implementation Plan: Monorepo Library Foundation

**Branch**: `001-monorepo-library-foundation` | **Date**: 2026-07-06 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-monorepo-library-foundation/spec.md`

## Summary

Design and implement a complete NestJS platform foundation organized as a monorepo library structure. The foundation consists of `libs-core` (providing configuration, logging, cache, tracing, health, exceptions, and utilities), and three specialized feature packages (`libs-sql`, `libs-mongo`, and `libs-apis`) that depend solely on `libs-core`. This architecture isolates tenant scoping (`tenantCode`), implements local RS256 JWT signature verification by default, manages transaction propagation on the active execution context using `AsyncLocalStorage`, and abstracts logging/tracing/health interfaces for long-term pluggability.

## Technical Context

**Language/Version**: TypeScript / Node.js >= v20.0.0

**Primary Dependencies**: NestJS v10+, TypeORM, Mongoose, class-validator, class-transformer

**Storage**: PostgreSQL (via TypeORM), MongoDB (via Mongoose), Redis (via cache provider)

**Testing**: Jest, `@nestjs/testing`

**Target Platform**: Node.js containerized environment (Linux)

**Project Type**: Monorepo Shared Libraries (published/linked npm packages)

**Performance Goals**: Negligible context access overhead (<2ms latency addition), health check responses in <100ms.

**Constraints**: Strict request context isolation (zero cross-tenant data leakage), zero direct database QueryRunner exposure to application services, no network verification calls to `auth-svc` on every request.

**Scale/Scope**: Core architecture foundation supporting multiple downstream microservices in a multi-tenant SaaS HRMS.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Library-First**: Passed. All foundation layers are strictly isolated into distinct, reusable libraries under `libs/`.
- **API Interface**: Passed. Each library exports its public contract via index.ts; no internal details leak.
- **Test-First**: Passed. Unit test suites for context isolation, module factories, and error mapping are planned.
- **Observability**: Passed. `LoggerService` and `TraceService` are core platform abstractions required by all repositories and endpoints.
- **Simplicity / Extensibility**: Passed. Pluggable strategies prevent hardcoded library coupling to specific transport/auth implementations.

## Project Structure

### Documentation (this feature)

```text
specs/001-monorepo-library-foundation/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── platform-contracts.ts
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
libs/
├── libs-core/
│   ├── package.json
│   └── src/
│       ├── configuration/       # Module configuration and factory contracts
│       ├── request-context/     # RequestContextService and AsyncLocalStorage wrapper
│       ├── cache/               # CacheProvider interface and Memory/Redis implementations
│       ├── logger/              # LoggerService interface and console/OTel providers
│       ├── tracing/             # TraceService interface and correlation providers
│       ├── health/              # HealthService registry and HealthIndicator interfaces
│       ├── exceptions/          # BusinessException and platform error classes
│       ├── interfaces/          # General interfaces (AuthContext, RequestContext)
│       ├── utilities/           # Generic helpers
│       └── index.ts             # Public exports
│
├── libs-sql/
│   ├── package.json
│   └── src/
│       ├── base.repository.ts   # BaseRepository TypeORM CRUD implementation
│       ├── transaction.service.ts # TransactionService context-aware propagation
│       ├── unit-of-work.service.ts # UnitOfWork transaction manager
│       ├── sql-health.service.ts # Postgres HealthIndicator implementation
│       ├── sql-error.mapper.ts  # PostgreSQL driver exception mapping
│       ├── sql.module.ts        # Module setup and providers
│       └── index.ts
│
├── libs-mongo/
│   ├── package.json
│   └── src/
│       ├── base-mongo.repository.ts # BaseMongoRepository Mongoose CRUD implementation
│       ├── mongo-health.service.ts # MongoDB HealthIndicator implementation
│       ├── mongo-error.mapper.ts # MongoDB driver exception mapping
│       ├── plugins/             # Mongoose soft-delete, timestamps, tenant, locking
│       ├── mongo.module.ts      # Module setup
│       └── index.ts
│
└── libs-apis/
    ├── package.json
    └── src/
        ├── middleware/          # TraceMiddleware, RequestLogMiddleware
        ├── guards/              # AuthGuard, PermissionGuard, RateLimitGuard
        ├── interceptors/        # LoggingInterceptor, AuditInterceptor, TimeoutInterceptor
        ├── pipes/               # ValidationPipe, TrimPipe, SanitizePipe
        ├── decorators/          # @CurrentUser, @TenantCode, etc.
        ├── apis.module.ts       # Module setup
        └── index.ts
```

**Structure Decision**: Evolved multi-package monorepo structure. Each module resides in its own folder under `libs/` to ensure absolute decoupling, separate package files, and explicit dependency lines.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. The structure complies fully with the monorepo architecture rules.
