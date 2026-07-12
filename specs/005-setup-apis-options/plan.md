# Implementation Plan: Reusable API Infrastructure Options

**Branch**: `005-setup-apis-options` | **Date**: 2026-07-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-setup-apis-options/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement generic, configurable, and production-ready modules and helper functions in `@new-hros/libs-apis` to establish a reusable API infrastructure across all microservices in the NestJS monorepo. This covers CORS configuration, Swagger setups with Bearer authentication support, Media Type API versioning, and standardized Pagination utilities (DTOs, helpers, and schemas) compatible with NestJS v11.

## Technical Context

**Language/Version**: TypeScript / Node.js (v18+)

**Primary Dependencies**: `@nestjs/common`, `@nestjs/core`, `@nestjs/swagger`, `class-validator`, `class-transformer`

**Storage**: N/A (shared library, memory/calculations only)

**Testing**: Jest (`jest`, `ts-jest`) matching current repository conventions

**Target Platform**: Node.js microservices

**Project Type**: NestJS monorepo shared library (`@new-hros/libs-apis`)

**Performance Goals**: Zero-overhead calculations; minimal initialization footprint; under 5ms execution for mapping utilities

**Constraints**:
- Fully generic & configurable (avoid environment assumptions inside modules; utilize parameter overrides).
- Strict query validation rules (`@IsInt({ min: 0 })`) for `page` and `limit` pagination parameters.
- Default to secure defaults: Swagger is hidden, and CORS is restricted to same-origin if configuration is missing.
- Forced `MediaTypeVersioning` strategy for versioning setup.

**Scale/Scope**: Reusable utilities for the entire API monorepo layer.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Gate 1: Library-First (Modular design)**: All utilities must reside inside `libs/libs-apis/src` and must be decoupled from specific microservice business logic. (Passed)
- **Gate 2: Expose via Index**: All public classes, utilities, and interfaces must be exported in `libs/libs-apis/src/index.ts`. (Passed)
- **Gate 3: Test-Driven Validation**: Standardized test specifications must be placed under `libs/libs-apis/tests` and run on mock NestJS applications to verify integration behaviors (e.g. versioning routing, Swagger page mounting). (Passed)

## Project Structure

### Documentation (this feature)

```text
specs/005-setup-apis-options/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/
│   └── library-exports.md # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
libs/libs-apis/src/
├── cors/
│   ├── cors.config.ts        # createCorsOptions implementation
│   └── index.ts
├── swagger/
│   ├── swagger.setup.ts      # setupSwagger utility
│   ├── interfaces.ts         # SwaggerSetupOptions interface
│   └── index.ts
├── versioning/
│   ├── versioning.setup.ts   # setupVersioning utility
│   ├── interfaces.ts         # VersioningSetupOptions interface
│   └── index.ts
├── pagination/
│   ├── pagination.dto.ts     # PaginationQueryDto, PaginationMetaDto, PaginationResponseDto
│   ├── pagination.utils.ts   # calculateSkip, createPaginationMeta, createPaginationResponse
│   └── index.ts
├── index.ts                  # Public library exports aggregator
└── apis.module.ts

libs/libs-apis/tests/
├── cors.spec.ts              # Unit tests for createCorsOptions
├── swagger.spec.ts           # Unit/Integration tests for setupSwagger
├── versioning.spec.ts        # Unit/Integration tests for Media Type versioning
└── pagination.spec.ts        # Unit tests for pagination DTO validation and calculation helpers
```

**Structure Decision**: Monorepo shared library structure inside the existing `libs/libs-apis` project. We extend the project structure to include dedicated folders for each module (`cors`, `swagger`, `versioning`, `pagination`), following the project's standard structure.

## Complexity Tracking

*No current constitution check violations or complexity issues detected.*
