export interface AppConfiguration {
  name: string;
  port: number;
  env: 'production' | 'development' | 'test';
}

export interface DatabaseConfiguration {
  host: string;
  port: number;
  username?: string;
  password?: string;
  name?: string;
}

export interface RedisConfiguration {
  host: string;
  port: number;
}

export interface KafkaConfiguration {
  brokers: string[];
}

export interface JwtConfiguration {
  publicKey: string;
  privateKey: string;
}

export interface Configuration {
  app: AppConfiguration;
  database: DatabaseConfiguration;
  redis: RedisConfiguration;
  kafka: KafkaConfiguration;
  jwt: JwtConfiguration;
}
