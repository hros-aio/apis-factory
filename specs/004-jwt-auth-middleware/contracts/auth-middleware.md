# Interface Contract: JWT Authentication Middleware

This document defines the interface contracts exposed by the JWT Authentication Middleware to external clients and HTTP requests.

## Request Interface

Protected endpoints require the `Authorization` header populated with a Bearer token.

### Header Schema
```http
Authorization: Bearer <JWT_TOKEN>
```

- **Format**: Must begin with `Bearer ` (case-sensitive) followed by a single space and a valid RS256 JWT.
- **Missing or Invalid Token**: `AuthMiddleware` catches validation errors, logs a warning, and continues (calls `next()`). It does not reject the request or return a 401 response.
- **Enforcement**: `AuthGuard` must be registered on protected endpoints; it verifies that the session is valid and throws the `UnauthorizedException` to produce a `401 Unauthorized` response.

---

## Response Interface (Failure Cases)

When token validation fails and a request accesses an endpoint protected by `AuthGuard`, the guard throws an `UnauthorizedException`, producing a `401 Unauthorized` response. The response body is formatted by the global `GlobalHttpExceptionFilter`:

### Example 401 Response (Missing Header)
```json
{
  "statusCode": 401,
  "timestamp": "2026-07-11T00:30:00.000Z",
  "path": "/protected-route",
  "code": "UNAUTHORIZED",
  "message": "Authorization Bearer token is missing",
  "traceId": "trace-xxxx-xxxx"
}
```

### Example 401 Response (Invalid Signature / Expired Token)
```json
{
  "statusCode": 401,
  "timestamp": "2026-07-11T00:30:00.000Z",
  "path": "/protected-route",
  "code": "UNAUTHORIZED",
  "message": "Invalid authentication token: jwt expired",
  "traceId": "trace-xxxx-xxxx"
}
```

### Example 401 Response (Missing Session ID / Tenant Code Claims)
```json
{
  "statusCode": 401,
  "timestamp": "2026-07-11T00:30:00.000Z",
  "path": "/protected-route",
  "code": "UNAUTHORIZED",
  "message": "Session ID is missing from token",
  "traceId": "trace-xxxx-xxxx"
}
```
