# Quickstart Guide: Caching & Authentication Guard Verification

This guide outlines the steps to verify the functionality of the two-level cache and the authentication guard.

---

## 1. Prerequisites

To run tests and verify the L2 Redis functionality, a local Redis server must be running.

```bash
# Start a local Redis instance via Docker
docker run --name hros-redis -p 6379:6379 -d redis
```

---

## 2. Test Execution

Unit tests are located inside their respective library directories and verify all requirements.

### Run Cache Service tests
To test CacheService L1/L2 logic, run:
```bash
npm run test -w @new-hros/libs-core
```

### Run Auth Guard tests
To test AuthGuard JWT validation and caching check, run:
```bash
npm run test -w @new-hros/libs-apis
```

---

## 3. End-to-End Integration Verification

### Cache Initialization Example
```typescript
import { Module } from '@nestjs/common';
import { CacheModule } from '@new-hros/libs-core';

@Module({
  imports: [
    CacheModule.register({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
  ],
})
export class AppModule {}
```

### Protecting Controller with Auth Guard
```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUser } from '@new-hros/libs-apis';

@Controller('users')
export class UserController {
  @Get('me')
  @UseGuards(AuthGuard)
  getProfile(@CurrentUser() user: any) {
    return user;
  }
}
```
