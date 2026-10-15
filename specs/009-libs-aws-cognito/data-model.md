# Data Model & Type Definitions: AWS Cognito Integration (libs-aws)

**Feature Branch**: `009-libs-aws-cognito`  
**Date**: 2026-10-15  
**Spec**: [spec.md](./spec.md)

---

## 1. Module Configuration Entities

### `CognitoModuleOptions`
Primary configuration object passed synchronously to `CognitoModule.forRoot()`.

| Field | Type | Required | Description |
|---|---|---|---|
| `region` | `string` | Yes | AWS region (e.g. `'us-east-1'`, `'ap-southeast-1'`) |
| `userPoolId` | `string` | Yes | Target Cognito User Pool ID |
| `clientId` | `string` | No | Target Cognito App Client ID (required for public auth flows) |
| `clientSecret` | `string` | No | Cognito App Client secret (if App Client generates a secret) |
| `credentials` | `AwsCredentialIdentity` | No | Optional explicit AWS credentials (`accessKeyId`, `secretAccessKey`, `sessionToken`) |
| `clientConfig` | `Partial<CognitoIdentityProviderClientConfig>` | No | Optional AWS SDK v3 client overrides (custom endpoint, maxRetries, etc.) |
| `instanceName` | `string` | No | Distinct identifier when running multiple User Pool instances in the same application |

### `CognitoModuleAsyncOptions`
Options object for asynchronous module registration via `CognitoModule.forRootAsync()`.

| Field | Type | Required | Description |
|---|---|---|---|
| `useFactory` | `(...args: any[]) => Promise<CognitoModuleOptions> \| CognitoModuleOptions` | Conditional | Factory producing configuration |
| `useClass` | `Type<CognitoOptionsFactory>` | Conditional | Class implementing `createCognitoOptions()` |
| `useExisting` | `Type<CognitoOptionsFactory>` | Conditional | Existing provider implementing `createCognitoOptions()` |
| `inject` | `any[]` | No | Array of dependencies to inject into `useFactory` |
| `imports` | `any[]` | No | Modules to import to satisfy injected dependencies |
| `instanceName` | `string` | No | Distinct identifier for multi-pool differentiation |

---

## 2. User & Attribute Entities

### `CognitoUserRecord`
Domain representation of a Cognito user returned from administrative operations.

| Field | Type | Required | Description |
|---|---|---|---|
| `username` | `string` | Yes | Username or external identifier |
| `attributes` | `Record<string, string>` | Yes | Normalized key-value map of user attributes (e.g., `email`, `sub`, `custom:tenant_code`) |
| `enabled` | `boolean` | Yes | Whether the user account is active |
| `userStatus` | `CognitoUserStatus` | Yes | Current lifecycle status (`UNCONFIRMED`, `CONFIRMED`, `ARCHIVED`, `COMPROMISED`, `RESET_REQUIRED`, `FORCE_CHANGE_PASSWORD`) |
| `userCreateDate` | `Date` | No | User creation timestamp |
| `userLastModifiedDate` | `Date` | No | Last update timestamp |

### `CognitoUserStatus`
Enum / Union type:
`'UNCONFIRMED' | 'CONFIRMED' | 'ARCHIVED' | 'COMPROMISED' | 'RESET_REQUIRED' | 'FORCE_CHANGE_PASSWORD' | 'UNKNOWN'`

### `PaginatedUserList`
Result returned by `CognitoService.listUsers()`.

| Field | Type | Required | Description |
|---|---|---|---|
| `users` | `CognitoUserRecord[]` | Yes | Array of user records for the current page |
| `paginationToken` | `string \| undefined` | No | Opaque cursor token to fetch the subsequent page |

---

## 3. Authentication & Challenge Entities

### `CognitoTokens`
Payload returned upon successful authentication.

| Field | Type | Required | Description |
|---|---|---|---|
| `accessToken` | `string` | Yes | JWT Access Token |
| `idToken` | `string` | Yes | JWT ID Token containing user identity claims |
| `refreshToken` | `string \| undefined` | No | Refresh Token for session renewal (if issued) |
| `expiresIn` | `number` | Yes | Token validity lifetime in seconds |
| `tokenType` | `string` | Yes | Typically `'Bearer'` |

### `CognitoChallenge`
Payload returned when authentication encounters an interactive challenge.

| Field | Type | Required | Description |
|---|---|---|---|
| `challengeName` | `CognitoChallengeName` | Yes | Specific challenge type |
| `session` | `string` | Yes | Opaque session string required for challenge response |
| `challengeParameters` | `Record<string, string>` | Yes | Metadata and parameters required to satisfy challenge |

### `CognitoChallengeName`
Union type:
`'NEW_PASSWORD_REQUIRED' | 'SMS_MFA' | 'SOFTWARE_TOKEN_MFA' | 'SELECT_MFA_TYPE' | 'MFA_SETUP' | 'PASSWORD_VERIFIER' | 'CUSTOM_CHALLENGE' | string`

### `CognitoAuthResult`
Discriminated union representing either tokens or an active challenge:
```typescript
export type CognitoAuthResult =
  | { isChallenge: false; tokens: CognitoTokens }
  | { isChallenge: true; challenge: CognitoChallenge };
```

---

## 4. Error Hierarchy

```text
Error (native JS Error)
└── CognitoException (base domain exception with code, message, cause)
    ├── CognitoUserNotFoundException (Code: USER_NOT_FOUND)
    ├── CognitoUserAlreadyExistsException (Code: USER_ALREADY_EXISTS)
    ├── CognitoNotAuthorizedException (Code: NOT_AUTHORIZED)
    ├── CognitoInvalidPasswordException (Code: INVALID_PASSWORD)
    ├── CognitoCodeMismatchException (Code: CODE_MISMATCH)
    ├── CognitoCodeExpiredException (Code: CODE_EXPIRED)
    ├── CognitoPasswordResetRequiredException (Code: PASSWORD_RESET_REQUIRED)
    ├── CognitoUserNotConfirmedException (Code: USER_NOT_CONFIRMED)
    └── CognitoInternalException (Code: INTERNAL_ERROR)
```

Each exception constructor accepts `(message: string, cause?: unknown)`.
