# Data Model: JWT Authentication Middleware

Since this middleware is stateless and does not persist data to a database or cache, the data model defines the structures used for JWT payload verification and request authentication context.

## Entities

### 1. JwtPayload
Represents the structure of claims in the decoded JSON Web Token.

| Field | Type | Required | Description | Validation / Constraints |
|---|---|---|---|---|
| `sub` | `string` | Yes | Subject: unique identifier of the authenticated user. | Non-empty string. |
| `sessionId` | `string` | Yes | ID representing the user's active session. | Non-empty string. |
| `tenantCode` | `string` | Yes | Code of the tenant the user belongs to. | Non-empty string. |
| `iat` | `number` | Yes | Issued-at timestamp (Unix epoch seconds). | Must be a valid positive integer. |
| `exp` | `number` | Yes | Expiration timestamp (Unix epoch seconds). | Must be greater than current time. |

### 2. AuthContext
Represents the request-scoped authentication context attached to the request object.

| Field | Type | Required | Description |
|---|---|---|---|
| `sessionId` | `string` | Yes | Extracted session ID. |
| `tenantCode` | `string` | Yes | Extracted tenant code. |
| `payload` | `JwtPayload` | Yes | Full verified and decoded token claims. |

## Request Object Extension
The Express `Request` object is extended with the `authContent` property:

```typescript
declare global {
  namespace Express {
    interface Request {
      authContent?: AuthContext;
    }
  }
}
```
