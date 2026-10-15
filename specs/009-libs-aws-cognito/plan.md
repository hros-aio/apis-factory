# Implementation Plan: AWS Integration Library with Cognito User Pools (libs-aws)

**Branch**: `009-libs-aws-cognito` | **Date**: 2026-10-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-libs-aws-cognito/spec.md`

## Summary

Build a production-ready, reusable AWS integration library named `@new-hros/libs-aws` under `libs/libs-aws` in the existing NestJS monorepo, initially providing modular, type-safe, dependency-injection-friendly AWS Cognito User Pools integration via AWS SDK for JavaScript v3 (`@aws-sdk/client-cognito-identity-provider`).

The library provides:
1. Dynamic Module configuration via NestJS `ConfigurableModuleBuilder` with synchronous (`forRoot`) and asynchronous (`forRootAsync`) support.
2. Multi-pool isolation preventing provider collisions when managing multiple user directories in a single application.
3. Separation of concerns between administrative user operations (`CognitoService`) and end-user authentication flows (`CognitoAuthService`).
4. Automatic calculation of HMAC-SHA256 `SECRET_HASH` for App Clients with secrets.
5. Automated lifecycle management destroying the shared `CognitoIdentityProviderClient` on application shutdown (`OnApplicationShutdown`).
6. Centralized typed error mapping decoupled from HTTP status codes.
7. Hermetic unit tests with mocked AWS SDK command responses achieving high coverage without real credentials or network calls.

---

## Technical Context

- **Language/Version**: TypeScript 5.3.3 (`strict: true`), Node.js 20+
- **Primary Dependencies**:
  - `@nestjs/common`: `^10.0.0`
  - `@nestjs/core`: `^10.0.0`
  - `@aws-sdk/client-cognito-identity-provider`: `^3.x`
  - `rxjs`: `^7.8.1`
- **Storage**: AWS Cognito User Pools (Cloud Identity Directory)
- **Testing**: Jest 29.7.0, `ts-jest`, `@nestjs/testing` 10.0.0, mocked AWS SDK v3 commands
- **Target Platform**: Node.js 20+ server environment (containerized microservices, REST APIs, and background workers)
- **Project Type**: Reusable NestJS Monorepo Library (`libs/libs-aws`)
- **Performance Goals**:
  - Single reused AWS client per module instance (zero per-request client instantiation).
  - Sub-millisecond local parameter mapping and secret hash computation overhead.
- **Constraints**:
  - No hardcoded AWS credentials; support AWS default credential provider chain.
  - Zero leakage of passwords, tokens, client secrets, or secret hashes in logs or unhandled errors.
  - Framework-agnostic error mapping (no direct coupling to NestJS `HttpException` or `HttpStatus`).
  - Strict TypeScript compliance (no `any`, explicit method return types, strict null checks).
- **Scale/Scope**: Monorepo library package designed to support multiple independent User Pools and structured for future AWS services (S3, SQS, SNS, SES).

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance Assessment | Status |
|---|---|---|
| **I. Clean Architecture & Modular Domain Design** | The library encapsulates AWS interactions into modular NestJS services (`CognitoService`, `CognitoAuthService`) registered through `CognitoModule`. No circular dependencies. Clean public API via `index.ts`. | **PASS** |
| **II. Strict TypeScript & Coding Conventions** | Full compliance with `strict: true`. No `any` types used. Explicit return types on all exported methods. Kebab-case filenames (`<name>.<type>.ts`). Named exports only. No `I` prefix on interface names. | **PASS** |
| **III. Database, Caching, and Migration Discipline** | N/A for relational DB, but applies proper connection lifecycle discipline: single shared client instance per module, properly destroyed on application shutdown via `OnApplicationShutdown`. | **PASS** |
| **IV. Edge-to-Edge Security & Robust Validation** | Zero hardcoded credentials. Safe HMAC-SHA256 secret hash generation. Administrative commands enforce immutable `userPoolId`. Zero leakage of sensitive data in logs. Typed domain exceptions preserving root cause. | **PASS** |
| **V. Automated Quality Gates & Standardized Logging** | Standardized JSON logging ready. 100% hermetic Jest unit tests mocking AWS SDK commands. Clean execution via `npm test -w @new-hros/libs-aws`. | **PASS** |

---

## Project Structure

### Documentation (this feature)

```text
specs/009-libs-aws-cognito/
├── plan.md              # This implementation plan
├── research.md          # Architecture decisions & research
├── data-model.md        # Entities, options, and error models
├── quickstart.md        # Integration guide & runnable examples
├── contracts/           # Public API & service contract definitions
│   ├── cognito-service.contract.ts
│   ├── cognito-auth-service.contract.ts
│   ├── cognito-module.contract.ts
│   └── cognito-errors.contract.ts
└── checklists/
    └── requirements.md  # Specification quality checklist
```

### Source Code (repository root)

```text
libs/libs-aws/
├── package.json
├── tsconfig.json
├── tsconfig.lib.json
├── jest.config.js
├── README.md
├── src/
│   ├── cognito/
│   │   ├── cognito.module.ts
│   │   ├── cognito.service.ts
│   │   ├── cognito-auth.service.ts
│   │   ├── cognito.constants.ts
│   │   ├── cognito.types.ts
│   │   ├── cognito.module-definition.ts
│   │   ├── cognito.errors.ts
│   │   ├── cognito-secret-hash.ts
│   │   ├── cognito.service.spec.ts
│   │   └── cognito-auth.service.spec.ts
│   └── index.ts
```

**Structure Decision**:
`libs-aws` is established as an independent monorepo workspace package under `libs/libs-aws`, mirroring `@new-hros/libs-events` and `@new-hros/libs-core`. AWS Cognito is isolated in `src/cognito/`, ensuring future AWS services (e.g., `src/s3/`, `src/sqs/`, `src/sns/`, `src/ses/`) can be added without architectural disruptions.

---

## Complexity Tracking

*No constitution violations. Architecture uses standard NestJS dynamic modules and AWS SDK v3 patterns.*

---

## Implementation Phases & Detailed Steps

### Phase 1: Package Foundation & Monorepo Configuration
1. Create `libs/libs-aws/package.json` with `@new-hros/libs-aws` package name, dependencies (`@nestjs/common`, `@nestjs/core`, `@aws-sdk/client-cognito-identity-provider`, `rxjs`), and devDependencies.
2. Create `libs/libs-aws/tsconfig.json`, `libs/libs-aws/tsconfig.lib.json`, and `libs/libs-aws/jest.config.js`.
3. Update root `tsconfig.json` path mappings to include `"@new-hros/libs-aws": ["libs/libs-aws/src"]`.
4. Update root `package.json` build script to include building `@new-hros/libs-aws`.

### Phase 2: Types, Constants, Secret Hash & Error Handling
1. **`cognito.types.ts`**: Define `CognitoModuleOptions`, `CognitoModuleAsyncOptions`, `CognitoUserRecord`, `CognitoAuthResult`, `CognitoTokens`, `CognitoChallenge`, and input DTOs.
2. **`cognito.constants.ts`**: Define injection tokens (`COGNITO_MODULE_OPTIONS`, `COGNITO_CLIENT`), and token generation helper functions (`getCognitoClientToken`, `getCognitoServiceToken`, `getCognitoAuthServiceToken`).
3. **`cognito-secret-hash.ts`**: Implement `computeSecretHash(username, clientId, clientSecret)` using Node.js `node:crypto` HMAC-SHA256 with Base64 encoding.
4. **`cognito.errors.ts`**: Implement domain exception hierarchy extending `CognitoException` (`CognitoUserNotFoundException`, `CognitoNotAuthorizedException`, etc.) and `CognitoErrorMapper.map(error)`.

### Phase 3: Module Definition, DI Providers & Lifecycle
1. **`cognito.module-definition.ts`**: Implement `ConfigurableModuleBuilder` for `CognitoModuleOptions` with prefix `'Cognito'`.
2. **`cognito.module.ts`**:
   - Provide `forRoot(options)` and `forRootAsync(options)`.
   - Provide `CognitoIdentityProviderClient` factory respecting default credential chain and custom options.
   - Implement `OnApplicationShutdown` to invoke `.destroy()` on the client.
   - Register and export `CognitoService`, `CognitoAuthService`, and the client token.

### Phase 4: Administrative User Management (`CognitoService`)
1. Implement `CognitoService` wrapping AWS SDK v3 commands:
   - `createUser`, `getUser`, `listUsers`, `updateUser`, `deleteUser`, `enableUser`, `disableUser`, `setUserPassword`, `adminSignOut`.
2. Immutably enforce `userPoolId` on all command inputs.
3. Normalize Cognito attribute arrays (`AttributeType[]`) to clean key-value records.
4. Catch and translate AWS exceptions via `CognitoErrorMapper`.
5. Implement unit tests in `cognito.service.spec.ts` mocking the client.

### Phase 5: Client Authentication & Challenge Handling (`CognitoAuthService`)
1. Implement `CognitoAuthService` supporting:
   - `signUp`, `confirmSignUp`, `signIn` (`USER_PASSWORD_AUTH`), `refreshToken`, `respondToChallenge`, `forgotPassword`, `confirmForgotPassword`, `changePassword`, `signOut`.
2. Automatically compute `SECRET_HASH` when `clientSecret` is configured.
3. Handle both direct token returns and interactive challenge responses (`isChallenge: true`).
4. Catch and translate AWS exceptions via `CognitoErrorMapper`.
5. Ensure zero logging of cleartext passwords, tokens, or secrets.
6. Implement unit tests in `cognito-auth.service.spec.ts` mocking all authentication and challenge paths.

### Phase 6: Public API Exports & Verification
1. Export all public classes, interfaces, and helpers in `libs/libs-aws/src/index.ts`.
2. Run unit tests (`npm test -w @new-hros/libs-aws`) and verify >= 90% coverage.
3. Run TypeScript type checks and build (`npm run build -w @new-hros/libs-aws`).

---

## Risk Analysis & Mitigation

| Risk | Impact | Mitigation Strategy |
|---|---|---|
| **Multiple User Pools Provider Collision** | High | Dynamic module instances are not global; support explicit `instanceName` generating unique injection tokens (`getCognitoServiceToken(name)`). |
| **Secret Hash Omission for Secret Clients** | High | `CognitoAuthService` checks `options.clientSecret` and automatically computes `SECRET_HASH` for all public commands without caller intervention. |
| **Authentication Flow Halts on Challenge** | High | Return discriminated union `CognitoAuthResult` with `isChallenge: true`, preserving `challengeName`, `session`, and `challengeParameters` for `respondToChallenge()`. |
| **Token Rotation Failure** | Medium | `refreshToken()` explicitly requests fresh tokens using `REFRESH_TOKEN_AUTH` flow and forwards new access/ID/refresh tokens if rotated. |
| **Sensitive Data Exposure in Error Logs** | High | Custom error classes sanitize error messages; passwords and raw tokens are excluded from exception payloads and logs. |
| **Client Socket / Memory Leaks** | Medium | Reuse single client instance per module and implement `OnApplicationShutdown` to call `.destroy()`. |
