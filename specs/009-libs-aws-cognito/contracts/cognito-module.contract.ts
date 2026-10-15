import { DynamicModule } from '@nestjs/common';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { CognitoModuleOptions, CognitoModuleAsyncOptions } from '../data-model';
import { ICognitoService } from './cognito-service.contract';
import { ICognitoAuthService } from './cognito-auth-service.contract';

export declare const COGNITO_MODULE_OPTIONS = 'COGNITO_MODULE_OPTIONS';
export declare const COGNITO_CLIENT = 'COGNITO_CLIENT';

export declare function getCognitoClientToken(instanceName?: string): string;
export declare function getCognitoServiceToken(instanceName?: string): string;
export declare function getCognitoAuthServiceToken(instanceName?: string): string;
export declare function getCognitoOptionsToken(instanceName?: string): string;

/**
 * Dynamic module contract for CognitoModule.
 */
export interface ICognitoModule {
  forRoot(options: CognitoModuleOptions): DynamicModule;
  forRootAsync(options: CognitoModuleAsyncOptions): DynamicModule;
}
