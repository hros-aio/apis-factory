# @new-hros/libs-aws

Production-ready, type-safe, dependency-injection-friendly AWS integration library for NestJS applications and microservices, built with **AWS SDK for JavaScript v3** and **TypeScript**.

Initially focused on **AWS Cognito User Pools**, the library is architected to cleanly support future AWS service integrations (such as S3, SQS, SNS, and SES) without structural changes.

---

## Features

- **NestJS Dynamic Modules**: Standard `forRoot()` and `forRootAsync()` registration using `ConfigurableModuleBuilder`.
- **Dependency Injection**: Shared `CognitoIdentityProviderClient` managed via DI.
- **Connection Lifecycle Management**: Reuses a single client per module and cleanly destroys AWS clients on application shutdown (`OnApplicationShutdown`).
- **Multi-Pool Isolation**: Run multiple isolated Cognito User Pools within a single application using custom instance names (`instanceName`) without provider collisions.
- **Administrative User Management (`CognitoService`)**:
  - `createUser`: Admin user creation with temporary passwords and custom attributes.
  - `getUser`: Retrieve user profile and normalized attributes.
  - `listUsers`: List users with pagination tokens and filtering.
  - `updateUser`: Update user attributes.
  - `deleteUser`: Admin delete user.
  - `enableUser` / `disableUser`: Activate or suspend user accounts.
  - `setUserPassword`: Set temporary or permanent user passwords.
  - `adminSignOut`: Globally invalidate user sessions.
  - **Immutable User Pool ID**: Automatically applied to all administrative calls, preventing callers from overriding or tampering with target pools.
- **End-User Authentication (`CognitoAuthService`)**:
  - `signUp` & `confirmSignUp`: User self-registration and confirmation code validation.
  - `signIn`: Public authentication with `USER_PASSWORD_AUTH`.
  - `refreshToken`: Token refresh flow supporting refresh token rotation.
  - `respondToChallenge`: Handle interactive challenges (`NEW_PASSWORD_REQUIRED`, `SMS_MFA`, `SOFTWARE_TOKEN_MFA`).
  - `forgotPassword` & `confirmForgotPassword`: Password recovery flows.
  - `changePassword`: Self-service password change with access token.
  - `signOut`: Global sign-out revoking all user tokens.
  - **Automated Secret Hash**: Automatic HMAC-SHA256 `SECRET_HASH` computation for App Clients configured with client secrets.
  - **Challenge Preservation**: Preserves challenge names, sessions, and parameters when authentication does not immediately issue tokens.
- **Centralized Error Handling**: Maps AWS Cognito exceptions to typed domain exceptions (`CognitoUserNotFoundException`, `CognitoNotAuthorizedException`, etc.) while preserving root causes in `.cause`.
- **Framework-Agnostic**: Decoupled from NestJS HTTP exceptions (`HttpException`), making the library equally suitable for HTTP REST APIs, gRPC, and message-driven microservices.
- **Security-First**: Strictly masks sensitive fields; passwords, tokens, client secrets, and secret hashes are never emitted to logs or exception strings.

---

## Installation

Add `@new-hros/libs-aws` to your application dependencies:

```json
{
  "dependencies": {
    "@new-hros/libs-aws": "^1.0.0",
    "@aws-sdk/client-cognito-identity-provider": "^3.500.0"
  }
}
```

---

## Configuration

### Environment Variables Example

```env
AWS_REGION=us-east-1
AWS_COGNITO_USER_POOL_ID=us-east-1_examplePool
AWS_COGNITO_CLIENT_ID=exampleappclientid12345
AWS_COGNITO_CLIENT_SECRET=examplesecretkey1234567890abcdef

# Credentials can use AWS default credential provider chain (IAM role, ECS task role, or env):
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...
```

---

## Usage

### 1. Synchronous Module Registration (`forRoot`)

```typescript
import { Module } from '@nestjs/common';
import { CognitoModule } from '@new-hros/libs-aws';

@Module({
  imports: [
    CognitoModule.forRoot({
      region: process.env.AWS_REGION || 'us-east-1',
      userPoolId: process.env.AWS_COGNITO_USER_POOL_ID!,
      clientId: process.env.AWS_COGNITO_CLIENT_ID,
      clientSecret: process.env.AWS_COGNITO_CLIENT_SECRET,
    }),
  ],
})
export class AuthModule {}
```

### 2. Asynchronous Module Registration (`forRootAsync`)

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CognitoModule } from '@new-hros/libs-aws';

@Module({
  imports: [
    CognitoModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        region: config.get<string>('AWS_REGION', 'us-east-1'),
        userPoolId: config.getOrThrow<string>('AWS_COGNITO_USER_POOL_ID'),
        clientId: config.get<string>('AWS_COGNITO_CLIENT_ID'),
        clientSecret: config.get<string>('AWS_COGNITO_CLIENT_SECRET'),
      }),
    }),
  ],
})
export class AuthModule {}
```

---

### 3. Administrative User Management (`CognitoService`)

```typescript
import { Injectable } from '@nestjs/common';
import { CognitoService } from '@new-hros/libs-aws';

@Injectable()
export class UserManagementService {
  constructor(private readonly cognitoService: CognitoService) {}

  async createUser() {
    // 1. Create a user (UserPoolId is automatically applied)
    const user = await this.cognitoService.createUser({
      username: 'john.doe@example.com',
      temporaryPassword: 'TempPassword123!',
      userAttributes: {
        email: 'john.doe@example.com',
        given_name: 'John',
        family_name: 'Doe',
      },
    });

    // 2. Fetch user details
    const fetched = await this.cognitoService.getUser('john.doe@example.com');

    // 3. List users with pagination
    const page = await this.cognitoService.listUsers({ limit: 20 });

    // 4. Set permanent password
    await this.cognitoService.setUserPassword({
      username: 'john.doe@example.com',
      password: 'PermanentPassword456#',
      permanent: true,
    });

    // 5. Global sign-out administratively
    await this.cognitoService.adminSignOut('john.doe@example.com');

    return { user, fetched, page };
  }
}
```

---

### 4. Client Authentication & Challenges (`CognitoAuthService`)

```typescript
import { Injectable } from '@nestjs/common';
import { CognitoAuthService, CognitoAuthResult } from '@new-hros/libs-aws';

@Injectable()
export class AuthenticationService {
  constructor(private readonly cognitoAuthService: CognitoAuthService) {}

  async authenticate(username: string, password: string): Promise<CognitoAuthResult> {
    // Automatically generates SECRET_HASH if clientSecret is configured
    const result = await this.cognitoAuthService.signIn({ username, password });

    if (result.isChallenge) {
      // User must satisfy challenge (e.g., NEW_PASSWORD_REQUIRED, SMS_MFA)
      console.log(`Challenge required: ${result.challenge.challengeName}`);
      return result;
    }

    // Direct token authentication
    console.log('Authentication successful');
    return result;
  }

  async respondToNewPasswordChallenge(session: string, username: string, newPassword: string) {
    return this.cognitoAuthService.respondToChallenge({
      challengeName: 'NEW_PASSWORD_REQUIRED',
      session,
      challengeResponses: {
        USERNAME: username,
        NEW_PASSWORD: newPassword,
      },
    });
  }

  async refreshToken(refreshToken: string, username?: string) {
    return this.cognitoAuthService.refreshToken({ refreshToken, username });
  }
}
```

---

### 5. Multi-Pool Support

To configure multiple distinct Cognito User Pools in the same application:

```typescript
import { Module, Injectable, Inject } from '@nestjs/common';
import {
  CognitoModule,
  getCognitoServiceToken,
  getCognitoAuthServiceToken,
  CognitoService,
  CognitoAuthService,
} from '@new-hros/libs-aws';

@Module({
  imports: [
    CognitoModule.forRoot({
      instanceName: 'AdminPool',
      region: 'us-east-1',
      userPoolId: 'us-east-1_adminPoolId',
    }),
    CognitoModule.forRoot({
      instanceName: 'CustomerPool',
      region: 'us-east-1',
      userPoolId: 'us-east-1_customerPoolId',
      clientId: 'customerAppClientId',
      clientSecret: 'customerAppClientSecret',
    }),
  ],
})
export class IdentityModule {}

// Injecting specific instances:
@Injectable()
export class MultiDirectoryService {
  constructor(
    @Inject(getCognitoServiceToken('AdminPool'))
    private readonly adminCognitoService: CognitoService,

    @Inject(getCognitoAuthServiceToken('CustomerPool'))
    private readonly customerCognitoAuthService: CognitoAuthService,
  ) {}
}
```

---

## Required IAM Permissions

For administrative operations via `CognitoService`, the IAM execution role must have permissions on the target User Pool ARN:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cognito-idp:AdminCreateUser",
        "cognito-idp:AdminGetUser",
        "cognito-idp:ListUsers",
        "cognito-idp:AdminUpdateUserAttributes",
        "cognito-idp:AdminDeleteUser",
        "cognito-idp:AdminEnableUser",
        "cognito-idp:AdminDisableUser",
        "cognito-idp:AdminSetUserPassword",
        "cognito-idp:AdminUserGlobalSignOut"
      ],
      "Resource": "arn:aws:cognito-idp:<region>:<account-id>:userpool/<user-pool-id>"
    }
  ]
}
```

Public authentication calls via `CognitoAuthService` interact with the Cognito App Client and do not require AWS IAM credentials if anonymous authentication is enabled on the pool.

---

## Security Considerations

1. **Credentials**: Never commit AWS credentials to source code. Use IAM roles for Amazon EC2 or ECS task execution roles in production.
2. **Secret Hash**: Secret hashes are calculated securely using native Node.js `node:crypto` HMAC-SHA256.
3. **Sensitive Data Masking**: Passwords, tokens, and client secrets are stripped from error logs and stringified objects.
4. **Pool Isolation**: `CognitoService` enforces the configured User Pool ID immutably, preventing cross-tenant pool tampering.

---

## Running Unit Tests

Hermetic unit tests with 100% mocked AWS SDK commands:

```bash
# Run tests for libs-aws
npm test -w @new-hros/libs-aws

# Run with coverage report
npm test -w @new-hros/libs-aws -- --coverage
```
