# Implementation Plan: JWT Authentication Middleware

**Branch**: `004-jwt-auth-middleware` | **Date**: 2026-07-11 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-jwt-auth-middleware/spec.md`

## Summary

The objective is to implement a reusable, stateless authentication middleware for NestJS within the API platform layer (`libs-apis`). The middleware intercepts incoming HTTP requests, extracts the JWT from the `Authorization: Bearer <token>` header, verifies the signature using the **RS256** algorithm and a public key loaded from application options, extracts user context claims (`sessionId` and `tenantCode`), and attaches this context to the request. On failure, it throws `UnauthorizedException`.

## Technical Context

**Language/Version**: TypeScript ^5.3.3, Node.js v20

**Primary Dependencies**: `@nestjs/common` ^10.0.0, `@nestjs/core` ^10.0.0, `jsonwebtoken` ^9.0.0

**Storage**: N/A (Stateless)

**Testing**: Jest ^29.7.0, `ts-jest` ^29.1.1, `@nestjs/testing` ^10.0.0

**Target Platform**: Node.js/NestJS Server Environment

**Project Type**: Monorepo library layer (`libs/libs-apis`)

**Performance Goals**: Adds less than 1.5ms latency to HTTP requests (in-memory validation)

**Constraints**: No database or Redis cache dependencies; only allow RS256 algorithm

**Scale/Scope**: Reusable globally or per-route across all microservices/gateways consuming `libs-apis`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

1. **Library-First Principle**: **Pass**. This middleware is implemented inside the shared platform library `libs-apis` rather than being tightly coupled to a single microservice application.
2. **TDD / Test-First**: **Pass**. Test cases covering all validation paths will be planned and implemented in unit tests.
3. **Observability**: **Pass**. Any security exceptions will be propagated through the global exception filter which logs errors alongside trace and request IDs.

## Project Structure

### Documentation (this feature)

```text
specs/004-jwt-auth-middleware/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/
    └── auth-middleware.md # Phase 1 output
```

### Source Code

```text
libs/libs-apis/
├── src/
│   ├── auth/
│   │   ├── auth.middleware.ts             # Intercepts requests, validates structure, attaches context
│   │   ├── jwt.service.ts                 # Validates JWT signature using RS256 and public key
│   │   ├── interfaces/
│   │   │   └── auth-context.interface.ts  # Context structure (sessionId, tenantCode, payload)
│   │   └── types/
│   │       └── express-request.d.ts       # Extension for Express.Request type
│   └── index.ts                           # Exports AuthMiddleware, JwtService, and AuthContext
└── tests/
    └── auth.middleware.spec.ts            # Unit tests for verification states
```

**Structure Decision**: Implemented directly within the `@new-hros/libs-apis` package inside a new `src/auth/` namespace directory.

## Complexity Tracking

No violations of project principles.
