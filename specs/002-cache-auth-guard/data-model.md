# Data Structures: Cache and Auth Session Models

This document defines the schemas and structures used in the cache namespaces and the user context.

---

## 1. User Context

The User Context represents the identity and tenant affiliation of the authenticated user. This context is attached to incoming requests and retrieved via the `@CurrentUser()` decorator.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier of the user (e.g. UUID) |
| `tenantCode` | `string` | Tenant scoping identifier for data isolation |
| `email` | `string` | User's email address |
| `roles` | `string[]` | User permissions or role groups (e.g., `["ADMIN", "USER"]`) |

---

## 2. Cache Namespace Schema

The cache namespaces isolate different types of cached data in Redis and the local in-memory L1 cache.

### Namespace 1: User Session Cache

- **Pattern**: `auth:session:{sessionId}`
- **TTL**: Configurable (e.g., 2 hours / 7200 seconds)
- **Value**: JSON serialized object of the `SessionState`.

#### SessionState Schema:
```json
{
  "sessionId": "uuid-v4-session-id",
  "userId": "uuid-v4-user-id",
  "tenantCode": "tenant-xyz",
  "user": {
    "id": "uuid-v4-user-id",
    "tenantCode": "tenant-xyz",
    "email": "user@example.com",
    "roles": ["ADMIN"]
  },
  "createdAt": "2026-07-07T14:32:00.000Z",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

### Namespace 2: User-to-Session Mapping (Optional)

To support tracking multiple concurrent sessions for a single user and bulk revoking them, mapping of user sessions can be maintained.

- **Pattern**: `auth:user-sessions:{userId}`
- **TTL**: Matches the maximum session TTL.
- **Value**: A JSON stringified array of session IDs (e.g., `["session-id-1", "session-id-2"]`) or a Redis Set.
