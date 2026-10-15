# Feature Specification: AWS Integration Library with Cognito User Pools (libs-aws)

**Feature Branch**: `009-libs-aws-cognito`

**Created**: 2026-10-15

**Status**: Draft

**Input**: User description: "Build a production-ready, reusable AWS integration library named `libs-aws` within the existing NestJS codebase, initially focused on AWS Cognito User Pools using AWS SDK for JavaScript v3 and TypeScript."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dynamic Module Configuration and Lifecycle Management (Priority: P1)

As a backend engineer building a NestJS application or microservice, I want to configure and import the AWS Cognito module both synchronously (`forRoot`) and asynchronously (`forRootAsync`), supporting the default AWS credential provider chain or custom client configurations, with automated client cleanup on application shutdown, so that my service can integrate with Cognito reliably using standard dependency injection.

**Why this priority**: Dynamic module registration and dependency injection are the fundamental prerequisites for consuming any library service in NestJS, ensuring connection lifecycle management and zero hardcoded credentials.

**Independent Test**: Can be tested independently by importing `CognitoModule.forRoot({ ... })` and `CognitoModule.forRootAsync({ ... })` into a NestJS test context, resolving the client provider, verifying client configuration, and confirming that the client is properly destroyed upon application shutdown.

**Acceptance Scenarios**:

1. **Given** a valid synchronous configuration with region and user pool ID, **When** the module is imported via `CognitoModule.forRoot()`, **Then** the module registers `CognitoService` and `CognitoAuthService` providers and provides a shared `CognitoIdentityProviderClient` instance.
2. **Given** an asynchronous configuration using `useFactory` or `useExisting` with a configuration service, **When** the module is imported via `CognitoModule.forRootAsync()`, **Then** the options are resolved asynchronously and services are injected cleanly.
3. **Given** no explicit credentials provided in the module options, **When** the client is initialized, **Then** the AWS SDK default credential provider chain is utilized.
4. **Given** custom client options (such as custom endpoints, retry strategies, or timeouts), **When** the module initializes, **Then** the underlying AWS client applies the custom configurations.
5. **Given** an application lifecycle shutdown event (`onApplicationShutdown`), **When** the NestJS container shuts down, **Then** the module terminates and destroys the shared AWS client instance to release system resources.

---

### User Story 2 - Administrative User Pool Management (Priority: P1)

As an administrative service or identity management worker, I want a dedicated `CognitoService` to manage user accounts (create, get, list with pagination, update attributes, delete, enable, disable, set permanent/temporary passwords, and revoke sessions), with the configured User Pool ID automatically applied, so that administrative identity management operations are secure, type-safe, and immune to caller pool ID tampering.

**Why this priority**: Administrative user operations are essential for employee onboarding, lifecycle maintenance, access suspension, and backend directory management across the enterprise platform.

**Independent Test**: Can be tested by invoking `CognitoService` CRUD operations against a mock client, verifying that the configured User Pool ID is automatically attached to each AWS command and that responses match AWS SDK v3 specifications.

**Acceptance Scenarios**:

1. **Given** a user creation request with username, temporary password, and user attributes, **When** `createUser()` is invoked, **Then** `AdminCreateUserCommand` is executed with the configured User Pool ID and user attributes, and the created user record is returned.
2. **Given** a username, **When** `getUser()` is invoked, **Then** `AdminGetUserCommand` retrieves the user record with attributes and current status.
3. **Given** a request to list users with a limit and optional pagination token, **When** `listUsers()` is invoked, **Then** `ListUsersCommand` retrieves the users and returns the next pagination token if additional users exist.
4. **Given** updated attributes for an existing user, **When** `updateUser()` is invoked, **Then** `AdminUpdateUserAttributesCommand` applies the changes to the user within the configured pool.
5. **Given** a request to enable, disable, or delete a user, **When** `enableUser()`, `disableUser()`, or `deleteUser()` is invoked, **Then** the corresponding administrative command is dispatched with the target username.
6. **Given** a request to set a user password, **When** `setUserPassword()` is called with permanent or temporary flags, **Then** `AdminSetUserPasswordCommand` updates the password accordingly.
7. **Given** a request to sign out a user from all sessions, **When** `adminSignOut()` is invoked, **Then** `AdminUserGlobalSignOutCommand` invalidates all active tokens for that user.
8. **Given** an administrative command call, **When** the caller provides input, **Then** the configured User Pool ID is automatically and immutably set, preventing the caller from overriding or misdirecting the command to another pool.

---

### User Story 3 - Client Authentication and Challenge Workflows (Priority: P1)

As an authentication service or user-facing API, I want a separate `CognitoAuthService` supporting end-user authentication workflows (sign up, confirm sign up, sign in, challenge responses, token refresh, forgot/confirm password, change password, and sign out) with automatic HMAC-SHA256 client secret hash calculation, without exposing or logging sensitive credentials, so that client users can authenticate securely.

**Why this priority**: End-user authentication is the core gateway for user access, requiring strict adherence to AWS Cognito authentication flows, token handling, and cryptographic security.

**Independent Test**: Can be tested by executing `signUp`, `signIn`, challenge response, and `refreshToken` methods against a mock client, validating `SECRET_HASH` computation, challenge response preservation, and safe token handling without logging credentials.

**Acceptance Scenarios**:

1. **Given** an App Client configured with a client secret, **When** any public authentication method (`signIn`, `signUp`, etc.) is called, **Then** `SECRET_HASH` is automatically computed via HMAC-SHA256(username + clientId, clientSecret) and attached to the command payload.
2. **Given** an App Client configured without a client secret, **When** authentication methods are called, **Then** no `SECRET_HASH` is generated or attached.
3. **Given** valid credentials, **When** `signIn()` is called with `USER_PASSWORD_AUTH` flow, **Then** authentication tokens (`AccessToken`, `IdToken`, `RefreshToken`, expiration) are returned if authentication succeeds immediately.
4. **Given** a user requiring a password change or multi-factor authentication, **When** `signIn()` is executed, **Then** the challenge name (e.g., `NEW_PASSWORD_REQUIRED`, `SMS_MFA`), session identifier, and challenge parameters are preserved and returned to the caller.
5. **Given** a valid challenge response and session, **When** `respondToChallenge()` is invoked, **Then** `RespondToAuthChallengeCommand` is dispatched and subsequent challenge results or tokens are returned.
6. **Given** a valid refresh token, **When** `refreshToken()` is called, **Then** `InitiateAuthCommand` with `REFRESH_TOKEN_AUTH` flow is dispatched and new access/ID tokens are returned.
7. **Given** a user self-registration and confirmation code, **When** `signUp()` and `confirmSignUp()` are invoked, **Then** corresponding `SignUpCommand` and `ConfirmSignUpCommand` are executed.
8. **Given** a password reset request and reset code, **When** `forgotPassword()` and `confirmForgotPassword()` are invoked, **Then** password reset instructions are triggered and confirmed.
9. **Given** an active access token and new password, **When** `changePassword()` is invoked, **Then** `ChangePasswordCommand` updates the authenticated user's password.
10. **Given** an active access token, **When** `signOut()` is invoked, **Then** `GlobalSignOutCommand` revokes all active tokens for the session.
11. **Given** any authentication operation, **When** execution logs are produced, **Then** passwords, raw tokens, client secrets, and secret hashes are never emitted to logs.

---

### User Story 4 - Framework-Agnostic Centralized Error Mapping (Priority: P2)

As a consuming developer in either an HTTP REST service or an asynchronous microservice/worker, I want AWS Cognito errors mapped to typed domain error classes that preserve underlying error causes while hiding sensitive AWS internals, without being tightly coupled to NestJS HTTP exceptions, so that errors can be handled uniformly across different transport layers.

**Why this priority**: Applications use different transports (HTTP controllers, gRPC, Kafka consumers). Decoupling core errors from HTTP exceptions allows clean, centralized error handling and domain mapping.

**Independent Test**: Can be tested by simulating AWS SDK error responses (e.g., `UserNotFoundException`, `UsernameExistsException`, `NotAuthorizedException`, `CodeMismatchException`, `ExpiredCodeException`, `PasswordResetRequiredException`) and verifying that the corresponding typed domain error is thrown with original error cause preserved for internal inspection.

**Acceptance Scenarios**:

1. **Given** an AWS `UserNotFoundException`, **When** any Cognito operation fails, **Then** the service throws a typed `CognitoUserNotFoundException` containing the user identifier.
2. **Given** an AWS `NotAuthorizedException` (e.g., invalid password or expired session), **When** authentication fails, **Then** the service throws a typed `CognitoNotAuthorizedException` without leaking internal AWS stack details to external callers.
3. **Given** an AWS `UsernameExistsException`, **When** user creation or sign up fails, **Then** the service throws a typed `CognitoUserAlreadyExistsException`.
4. **Given** an AWS `CodeMismatchException` or `ExpiredCodeException`, **When** verification or confirmation fails, **Then** the service throws typed verification exceptions.
5. **Given** any mapped Cognito domain error, **When** inspected internally by logging or telemetry, **Then** the underlying original error cause is accessible via standard `cause` or diagnostic properties.
6. **Given** non-HTTP contexts (e.g., background message consumers), **When** errors are thrown, **Then** no HTTP-specific dependencies (`HttpException`, `HttpStatus`) are required or imported by the core error module.

---

### User Story 5 - Multi-Pool Support and Future Service Extensibility (Priority: P3)

As a platform architect managing multiple user pools (e.g., employee directory vs external client portal) and planning future AWS integrations (S3, SQS, SNS, SES), I want the library structured with modular namespaces and distinct provider injection tokens, so that multiple Cognito modules can be imported without provider collisions and future AWS services can be added under `libs-aws` seamlessly.

**Why this priority**: Enterprise multi-tenant architectures often segregate administrative users from end-customer accounts across different Cognito User Pools, and require a cohesive AWS integration footprint for cloud services.

**Independent Test**: Can be tested by registering two distinct `CognitoModule` instances with different pool configurations and custom injection tokens in a single NestJS testing module, verifying that each module resolves its respective client and services without collision.

**Acceptance Scenarios**:

1. **Given** an application needing access to two distinct Cognito User Pools, **When** configuring multiple module instances, **Then** independent tokens or named instances allow injecting both service instances without provider collision.
2. **Given** the overall `libs-aws` directory structure, **When** inspected, **Then** `cognito/` is isolated within its own subfolder and exported via the main library index, providing a clean pattern for future additions like `s3/`, `sqs/`, `sns/`, and `ses/`.

---

### Edge Cases

- **Missing Mandatory Config**: If `userPoolId` or `region` is omitted in `forRoot()` or `forRootAsync()`, the module throws a descriptive configuration validation error at startup.
- **Client Secret Hash for Secretless Clients**: If `clientSecret` is not provided, the HMAC-SHA256 secret hash generator is omitted entirely from command inputs without throwing errors.
- **Non-Token Authentication Responses**: If `InitiateAuth` returns a challenge (e.g., `NEW_PASSWORD_REQUIRED`, `SMS_MFA`, `SOFTWARE_TOKEN_MFA`) instead of an `AuthenticationResult`, the service returns a structured challenge response rather than null or an unexpected failure.
- **Refresh Token Rotation & Revocation**: If a refresh token has expired, been revoked, or rotated out, the error is mapped to `CognitoNotAuthorizedException` or `CognitoTokenExpiredException` with clear diagnostic context.
- **Empty or Truncated User Listings**: When `listUsers()` reaches the end of the user pool, `PaginationToken` is null/undefined, and an empty or partial list of users is returned safely.
- **Shutdown While Client is Inactive**: Invoking `onApplicationShutdown` on a module where the client was never used or already destroyed executes cleanly without unhandled rejections.
- **Sensitive Data Masking**: Log messages, error messages, and stringified representations of payloads never contain cleartext passwords, access tokens, refresh tokens, client secrets, or calculated secret hashes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The library MUST be organized as a workspace package under `libs/libs-aws` within the monorepo, exporting all public symbols through `libs/libs-aws/src/index.ts`.
- **FR-002**: The library MUST implement `CognitoModule` using NestJS Dynamic Modules supporting both synchronous `forRoot(options)` and asynchronous `forRootAsync(options)` registration.
- **FR-003**: The module MUST support configuration via NestJS `ConfigurableModuleBuilder` where compatible with NestJS v10.
- **FR-004**: The module MUST support the AWS SDK v3 default credential provider chain when explicit credentials are not provided in `CognitoModuleOptions`.
- **FR-005**: The module MUST support optional explicit AWS credentials, custom endpoints, and client configuration options passed via `CognitoModuleOptions`.
- **FR-006**: The module MUST instantiate a single `CognitoIdentityProviderClient` per configured module instance, managed via NestJS dependency injection.
- **FR-007**: The module MUST implement NestJS `OnApplicationShutdown` to properly invoke `.destroy()` on the `CognitoIdentityProviderClient` instance during application shutdown.
- **FR-008**: The module MUST support configuring multiple independent Cognito User Pools without provider or token collision when configured with custom instance identifiers.
- **FR-009**: The module MUST NOT mark modules as global by default, keeping encapsulation per consuming module.
- **FR-010**: `CognitoService` MUST implement administrative user operations: `createUser()`, `getUser()`, `listUsers()`, `updateUser()`, `deleteUser()`, `enableUser()`, `disableUser()`, `setUserPassword()`, and `adminSignOut()`.
- **FR-011**: `CognitoService` MUST automatically apply the configured `userPoolId` to all administrative command inputs, and MUST prevent callers from accidentally or maliciously overriding the pool ID.
- **FR-012**: `CognitoService.listUsers()` MUST support limit and pagination tokens for cursor-based user listing.
- **FR-013**: `CognitoAuthService` MUST implement end-user authentication operations: `signUp()`, `confirmSignUp()`, `signIn()`, `refreshToken()`, `respondToChallenge()`, `forgotPassword()`, `confirmForgotPassword()`, `changePassword()`, and `signOut()`.
- **FR-014**: `CognitoAuthService` MUST support App Clients both with and without client secrets.
- **FR-015**: When an App Client secret is configured, `CognitoAuthService` MUST automatically generate a valid `SECRET_HASH` using HMAC-SHA256 over the username and client ID.
- **FR-016**: `CognitoAuthService.signIn()` MUST support `USER_PASSWORD_AUTH` flow when enabled on the App Client.
- **FR-017**: `CognitoAuthService.signIn()` and `respondToChallenge()` MUST preserve and return authentication challenges (including `NEW_PASSWORD_REQUIRED`, `SMS_MFA`, `SOFTWARE_TOKEN_MFA`) when full tokens are not immediately issued.
- **FR-018**: `CognitoAuthService.refreshToken()` MUST use the appropriate Cognito refresh token flow and handle token rotation cleanly.
- **FR-019**: All operations MUST sanitize logging and NEVER log sensitive fields, including passwords, tokens, client secrets, or secret hashes.
- **FR-020**: The library MUST implement a centralized error mapper that catches AWS SDK Cognito exceptions and maps them to domain typed errors (e.g., `CognitoUserNotFoundException`, `CognitoNotAuthorizedException`, `CognitoUserAlreadyExistsException`, `CognitoInvalidPasswordException`, `CognitoInvalidCodeException`, `CognitoInternalException`).
- **FR-021**: Typed domain errors MUST preserve the underlying AWS exception cause for internal diagnostics while exposing safe, non-sensitive messages to callers.
- **FR-022**: The core library and its error classes MUST NOT depend on NestJS HTTP exceptions (`HttpException`, `HttpStatus`), enabling seamless use across HTTP apps and non-HTTP microservices/workers.
- **FR-023**: All AWS SDK v3 commands MUST use official AWS SDK v3 input and output types where appropriate.
- **FR-024**: The directory structure MUST isolate Cognito under `libs/libs-aws/src/cognito/` and expose a clean public API ready for future AWS services (e.g., S3, SQS, SNS, SES).

### Key Entities

- **CognitoModuleOptions**: Configuration object containing `region` (string), `userPoolId` (string), optional `clientId` (string), optional `clientSecret` (string), optional `credentials` (AWS credentials), optional `clientConfig` (CognitoIdentityProviderClientConfig), and optional `instanceName` (string) for multi-pool differentiation.
- **CognitoUserRecord**: Standardized entity representing a Cognito user, including `username`, `attributes` (key-value map or array of Name-Value pairs), `enabled` (boolean), `userStatus` (string), `createdAt` (Date), and `updatedAt` (Date).
- **CognitoAuthResult**: Union or structured entity representing the output of an authentication attempt, containing either an authenticated session (`accessToken`, `idToken`, `refreshToken`, `expiresIn`, `tokenType`) or an ongoing challenge (`challengeName`, `session`, `challengeParameters`).
- **CognitoChallengeResponse**: Data structure holding challenge parameters returned by Cognito when authentication requires additional interaction (e.g., initial password reset or MFA verification).
- **CognitoException**: Base class for all library errors extending standard JavaScript `Error`, containing an error `code`, message, and optional `cause`. Specialized subclasses include `CognitoUserNotFoundException`, `CognitoUserAlreadyExistsException`, `CognitoNotAuthorizedException`, `CognitoInvalidPasswordException`, `CognitoCodeMismatchException`, `CognitoCodeExpiredException`, and `CognitoInternalException`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of administrative user operations automatically apply the configured User Pool ID without permitting caller override.
- **SC-002**: 100% of authentication operations against secret-bearing App Clients correctly compute the HMAC-SHA256 `SECRET_HASH`, matching AWS Cognito signature validation.
- **SC-003**: Zero leakage (0 instances) of cleartext passwords, authentication tokens, client secrets, or secret hashes in application logs or unhandled error payloads.
- **SC-004**: Comprehensive unit tests cover 100% of the defined public API methods across module initialization, administrative user management, authentication flows, error mapping, and lifecycle hooks, achieving at least 90% branch and statement test coverage without requiring real AWS credentials or network access.
- **SC-005**: Zero regressions across existing codebase libraries (`libs-core`, `libs-events`, `libs-sql`, `libs-mongo`, `libs-apis`) and 100% clean compilation under strict TypeScript settings (`strict: true`).
- **SC-006**: Multiple distinct Cognito module configurations can be registered simultaneously in the same NestJS context without provider collision or state corruption.

## Assumptions

- The monorepo uses npm/pnpm workspaces with NestJS v10 and TypeScript 5.x.
- AWS SDK v3 package `@aws-sdk/client-cognito-identity-provider` will be added as a dependency in `libs/libs-aws/package.json`.
- The cryptographic HMAC-SHA256 secret hash is implemented using Node.js built-in `crypto` module, avoiding unnecessary external dependencies.
- Consuming HTTP applications may optionally implement their own NestJS `ExceptionFilter` to map the library's typed `CognitoException` domain errors into HTTP status codes (e.g., 404 for UserNotFound, 401 for NotAuthorized, 409 for UserAlreadyExists).
- Client credentials and pool configurations can be supplied via standard environment variables or NestJS `@nestjs/config` in consuming applications.
- Future AWS services (such as S3, SQS, SNS, SES) will reside in sibling directories under `libs/libs-aws/src/` (e.g., `libs/libs-aws/src/s3/`) and follow the same dynamic module and client lifecycle patterns.
