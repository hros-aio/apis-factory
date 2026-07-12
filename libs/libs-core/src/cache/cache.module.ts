import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { CACHE_MODULE_OPTIONS_TOKEN } from './cache.constants';
import { CacheService } from './cache.service';
import { CacheModuleAsyncOptions, CacheModuleOptions } from './interfaces/cache-options.interface';
import { MemoryCacheProvider } from './memory-cache.provider';
import { RedisCacheProvider } from './redis-cache.provider';

@Global()
@Module({})
export class CacheModule {
  static register(options: CacheModuleOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: CACHE_MODULE_OPTIONS_TOKEN,
      useValue: options,
    };

    return {
      module: CacheModule,
      providers: [optionsProvider, MemoryCacheProvider, RedisCacheProvider, CacheService],
      exports: [CacheService],
    };
  }

  static registerAsync(options: CacheModuleAsyncOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: CACHE_MODULE_OPTIONS_TOKEN,
      useFactory: options.useFactory,
      inject: options.inject || [],
    };

    return {
      module: CacheModule,
      providers: [optionsProvider, MemoryCacheProvider, RedisCacheProvider, CacheService],
      exports: [CacheService],
    };
  }
}
