# API Factory - Monorepo Library Foundation

A modular NestJS foundation platform for multi-tenant microservices in a SaaS HRMS.

## Project Structure

This monorepo uses npm workspaces to manage the following shared libraries:

- **[@new-hros/libs-core](file:///home/ren0503/new-hros/api-factory/libs/libs-core)**: Core utilities, request context isolation (`AsyncLocalStorage`), caching, logging, tracing, health check registry, and business exceptions.
- **[@new-hros/libs-sql](file:///home/ren0503/new-hros/api-factory/libs/libs-sql)**: PostgreSQL engine integration using TypeORM, context-aware transaction propagation, and a `UnitOfWork` manager.
- **[@new-hros/libs-mongo](file:///home/ren0503/new-hros/api-factory/libs/libs-mongo)**: MongoDB integration using Mongoose, featuring auto-tenant scoping, soft-delete, and concurrency control plugins.
- **[@new-hros/libs-apis](file:///home/ren0503/new-hros/api-factory/libs/libs-apis)**: Shared HTTP/API components including authentication guards (RS256 JWT), rate limiting, middleware, interceptors, and custom decorators.

## Quick Start

### Installation

Install dependencies from the root directory:

```bash
npm install
```

### Build

Compile all libraries in dependency order:

```bash
npm run build
```

### Testing

Run test suites for all workspaces:

```bash
npm run test
```

## Additional Documentation

Detailed design specifications, data models, and scenario verification guides can be found in the [specs directory](file:///home/ren0503/new-hros/api-factory/specs/001-monorepo-library-foundation):

- [Implementation Plan](file:///home/ren0503/new-hros/api-factory/specs/001-monorepo-library-foundation/plan.md)
- [Quickstart & Verification Guide](file:///home/ren0503/new-hros/api-factory/specs/001-monorepo-library-foundation/quickstart.md)
- [Feature Specification](file:///home/ren0503/new-hros/api-factory/specs/001-monorepo-library-foundation/spec.md)
