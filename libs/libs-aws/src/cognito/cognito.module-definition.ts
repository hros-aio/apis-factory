import { ConfigurableModuleBuilder } from '@nestjs/common';
import { CognitoModuleOptions } from './cognito.types';

export interface CognitoModuleExtras {
  /** Optional instance identifier for multi-pool differentiation at registration level */
  instanceName?: string;
}

export const {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN: COGNITO_MODULE_OPTIONS_TOKEN,
  ASYNC_OPTIONS_TYPE: COGNITO_ASYNC_OPTIONS_TYPE,
  OPTIONS_TYPE: COGNITO_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<CognitoModuleOptions>({
  moduleName: 'Cognito',
  alwaysTransient: true,
})
  .setClassMethodName('forRoot')
  .setExtras<CognitoModuleExtras>(
    { instanceName: undefined },
    (definition, extras) => ({
      ...definition,
      instanceName: extras.instanceName,
    }),
  )
  .build();
