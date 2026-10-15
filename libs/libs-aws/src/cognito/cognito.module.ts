import {
  DynamicModule,
  Injectable,
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
  getCognitoClientToken,
  getCognitoOptionsToken,
  getCognitoServiceToken,
  getCognitoAuthServiceToken,
} from './cognito.constants';
import { CognitoModuleOptions } from './cognito.types';
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

/**
 * Context-scoped manager that tracks and destroys the AWS Cognito client
 * when the owning application context shuts down.
 */
@Injectable()
export class CognitoClientManager implements OnApplicationShutdown {
  private client?: CognitoIdentityProviderClient;

  setClient(client: CognitoIdentityProviderClient): void {
    this.client = client;
  }

  getClient(): CognitoIdentityProviderClient | undefined {
    return this.client;
  }

  onApplicationShutdown(): void {
    if (this.client) {
      try {
        this.client.destroy();
      } catch {
        // Suppress cleanup errors
      }
    }
  }
}

@Module({})
export class CognitoModule
  extends ConfigurableModuleClass
  implements OnApplicationShutdown
{
  static forRoot(options: typeof COGNITO_OPTIONS_TYPE): DynamicModule {
    const dynamicModule = super.forRoot(options);
    return CognitoModule.enhanceModule(dynamicModule, options.instanceName);
  }

  static forRootAsync(options: typeof COGNITO_ASYNC_OPTIONS_TYPE): DynamicModule {
    const dynamicModule = super.forRootAsync(options);
    return CognitoModule.enhanceModule(dynamicModule, options.instanceName);
  }

  private static enhanceModule(
    dynamicModule: DynamicModule,
    instanceName?: string,
  ): DynamicModule {
    const clientManagerProvider: Provider = {
      provide: CognitoClientManager,
      useClass: CognitoClientManager,
    };

    const clientProvider: Provider = {
      provide: COGNITO_CLIENT,
      useFactory: (opts: CognitoModuleOptions, manager: CognitoClientManager) => {
        const client = createCognitoClient(opts);
        manager.setClient(client);
        return client;
      },
      inject: [COGNITO_MODULE_OPTIONS_TOKEN, CognitoClientManager],
    };

    const baseServiceToken = getCognitoServiceToken();
    const baseAuthServiceToken = getCognitoAuthServiceToken();

    const providers: Provider[] = [
      clientManagerProvider,
      clientProvider,
      CognitoService,
      CognitoAuthService,
      {
        provide: baseServiceToken,
        useExisting: CognitoService,
      },
      {
        provide: baseAuthServiceToken,
        useExisting: CognitoAuthService,
      },
    ];

    const exports: (Provider | string | symbol)[] = [
      clientManagerProvider,
      clientProvider,
      CognitoService,
      CognitoAuthService,
      COGNITO_CLIENT,
      COGNITO_MODULE_OPTIONS_TOKEN,
      baseServiceToken,
      baseAuthServiceToken,
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

  async onApplicationShutdown(): Promise<void> {
    // Delegated to context-scoped CognitoClientManager
  }
}
