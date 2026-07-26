<!--
Sync Impact Report:
- Version change: None (Initial template) -> 1.0.0
- List of modified principles:
  - [PRINCIPLE_1_NAME] -> I. Clean Architecture & Modular Domain Design
  - [PRINCIPLE_2_NAME] -> II. Strict TypeScript & Coding Conventions
  - [PRINCIPLE_3_NAME] -> III. Database, Caching, and Migration Discipline
  - [PRINCIPLE_4_NAME] -> IV. Edge-to-Edge Security & Robust Validation
  - [PRINCIPLE_5_NAME] -> V. Automated Quality Gates & Standardized Logging
- Added sections:
  - Technical Stack & Infrastructure Constraints
  - Development Workflow & Quality Gates
- Removed sections: None
- Templates requiring updates (✅ updated):
  - .specify/templates/plan-template.md (✅ aligned)
  - .specify/templates/spec-template.md (✅ aligned)
  - .specify/templates/tasks-template.md (✅ aligned)
- Follow-up TODOs: None
-->

# Enterprise HRMS Backend Constitution

## Core Principles

### I. Clean Architecture & Modular Domain Design
Every business domain MUST be isolated into a NestJS Module under `src/modules/<domain>`. Dependencies MUST flow inward: Controller (transport only, no business logic or direct repository/DB access) -> Service (business logic, orchestrations, transactions) -> Repository (database access only, extending `BaseRepository`, no business logic). Cross-module communication MUST be strictly limited to public exported Services; circular dependencies and direct internal folder imports (`entities`, `repositories`) across modules are prohibited.

### II. Strict TypeScript & Coding Conventions
All codebase files MUST compile under TypeScript `strict: true` settings (including `strictNullChecks`, `noImplicitAny`, and `strictPropertyInitialization`). The use of `any` is forbidden (use `unknown` if the shape is genuinely unknown). All exported functions, methods, and classes MUST have explicit return types. Filenames MUST use kebab-case (`<name>.<type>.ts`), one concept per file. Code names MUST follow strict suffix rules (e.g. `EmployeeService`, `create-employee.dto.ts`), and interfaces MUST not use the `I` prefix. Named exports MUST be used exclusively; default exports are banned.

### III. Database, Caching, and Migration Discipline
Database queries MUST avoid N+1 issues; looping queries (`await` in loops) are blockages. Mandatory cursor/offset pagination helper MUST be enforced for all list endpoints. Database writes requiring atomicity MUST use explicit transactions. Caching via Redis MUST be strictly limited to session data, permission sets, and slow-changing master data; caching mutable transactional data is prohibited. All cache keys MUST be namespaced with an explicit TTL. All database schema changes MUST be hand-written TypeORM migrations under `libs-sql/migrations` with corresponding `down()` functions.

### IV. Edge-to-Edge Security & Robust Validation
All input requests MUST use DTOs validated via `class-validator` and `class-transformer` at the NestJS `ValidationPipe` edge. SQL injection MUST be prevented by enforcing TypeORM parameter bindings exclusively; raw queries with interpolated/concatenated strings are forbidden. Access control MUST be managed via asymmetric JWT RS256 tokens and RBAC rules enforced by route-level `PermissionGuard` decorators. Domain code MUST throw typed exceptions extending `BaseException`, mapped to HTTP status codes in a global filter.

### V. Automated Quality Gates & Standardized Logging
All logs MUST use structured JSON format via the `AppLogger` in `libs-core`, preserving context (`requestId`, `tenantCode`) via `AsyncLocalStorage`. All code changes MUST pass local automated Husky pre-commit hooks executing ESLint and Prettier. Commits MUST strictly conform to Conventional Commits format, enforced via Commitlint, to ensure readable and clean history. Package management MUST be managed exclusively via pnpm.

## Technical Stack & Infrastructure Constraints
The approved technology stack for the project is:
- **Backend Framework**: NestJS (latest)
- **Language**: TypeScript (`strict: true`)
- **Database**: PostgreSQL (relational storage with ACID)
- **ORM**: TypeORM (repository pattern and migrations)
- **Cache**: Redis (via `libs-core` CacheManager)
- **Authentication**: JWT RS256 (asymmetric verification)
- **Validation**: `class-validator` + `class-transformer`
- **Linting & Formatting**: ESLint + Prettier
- **Git Hooks & Commit Linting**: Husky + Commitlint (Conventional Commits)
- **Package Manager**: pnpm

No other technologies, libraries, or frameworks may be introduced without first updating this constitution and obtaining approval.

## Development Workflow & Quality Gates
To ensure strict compliance with all coding rules, the following quality gates must be met:
1. **Pre-commit**: Husky hooks automatically run ESLint, Prettier, and check commit messages using Commitlint.
2. **Local/CI Validation**: `pnpm lint` and `pnpm test` must pass cleanly without warnings or errors.
3. **Pull Request Review**: All PRs must satisfy the Code Review and PR Checklists in `implemention-rules.md`, validating clean architecture layering, no `any`, no N+1 query patterns, and correct migrations.
4. **Testing Thresholds**: All new code must be accompanied by unit tests covering service logic, maintaining the project's coverage requirements.

## Governance
This constitution serves as the primary governance document and supersedes all ad-hoc conventions.
- **Compliance**: All developers and automated agents must verify compliance with this constitution for all code changes in the repository. Violations of `MUST` directives are critical blockers.
- **Amendments**: Modifying this constitution requires a formal version update. Major changes (removing/redefining principles) require a MAJOR version bump. Adding new principles or expanding rules requires a MINOR bump. Typo corrections and refinements require a PATCH bump.
- **Runtime Guidance**: Use `.specify/memory/coding-conventions.md`, `.specify/memory/implemention-rules.md`, and `.specify/memory/tech-stack.md` as binding runtime references for development.

**Version**: 1.0.0 | **Ratified**: 2026-07-26 | **Last Amended**: 2026-07-26
