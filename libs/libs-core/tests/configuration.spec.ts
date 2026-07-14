import * as fs from 'fs';
import * as path from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ConfigurationModule,
  ConfigurationService,
  ConfigurationValidationException,
  InvalidConfigurationException,
  ConfigurationNotFoundException,
} from '../src/configuration';

describe('ConfigurationModule', () => {
  const tmpConfigDir = path.join(__dirname, 'tmp-config');

  const validAppYaml = `
app:
  name: test-app
  port: 4000
  env: test
`;

  const validDbYaml = `
database:
  host: db-host
  port: 5432
  username: pg-user
  password: pg-password
`;

  const validRedisYaml = `
redis:
  host: redis-host
  port: 6379
`;

  const validKafkaYaml = `
kafka:
  brokers:
    - kafka-1:9092
    - kafka-2:9092
`;

  const validJwtYaml = `
jwt:
  publicKey: pub-key
  privateKey: priv-key
`;

  beforeAll(() => {
    fs.mkdirSync(tmpConfigDir, { recursive: true });
  });

  afterAll(() => {
    fs.rmSync(tmpConfigDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    // Clear relevant environment variables
    const keysToClear = [
      'APP_NAME',
      'APP_PORT',
      'DATABASE_HOST',
      'DATABASE_PORT',
      'DATABASE_USERNAME',
      'DATABASE_PASSWORD',
      'DATABASE_NAME',
      'REDIS_HOST',
      'REDIS_PORT',
      'JWT_PUBLIC_KEY',
      'JWT_PRIVATE_KEY',
      'KAFKA_BROKERS',
      'DATABASE__HOST',
      'DATABASE__PORT',
    ];
    for (const key of keysToClear) {
      delete process.env[key];
    }
    process.env.NODE_ENV = 'test';
    // Write valid base files
    fs.writeFileSync(path.join(tmpConfigDir, 'app.yaml'), validAppYaml);
    fs.writeFileSync(path.join(tmpConfigDir, 'database.yaml'), validDbYaml);
    fs.writeFileSync(path.join(tmpConfigDir, 'redis.yaml'), validRedisYaml);
    fs.writeFileSync(path.join(tmpConfigDir, 'kafka.yaml'), validKafkaYaml);
    fs.writeFileSync(path.join(tmpConfigDir, 'jwt.yaml'), validJwtYaml);
  });

  describe('1. Layered Loading & Merging', () => {
    it('should successfully load and merge all YAML files', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [ConfigurationModule.register({ configDir: tmpConfigDir })],
      }).compile();

      const service = module.get<ConfigurationService>(ConfigurationService);
      expect(service.get('app.name')).toBe('test-app');
      expect(service.get('database.host')).toBe('db-host');
      expect(service.get('redis.host')).toBe('redis-host');
      expect(service.get('kafka.brokers')).toEqual(['kafka-1:9092', 'kafka-2:9092']);
    });

    it('should override YAML values with environment variables (Double Underscore)', async () => {
      process.env.DATABASE__HOST = 'env-db-host';
      process.env.DATABASE__PORT = '9999';

      const module: TestingModule = await Test.createTestingModule({
        imports: [ConfigurationModule.register({ configDir: tmpConfigDir })],
      }).compile();

      const service = module.get<ConfigurationService>(ConfigurationService);
      expect(service.get('database.host')).toBe('env-db-host');
      expect(service.get('database.port')).toBe(9999); // Coerced to number by Zod
    });

    it('should override YAML values with standard mapped environment variables', async () => {
      process.env.DATABASE_HOST = 'env-db-host-mapped';
      process.env.DATABASE_PORT = '8888';

      const module: TestingModule = await Test.createTestingModule({
        imports: [ConfigurationModule.register({ configDir: tmpConfigDir })],
      }).compile();

      const service = module.get<ConfigurationService>(ConfigurationService);
      expect(service.get('database.host')).toBe('env-db-host-mapped');
      expect(service.get('database.port')).toBe(8888);
    });

    it('should handle array parsing for KAFKA_BROKERS', async () => {
      process.env.KAFKA_BROKERS = 'kafka-env-1:9092, kafka-env-2:9092';

      const module: TestingModule = await Test.createTestingModule({
        imports: [ConfigurationModule.register({ configDir: tmpConfigDir })],
      }).compile();

      const service = module.get<ConfigurationService>(ConfigurationService);
      expect(service.get('kafka.brokers')).toEqual(['kafka-env-1:9092', 'kafka-env-2:9092']);
    });

    it('should load environment variables from envPath using dotenv if the file exists', async () => {
      const tmpEnvPath = path.join(tmpConfigDir, '.env');
      fs.writeFileSync(tmpEnvPath, 'DATABASE__PORT=7777\nAPP_PORT=3333');

      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigurationModule.register({
            configDir: tmpConfigDir,
            envPath: tmpEnvPath,
          }),
        ],
      }).compile();

      const service = module.get<ConfigurationService>(ConfigurationService);
      expect(service.get('database.port')).toBe(7777);
      expect(service.get('app.port')).toBe(3333);

      fs.unlinkSync(tmpEnvPath);
    });

    it('should update environment variables on reload when the envPath file is updated', async () => {
      const tmpEnvPath = path.join(tmpConfigDir, '.env');
      fs.writeFileSync(tmpEnvPath, 'DATABASE__PORT=7777\nAPP_PORT=3333');

      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigurationModule.register({
            configDir: tmpConfigDir,
            envPath: tmpEnvPath,
          }),
        ],
      }).compile();

      const service = module.get<ConfigurationService>(ConfigurationService);
      expect(service.get('database.port')).toBe(7777);

      fs.writeFileSync(tmpEnvPath, 'DATABASE__PORT=8888\nAPP_PORT=3333');
      service.reload();

      expect(service.get('database.port')).toBe(8888);

      fs.unlinkSync(tmpEnvPath);
    });
  });

  describe('2. Validation & Fail-fast', () => {
    it('should not throw on missing optional privateKey', async () => {
      fs.writeFileSync(
        path.join(tmpConfigDir, 'jwt.yaml'),
        `
jwt:
  publicKey: pub-key
`
      );

      const module: TestingModule = await Test.createTestingModule({
        imports: [ConfigurationModule.register({ configDir: tmpConfigDir })],
      }).compile();

      const service = module.get<ConfigurationService>(ConfigurationService);
      expect(service.get('jwt.publicKey')).toBe('pub-key');
      expect(service.get('jwt.privateKey')).toBeUndefined();
    });

    it('should throw ConfigurationValidationException on missing required keys', async () => {
      // Remove database username and password in YAML to cause validation error
      fs.writeFileSync(
        path.join(tmpConfigDir, 'database.yaml'),
        `
database:
  host: db-host
`
      );

      await expect(
        Test.createTestingModule({
          imports: [ConfigurationModule.register({ configDir: tmpConfigDir })],
        }).compile()
      ).rejects.toThrow(ConfigurationValidationException);
    });

    it('should throw ConfigurationValidationException on invalid types (port is not a number)', async () => {
      process.env.DATABASE__PORT = 'not-a-number';

      await expect(
        Test.createTestingModule({
          imports: [ConfigurationModule.register({ configDir: tmpConfigDir })],
        }).compile()
      ).rejects.toThrow(ConfigurationValidationException);
    });

    it('should throw InvalidConfigurationException on malformed YAML syntax', async () => {
      fs.writeFileSync(path.join(tmpConfigDir, 'app.yaml'), 'malformed: yaml: : :');

      await expect(
        Test.createTestingModule({
          imports: [ConfigurationModule.register({ configDir: tmpConfigDir })],
        }).compile()
      ).rejects.toThrow(InvalidConfigurationException);
    });
  });

  describe('3. Service API & Path Resolution', () => {
    let service: ConfigurationService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [ConfigurationModule.register({ configDir: tmpConfigDir })],
      }).compile();
      service = module.get<ConfigurationService>(ConfigurationService);
    });

    it('should resolve nested paths via get()', () => {
      expect(service.get<string>('database.username')).toBe('pg-user');
      expect(service.get<number>('database.port')).toBe(5432);
      expect(service.get<string>('non.existent.path')).toBeUndefined();
    });

    it('should throw ConfigurationNotFoundException via getOrThrow() on missing path', () => {
      expect(service.getOrThrow<string>('database.username')).toBe('pg-user');
      expect(() => service.getOrThrow('non.existent.path')).toThrow(ConfigurationNotFoundException);
    });

    it('should return correct has() status', () => {
      expect(service.has('database.username')).toBe(true);
      expect(service.has('non.existent.path')).toBe(false);
    });

    it('should return all config via all()', () => {
      const all = service.all();
      expect(all.app.name).toBe('test-app');
      expect(all.database.host).toBe('db-host');
    });

    it('should correctly report environment checks', () => {
      expect(service.isTest()).toBe(true);
      expect(service.isDevelopment()).toBe(false);
      expect(service.isProduction()).toBe(false);
    });
  });

  describe('4. Dynamic Hot Reloading', () => {
    let service: ConfigurationService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [ConfigurationModule.register({ configDir: tmpConfigDir })],
      }).compile();
      service = module.get<ConfigurationService>(ConfigurationService);
    });

    it('should successfully reload config when YAML on disk is updated', () => {
      expect(service.get('app.name')).toBe('test-app');

      // Update app.yaml on disk
      fs.writeFileSync(
        path.join(tmpConfigDir, 'app.yaml'),
        `
app:
  name: updated-app-name
  port: 4000
  env: test
`
      );

      service.reload();
      expect(service.get('app.name')).toBe('updated-app-name');
    });

    it('should throw validation exception on reload failure and rollback cache', () => {
      expect(service.get('app.name')).toBe('test-app');

      // Update app.yaml with invalid port value
      fs.writeFileSync(
        path.join(tmpConfigDir, 'app.yaml'),
        `
app:
  name: invalid-app
  port: 999999
  env: test
`
      );

      expect(() => service.reload()).toThrow(ConfigurationValidationException);
      // Cache should roll back to original state
      expect(service.get('app.name')).toBe('test-app');
      expect(service.get('app.port')).toBe(4000);
    });
  });

  describe('5. Utilities', () => {
    it('should mask sensitive configuration properties', () => {
      const { maskSecrets } = require('../src/configuration/configuration.utils');
      const testConfig = {
        app: { name: 'test-app' },
        database: {
          password: 'sensitive-password',
          secretToken: 'secret-token-val',
          apiKey: 'key123',
        },
        nonSensitive: 'value',
        arrayProp: [{ token: 'abc' }, 'normal'],
      };
      const masked = maskSecrets(testConfig);
      expect(masked.database.password).toBe('[MASKED]');
      expect(masked.database.secretToken).toBe('[MASKED]');
      expect(masked.database.apiKey).toBe('[MASKED]');
      expect(masked.nonSensitive).toBe('value');
      expect(masked.arrayProp[0].token).toBe('[MASKED]');
      expect(masked.arrayProp[1]).toBe('normal');
      expect(maskSecrets(null)).toBeNull();
      expect(maskSecrets(123)).toBe(123);
    });
  });
});
