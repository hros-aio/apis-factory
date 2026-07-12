# Feature Specification: Reusable Two-Level Cache Foundation and Reusable Auth Guard

**Feature Branch**: `002-cache-auth-guard`

**Created**: 2026-07-07

**Status**: Draft

**Input**: User description: "Implement a reusable two-level cache foundation and reusable auth guard for a NestJS monorepo..."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fast and Efficient API Call Performance (Priority: P1)

Developers and applications need high-speed access to hot-path data (such as active user sessions, feature flags, or frequent configuration values) without incurring database queries or even network roundtrips to Redis.

**Why this priority**: Latency must be kept at a minimum for every API request. A two-level caching strategy satisfies this by maintaining an in-memory L1 cache locally within the application instance.

**Independent Test**: Can be verified by reading a cached value twice and measuring the time of the second read (which should be near-instantaneous, i.e., <2ms, as it avoids network I/O to L2/Redis).

**Acceptance Scenarios**:

1. **Given** a value `{"tenantCode": "tenant-A"}` is stored in cache for key `test-key`, **When** a read request is received, **Then** the value is successfully returned.
2. **Given** a cache miss on the L1 in-memory cache but a cache hit on the L2 Redis cache for key `test-key`, **When** `get("test-key")` is called, **Then** the value is returned and the L1 in-memory cache is populated (hydrated) with this value.
3. **Given** a new value is written to the cache via `set("test-key", value)`, **When** the operation finishes, **Then** both L1 in-memory and L2 Redis cache must contain the new value.

---

### User Story 2 - Secure Multi-Tenant Request Guarding (Priority: P1)

Every microservice API endpoint must isolate request execution contexts based on the tenant, and reject any requests with invalid, missing, or expired credentials before invoking any controller or business logic.

**Why this priority**: Core security constraint to prevent cross-tenant data leakage and unauthorized API execution.

**Independent Test**: Can be verified by calling an endpoint protected by the AuthGuard using:
- No token (should return 401).
- An invalid/expired token (should return 401).
- A valid token representing a session not found in the cache (should return 401).
- A valid token with active cached session context (should successfully invoke the endpoint and receive the expected user context).

**Acceptance Scenarios**:

1. **Given** an incoming HTTP request containing `Authorization: Bearer <valid_jwt>`, **When** the JWT payload contains `sid` (session ID) and a cached session exists at `auth:session:<sessionId>`, **Then** the request is allowed and the user context (including tenantCode) is attached to the request.
2. **Given** an incoming request with an invalid signature or missing `sid` in the JWT, **When** evaluated by the AuthGuard, **Then** the request is immediately rejected with a 401 Unauthorized exception.
3. **Given** a valid JWT with a correct `sid`, but no active session state is cached under `auth:session:<sessionId>`, **When** evaluated by the AuthGuard, **Then** the request is rejected with a 401 Unauthorized exception.

---

### User Story 3 - Multi-Session Support & Seamless Logout (Priority: P2)

Users must be able to log in from multiple devices (e.g., mobile app, web app) concurrently. Actions like logging out on one device must not terminate sessions on other active devices.

**Why this priority**: Enhances user experience across different client platforms while preserving proper security state mapping.

**Independent Test**: Log in twice to receive two distinct JWTs with different session IDs (`sid`) but the same user ID (`sub`). Verify that logging out of one session removes its specific key and invalidates its token, while the other session remains active and authorized.

**Acceptance Scenarios**:

1. **Given** a user has multiple active sessions (session A and session B), **When** a logout request is received for session A, **Then** `auth:session:<sessionA_id>` is deleted from the cache, while `auth:session:<sessionB_id>` remains present.

---

### Edge Cases

- **Redis Connection Downtime**: If the L2 Redis cache becomes unreachable, the Cache Service must degrade gracefully (e.g., continue serving/writing through the L1 in-memory cache, logging errors, or falling back to safe defaults without crashing the entire application).
- **L1 Cache Drift / Stale Data**: When multiple instances of an API run behind a load balancer, updating a cache key on one instance updates L2 (Redis) but might leave old values in L1 on other instances. The L1 in-memory cache must use a short Time-To-Live (TTL) configuration to ensure eventual consistency.
- **Malformed Serialization**: Writing objects with non-serializable properties (e.g., circular references or special types) must handle errors gracefully without corrupting the cache.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a `CacheModule` and `CacheService` inside `libs-core`.
- **FR-002**: The `CacheService` MUST support a two-level cache strategy consisting of an L1 in-memory cache and an L2 Redis cache.
- **FR-003**: The `CacheService` MUST expose standard methods: `get<T>`, `set<T>`, `has`, `del`, `flushAll`, and `flushNamespace`.
- **FR-004**: Read operations (`get`) MUST read from L1 first, fall back to L2 (Redis) on miss, and hydrate L1 from L2 on a hit.
- **FR-005**: Write operations (`set`, `del`, `flush*`) MUST synchronize modifications to both L1 and L2 caches.
- **FR-006**: The `CacheService` MUST serialize and deserialize values to/from JSON format safely.
- **FR-007**: Redis connection properties (host, port, credentials, namespaces, etc.) MUST be injectable using NestJS module configuration options, avoiding hardcoded values.
- **FR-008**: The `AuthGuard` in `libs-apis` MUST extract the Bearer token, verify its signature, and check the active session using the `CacheService` at key `auth:session:{sessionId}`.
- **FR-009**: The `AuthGuard` MUST block any requests where the token is missing, invalid, or lacks a corresponding cached session, throwing a 401 exception.
- **FR-010**: The `AuthGuard` MUST attach the authenticated user context (including `tenantCode` and roles) to the request context.
- **FR-011**: A custom `CurrentUser` decorator MUST be provided to retrieve the attached user context from the request.
- **FR-012**: The `AuthGuard` MUST NOT contain domain-specific login, logout, or direct database queries.

### Key Entities

- **UserContext**: Represents the authenticated user profile, containing user ID, tenant scope, and roles.
- **SessionState**: Represents the active session lifecycle details, stored in the cache under `auth:session:{sessionId}`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: System authorization checks add less than 5ms overhead to the request timeline.
- **SC-002**: Cache reads from L1 return in less than 2ms.
- **SC-003**: 100% of API endpoints protected by the guard correctly block requests with expired or revoked sessions.
- **SC-004**: Memory footprint of the L1 cache remains bounded using standard Least Recently Used (LRU) or TTL eviction.

## Assumptions

- The JWT payload uses standard fields (`sub`, `sid`, `tenantCode`) which map to user ID, session ID, and tenant scope.
- RS256 algorithm with a locally configured public key is used for signature validation.
- Standard serialization uses JSON stringify/parse; complex objects should be mapped to plain DTOs before caching.
- Eventual consistency (short L1 TTL) is acceptable across API instances for user sessions.
