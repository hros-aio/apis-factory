# Quickstart Validation Guide: Reusable API Infrastructure Options

This guide outlines runnable scenarios to validate that the reusable CORS, Swagger, Versioning, and Pagination utilities function correctly in a service.

## Prerequisites

- Node.js runtime environment (v18+)
- NestJS application workspace

## Scenarios

### Scenario 1: CORS Settings Validation

Validate that the generated CORS options match configurations from environment variables and support custom service-level overrides.

**Commands**:
Run tests validating the `createCorsOptions()` helper:
```bash
npm run test -w @new-hros/libs-apis -- -t "CORS"
```

**Expected Outcome**:
- When `CORS_ALLOWED_ORIGINS` is not defined, generated CORS options only allow requests matching same-origin.
- When `CORS_ALLOWED_ORIGINS` is set to `https://example.com`, generated CORS options allow `https://example.com` and credentials are true.
- Passing overrides (e.g. `{ allowedHeaders: ['X-Custom-Header'] }`) successfully overrides default behavior.

---

### Scenario 2: Swagger Documentation Validation

Validate that Swagger generates correctly when enabled, mounts to the specified path, and supports JWT Bearer authentication.

**Commands**:
Run tests validating the `setupSwagger()` helper:
```bash
npm run test -w @new-hros/libs-apis -- -t "Swagger"
```

**Expected Outcome**:
- When `SWAGGER_ENABLED` is not set or false, Swagger UI configuration is skipped.
- When `SWAGGER_ENABLED` is true, Swagger generates at the custom path (e.g., `/docs`).
- Bearer Authentication configuration is visible in the generated document.

---

### Scenario 3: API Versioning Validation

Validate that Media Type versioning correctly matches the `MediaTypeVersioning` strategy.

**Commands**:
Run tests validating the `setupVersioning()` helper:
```bash
npm run test -w @new-hros/libs-apis -- -t "Versioning"
```

**Expected Outcome**:
- Versioning type matches `VersioningType.MEDIA_TYPE` with key `v`.
- Default version is applied correctly to versioning options.

---

### Scenario 4: Pagination Validation

Validate query parameters validation and metadata calculations.

**Commands**:
Run tests validating pagination DTO validation and calculation helper functions:
```bash
npm run test -w @new-hros/libs-apis -- -t "Pagination"
```

**Expected Outcome**:
- Query parameters `page` and `limit` are validated using `@IsInt({ min: 0 })`.
- Invalid inputs (negative integers or non-numbers) fail validation.
- `calculateSkip` returns correct offsets (`page * limit`).
- Pagination metadata maps correctly to:
  ```json
  {
    "page": 1,
    "limit": 20,
    "total": 35,
    "totalPages": 2,
    "hasNext": false,
    "hasPrevious": true
  }
  ```
