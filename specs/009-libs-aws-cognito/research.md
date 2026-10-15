# Architecture & Research Decisions: AWS Integration Library with Cognito (libs-aws)

**Feature Branch**: `009-libs-aws-cognito`  
**Date**: 2026-10-15  
**Spec**: [spec.md](./spec.md)

---

## 1. Monorepo Library Foundation & Package Architecture

### Decision
Create `@new-hros/libs-aws` in `libs/libs-aws` following the repository's existing monorepo conventions (`@new-hros/libs-core`, `@new-hros/libs-events`, `@new-hros/libs-sql`).

### Rationale
- The monorepo uses npm workspaces configured with `libs/*`.
- Root `package.json` coordinates workspace builds (`npm run build -w ...`).
- Root `tsconfig.json` defines path aliases (`@new-hros/libs-aws` pointing to `libs/libs-aws/src`).
- Isolating AWS integrations into a separate package prevents pulling heavy AWS dependencies into lightweight services that do not need cloud integrations.

### Alternatives Considered
- *Adding Cognito directly into `libs-core`*: Rejected because `libs-core` is foundational and should remain minimal without external cloud vendor SDK dependencies.
- *Creating a standalone repository outside `apis-factory`*: Rejected because the project architecture is a cohesive multi-tenant monorepo designed for shared library infrastructure.

---

## 2. NestJS Dynamic Module & ConfigurableModuleBuilder

### Decision
Use `ConfigurableModuleBuilder<CognitoModuleOptions>` from `@nestjs/common` as the core foundation in `cognito.module-definition.ts`, customized with `.setClassPrefix('Cognito')` and extended in `cognito.module.ts` to provide standard `forRoot()` and `forRootAsync()`.

### Rationale
- NestJS 10 provides `ConfigurableModuleBuilder` to standardize dynamic module creation, async factory resolution, and options injection tokens.
- Using `.setClassPrefix('Cognito')` generates typed `COGNITO_MODULE_OPTIONS`, `CognitoOptionsFactory`, `CognitoModuleAsyncOptions`, and `ConfigurableModuleClass`.
- Customizing `CognitoModule` methods (`forRoot`, `forRootAsync`) ensures ergonomic API semantics while maintaining strict TypeScript types and compatibility.

### Multi-Pool Support Strategy
To support multiple Cognito User Pools without provider collisions:
1. Dynamic modules are not decorated with `@Global()`, ensuring each consuming module receives an isolated provider scope by default.
2. In addition, `CognitoModuleOptions` accepts an optional `instanceName?: string`.
3. When `instanceName` is provided, custom injection tokens are derived via helper functions:
   - `getCognitoClientToken(name?: string)`
   - `getCognitoServiceToken(name?: string)`
   - `getCognitoAuthServiceToken(name?: string)`
4. This enables a single consuming module to inject multiple distinct User Pools (e.g., `CustomerPool` and `AdminPool`) via `@Inject(getCognitoServiceToken('AdminPool'))`.

---

## 3. AWS Client Lifecycle & Resource Management

### Decision
Provide `CognitoIdentityProviderClient` as a shared singleton provider within the module instance and implement `OnApplicationShutdown` to call `.destroy()` on shutdown.

### Rationale
- AWS SDK v3 clients maintain internal HTTP connection pools, sockets, and keep-alive agents.
- Creating a new client per request causes socket exhaustion, memory leaks, and latency penalties.
- Reusing a single client per module instance maximizes connection reuse.
- Implementing NestJS `OnApplicationShutdown` ensures clean termination of sockets and active handlers when the Node.js process receives `SIGTERM` or `SIGINT`.

### Credential Resolution Strategy
- Support the AWS SDK default credential provider chain:
  - If `options.credentials` is omitted, the client is initialized without explicit credentials, letting the AWS SDK v3 chain resolve credentials from environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`), ECS container metadata, or EC2 instance profile roles.
  - If `options.credentials` is provided, it is passed directly to the client configuration.
  - Custom endpoint (e.g., LocalStack), region, and other `CognitoIdentityProviderClientConfig` properties are forwarded safely.

---

## 4. Administrative User Management (CognitoService)

### Decision
Encapsulate all administrative operations in `CognitoService`, using AWS SDK v3 command classes with the configured `userPoolId` applied automatically and immutably.

### Operations Covered
- `createUser(input)`: `AdminCreateUserCommand`
- `getUser(username)`: `AdminGetUserCommand`
- `listUsers(input)`: `ListUsersCommand` (supporting `Limit` and `PaginationToken`)
- `updateUser(username, userAttributes)`: `AdminUpdateUserAttributesCommand`
- `deleteUser(username)`: `AdminDeleteUserCommand`
- `enableUser(username)`: `AdminEnableUserCommand`
- `disableUser(username)`: `AdminDisableUserCommand`
- `setUserPassword(username, password, permanent)`: `AdminSetUserPasswordCommand`
- `adminSignOut(username)`: `AdminUserGlobalSignOutCommand`

### Security Enforcement
- The caller input type omits `UserPoolId` (`Omit<AdminCreateUserInput, 'UserPoolId'>`).
- The method implementation merges the input with `{ UserPoolId: this.options.userPoolId }`, strictly preventing callers from bypassing or redirecting queries across pools.

---

## 5. End-User Authentication & Secret Hash Handling (CognitoAuthService)

### Decision
Encapsulate public and user-facing authentication flows in a separate `CognitoAuthService`, with automated HMAC-SHA256 `SECRET_HASH` calculation.

### Operations Covered
- `signUp(input)`: `SignUpCommand`
- `confirmSignUp(input)`: `ConfirmSignUpCommand`
- `signIn(input)`: `InitiateAuthCommand` (`AuthFlow: 'USER_PASSWORD_AUTH'`)
- `refreshToken(refreshToken, username?)`: `InitiateAuthCommand` (`AuthFlow: 'REFRESH_TOKEN_AUTH'`)
- `respondToChallenge(input)`: `RespondToAuthChallengeCommand`
- `forgotPassword(input)`: `ForgotPasswordCommand`
- `confirmForgotPassword(input)`: `ConfirmForgotPasswordCommand`
- `changePassword(accessToken, previousPassword, proposedPassword)`: `ChangePasswordCommand`
- `signOut(accessToken)`: `GlobalSignOutCommand`

### Secret Hash Implementation
- Formula: `Base64(HMAC-SHA256(clientSecret, username + clientId))`
- Implemented using Node.js standard `node:crypto` (`createHmac('sha256', secret).update(message).digest('base64')`).
- Automatically attached to `AuthParameters` or command parameters if `clientSecret` is configured in `options`.
- If `clientSecret` is undefined, `SECRET_HASH` is omitted completely.

### Authentication Challenge Preservation
- Cognito `InitiateAuth` and `RespondToAuthChallenge` do not always return authentication tokens. When passwords must be changed (`NEW_PASSWORD_REQUIRED`) or MFA is active (`SMS_MFA`, `SOFTWARE_TOKEN_MFA`), Cognito returns `ChallengeName`, `Session`, and `ChallengeParameters`.
- `CognitoAuthService` preserves this structure in the returned `CognitoAuthResult`, allowing consumers to detect the challenge and invoke `respondToChallenge()` with the session ID.

### Token Rotation
- Rotating clients use `GetTokensFromRefreshTokenCommand`, passing `RefreshToken`, `ClientId`, and `ClientSecret` directly without requiring `SECRET_HASH` or username computation. When token rotation is enabled on the Cognito App Client, this operation issues a fresh `RefreshToken` alongside new `IdToken` and `AccessToken`, invalidating the original refresh token after the configured grace period.
- Non-rotating clients retain `InitiateAuthCommand` with `AuthFlow: 'REFRESH_TOKEN_AUTH'`, computing HMAC-SHA256 `SECRET_HASH` when `clientSecret` and username are provided. If `clientSecret` is configured without username, the service seamlessly delegates to `GetTokensFromRefreshTokenCommand` which accepts `ClientSecret` directly.
- The service returns all issued tokens transparently.

---

## 6. Centralized Error Handling & Exception Architecture

### Decision
Implement a centralized error mapper in `cognito.errors.ts` mapping AWS SDK Cognito exceptions into typed domain exceptions extending `CognitoException` (which extends JavaScript `Error`).

### Error Hierarchy
- `CognitoException` (Base error class with `code`, `message`, `cause`)
  - `CognitoUserNotFoundException` (Code: `USER_NOT_FOUND`)
  - `CognitoUserAlreadyExistsException` (Code: `USER_ALREADY_EXISTS`)
  - `CognitoNotAuthorizedException` (Code: `NOT_AUTHORIZED`)
  - `CognitoInvalidPasswordException` (Code: `INVALID_PASSWORD`)
  - `CognitoCodeMismatchException` (Code: `CODE_MISMATCH`)
  - `CognitoCodeExpiredException` (Code: `CODE_EXPIRED`)
  - `CognitoPasswordResetRequiredException` (Code: `PASSWORD_RESET_REQUIRED`)
  - `CognitoUserNotConfirmedException` (Code: `USER_NOT_CONFIRMED`)
  - `CognitoInternalException` (Code: `INTERNAL_ERROR`)

### Framework-Agnostic Principle
- Core error classes do NOT extend `@nestjs/common`'s `HttpException`.
- This ensures zero coupling to HTTP semantics, making `libs-aws` fully usable in Kafka workers, event subscribers, and CLI tools.
- Original errors are attached to the `cause` property for structured logging, while masking sensitive details in the exposed error message.

---

## 7. Testing & Mocking Strategy

### Decision
Use Jest unit tests with mock instances of `CognitoIdentityProviderClient`, validating commands, parameter structures, secret hash computation, and error mappings.

### Rationale
- Unit tests must be hermetic and execute without AWS network access or credentials.
- `aws-sdk-client-mock` or standard Jest function mocks (`jest.spyOn(client, 'send')`) allow simulating all AWS command inputs and outputs with high fidelity.
- Covers 100% of methods, edge cases, error branches, and lifecycle hooks.
