import { DynamicModule, Global, Module } from '@nestjs/common';
import { CACHE_PROVIDER_TOKEN } from './cache';
import { CacheService } from './cache/cache.service';
import { MemoryCacheProvider } from './cache/memory-cache.provider';
import { RedisCacheProvider } from './cache/redis-cache.provider';
import { HealthService } from './health/health.service';
import { LoggerService } from './logger';
import { ConsoleLoggerService } from './logger/console-logger.service';
import { RequestContextService } from './request-context/request-context.service';
import { DefaultTraceService } from './tracing/default-trace.service';
import { TraceService } from './tracing/trace.service';

@Global()
@Module({})
export class CoreModule {
  static forRoot(
    options: {
      logger?: { level?: string };
      cache?: { store?: 'memory' | 'redis'; host?: string; port?: number };
    } = {},
  ): DynamicModule {
    const cacheOptions = {
      l1DefaultTtl: 60,
      l1MaxItems: 1000,
      redis:
        options.cache?.store === 'redis'
          ? {
              host: options.cache.host || 'localhost',
              port: options.cache.port || 6379,
            }
          : undefined,
    };

    const l1 = new MemoryCacheProvider(cacheOptions);
    const l2 = new RedisCacheProvider(cacheOptions);
    const cacheProvider = new CacheService(l1, l2);

    const loggerProvider = new ConsoleLoggerService();
    const traceProvider = new DefaultTraceService();
    const healthProvider = new HealthService();

    return {
      module: CoreModule,
      providers: [
        { provide: RequestContextService, useValue: RequestContextService },
        { provide: CACHE_PROVIDER_TOKEN, useValue: cacheProvider },
        { provide: LoggerService, useValue: loggerProvider },
        { provide: TraceService, useValue: traceProvider },
        { provide: HealthService, useValue: healthProvider },
      ],
      exports: [
        RequestContextService,
        CACHE_PROVIDER_TOKEN,
        LoggerService,
        TraceService,
        HealthService,
      ],
    };
  }
}
