export const CONFIGURATION_OPTIONS = 'CONFIGURATION_OPTIONS';
export const CONFIGURATION_SERVICE = 'CONFIGURATION_SERVICE';

export class ConfigurationNotFoundException extends Error {
  constructor(path: string) {
    super(`[Configuration] Config path "${path}" was not found.`);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'ConfigurationNotFoundException';
  }
}

export class ConfigurationValidationException extends Error {
  constructor(public readonly errors: any[]) {
    super(`[Configuration] Validation failed: \n- ${errors.map(e => `${e.path.join('.')}: ${e.message}`).join('\n- ')}`);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'ConfigurationValidationException';
  }
}

export class InvalidConfigurationException extends Error {
  constructor(reason: string) {
    super(`[Configuration] Invalid configuration source: ${reason}`);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'InvalidConfigurationException';
  }
}
