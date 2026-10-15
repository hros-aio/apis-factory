import {
  DynamicModule,
  Module,
  OnApplicationShutdown,
  Provider,
} from '@nestjs/common';
import {
  CognitoIdentityProviderClient,
  CognitoIdentityProviderClientConfig,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  ConfigurableModuleClass,
  COGNITO_MODULE_OPTIONS_TOKEN,
  COGNITO_OPTIONS_TYPE,
  COGNITO_ASYNC_OPTIONS_TYPE,
} from './cognito.module-definition';
import {
  COGNITO_CLIENT,
  COGNITO_SERVICE,
  COGNITO_AUTH_SERVICE,
  getCognitoClientToken,
  getCognitoOptionsToken,
  getCognitoServiceToken,
  getCognitoAuthServiceToken,
} from './cognito.constants';
import { CognitoModuleOptions, CognitoModuleAsyncOptions } from './cognito.types';
import { CognitoService } from './cognito.service';
import { CognitoAuthService } from './cognito-auth.service';

function createCognitoClient(options: CognitoModuleOptions): CognitoIdentityProviderClient {
  const config: CognitoIdentityProviderClientConfig = {
    region: options.region,
    ...options.clientConfig,
  };

  if (options.credentials) {
    config.credentials = options.credentials;
  }
  // If credentials are omitted, the AWS SDK v3 default credential provider chain is used automatically

  return new CognitoIdentityProviderClient(config);
}

@Module({})
export class CognitoModule
  extends ConfigurableModuleClass
  implements OnApplicationShutdown
{
  private static readonly activeClients = new Set<CognitoIdentityProviderClient>();

  static forRoot(options: typeof COGNITO_OPTIONS_TYPE): DynamicModule {
    const dynamicModule = super.forRoot(options);
    return CognitoModule.enhanceModule(dynamicModule, options.instanceName);
  }

  static forRootAsync(options: typeof COGNITO_ASYNC_OPTIONS_TYPE): DynamicModule {
    const dynamicModule = super.forRootAsync(options);
    return CognitoModule.enhanceModule(dynamicModule, (options as { instanceName?: string }).instanceName);
  }

  private static enhanceModule(
    dynamicModule: DynamicModule,
    instanceName?: string,
  ): DynamicModule {
    const clientProvider: Provider = {
      provide: COGNITO_CLIENT,
      useFactory: (opts: CognitoModuleOptions) => {
        const client = createCognitoClient(opts);
        CognitoModule.activeClients.add(client);
        return client;
      },
      inject: [COGNITO_MODULE_OPTIONS_TOKEN],
    };

    const providers: Provider[] = [
      clientProvider,
      CognitoService,
      CognitoAuthService,
    ];

    const exports: (Provider | string | symbol)[] = [
      clientProvider,
      CognitoService,
      CognitoAuthService,
      COGNITO_CLIENT,
      COGNITO_MODULE_OPTIONS_TOKEN,
    ];

    // If multi-pool instanceName is provided, add named token aliases
    if (instanceName) {
      const namedOptionsToken = getCognitoOptionsToken(instanceName);
      const namedClientToken = getCognitoClientToken(instanceName);
      const namedServiceToken = getCognitoServiceToken(instanceName);
      const namedAuthServiceToken = getCognitoAuthServiceToken(instanceName);

      const namedProviders: Provider[] = [
        {
          provide: namedOptionsToken,
          useExisting: COGNITO_MODULE_OPTIONS_TOKEN,
        },
        {
          provide: namedClientToken,
          useExisting: COGNITO_CLIENT,
        },
        {
          provide: namedServiceToken,
          useExisting: CognitoService,
        },
        {
          provide: namedAuthServiceToken,
          useExisting: CognitoAuthService,
        },
      ];

      providers.push(...namedProviders);
      exports.push(
        namedOptionsToken,
        namedClientToken,
        namedServiceToken,
        namedAuthServiceToken,
      );
    }

    return {
      ...dynamicModule,
      providers: [...(dynamicModule.providers || []), ...providers],
      exports: [...(dynamicModule.exports || []), ...exports],
    };
  }

  /**
   * Cleans up all active AWS Cognito client connections on application shutdown.
   */
  async onApplicationShutdown(): Promise<void> {
    for (const client of CognitoModule.activeClients) {
      try {
        client.destroy();
      } catch {
        // Suppress cleanup errors
      }
    }
    CognitoModule.activeClients.clear();
  }
}
