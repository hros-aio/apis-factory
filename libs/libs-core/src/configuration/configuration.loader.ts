import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { ConfigurationSchema } from './schemas/configuration.schema';
import { deepMerge } from './configuration.utils';
import { ConfigurationValidationException, InvalidConfigurationException } from './configuration.constants';

/**
 * Loads, deep-merges, and validates configurations from YAML files and process.env.
 * Throws exceptions on validation or parsing failure.
 */
export function loadAndValidateConfig(configDir: string): any {
  let yamlConfig = {};

  // 1. Load configuration from YAML files in the specified directory
  if (fs.existsSync(configDir)) {
    try {
      const files = fs.readdirSync(configDir);
      for (const file of files) {
        if (file.endsWith('.yaml') || file.endsWith('.yml')) {
          const filePath = path.join(configDir, file);
          const content = fs.readFileSync(filePath, 'utf8');
          const parsed = yaml.load(content);
          if (parsed && typeof parsed === 'object') {
            yamlConfig = deepMerge(yamlConfig, parsed);
          }
        }
      }
    } catch (err: any) {
      throw new InvalidConfigurationException(`Failed to parse configuration sources: ${err.message}`);
    }
  }

  // 2. Load and parse environment variable overrides
  const envConfig = parseEnvVariables();

  // 3. Deep merge YAML config and Environment overrides
  const mergedConfig = deepMerge(yamlConfig, envConfig);

  // 4. Validate against the schema
  const validationResult = ConfigurationSchema.safeParse(mergedConfig);
  if (!validationResult.success) {
    throw new ConfigurationValidationException(validationResult.error.issues);
  }

  return validationResult.data;
}

/**
 * Maps environment variables using double-underscore paths and fallback mappings.
 */
export function parseEnvVariables(): any {
  const config: any = {};

  // Standard environment mapping registry
  const mappings: { [key: string]: string } = {
    APP_NAME: 'app.name',
    APP_PORT: 'app.port',
    NODE_ENV: 'app.env',
    DATABASE_HOST: 'database.host',
    DATABASE_PORT: 'database.port',
    DATABASE_USERNAME: 'database.username',
    DATABASE_PASSWORD: 'database.password',
    DATABASE_NAME: 'database.name',
    REDIS_HOST: 'redis.host',
    REDIS_PORT: 'redis.port',
    JWT_PUBLIC_KEY: 'jwt.publicKey',
    JWT_PRIVATE_KEY: 'jwt.privateKey',
    KAFKA_BROKERS: 'kafka.brokers',
  };

  for (const [envKey, value] of Object.entries(process.env)) {
    if (value === undefined || value === '') continue;

    let targetPath: string | undefined = undefined;

    // Strategy 1: Double Underscores (e.g. DATABASE__HOST -> database.host)
    if (envKey.includes('__')) {
      targetPath = envKey.toLowerCase().replace(/__/g, '.');
    }
    // Strategy 2: Pre-defined mapping registry
    else if (mappings[envKey]) {
      targetPath = mappings[envKey];
    }

    if (targetPath) {
      setNestedProperty(
        config,
        targetPath,
        value,
        envKey === 'KAFKA_BROKERS' || envKey.toLowerCase().endsWith('__brokers')
      );
    }
  }

  return config;
}

/**
 * Sets a nested property in an object using a dot-notation path.
 */
function setNestedProperty(obj: any, path: string, value: string, isArray: boolean) {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part] || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }
  const lastPart = parts[parts.length - 1];

  if (isArray) {
    current[lastPart] = value.split(',').map(item => item.trim());
  } else {
    current[lastPart] = value;
  }
}
