# Architectural Research & Decisions: Monorepo Library Foundation

This document captures the key architectural choices, evaluation of alternatives, and design decisions for the NestJS microservices platform libraries.

## 1. Request Context Propagation & Isolation

- **Decision**: Use Node.js `AsyncLocalStorage` encapsulated inside `RequestContextService` to store and propagate request-specific context (traceId, tenantCode, user, companyId).
- **Rationale**: 
  - Standard NestJS request-scoped providers (`Scope.REQUEST`) trigger a cascade where every injecting provider (repositories, services, database connections) must also become request-scoped. This introduces severe memory allocation overhead and degrades throughput under load.
  - `AsyncLocalStorage` isolates request metadata efficiently on the active execution thread without affecting dependency injection lifetimes.
- **Alternatives Considered**: 
  - **Request-scoped providers**: Rejected due to instantiation cascades and performance bottlenecks.
  - **Manual parameter passing**: Rejected because passing context headers through every service and repository method pollutes method signatures and increases risk of developer error.

## 2. Authentication Verification Strategy

- **Decision**: Define a pluggable strategy pattern contract defaulting to local RS256 JWT signature verification using a cached public key obtained from `auth-svc`.
- **Rationale**: 
  - Validating JWT signatures locally avoids network calls on every API request, reducing latency and avoiding `auth-svc` becoming a bottleneck.
  - A strategy contract allows the host application to easily swap out validation logic for OAuth2, SAML, or mock validation during local/integration testing.
- **Alternatives Considered**: 
  - **Synchronous gRPC/REST verification**: Rejected as it makes the central auth service a single point of failure and doubles API execution duration.

## 3. Database Transaction Management & Propagation

- **Decision**: Provide a `UnitOfWork` service that executes transactional blocks programmatically, propagating the active transactional database transaction scope (e.g. TypeORM `EntityManager`) via `AsyncLocalStorage`.
- **Rationale**: 
  - Business operations frequently span multiple repositories.
  - Propagating transactional scope via context ensures repositories automatically participate in the active transaction without exposing database-specific objects (like TypeORM `QueryRunner`) directly to application/domain services.
- **Alternatives Considered**: 
  - **Passing QueryRunner to repositories**: Rejected because it leaks database-specific implementation details to the business logic layer.

## 4. Multi-Tenant MongoDB Scoping

- **Decision**: Provide a Mongoose plugin that automatically intercepts read, update, and delete queries (e.g., `pre('find')`, `pre('findOne')`) to inject a `tenantCode` filter retrieved from `RequestContextService`.
- **Rationale**: 
  - Tenant data isolation is critical. Automating the filter via schema plugins guarantees data isolation at the library layer, eliminating the risk of a developer forgetting to append a tenant filter to a query.
- **Alternatives Considered**: 
  - **Manual repository scoping**: Rejected as it is highly error-prone and depends on developer vigilance.
