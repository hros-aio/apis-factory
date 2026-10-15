# Quickstart & Integration Validation Guide: libs-aws Cognito Integration

**Feature Branch**: `009-libs-aws-cognito`  
**Date**: 2026-10-15  
**Spec**: [spec.md](./spec.md) | **Contracts**: [contracts/](./contracts/)

---

## 1. Prerequisites & Environment Setup

### Required Package Installation
In a service consuming `@new-hros/libs-aws`:
```bash
# Add workspace dependency in the consuming application or library package.json
"@new-hros/libs-aws": "workspace:*"
```

### Environment Variables Example
```env
AWS_REGION=us-east-1
AWS_COGNITO_USER_POOL_ID=us-east-1_abcdef123
AWS_COGNITO_CLIENT_ID=1234567890abcdefghijklmnop
AWS_COGNITO_CLIENT_SECRET=s0m3s3cr3th4shs3cr3tk3y1234567890
# Credentials can use AWS default credential chain (IAM role, ECS task role, or env):
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...
```

---

## 2. Dynamic Module Setup

### Synchronous Setup (`forRoot`)
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

### Asynchronous Setup with ConfigService (`forRootAsync`)
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

## 3. Administrative User Management Verification (`CognitoService`)

```typescript
import { Injectable } from '@nestjs/common';
import { CognitoService } from '@new-hros/libs-aws';

@Injectable()
export class UserAdminExampleService {
  constructor(private readonly cognitoService: CognitoService) {}

  async createUserExample() {
    // 1. Create a user (User Pool ID is automatically applied)
    const user = await this.cognitoService.createUser({
      username: 'john.doe@example.com',
      temporaryPassword: 'TempPassword123!',
      userAttributes: {
        email: 'john.doe@example.com',
        given_name: 'John',
        family_name: 'Doe',
      },
    });

    // 2. Retrieve user
    const fetched = await this.cognitoService.getUser('john.doe@example.com');

    // 3. List users with pagination
    const page = await this.cognitoService.listUsers({ limit: 10 });

    // 4. Set permanent password
    await this.cognitoService.setUserPassword({
      username: 'john.doe@example.com',
      password: 'PermanentPassword456#',
      permanent: true,
    });

    return { created: user, fetched, page };
  }
}
```

---

## 4. End-User Authentication & Challenge Handling (`CognitoAuthService`)

```typescript
import { Injectable } from '@nestjs/common';
import { CognitoAuthService, CognitoAuthResult } from '@new-hros/libs-aws';

@Injectable()
export class AuthExampleService {
  constructor(private readonly cognitoAuthService: CognitoAuthService) {}

  async authenticateUser(username: string, password: string): Promise<CognitoAuthResult> {
    // Secret hash is automatically computed if clientSecret is configured
    const result = await this.cognitoAuthService.signIn({ username, password });

    if (result.isChallenge) {
      // Handle interactive challenge (e.g. NEW_PASSWORD_REQUIRED, SMS_MFA)
      console.log(`Challenge required: ${result.challenge.challengeName}`);
      return result;
    }

    // Direct token return
    console.log(`Access Token: ${result.tokens.accessToken}`);
    return result;
  }

  async refreshUserTokens(refreshToken: string, username?: string) {
    return this.cognitoAuthService.refreshToken({ refreshToken, username });
  }
}
```

---

## 5. Multi-Pool Configuration Verification

```typescript
import { Module } from '@nestjs/common';
import { CognitoModule, getCognitoServiceToken } from '@new-hros/libs-aws';

@Module({
  imports: [
    CognitoModule.forRoot({
      instanceName: 'AdminPool',
      region: 'us-east-1',
      userPoolId: 'us-east-1_adminPool',
    }),
    CognitoModule.forRoot({
      instanceName: 'CustomerPool',
      region: 'us-east-1',
      userPoolId: 'us-east-1_customerPool',
      clientId: 'customerAppClientId',
      clientSecret: 'customerAppClientSecret',
    }),
  ],
})
export class MultiPoolModule {}

// Injecting specific instances:
// @Inject(getCognitoServiceToken('AdminPool')) private readonly adminCognitoService: CognitoService
// @Inject(getCognitoServiceToken('CustomerPool')) private readonly customerCognitoService: CognitoService
```

---

## 6. Running Unit Tests

Execute the library's unit tests:
```bash
# Run unit tests specifically for libs-aws
npm test -w @new-hros/libs-aws

# Or run tests across all workspaces
npm test
```

Expected Outcome:
- All unit tests pass using mocked AWS SDK commands.
- Zero external HTTP network calls or real AWS credentials required.
- Coverage achieves >= 90% across statements and branches.
