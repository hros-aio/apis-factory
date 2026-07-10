# Feature Specification: JWT Authentication Middleware

**Feature Branch**: `004-jwt-auth-middleware`

**Created**: 2026-07-11

**Status**: Draft

**Input**: User description: "Implement JWT Authentication Middleware for NestJS"

## Objective

Implement a reusable, stateless authentication middleware for NestJS that validates JWT tokens signed with **RS256** using a public key loaded from application configuration. Upon successful validation, it extracts user context and attaches it to the incoming request. If validation fails, it rejects the request immediately.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Secure API Access with Valid JWT (Priority: P1)

As an API client, I want to access a protected endpoint by presenting a valid RS256-signed JWT token so that the server can identify me and my tenant context.

**Why this priority**: Core happy path. This is the primary function of the authentication middleware.

**Independent Test**: Can be fully tested by sending a request with `Authorization: Bearer <valid_token>` to a route protected by the middleware. The response should indicate success (e.g., 200 OK) and the endpoint should be able to read the tenant code and session ID from the request context.

**Acceptance Scenarios**:

1. **Given** a client has a valid RS256 JWT containing `sessionId: "session-123"` and `tenantCode: VN001`, **When** they send a request with `Authorization: Bearer <token>`, **Then** the request is allowed through, and `request.authContent` contains the correct `sessionId`, `tenantCode`, and full decoded payload.

---

### User Story 2 - Reject Unauthorized and Invalid Formats (Priority: P2)

As an API security boundary, I want to block requests that have missing, malformed, or invalid tokens so that unauthorized clients cannot access protected resources.

**Why this priority**: Crucial security requirement. Prevents unauthorized execution of backend logic.

**Independent Test**: Send requests with no authorization header, non-Bearer headers (e.g., `Basic token`), expired tokens, or tokens signed with an incorrect key, and verify they all return a 401 Unauthorized status.

**Acceptance Scenarios**:

1. **Given** a request has no `Authorization` header, **When** processed by the middleware, **Then** it throws an `UnauthorizedException` (401 Unauthorized).
2. **Given** a request has an `Authorization` header with format `Basic abc123xyz`, **When** processed by the middleware, **Then** it throws an `UnauthorizedException` (401 Unauthorized).
3. **Given** a request has an expired JWT token, **When** processed by the middleware, **Then** it throws an `UnauthorizedException` (401 Unauthorized).
4. **Given** a request has a JWT signed with HS256 instead of RS256, **When** processed by the middleware, **Then** it throws an `UnauthorizedException` (401 Unauthorized).
5. **Given** a request has a JWT containing a signature that does not match the configured public key, **When** processed by the middleware, **Then** it throws an `UnauthorizedException` (401 Unauthorized).

---

### User Story 3 - Reject Validly Signed JWT with Missing Context Claims (Priority: P3)

As a multi-tenant API system, I want to reject requests that use a valid token but are missing the mandatory session and tenant tracking claims, so that downstream application logic is guaranteed to have the context it needs.

**Why this priority**: Prevents downstream system failures or data leaks due to missing tenant information.

**Independent Test**: Send a validly signed RS256 JWT that is missing `sessionId` or `tenantCode` and verify it returns a 401 Unauthorized status.

**Acceptance Scenarios**:

1. **Given** a JWT is signed correctly but lacks the `sessionId` claim, **When** processed by the middleware, **Then** it throws an `UnauthorizedException` (401 Unauthorized).
2. **Given** a JWT is signed correctly but lacks the `tenantCode` claim, **When** processed by the middleware, **Then** it throws an `UnauthorizedException` (401 Unauthorized).

---

### Edge Cases

- **Malformed JWT String**: If the `Authorization` header contains `Bearer malformed-token-without-three-parts`, the system MUST return `UnauthorizedException`.
- **Public Key Configuration Errors**: If the RS256 public key is not configured or is malformed at runtime, the middleware MUST fail secure (e.g., reject incoming requests as unauthorized or throw a 500 error, rather than letting requests pass through unauthenticated).
- **Extra Whitespace**: If the header format has multiple spaces (e.g., `Bearer   <token>`), the middleware should handle it gracefully or reject it based on strict Bearer pattern compliance.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST read the token from the `Authorization` header of incoming HTTP requests.
- **FR-002**: The system MUST enforce that the authorization token strictly uses the `Bearer <token>` format.
- **FR-003**: The system MUST verify the JWT signature using the **RS256** algorithm and a public key retrieved from the application's configuration.
- **FR-004**: The system MUST reject any tokens that are expired (`exp` claim is in the past).
- **FR-005**: The system MUST decode the JWT payload and extract `sessionId` and `tenantCode` claims.
- **FR-006**: The system MUST require both `sessionId` and `tenantCode` to be present and non-empty.
- **FR-007**: The system MUST attach an authentication context object (`authContent`) containing `sessionId`, `tenantCode`, and the full decoded `payload` to the Request object.
- **FR-008**: The system MUST reject requests with `UnauthorizedException` if any validation check fails.

### Key Entities

- **AuthContext**: Object representing the authenticated user context attached to the request.
  - `sessionId` (string): Identifies the user's current session.
  - `tenantCode` (string): Identifies the tenant partition.
  - `payload` (object): The full decoded JWT claims.
- **Request**: The HTTP request object (Express request) which is extended to support the `authContent` property containing an `AuthContext`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of requests with invalid, malformed, expired, or claims-deficient tokens are rejected with a 401 status before reaching route controller handlers.
- **SC-002**: Authentication validation check is performed entirely in-memory and adds less than 1.5ms of latency to incoming HTTP requests.
- **SC-003**: Multiple independent microservices can import and utilize the same middleware logic without duplication of validation code.

---

## Assumptions

- **Public Key Availability**: The application configuration mechanism provides a valid PEM-encoded RS256 public key during bootstrap/runtime.
- **TypeScript and NestJS Environment**: The application environment is configured with NestJS and Express as the underlying HTTP platform.
- **Stateless Verification**: Token verification does not require checking any revocation list (CRL), database session tables, or Redis cache.
