# Research Report: JWT Authentication Middleware

## Research & Decisions

### Decision 1: JWT Verification Library
- **Decision**: Use `jsonwebtoken` (specifically the existing version `^9.0.0` from `libs-apis` dependencies).
- **Rationale**: It is already installed, mature, and widely used for synchronous/asynchronous JWT verification in Node.js environments.
- **Alternatives considered**: `jose` (rejected as it would introduce a new dependency when `jsonwebtoken` is already available).

### Decision 2: Public Key Retrieval
- **Decision**: Inject `'ApisModuleOptions'` into `JwtService` to retrieve the PEM-encoded public key.
- **Rationale**: Matches how `JwtAuthStrategy` and other guards currently access options in the `ApisModule`.
- **Alternatives considered**: Directly accessing `process.env.JWT_PUBLIC_KEY` (rejected because it bypasses NestJS's dependency injection system and makes configuration testing harder).

### Decision 3: Express Request Extension
- **Decision**: Declare ambient module extension in `types/express-request.d.ts` extending the `Request` interface of `express`.
- **Rationale**: Allows standard TypeScript files to compile when accessing `request.authContent` without type casting.
- **Alternatives considered**: Custom request interface mapping (rejected as it requires modifying controllers to use the custom type instead of standard Express Request).

### Decision 4: Alg Verification
- **Decision**: Explicitly enforce `{ algorithms: ['RS256'] }` option in `jwt.verify` call and manually check decoded header if necessary.
- **Rationale**: Prevents algorithm confusion attacks (e.g. attempting to verify with HS256 using the public key as a secret).
- **Alternatives considered**: Relying on library defaults (rejected as it is a major security vulnerability).
