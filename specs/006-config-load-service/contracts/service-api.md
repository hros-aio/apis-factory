# Configuration Module API Contracts

This contract document defines the public-facing API signatures, types, and behaviors of the `ConfigurationService` and `ConfigurationModule`.

---

## 1. ConfigurationService API

```typescript
export interface IConfigurationService {
  /**
   * Retrieves a configuration value by path.
   * Supports dot notation (e.g. 'database.host').
   * Returns undefined if key is not found.
   */
  get<T>(path: string): T | undefined;

  /**
   * Retrieves a configuration value by path.
   * Throws ConfigurationNotFoundException if key is not found or is undefined.
   */
  getOrThrow<T>(path: string): T;

  /**
   * Checks if a configuration path exists.
   */
  has(path: string): boolean;

  /**
   * Returns the entire active Configuration object.
   */
  all(): Configuration;

  /**
   * Reloads YAML config files from disk, runs validation,
   * and updates cache. Throws InvalidConfigurationException on validation failure.
   */
  reload(): void;

  /**
   * Helper check if active environment is production.
   */
  isProduction(): boolean;

  /**
   * Helper check if active environment is development.
   */
  isDevelopment(): boolean;

  /**
   * Helper check if active environment is test.
   */
  isTest(): boolean;
}
```

---

## 2. Integration Pattern Contracts

### 2.1 Module Import Contract

The `ConfigurationModule` is imported as a global module at the root module level:

```typescript
@Module({
  imports: [
    ConfigurationModule.register({
      configDir: 'config', // Path to YAML config directory
    }),
  ],
})
export class AppModule {}
```

### 2.2 Microservice Client Integrations

#### TypeORM Integration Contract

```typescript
TypeOrmModule.forRootAsync({
  imports: [ConfigurationModule],
  inject: [ConfigurationService],
  useFactory: (config: ConfigurationService) => ({
    type: 'postgres',
    host: config.get<string>('database.host'),
    port: config.get<number>('database.port'),
    username: config.get<string>('database.username'),
    password: config.get<string>('database.password'),
    database: config.get<string>('database.name'),
    autoLoadEntities: true,
    synchronize: !config.isProduction(),
  }),
})
```

#### Redis Integration Contract

```typescript
RedisModule.forRootAsync({
  imports: [ConfigurationModule],
  inject: [ConfigurationService],
  useFactory: (config: ConfigurationService) => ({
    config: {
      host: config.get<string>('redis.host'),
      port: config.get<number>('redis.port'),
    },
  }),
})
```

---

## 3. Custom Exceptions

### `ConfigurationNotFoundException`
- **Thrown when**: `getOrThrow` is invoked with a path that does not exist or resolves to undefined.
- **Message format**: `[Configuration] Config path "${path}" was not found.`

### `ConfigurationValidationException`
- **Thrown when**: Configuration validation fails during application bootstrap.
- **Payload**: Contains the list of validation errors from Zod.
- **Message format**: `[Configuration] Validation failed: \n- ${errorMessages.join('\n- ')}`

### `InvalidConfigurationException`
- **Thrown when**: Loading a malformed YAML file or a reload fails validation.
- **Message format**: `[Configuration] Invalid configuration source: ${reason}`
