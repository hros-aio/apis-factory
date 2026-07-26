# Implementation Plan: Event Handling Library (libs-events)

**Branch**: `007-libs-events` | **Date**: 2026-07-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-libs-events/spec.md`

## Summary

The objective is to implement a reusable, robust, and reliable event-handling library (`libs-events`) in the monorepo. This library will encapsulate connection management, event publishing, and consumer microservice transporter setup using Apache Kafka and NestJS microservices. It will provide failure resilience by implementing a non-blocking retry policy with fixed delay backoff, and automatically routing poisoned/repeatedly failing messages to a `<original-topic>.DLQ` topic after exceeding the configured `failedCount` using standard auto-commit.

## Technical Context

**Language/Version**: TypeScript 5.3+ / Node.js 20.11+

**Primary Dependencies**: NestJS (`@nestjs/common`, `@nestjs/core`, `@nestjs/microservices`), `kafkajs`, `rxjs`

**Storage**: Apache Kafka (message broker)

**Testing**: Jest, `@nestjs/testing`

**Target Platform**: Linux (Node.js runtime container)

**Project Type**: monorepo library

**Performance Goals**: Event publishing overhead <50ms; fast consumer initialization.

**Constraints**: Retries must be non-blocking on the partition (asynchronous retries), enabling subsequent messages to be processed, and failed messages must be routed to DLQ topics suffixing the original name with `.DLQ`.

**Scale/Scope**: Monorepo-wide shared library under `libs/libs-events` to be imported by all backend microservices.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Directives / Notes |
| :--- | :--- | :--- |
| **I. Clean Architecture** | Passed | Modular library structure. Only modules, services, and connection manager are exposed. |
| **II. Strict TypeScript** | Passed | Compiles under `strict: true`. Fully typed return types, explicit interfaces, no usage of `any`. |
| **III. Database & Migration** | N/A | No databases or caching are directly used in this stateless library. |
| **IV. Security & Validation** | Passed | Employs class-validator/class-transformer logic for deserializing and validating event payloads. |
| **V. Automated Quality/Logging**| Passed | Logs structured JSON through the standard monorepo `AppLogger` preserving async localStorage context. |

## Project Structure

### Documentation (this feature)

```text
specs/007-libs-events/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Decision log and research details
├── data-model.md        # Data entities and payload formats
├── quickstart.md        # Integration/Validation quickstart guide
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

The library will be added to the monorepo `libs` workspace:

```text
libs/libs-events/
├── src/
│   ├── connection/
│   │   ├── kafka-connection.manager.ts
│   │   └── kafka-connection.module.ts
│   ├── publisher/
│   │   └── event-publisher.service.ts
│   ├── transporter/
│   │   └── setup-kafka-microservice.ts
│   ├── interceptors/
│   │   └── kafka-retry.interceptor.ts
│   ├── exceptions/
│   │   └── event-processing.exception.ts
│   ├── interfaces/
│   │   ├── event-payload.interface.ts
│   │   └── events-config.interface.ts
│   ├── index.ts
│   └── events.module.ts
├── test/
│   ├── unit/
│   │   ├── event-publisher.spec.ts
│   │   └── setup-kafka-microservice.spec.ts
│   └── integration/
│       └── kafka-flow.spec.ts
├── package.json
├── tsconfig.json
├── tsconfig.lib.json
└── tsconfig.spec.json
```

**Structure Decision**: A standard NestJS monorepo sub-project workspace directory structure under `libs/libs-events`, following the pattern of existing packages like `libs-core`.

## Complexity Tracking

*No constitution violations occurred.*
