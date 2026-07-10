# Quickstart & Verification Guide: JWT Authentication Middleware

This guide documents the procedures for verifying the correct functionality of the JWT Authentication Middleware.

## Prerequisites

1. Ensure all dependencies in the workspace are installed:
   ```bash
   npm install
   ```
2. Generate an RS256 keypair for testing (used to sign test tokens and verify them).
   ```bash
   openssl genrsa -out private.pem 2048
   openssl rsa -in private.pem -pubout -out public.pem
   ```

---

## Verification Scenarios

### Scenario 1: Run Unit Tests
Verify all validation requirements, signature checks, expiration handling, and custom claim validation rules.

* **Command**:
  ```bash
  npm run test -w @new-hros/libs-apis -- tests/auth.middleware.spec.ts
  ```
* **Expected Outcome**: All tests pass.

### Scenario 2: Register & Run in NestJS App
Integrate the middleware into a test application and verify headers.

1. Import `ApisModule` inside the NestJS app with a public key configured:
   ```typescript
   ApisModule.forRoot({
     auth: {
       publicKey: fs.readFileSync('public.pem', 'utf8'),
     }
   })
   ```
2. Register the middleware in the app module:
   ```typescript
   consumer
     .apply(AuthMiddleware)
     .forRoutes('/protected');
   ```
3. Generate a token signed with the corresponding private key:
   - Claims must include `sub`, `sessionId`, and `tenantCode`.
   - Set expiration to 1 hour in the future.
4. Call endpoint with token:
   ```bash
   curl -H "Authorization: Bearer <JWT_TOKEN>" http://localhost:3000/protected
   ```
5. **Expected Outcome**: The request returns `200 OK`, and response contains context from `request.authContent`.
6. Call endpoint with invalid signature or missing header:
   ```bash
   curl http://localhost:3000/protected
   ```
7. **Expected Outcome**: The request returns `401 Unauthorized` with the correct JSON error payload layout (see [contracts/auth-middleware.md](contracts/auth-middleware.md)).
