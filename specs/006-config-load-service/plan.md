# Implementation Plan: Enterprise Configuration Service

**Branch**: `006-config-load-service` | **Date**: 2026-07-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-config-load-service/spec.md`

---

## Summary

Implement a reusable, schema-validated, and layered configuration module inside the NestJS shared core library (`@new-hros/libs-core`). This module loads configuration from YAML files and environment variables, maps flat environment variables into nested fields automatically, caches the parsed results in memory, and exposes a singleton `ConfigurationService` that validates inputs at startup using Zod schemas. If configuration validation fails, the application stops immediately to prevent misconfigured deploys.

---

## Technical Context

**Language/Version**: TypeScript / Node.js (v20+)

**Primary Dependencies**: `@nestjs/common`, `@nestjs/core`, `zod`, `js-yaml`

**Storage**: N/A (shared core configuration layer in memory only)

**Testing**: Jest (`jest`, `ts-jest`) matching current repository conventions

**Target Platform**: Node.js microservices / NestJS Monorepo

**Project Type**: Reusable monorepo core library (`@new-hros/libs-core`)

**Performance Goals**:
- Zero-overhead in-memory config retrieval.
- File loading and parsing executes exactly once during startup (unless hot-reloaded explicitly).
- Under 2ms lookup overhead for nested path resolution (e.g. `database.host`).

**Constraints**:
- Deep merge must properly overwrite default values and YAML inputs with environment variables without deleting other properties in nested objects.
- Environment variables must automatically map to nested keys (e.g. `JWT_PRIVATE_KEY` → `jwt.privateKey`).
- Application MUST exit immediately with exit code `1` if validation fails during bootstrap, listing all validation errors.
- Secrets must be automatically masked in startup configuration logs.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Gate 1: Library-First**: The configuration service is modular and fully contained inside `@new-hros/libs-core/src/configuration`. (Passed)
- **Gate 2: Expose via Index**: All public classes, utilities, interfaces, and exceptions must be exported via `libs/libs-core/src/configuration/index.ts` and aggregate in `libs/libs-core/src/index.ts`. (Passed)
- **Gate 3: Test-Driven Validation**: Standardized Jest tests must be placed under `libs/libs-core/tests/` to verify loading, merging, validation, and hot reload. (Passed)

---

## Project Structure

### Documentation (this feature)

```text
specs/006-config-load-service/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/
│   └── service-api.md   # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (libs-core directory)

```text
libs/libs-core/src/configuration/
├── schemas/
│   ├── app.schema.ts            # Zod validation schema for app settings
│   ├── database.schema.ts       # Zod validation schema for database connection
│   ├── redis.schema.ts          # Zod validation schema for Redis settings
│   ├── kafka.schema.ts          # Zod validation schema for Kafka brokers
│   └── jwt.schema.ts            # Zod validation schema for JWT keys
├── configuration.module.ts      # Global NestJS ConfigurationModule definition
├── configuration.service.ts     # ConfigurationService containing get(), getOrThrow(), reload(), etc.
├── configuration.loader.ts      # YAML loader, environment variable mapper, and deep merger
├── configuration.interface.ts   # Configuration, AppConfiguration, DatabaseConfiguration, etc.
├── configuration.types.ts       # Helper typescript types
├── configuration.constants.ts   # Configuration token names, default paths
├── configuration.utils.ts       # deepMerge and key masking utility functions
└── index.ts                     # Aggregates exports for configuration module

libs/libs-core/tests/
└── configuration.spec.ts        # Unit and integration tests for Configuration service
```

**Structure Decision**: Add a dedicated package subdirectory `src/configuration/` to the existing NestJS workspace library `libs-core`. Tests are placed under `libs/libs-core/tests/` with filename `configuration.spec.ts`.

---

## Complexity Tracking

*No current constitution check violations or complexity issues detected.*
