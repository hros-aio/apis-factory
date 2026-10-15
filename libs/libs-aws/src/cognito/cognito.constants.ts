export const COGNITO_MODULE_OPTIONS = 'COGNITO_MODULE_OPTIONS';
export const COGNITO_CLIENT = 'COGNITO_CLIENT';
export const COGNITO_SERVICE = 'COGNITO_SERVICE';
export const COGNITO_AUTH_SERVICE = 'COGNITO_AUTH_SERVICE';

export function getCognitoOptionsToken(instanceName?: string): string {
  return instanceName ? `COGNITO_MODULE_OPTIONS_${instanceName}` : COGNITO_MODULE_OPTIONS;
}

export function getCognitoClientToken(instanceName?: string): string {
  return instanceName ? `COGNITO_CLIENT_${instanceName}` : COGNITO_CLIENT;
}

export function getCognitoServiceToken(instanceName?: string): string {
  return instanceName ? `COGNITO_SERVICE_${instanceName}` : COGNITO_SERVICE;
}

export function getCognitoAuthServiceToken(instanceName?: string): string {
  return instanceName ? `COGNITO_AUTH_SERVICE_${instanceName}` : COGNITO_AUTH_SERVICE;
}
