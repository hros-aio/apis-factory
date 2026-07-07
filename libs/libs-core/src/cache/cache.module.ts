import { DynamicModule, Module, Global, Provider } from '@nestjs/common';
import { CacheService } from './cache.service';
import { MemoryCacheProvider } from './memory-cache.provider';
import { RedisCacheProvider } from './redis-cache.provider';
import { CacheModuleOptions, CacheModuleAsyncOptions } from './interfaces/cache-options.interface';

@Global()
@Module({})
export class CacheModule {
  static register(options: CacheModuleOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: 'CACHE_MODULE_OPTIONS',
      useValue: options,
    };

    return {
      module: CacheModule,
      providers: [
        optionsProvider,
        MemoryCacheProvider,
        RedisCacheProvider,
        CacheService,
      ],
      exports: [CacheService],
    };
  }

  static registerAsync(options: CacheModuleAsyncOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: 'CACHE_MODULE_OPTIONS',
      useFactory: options.useFactory,
      inject: options.inject || [],
    };

    return {
      module: CacheModule,
      providers: [
        optionsProvider,
        MemoryCacheProvider,
        RedisCacheProvider,
        CacheService,
      ],
      exports: [CacheService],
    };
  }
}
