# Quickstart & Verification Guide: Monorepo Library Foundation

This guide outlines the steps and validation scenarios required to verify that the monorepo library foundation behaves correctly when integrated into a NestJS microservice application.

## 1. Prerequisites

- **Node.js**: >= v20.0.0
- **NestJS CLI**: Installed globally (`npm install -g @nestjs/cli`)
- **Docker**: For running database services:
  - **PostgreSQL**: Listening on port `5432`
  - **MongoDB**: Listening on port `27017`
  - **Redis**: Listening on port `6379`

## 2. Platform Bootstrap & Module Wiring

To use the libraries, a microservice application registers the core and feature modules in its main `AppModule`.

### Wire Modules in `AppModule`

```typescript
import { Module } from '@nestjs/common';
import { CoreModule } from '@new-hros/libs-core';
import { SqlModule } from '@new-hros/libs-sql';
import { MongoModule } from '@new-hros/libs-mongo';
import { ApisModule } from '@new-hros/libs-apis';

@Module({
  imports: [
    CoreModule.forRoot({
      logger: { level: 'info' },
      cache: { store: 'redis', host: 'localhost', port: 6379 }
    }),
    SqlModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'password',
        database: 'hrms_tenant',
        autoLoadEntities: true
      })
    }),
    MongoModule.forRootAsync({
      useFactory: () => ({
        uri: 'mongodb://localhost:27017/hrms_tenant'
      })
    }),
    ApisModule.forRoot({
      auth: {
        publicKey: '-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----'
      },
      rateLimit: { limit: 100, windowSeconds: 60 }
    })
  ]
})
export class AppModule {}
```

---

## 3. Runnable Validation Scenarios

### Scenario 1: Request Isolation & Context Validation
- **Goal**: Verify that AsyncLocalStorage isolates request parameters (traceId, tenantCode) and exposes them through `RequestContextService`.
- **Setup**:
  1. Trigger concurrent HTTP requests to a dummy endpoint.
  2. Request A: Send headers `x-trace-id: trace-aaa`, `x-tenant-code: tenant-a`.
  3. Request B: Send headers `x-trace-id: trace-bbb`, `x-tenant-code: tenant-b`.
- **Expected Outcome**:
  - Request A log entries print `[trace-aaa] [tenant-a]`.
  - Request B log entries print `[trace-bbb] [tenant-b]`.
  - Zero cross-contamination occurs (Request A never sees `tenant-b` context).

### Scenario 2: RS256 JWT Authentication & Guard Validation
- **Goal**: Verify local signature validation and PermissionGuard access control.
- **Setup**:
  1. Generate an RS256 JWT token signed with an invalid key. Expect HTTP `401 Unauthorized`.
  2. Generate a valid RS256 JWT token (incorporating roles, scopes, permissions: `['employee:read']`) mapped to `tenant-a`.
  3. Request the protected route `/employees` decorated with `@RequirePermission('employee:read')` using the valid token.
- **Expected Outcome**:
  - Invalid signature yields immediate `401 Unauthorized` with formatted JSON error body.
  - Valid token yields HTTP `200 OK`.
  - Modifying the tenant context in the header (e.g. asking for `tenant-b` data with a `tenant-a` token) yields a mismatch rejection or validation failure.

### Scenario 3: Database Transactions & UnitOfWork Validation
- **Goal**: Verify transaction context propagation and atomicity.
- **Setup**:
  1. Inject `UnitOfWork` into a business service.
  2. Call `UnitOfWork.execute()` with a callback that performs:
     - SQL repository record insertion (e.g. Employee creation)
     - A business rule violation (e.g. throw a `ConflictException`).
- **Expected Outcome**:
  - The transaction aborts.
  - Check the database: no record of the new Employee is committed.
  - The API exception filter formats the `ConflictException` into a standardized error response.

### Scenario 4: Mongoose Auto-Scoping Validation
- **Goal**: Verify Mongoose plugins automatically filter by active tenant.
- **Setup**:
  1. Set request context to `tenantCode: tenant-a`.
  2. Save a Mongoose document.
  3. Execute `BaseMongoRepository.findPaginated()`.
- **Expected Outcome**:
  - Mongoose document contains `tenantCode: 'tenant-a'`, `version: 1`, `createdAt`, `updatedAt`, `createdBy`.
  - Executing subsequent finds returns only documents belonging to `tenant-a`, automatically filtering out `tenant-b` records.

### Scenario 5: General Health Status Verification
- **Goal**: Verify that all platform components report health indicators.
- **Setup**:
  1. Query the health endpoint `GET /health`.
- **Expected Outcome**:
  - Returns `200 OK` with JSON:
    ```json
    {
      "status": "up",
      "components": {
        "postgres": { "status": "up" },
        "mongodb": { "status": "up" }
      }
    }
    ```
  - Stop the PostgreSQL Docker container, query `GET /health` again. Expect `503 Service Unavailable` with `postgres` reporting `down`.
