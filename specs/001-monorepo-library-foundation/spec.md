# Feature Specification: Monorepo Library Foundation

**Feature Branch**: `001-monorepo-library-foundation`

**Created**: 2026-07-06

**Status**: Draft

**Input**: User description: "Design and implement a reusable monorepo library foundation for NestJS microservices. Create three main libraries: libs-sql (PostgreSQL/TypeORM), libs-mongo (MongoDB/Mongoose), libs-apis (HTTP/API platform layer)."

## Architecture Overview

The NestJS platform foundation is organized as a monorepo library structure:

```
libs/
├── libs-core
│   ├── configuration
│   ├── request-context
│   ├── cache
│   ├── logger
│   ├── tracing
│   ├── health
│   ├── exceptions
│   ├── interfaces
│   └── utilities
│
├── libs-sql
│
├── libs-mongo
│
├── libs-apis
│
└── libs-auth (future extension)
```

### Dependency Rules:
- `libs-core` provides common infrastructure used by every other library.
- `libs-sql`, `libs-mongo`, and `libs-apis` must depend only on `libs-core`.
- They must never depend on each other.
- `libs-auth` is intentionally planned as a future platform library and is outside the scope of this specification.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - SQL Database Integration Layer for Service Development (Priority: P1)

Internal service developers need a reliable, standard way to connect to PostgreSQL with multi-tenancy, health check integration, automatic transaction handling, and pagination, so that they do not repeatedly implement boilerplate database integration code.

**Why this priority**: High priority as PostgreSQL is the primary transactional store for core HRMS SaaS features.

**Independent Test**: A developer can import the SQL module asynchronously, inject the transaction service, use the BaseRepository to query paginated records, and map errors correctly.

**Acceptance Scenarios**:

1. **Given** a NestJS microservice configuring `SqlModule.forRootAsync`, **When** the database service boots up, **Then** it must connect successfully to PostgreSQL and register the connection health indicator.
2. **Given** a database query executed through a repository extending `BaseRepository`, **When** querying with pagination parameters, **Then** it must return a paginated object containing results, total count, page, and limit metadata.
3. **Given** a PostgreSQL unique constraint violation error occurs during an insert, **When** caught by the library's error mapper, **Then** it must map to a standardized conflict domain exception.

---

### User Story 2 - MongoDB Integration Layer for Flexible Document Storage (Priority: P2)

Internal service developers need a standardized way to connect to MongoDB, support multi-tenancy, soft deletion, automatic timestamp tracking, and pagination, so they can handle semi-structured data consistently.

**Why this priority**: Medium priority as MongoDB is used for audit trails, document storage, and flexible HR profile forms, which are secondary to the core SQL transactional database.

**Independent Test**: A service developer can import the Mongo module, perform soft deletes on documents, filter by tenant context automatically, and verify timestamp presence.

**Acceptance Scenarios**:

1. **Given** a Mongoose model schema, **When** saving a document, **Then** the timestamp and tenant plugins must automatically inject the creation/update timestamps and the active tenant identifier.
2. **Given** an active document in a tenant collection, **When** a delete operation is triggered on a soft-delete repository, **Then** the document must not be physically removed but rather marked as deleted and excluded from subsequent default queries.

---

### User Story 3 - API Platform Layer for Standardized Request Context, Auditing, and Security (Priority: P1)

Every NestJS microservice needs standardized request context isolation, request tracing, auditing logs, authorization guards, and global error handling to guarantee compliance, security, and service stability.

**Why this priority**: High priority as security, auditing, and observability are non-negotiable for multi-tenant enterprise HRMS SaaS systems.

**Independent Test**: A microservice receives an HTTP request and must propagate the request tracing ID, current user, tenant, and request context via AsyncLocalStorage.

**Acceptance Scenarios**:

1. **Given** an HTTP request to a protected endpoint, **When** processed by the gateway/middleware, **Then** a unique request trace ID must be generated, and the user's tenant context must be loaded into AsyncLocalStorage.
2. **Given** an API endpoint decorated with `@RequirePermission('employee:read')`, **When** an authenticated user without this permission requests it, **Then** the API must return a forbidden response.
3. **Given** an HTTP endpoint, **When** a request rate threshold is exceeded, **Then** the request must be blocked, returning a rate limit error.

---

### Edge Cases

- **Trace Propagation Failure**: If an incoming request does not have a trace ID or correlation headers, the system must generate one at the entry point and propagate it throughout the request execution context.
- **Tenant Context Leaks**: If multiple concurrent requests are processed, the AsyncLocalStorage must ensure strict isolation so that Tenant A cannot access Tenant B's data or request context.
- **Database Connection Dropout**: If the PostgreSQL or MongoDB database connection drops, the SqlHealthService/MongoHealthService must immediately report unhealthy status, prompting load balancers to route requests away.
- **Mismatched Authentication Strategy**: The libraries define an authentication strategy contract that is registered by the host application. A built-in default strategy performs local RS256 JWT verification using the auth-svc public key, extracts userId, sessionId, tenantCode, roles, and scopes, and attaches an AuthContext to the RequestContext. Auth-svc must not be called for every request. Calls to auth-svc are permitted only for permission cache misses, session revocation validation, token revocation checks, or when explicitly enabled by the host authentication strategy.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: **SqlModule Config**: System MUST support synchronous (`forRoot`) and asynchronous (`forRootAsync`) configuration factory patterns for TypeORM database connection options.
- **FR-002**: **Base SQL Repository**: System MUST provide a generic `BaseRepository` that handles common CRUD, pagination, and transactional scope injection.
- **FR-003**: **SQL Transactions**: System MUST provide a `TransactionService` that manages TypeORM transactions programmatically across multiple repositories.
- **FR-004**: **SQL Observability**: System MUST provide a `SqlHealthService` that integrates with NestJS health checks to verify PostgreSQL connection.
- **FR-005**: **SQL Error Mapper**: System MUST provide a PostgreSQL error mapper to transform database-specific exceptions (e.g., unique key violation, foreign key violation) into standardized NestJS exceptions.
- **FR-006**: **MongoModule Config**: System MUST support synchronous (`forRoot`) and asynchronous (`forRootAsync`) configuration for Mongoose database connections.
- **FR-007**: **Base Mongo Repository**: System MUST provide a `BaseMongoRepository` abstraction with pagination helpers.
- **FR-008**: **Mongo Plugins**: System MUST include Mongoose plugins for automatic timestamps, soft deletion, and automatic tenant-based filtering.
- **FR-009**: **Mongo Observability**: System MUST provide a `MongoHealthService` to verify MongoDB connection health.
- **FR-010**: **Mongo Error Mapper**: System MUST provide a MongoDB error mapper to transform driver-specific exceptions.
- **FR-011**: **ApisModule Config**: System MUST support synchronous and asynchronous registration for the HTTP/API layer options.
- **FR-012**: **Trace & Request Logging Middleware**: System MUST generate and propagate a unique trace ID per request and log incoming request/response metadata.
- **FR-013**: **Async Request Context**: System MUST use Node.js `AsyncLocalStorage` to store, isolate, and provide access to the current RequestContext, Tenant, and User.
- **FR-014**: **Security Guards**: System MUST provide `AuthGuard`/`AuthMiddleware` to authenticate requests and `PermissionGuard` to enforce roles and permissions.
- **FR-015**: **Rate Limiting**: System MUST provide a `RateLimitGuard` or middleware to prevent API abuse based on IP or client identifier.
- **FR-016**: **Global Exception Filter**: System MUST intercept all unhandled exceptions and format them into a consistent JSON response.
- **FR-017**: **API Decorators**: System MUST export decorators `@CurrentUser`, `@Tenant`, `@RequestContext`, `@RequirePermission`, and `@Public` to simplify controller routing logic.
- **FR-018**: **Authentication Strategy Contract**: The system MUST define a pluggable authentication strategy contract. The default implementation MUST verify RS256 JWT locally using the auth-svc public key, extract userId, sessionId, tenantCode, roles, and scopes, populate AuthContext and RequestContext, and avoid calling auth-svc on every request. The host application must be able to replace this strategy with a custom implementation (SSO, external IdP, testing, etc.).
- **FR-019**: **Tenant Identifier Standardization**: The system MUST use `tenantCode` as the canonical tenant identifier across RequestContext, AuthContext, BaseEntity, BaseDocument, middleware, guards, repositories, and decorators.
- **FR-020**: **Configuration Provider**: The platform MUST expose strongly typed configuration providers that integrate with NestJS ConfigModule and support dependency injection. Every library must support `forRoot()` and `forRootAsync()`.
- **FR-021**: **Resource Lifecycle**: Every managed resource must support proper initialization and graceful shutdown through NestJS lifecycle hooks including `OnModuleInit`, `OnApplicationShutdown`, and `BeforeApplicationShutdown`. Database connections, Mongo connections, loggers and tracing providers must be properly disposed.
- **FR-022**: **Cache Provider**: The platform MUST define a `CacheProvider` abstraction supporting multiple implementations (e.g., Memory, Redis, Hybrid Memory + Redis). Permission cache, decision cache and rate limiter must consume this cache provider abstraction rather than Redis directly.
- **FR-023**: **Unit Of Work**: Provide a `UnitOfWork` service that executes business operations inside a managed SQL transaction. Repositories should not expose `QueryRunner` directly to application services.
- **FR-024**: **RequestContext Service**: The platform MUST expose a `RequestContextService` that acts as the exclusive accessor for the underlying AsyncLocalStorage request context. Required APIs include: `current()`, `getTraceId()`, `getRequestId()`, `getTenantCode()`, `getUser()`, and `getAuthContext()`. Business code must never access `AsyncLocalStorage` directly.
- **FR-025**: **Transaction Context propagation**: `TransactionService` must support transaction propagation across repositories, with transaction contexts propagated through AsyncLocalStorage or an equivalent context propagation mechanism. Nested services participating in the same business transaction must reuse the same transaction context.
- **FR-026**: **Mongo Optimistic Locking and Versioning**: Mongoose plugins must support configurable optimistic locking, automatic version field management (`version`/`__v`), and tracking of `createdBy` and `updatedBy` user metadata in addition to standard timestamps, soft deletion, and tenant filtering.
- **FR-027**: **API Interceptors**: The platform MUST provide reusable interceptors (e.g., `LoggingInterceptor`, `AuditInterceptor`, `TimeoutInterceptor`, `MetricsInterceptor`) that integrate with `RequestContextService`.
- **FR-028**: **API Pipes**: The platform MUST provide reusable validation and sanitization pipes (e.g., `ValidationPipe`, `TrimPipe`, `SanitizePipe`) configurable globally or per-module.
- **FR-029**: **Exception Hierarchy**: The platform MUST define a standardized exception hierarchy, including base `BusinessException`, `ValidationException`, `ConflictException`, `PermissionDeniedException`, `UnauthorizedException`, and `ResourceNotFoundException`. Database and driver-specific error mappers must map errors into this exception hierarchy.
- **FR-030**: **Decorator Expansion**: The platform MUST export decorators `@CurrentUserId()`, `@TenantCode()`, `@SessionId()`, `@TraceId()`, `@Roles()`, and `@Scopes()` which retrieve values from `RequestContextService`.
- **FR-031**: **Health Module**: Generalize health checking with a centralized `HealthModule` exposing `HealthService` and `HealthIndicator` interfaces. `SqlHealthService` and `MongoHealthService` become implementations. Future indicators (e.g. Redis, Kafka, OpenSearch, S3, External APIs) must be supported without changing the platform architecture.
- **FR-032**: **Logger Abstraction**: Business code must not bind directly to a logging implementation. The platform MUST introduce a `LoggerService` abstraction supporting `debug()`, `info()`, `warn()`, `error()`, `audit()`, and `security()` methods, allowing the backend logging engine to be replaceable (e.g., Pino, Winston, OpenTelemetry).
- **FR-033**: **Tracing Abstraction**: Provide `TraceService` that abstracts tracing logic compatible with OpenTelemetry, offering capabilities to retrieve the current trace/span, create child spans, and inject/extract trace context.
- **FR-034**: **Platform Strategy Pattern**: Define a platform strategy pattern for core features. Strategy interfaces must be defined for `AuthenticationStrategy`, `AuthorizationStrategy`, `RateLimitStrategy`, `LoggingStrategy`, `TraceStrategy`, `ExceptionStrategy`, `HealthStrategy`, and `CacheStrategy`. Libraries should depend on strategy interfaces rather than concrete implementations, allowing host applications to replace default implementations via dependency injection.

### Key Entities *(include if feature involves data)*

- **RequestContext**: A non-persistent object representing the lifecycle of an execution thread. Key attributes:
  * traceId
  * requestId
  * serviceName
  * tenantCode
  * companyId
  * user
  * client metadata
  * request timestamp
- **AuthContext**: A non-persistent object representing the authenticated security context. Key attributes:
  * userId
  * sessionId
  * tenantCode
  * roles
  * scopes
  * permissions
- **BaseEntity / BaseDocument**: Non-persistent domain base structure. Key attributes:
  * id / objectId
  * createdAt
  * updatedAt
  * deletedAt
  * isDeleted
  * tenantCode
  * version
  * createdBy
  * updatedBy

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of concurrent microservice HTTP requests must isolate request contexts with zero tenant data cross-contamination under concurrent load.
- **SC-002**: Database connection health check services must respond in under 100ms when queried.
- **SC-003**: In-memory AsyncLocalStorage context access must introduce negligible overhead (less than 2ms addition to request handling time).
- **SC-004**: Global exceptions filters must format 100% of uncaught errors into the standardized error format.

## Assumptions

- Microservices receive bearer JWT tokens from the gateway or directly from clients.
- Every service validates JWT locally by default using the auth-svc RS256 public key.
- The gateway may forward correlation headers (trace ID, request ID), but downstream services must not trust forwarded identity headers unless a custom authentication strategy explicitly enables it.
- Authentication must not require a network call to auth-svc for every request.
- Service repositories will run in a NestJS monorepo utilizing the standard `@nestjs/typeorm` and `@nestjs/mongoose` dependencies.
- Distributed tracing (like OpenTelemetry) may consume the trace ID generated by the libraries, but the libraries themselves will manage context within the local Node.js process using AsyncLocalStorage.
- User authentication validation will utilize a custom hook/strategy registered dynamically by the host application, defaulting to a local RS256 JWT validation using a shared public key without calling auth-svc on every request, with fallbacks for revocation/cache misses.
