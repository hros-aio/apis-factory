# HRMS NestJS Platform Library Monorepo (`api-factory`)

This repository contains the foundation libraries for a multi-tenant SaaS HRMS platform built with NestJS.

---

## 1. Project Structure

- **[`libs/libs-core`](file:///home/ren0503/new-hros/api-factory/libs/libs-core)**: Core platform abstractions (request context isolation, logging, tracing, health registries, exception mappings, and two-level caching).
- **[`libs/libs-apis`](file:///home/ren0503/new-hros/api-factory/libs/libs-apis)**: API layer utilities, reusable guards (`AuthGuard`, `PermissionGuard`, `RateLimitGuard`), custom decorators (`CurrentUser`), filters, and interceptors.
- **[`libs/libs-sql`](file:///home/ren0503/new-hros/api-factory/libs/libs-sql)**: Context-aware transaction managers and TypeORM repository bases.
- **[`libs/libs-mongo`](file:///home/ren0503/new-hros/api-factory/libs/libs-mongo)**: Mongoose wrappers, tenant scoping plugins, soft delete, and exception mappers.

---

## 2. Dynamic Two-Level Cache (`CacheModule`)

Defined in `libs-core`. Features an in-memory L1 cache (LRU and TTL) and a Redis-backed L2 cache.

### Configuration:
```typescript
import { Module } from '@nestjs/common';
import { CacheModule } from '@new-hros/libs-core';

@Module({
  imports: [
    CacheModule.register({
      l1DefaultTtl: 30, // 30 seconds
      l1MaxItems: 1000,
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
  ],
})
export class AppModule {}
```

---

## 3. Reusable Authentication Guard (`AuthGuard`)

Defined in `libs-apis`. Intercepts incoming HTTP requests, decodes/verifies RS256 JWT, validates active session IDs against the cached state (`auth:session:{sessionId}`), and injects tenant-context profiles.

### Usage:
```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUser, AuthenticatedUser } from '@new-hros/libs-apis';

@Controller('users')
export class UsersController {
  @Get('me')
  @UseGuards(AuthGuard)
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
```

---

## 4. Commands

### Clean the workspace:
```bash
npm run clean
```

### Build the project:
```bash
npm run build
```

### Run unit tests:
```bash
npm run test
```
