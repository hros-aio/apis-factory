# Feature Specification: Reusable API Infrastructure Options

**Feature Branch**: `005-setup-apis-options`

**Created**: 2026-07-11

**Status**: Draft

**Input**: User description: "I want to prepare a reusable API infrastructure in `libs/apis` for my NestJS monorepo. This library will be shared across all microservices, so every implementation must be generic, configurable, and production-ready.

Implement the following common modules and helper functions:
1. CORS Configuration
2. Swagger Configuration
3. API Versioning
4. Pagination Utilities
..."

## Clarifications

### Session 2026-07-11

- Q: What is the default CORS behavior if the allowed origins environment variable is missing? → A: Restrict CORS options to same-origin only (restricted access by default).
- Q: What is the default Swagger behavior if the environment configuration is missing? → A: Hide/disable Swagger documentation (hidden by default).
- Q: Which API versioning strategy should be used? → A: Force the use of Media Type versioning (`MediaTypeVersioning`).
- Q: What validation rules should be applied to page and limit parameters from the request query? → A: Use `@IsInt({ min: 0 })` validator constraints.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configuring CORS for Microservices (Priority: P1)

As a microservice developer, I want to easily generate CORS configuration options using environment variables and support custom service-level overrides, so that I can secure each microservice endpoint without duplicating CORS setup logic across the repository.

**Why this priority**: Fundamental security configuration required for all public-facing services.

**Independent Test**: A service can request CORS configuration with custom or environment-configured origins and receive a compliant options object.

**Acceptance Scenarios**:

1. **Given** the environment variable `CORS_ALLOWED_ORIGINS` is set to `https://example.com,https://api.example.com` and credentials are enabled, **When** `createCorsOptions()` is called, **Then** it returns CORS options allowing requests from those origins with credentials.
2. **Given** a service requires a custom HTTP method or header override, **When** `createCorsOptions({ allowedMethods: ['GET', 'POST'] })` is called, **Then** the custom options override the environment-configured defaults.

---

### User Story 2 - Automated API Documentation Setup (Priority: P1)

As a microservice developer, I want to quickly initialize Swagger documentation with sensible defaults and support for authentication, versioning, and customized paths, so that client teams have up-to-date and interactive documentation for my service.

**Why this priority**: Critical for inter-team integration and client API usage.

**Independent Test**: A running service can expose a Swagger UI endpoint that lists all endpoints, supports JWT Bearer authentication, and can be toggled on/off via environment configuration.

**Acceptance Scenarios**:

1. **Given** the environment variable `SWAGGER_ENABLED` is set to `true`, **When** the service starts up, **Then** the Swagger UI is generated and accessible at the default `/docs` path (or a configured custom path).
2. **Given** a service requiring JWT Bearer authentication, **When** Swagger is initialized, **Then** the Swagger documentation enables the Bearer Authentication button and attaches security requirements to all endpoints.

---

### User Story 3 - Standardized API Versioning (Priority: P2)

As a microservice developer, I want to easily apply standardized Media Type API versioning to my service endpoints so that we can introduce breaking changes safely.

**Why this priority**: Vital for long-term API maintenance and evolution.

**Independent Test**: Endpoints can be accessed via different versions using the Media Type strategy.

**Acceptance Scenarios**:

1. **Given** Media Type versioning is configured, **When** a client requests an endpoint with the media type `application/vnd.api.v1+json`, **Then** the request is correctly routed to the version 1 handler.
2. **Given** Media Type versioning is configured, **When** a client requests an endpoint with the media type `application/vnd.api.v2+json`, **Then** the request is routed to the version 2 handler.

---

### User Story 4 - Pagination and Search Capabilities (Priority: P2)

As a microservice developer, I want standard pagination, sorting, and search DTOs and utilities, so that all list endpoints across microservices follow the same request/response schema and validation rules.

**Why this priority**: Ensures API response consistency and prevents large database queries from overloading microservices.

**Independent Test**: A list endpoint returns paginated results matching the requested page, limit, sort, and search parameters, along with a standard metadata response.

**Acceptance Scenarios**:

1. **Given** a client request with `page=2` and `limit=10`, **When** the pagination helper calculates metadata for 25 total items, **Then** the response metadata displays `page: 2`, `limit: 10`, `total: 25`, `totalPages: 3`, `hasNext: true`, and `hasPrevious: true`.
2. **Given** a request parameter exceeding the maximum allowed page size (e.g. `limit=1000`), **When** validated by the query DTO, **Then** the system automatically caps the limit or throws a validation error.
3. **Given** a request query has a negative value or non-integer (e.g. `page=-1` or `page=abc`), **When** validated by the query DTO, **Then** the validation fails due to `@IsInt({ min: 0 })` constraints.

---

### Edge Cases

- **Missing/Invalid Configuration**: What happens when CORS or Swagger is requested but environment variables are missing?
  - *Resolution*: The system defaults to restricting CORS to same-origin only, and disabling (hiding) Swagger documentation.
- **Extreme Pagination Inputs**: How does the system handle negative values or non-numeric values for `page` or `limit`?
  - *Resolution*: Validation rules on the Pagination DTO must reject negative or non-numeric values using `@IsInt({ min: 0 })` on `req.query` parameters and throw a validation error.
- **Mixed Versioning Strategies**: What happens if a microservice attempts to configure multiple versioning strategies concurrently?
  - *Resolution*: The versioning utility forces the use of Media Type versioning, preventing strategy conflicts.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: CORS Options Generation MUST support environment-based configuration for allowed origins, credentials, allowed methods, allowed headers, exposed headers, and preflight requests.
- **FR-002**: CORS Options Generation MUST support programmatic overrides at the service level to customize options beyond the environment defaults.
- **FR-003**: Swagger utility MUST provide a reusable function to setup Swagger UI with support for title, description, version, server URL, bearer authentication, tags, and external docs.
- **FR-004**: Swagger utility MUST allow dynamically enabling/disabling the Swagger UI using environment variables and support a customizable document path.
- **FR-005**: Versioning utility MUST support Media Type versioning using NestJS built-in versioning mechanisms.
- **FR-006**: Pagination DTOs MUST validate query parameters (page, limit, sort, order, search) from the request query (`req.query`), enforcing non-negative integers using `@IsInt({ min: 0 })` for page and limit, and enforcing a maximum limit boundary.
- **FR-007**: Pagination Utilities MUST calculate pagination skip values, generate standard metadata (page, limit, total, totalPages, hasNext, hasPrevious), and format standard wrapper responses.

### Key Entities *(include if feature involves data)*

- **PaginationQuery**: Represents the client request parameters for paginated lists, containing page, limit, sort field, sort order, and search terms.
- **PaginationMeta**: Represents the calculated pagination metadata returned to the client, including current page, limit, total records, total pages, and flags indicating if next/previous pages exist.
- **PaginationResponse**: A generic response wrapper containing the data array of type `T` and the associated PaginationMeta.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can integrate CORS, Swagger, Versioning, and Pagination into a new microservice in under 5 minutes using the shared library.
- **SC-002**: 100% of microservice APIs using the library expose a consistent pagination response format and input validation behavior.
- **SC-003**: Swagger documentation can be toggled on/off across all microservices instantly via environment configuration.
- **SC-004**: Versioning helper correctly routes requests for the Media Type strategy without requiring custom routing middleware in the microservices.

## Assumptions

- **Target Environment**: Standard Node.js runtime environment (v18+) with NestJS v11 compatibility.
- **Scope Boundaries**: The shared library is focused purely on option generators, bootstrap helpers, and DTOs. Database adapters (e.g., TypeORM or Prisma pagination implementation) are service-specific and out of scope for this shared library.
- **Pagination Defaults**: Default page size is assumed to be `20`, and maximum page size is capped at `100` unless overridden by service config.
- **Environment Variable Names**: The default configuration keys used will be:
  - CORS: `CORS_ALLOWED_ORIGINS`, `CORS_CREDENTIALS`
  - Swagger: `SWAGGER_ENABLED`, `SWAGGER_PATH`
