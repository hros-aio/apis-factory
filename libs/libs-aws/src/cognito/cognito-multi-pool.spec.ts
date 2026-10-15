import { Test, TestingModule } from '@nestjs/testing';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { CognitoModule } from './cognito.module';
import { CognitoService } from './cognito.service';
import {
  getCognitoServiceToken,
  getCognitoClientToken,
  getCognitoOptionsToken,
} from './cognito.constants';
import { CognitoModuleOptions } from './cognito.types';

describe('CognitoModule Multi-Pool Isolation', () => {
  let moduleRef: TestingModule;

  afterEach(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  });

  it('should support registering multiple independent Cognito User Pools without provider collision', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        CognitoModule.forRoot({
          instanceName: 'AdminPool',
          region: 'us-east-1',
          userPoolId: 'us-east-1_admin123',
        }),
        CognitoModule.forRoot({
          instanceName: 'CustomerPool',
          region: 'us-west-2',
          userPoolId: 'us-west-2_customer456',
          clientId: 'customerAppClient',
        }),
      ],
    }).compile();

    const adminOptions = moduleRef.get<CognitoModuleOptions>(
      getCognitoOptionsToken('AdminPool'),
    );
    const customerOptions = moduleRef.get<CognitoModuleOptions>(
      getCognitoOptionsToken('CustomerPool'),
    );

    expect(adminOptions).toBeDefined();
    expect(customerOptions).toBeDefined();
    expect(adminOptions.userPoolId).toBe('us-east-1_admin123');
    expect(customerOptions.userPoolId).toBe('us-west-2_customer456');

    const adminClient = moduleRef.get<CognitoIdentityProviderClient>(
      getCognitoClientToken('AdminPool'),
    );
    const customerClient = moduleRef.get<CognitoIdentityProviderClient>(
      getCognitoClientToken('CustomerPool'),
    );

    expect(adminClient).toBeDefined();
    expect(customerClient).toBeDefined();

    const adminService = moduleRef.get<CognitoService>(
      getCognitoServiceToken('AdminPool'),
    );
    const customerService = moduleRef.get<CognitoService>(
      getCognitoServiceToken('CustomerPool'),
    );

    expect(adminService).toBeDefined();
    expect(customerService).toBeDefined();
  });
});
