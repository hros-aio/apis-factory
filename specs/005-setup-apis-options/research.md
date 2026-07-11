# Phase 0 Research: Reusable API Infrastructure Options

This document resolves the design and technical decisions for CORS, Swagger, API Versioning, and Pagination utilities.

## Research Findings & Decisions

### Decision 1: Swagger Dependency Management
- **Decision**: Add `@nestjs/swagger` as a peer dependency and dev dependency of `@new-hros/libs-apis`.
- **Rationale**: The Swagger setup utility `setupSwagger` requires imports from `@nestjs/swagger` (such as `SwaggerModule` and `DocumentBuilder`). Declaring it as a peer dependency allows the application using the library to supply the package, ensuring compatibility with their specific NestJS version, while installing it as a dev dependency allows local compilation and testing within the library.
- **Alternatives considered**: Direct dependency on `@nestjs/swagger`. Rejected to prevent version mismatches across microservices in the monorepo.

### Decision 2: CORS Options Configuration Defaults
- **Decision**: When allowed origins environment variable (`CORS_ALLOWED_ORIGINS`) is not set, CORS defaults to same-origin only (no external origins).
- **Rationale**: Prioritizes secure-by-default behavior. CORS will not default to wildcard (`*`) or permissive settings unless explicitly configured.
- **Alternatives considered**: Defaulting to wildcard `*`. Rejected as a security risk.

### Decision 3: Swagger Visibility Defaults
- **Decision**: If `SWAGGER_ENABLED` is missing from the environment, the Swagger UI is disabled/hidden.
- **Rationale**: Prevents accidental exposure of API schemas in environments where Swagger is not explicitly enabled (e.g., production environments).
- **Alternatives considered**: Enabling Swagger by default. Rejected to align with security best practices.

### Decision 4: API Versioning Strategy
- **Decision**: Force `VersioningType.MEDIA_TYPE` versioning strategy using NestJS built-in versioning.
- **Rationale**: Aligns with the user clarification to force Media Type versioning, using the default media type format `application/vnd.api.v[version]+json` or standard custom media types.
- **Alternatives considered**: Supporting multiple versioning strategies programmatically. Rejected because the requirement dictates forcing the Media Type strategy.

### Decision 5: Pagination DTO Validation
- **Decision**: Use `class-validator`'s `@IsInt({ min: 0 })` and `class-transformer`'s `@Type(() => Number)` on query parameters.
- **Rationale**: NestJS request query parameters are received as strings. We must use `class-transformer` to cast `page` and `limit` to numbers, then validate they are non-negative integers using `@IsInt({ min: 0 })`.
- **Alternatives considered**: Custom validation pipe. Rejected since NestJS's standard ValidationPipe combined with `class-validator` provides built-in support for these annotations.
