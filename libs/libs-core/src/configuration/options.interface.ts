import { ModuleMetadata, Type } from '@nestjs/common';

export interface SqlModuleOptions {
  type: 'postgres';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  url?: string;
  autoLoadEntities?: boolean;
  synchronize?: boolean;
  [key: string]: any;
}

export interface SqlModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  name?: string;
  useExisting?: Type<any>;
  useClass?: Type<any>;
  useFactory?: (...args: any[]) => Promise<SqlModuleOptions> | SqlModuleOptions;
  inject?: any[];
}

export interface MongoModuleOptions {
  uri: string;
  connectionName?: string;
  [key: string]: any;
}

export interface MongoModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  connectionName?: string;
  useExisting?: Type<any>;
  useClass?: Type<any>;
  useFactory?: (...args: any[]) => Promise<MongoModuleOptions> | MongoModuleOptions;
  inject?: any[];
}

export interface ApisModuleOptions {
  auth?: {
    publicKey?: string;
    strategy?: any; // customizable authentication strategy
  };
  rateLimit?: {
    limit?: number;
    windowSeconds?: number;
  };
  [key: string]: any;
}

export interface ApisModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<any>;
  useClass?: Type<any>;
  useFactory: (...args: any[]) => Promise<ApisModuleOptions> | ApisModuleOptions;
  inject?: any[];
}
