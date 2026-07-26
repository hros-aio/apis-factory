import { Inject, Injectable, Optional } from '@nestjs/common';
import fs from 'fs';
import dotenv from 'dotenv';
import { CONFIGURATION_OPTIONS, ConfigurationNotFoundException } from './configuration.constants';
import { Configuration } from './configuration.interface';
import { loadAndValidateConfig } from './configuration.loader';
import { maskSecrets } from './configuration.utils';

export interface ConfigurationModuleOptions {
  configDir?: string;
  envPath?: string;
}

@Injectable()
export class ConfigurationService {
  private cache!: Configuration;
  private readonly configDir: string;
  private readonly envPath?: string;

  constructor(
    @Optional()
    @Inject(CONFIGURATION_OPTIONS)
    options: ConfigurationModuleOptions | null
  ) {
    this.configDir = options?.configDir || 'config';
    this.envPath = options?.envPath;

    if (this.envPath && fs.existsSync(this.envPath)) {
      dotenv.config({ path: this.envPath });
    }

    this.load();
    this.logLoadSummary();
  }

  private load(): void {
    try {
      this.cache = loadAndValidateConfig(this.configDir);
    } catch (err: any) {
      if (process.env.NODE_ENV === 'test') {
        throw err;
      }
      console.error('\n==================================================');
      console.error('✔ Configuration Loading Failed');
      console.error(err.message);
      console.error('==================================================\n');
      process.exit(1);
    }
  }

  private logLoadSummary(): void {
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    const appConfig = this.cache.app;
    const maskedConfig = maskSecrets(this.cache);

    console.log('\n==================================================');
    console.log('✔ Configuration Loaded');
    console.log('\nSource:');
    console.log(`- ${this.configDir}/*.yaml`);
    console.log('- process.env');
    console.log(`\nEnvironment:\n${appConfig.env}`);
    console.log('\nActive Configuration (Masked):');
    console.log(JSON.stringify(maskedConfig, null, 2));
    console.log('==================================================\n');
  }

  public get<T>(path: string): T | undefined {
    return this.resolvePath<T>(path);
  }

  public getOrThrow<T>(path: string): T {
    const value = this.resolvePath<T>(path);
    if (value === undefined) {
      throw new ConfigurationNotFoundException(path);
    }
    return value;
  }

  public has(path: string): boolean {
    return this.resolvePath(path) !== undefined;
  }

  public all(): Configuration {
    return this.cache;
  }

  public reload(): void {
    if (this.envPath && fs.existsSync(this.envPath)) {
      dotenv.config({ path: this.envPath, override: true });
    }
    // Attempt load and validate. If successful, update cache.
    // If validation fails, throws and preserves the previous cache.
    const newConfig = loadAndValidateConfig(this.configDir);
    this.cache = newConfig;
  }

  public isProduction(): boolean {
    return this.cache.app.env === 'production';
  }

  public isDevelopment(): boolean {
    return this.cache.app.env === 'development';
  }

  public isTest(): boolean {
    return this.cache.app.env === 'test';
  }

  private resolvePath<T>(pathString: string): T | undefined {
    const parts = pathString.split('.');
    let current: any = this.cache;
    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }
    return current;
  }
}
