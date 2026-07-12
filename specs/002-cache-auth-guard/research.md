# Research Notes: Reusable Two-Level Cache Foundation and Reusable Auth Guard

## Summary of Decisions

This document outlines the research and technical decisions for the design of the two-level cache foundation (`libs-core`) and the reusable authentication guard (`libs-apis`).

---

### Decision 1: L1 Cache Implementation Strategy

**Chosen Approach**: Custom Memory Cache Provider
- **Rationale**: Implementing L1 using a standard JavaScript `Map` with key expiration avoids introducing heavy external dependencies, keeps the execution context simple, and guarantees sub-millisecond retrieval times (<1ms overhead).
- **Alternatives Considered**: 
  - `@nestjs/cache-manager` / `cache-manager`: Rejected to avoid pulling in nested dependency trees and to maintain direct, fine-grained control over the hydration flow and namespace-level operations.

---

### Decision 2: L2 Cache Client

**Chosen Approach**: `ioredis`
- **Rationale**: `ioredis` is the industry-standard Redis client for Node.js. It supports auto-reconnection, sentinel/cluster modes, promise-based APIs, and provides clean support for streams and scanning keys (`SCAN`).
- **Alternatives Considered**:
  - `redis` (official client): Considered, but `ioredis` is already present in the workspace package lockfile and offers more robust options for connection state management.

---

### Decision 3: Cache Invalidation & Consistency

**Chosen Approach**: Eventual consistency via local TTL
- **Rationale**: For multi-instance deployments, L1 caches on different nodes can temporarily drift. Setting a low TTL on L1 (e.g., 10-60 seconds for hot data, configurable) ensures eventual consistency without introducing the complexity of real-time pub/sub synchronization.
- **Eviction Strategy**: L1 cache will perform lazy eviction on read (checking `expiresAt`) and periodic cleanup to prevent memory growth.

---

### Decision 4: Safe Serialization

**Chosen Approach**: Standard JSON stringify/parse with try-catch
- **Rationale**: Caching libraries must serialize complex structures to prevent object references from being shared and mutated. Serializing to string in L1 also mirrors L2 behavior. Safe wrapping prevents malformed payloads from crashing the client applications.

---

### Decision 5: Auth Guard and Cache Session Integration

**Chosen Approach**: Decentralized token verification + Cached session validation
- **Rationale**: The AuthGuard verifies the JWT signature locally using RS256. It then looks up session details from the shared L2 cache (`auth:session:{sessionId}`) populated during user login. This removes database calls from the critical path of every protected API request.
- **Alternatives Considered**:
  - Calling `auth-svc` via HTTP for every request: Rejected due to significant latency penalty and creating a single point of failure.
