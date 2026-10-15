import { Test, TestingModule } from '@nestjs/testing';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { CognitoModule } from './cognito.module';
import { CognitoService } from './cognito.service';
import { CognitoAuthService } from './cognito-auth.service';
import {
  COGNITO_CLIENT,
  getCognitoServiceToken,
  getCognitoAuthServiceToken,
} from './cognito.constants';

describe('CognitoModule', () => {
  let moduleRef: TestingModule;

  afterEach(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  });

  it('should initialize synchronously with forRoot and register base token aliases', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        CognitoModule.forRoot({
          region: 'us-east-1',
          userPoolId: 'us-east-1_testPool',
          clientId: 'testClientId',
        }),
      ],
    }).compile();

    const service = moduleRef.get<CognitoService>(CognitoService);
    const authService = moduleRef.get<CognitoAuthService>(CognitoAuthService);
    const client = moduleRef.get<CognitoIdentityProviderClient>(COGNITO_CLIENT);
    const baseService = moduleRef.get<CognitoService>(getCognitoServiceToken());
    const baseAuthService = moduleRef.get<CognitoAuthService>(getCognitoAuthServiceToken());

    expect(service).toBeDefined();
    expect(authService).toBeDefined();
    expect(client).toBeDefined();
    expect(client).toBeInstanceOf(CognitoIdentityProviderClient);
    expect(baseService).toBe(service);
    expect(baseAuthService).toBe(authService);
  });

  it('should initialize asynchronously with forRootAsync using useFactory', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        CognitoModule.forRootAsync({
          useFactory: async () => ({
            region: 'us-west-2',
            userPoolId: 'us-west-2_asyncPool',
            clientId: 'asyncClientId',
            clientSecret: 'asyncSecret',
          }),
        }),
      ],
    }).compile();

    const service = moduleRef.get<CognitoService>(CognitoService);
    const authService = moduleRef.get<CognitoAuthService>(CognitoAuthService);
    const client = moduleRef.get<CognitoIdentityProviderClient>(COGNITO_CLIENT);

    expect(service).toBeDefined();
    expect(authService).toBeDefined();
    expect(client).toBeDefined();
  });

  it('should support explicit AWS credentials', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        CognitoModule.forRoot({
          region: 'us-east-1',
          userPoolId: 'us-east-1_credPool',
          credentials: {
            accessKeyId: 'mockKey',
            secretAccessKey: 'mockSecret',
          },
        }),
      ],
    }).compile();

    const client = moduleRef.get<CognitoIdentityProviderClient>(COGNITO_CLIENT);
    expect(client).toBeDefined();
  });

  it('should invoke destroy on client when application shuts down', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        CognitoModule.forRoot({
          region: 'us-east-1',
          userPoolId: 'us-east-1_testPool',
        }),
      ],
    }).compile();

    const client = moduleRef.get<CognitoIdentityProviderClient>(COGNITO_CLIENT);
    const destroySpy = jest.spyOn(client, 'destroy');

    await moduleRef.close();

    expect(destroySpy).toHaveBeenCalled();
  });

  it('should throw when userPoolId is not configured in CognitoService', async () => {
    await expect(
      Test.createTestingModule({
        imports: [
          CognitoModule.forRoot({
            region: 'us-east-1',
            userPoolId: '',
          }),
        ],
      }).compile(),
    ).rejects.toThrow('userPoolId must be configured in CognitoModuleOptions');
  });

  it('should support multiple User Pool registrations with distinct instanceNames', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        CognitoModule.forRoot({
          instanceName: 'PoolA',
          region: 'us-east-1',
          userPoolId: 'us-east-1_poolA',
        }),
        CognitoModule.forRootAsync({
          instanceName: 'PoolB',
          useFactory: () => ({
            region: 'us-east-1',
            userPoolId: 'us-east-1_poolB',
          }),
        }),
      ],
    }).compile();

    const serviceA = moduleRef.get<CognitoService>(getCognitoServiceToken('PoolA'));
    const serviceB = moduleRef.get<CognitoService>(getCognitoServiceToken('PoolB'));

    expect(serviceA).toBeDefined();
    expect(serviceB).toBeDefined();
    expect(serviceA).not.toBe(serviceB);
  });
});
