# API Platform Layer Library (`@new-hros/libs-apis`)

Provides reusable guards, decorators, interceptors, and middleware for API request isolation, request tracing, and multi-tenant authentication.

---

## 1. Authentication Guard (`AuthGuard`)

Protects controller endpoints by:
1. Extracting the Bearer token from the `Authorization` header.
2. Validating the signature (RS256).
3. Verifying that the session is active by checking the cache key `auth:session:{sessionId}`.
4. Setting the user context on the request.

### Usage:
```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUser, AuthenticatedUser } from '@new-hros/libs-apis';

@Controller('profile')
export class ProfileController {
  @Get()
  @UseGuards(AuthGuard)
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
```

---

## 2. Authentication Service (`auth-svc`) Integration Guide

The `auth-svc` is responsible for issuing access tokens and managing the session lifecycle state. It does not query the database during normal requests; instead, it populates the cache which `AuthGuard` queries.

### A. Login Flow Example

During a successful login, `auth-svc` must:
1. Validate credentials.
2. Generate a unique `sessionId` (e.g., UUID v4).
3. Issue a JWT with the payload containing `sub` (userId), `sid` (sessionId), `tenantCode`, and `type: 'access'`.
4. Cache the session profile data at `auth:session:{sessionId}`.

```typescript
import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { CacheService } from '@new-hros/libs-core';

@Injectable()
export class AuthService {
  constructor(
    private readonly cacheService: CacheService,
    private readonly privateKey: string, // RS256 Private Key
  ) {}

  async login(user: any, tenantCode: string): Promise<{ accessToken: string }> {
    const sessionId = 'session-' + Math.random().toString(36).substring(2, 15);
    const userId = user.id;

    // 1. Construct standard token payload
    const payload = {
      sub: userId,
      sid: sessionId,
      tenantCode,
      type: 'access',
    };

    // 2. Sign JWT using RS256
    const token = jwt.sign(payload, this.privateKey, {
      algorithm: 'RS256',
      expiresIn: '2h',
    });

    // 3. Cache session context (TTL: 2 hours)
    const sessionKey = `auth:session:${sessionId}`;
    const sessionData = {
      sessionId,
      userId,
      tenantCode,
      user: {
        id: userId,
        tenantCode,
        email: user.email,
        roles: user.roles,
      },
      createdAt: new Date().toISOString(),
    };
    await this.cacheService.set(sessionKey, sessionData, 7200);

    // 4. Optionally track active user sessions to support bulk invalidations
    const userSessionsKey = `auth:user-sessions:${userId}`;
    const activeSessions = (await this.cacheService.get<string[]>(userSessionsKey)) || [];
    activeSessions.push(sessionId);
    await this.cacheService.set(userSessionsKey, activeSessions, 7200);

    return { accessToken: token };
  }
}
```

### B. Logout Flow Example

During logout, `auth-svc` must invalidate the specific session from the cache.

```typescript
import { Injectable } from '@nestjs/common';
import { CacheService } from '@new-hros/libs-core';

@Injectable()
export class AuthService {
  constructor(private readonly cacheService: CacheService) {}

  async logout(sessionId: string, userId: string): Promise<void> {
    // 1. Delete session from cache
    const sessionKey = `auth:session:${sessionId}`;
    await this.cacheService.del(sessionKey);

    // 2. Remove session ID from user mapping list
    const userSessionsKey = `auth:user-sessions:${userId}`;
    const activeSessions = await this.cacheService.get<string[]>(userSessionsKey);
    if (activeSessions) {
      const filtered = activeSessions.filter(id => id !== sessionId);
      if (filtered.length > 0) {
        await this.cacheService.set(userSessionsKey, filtered, 7200);
      } else {
        await this.cacheService.del(userSessionsKey);
      }
    }
  }
}
```
