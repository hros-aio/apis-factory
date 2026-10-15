import { ConfigurableModuleBuilder } from '@nestjs/common';
import { CognitoModuleOptions } from './cognito.types';

export const {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN: COGNITO_MODULE_OPTIONS_TOKEN,
  ASYNC_OPTIONS_TYPE: COGNITO_ASYNC_OPTIONS_TYPE,
  OPTIONS_TYPE: COGNITO_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<CognitoModuleOptions>({ moduleName: 'Cognito' })
  .setClassMethodName('forRoot')
  .build();
