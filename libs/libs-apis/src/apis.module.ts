import { DynamicModule, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import {
  ApisModuleAsyncOptions,
  ApisModuleOptions,
  CACHE_PROVIDER_TOKEN,
  CacheProvider,
} from '@new-hros/libs-core';
import { JwtService } from './auth/jwt.service';
import { GlobalHttpExceptionFilter } from './filters/exception.filter';
import { AuthGuard } from './guards/auth.guard';
import { PermissionGuard } from './guards/permission.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { MetricsInterceptor } from './interceptors/metrics.interceptor';
import { TimeoutInterceptor } from './interceptors/timeout.interceptor';
import { RequestLogMiddleware } from './middleware/request-log.middleware';
import { TraceMiddleware } from './middleware/trace.middleware';
import { PlatformValidationPipe } from './pipes/validation.pipe';

import { API_MODULE_OPTIONS_TOKEN, TIMEOUT_MS_TOKEN } from './apis.constants';
export { API_MODULE_OPTIONS_TOKEN, TIMEOUT_MS_TOKEN };

@Module({})
export class ApisModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TraceMiddleware, RequestLogMiddleware).forRoutes('*');
  }

  static forRoot(options: ApisModuleOptions = {}): DynamicModule {
    const optionsProvider = {
      provide: API_MODULE_OPTIONS_TOKEN,
      useValue: options,
    };

    return {
      module: ApisModule,
      providers: [
        optionsProvider,
        { provide: TIMEOUT_MS_TOKEN, useValue: 5000 },
        JwtService,
        {
          provide: APP_GUARD,
          useClass: AuthGuard,
        },
        {
          provide: APP_GUARD,
          useClass: PermissionGuard,
        },
        {
          provide: APP_GUARD,
          useFactory: (cacheProvider: CacheProvider) => {
            return new RateLimitGuard(cacheProvider, {
              limit: options.rateLimit?.limit ?? 100,
              windowSeconds: options.rateLimit?.windowSeconds ?? 60,
            });
          },
          inject: [CACHE_PROVIDER_TOKEN],
        },
        {
          provide: APP_FILTER,
          useClass: GlobalHttpExceptionFilter,
        },
        {
          provide: APP_PIPE,
          useClass: PlatformValidationPipe,
        },
        {
          provide: APP_INTERCEPTOR,
          useClass: LoggingInterceptor,
        },
        {
          provide: APP_INTERCEPTOR,
          useClass: TimeoutInterceptor,
        },
        {
          provide: APP_INTERCEPTOR,
          useClass: AuditInterceptor,
        },
        {
          provide: APP_INTERCEPTOR,
          useClass: MetricsInterceptor,
        },
      ],
      exports: [JwtService],
    };
  }

  static forRootAsync(options: ApisModuleAsyncOptions): DynamicModule {
    if (!options || !options.useFactory) {
      throw new Error('ApisModuleAsyncOptions.useFactory is required');
    }
    const optionsProvider = {
      provide: API_MODULE_OPTIONS_TOKEN,
      useFactory: options.useFactory,
      inject: options.inject || [],
    };

    return {
      module: ApisModule,
      imports: options.imports || [],
      providers: [
        optionsProvider,
        { provide: TIMEOUT_MS_TOKEN, useValue: 5000 },
        JwtService,
        {
          provide: APP_GUARD,
          useClass: AuthGuard,
        },
        {
          provide: APP_GUARD,
          useClass: PermissionGuard,
        },
        {
          provide: APP_GUARD,
          useFactory: (cacheProvider: CacheProvider, apisOpts: ApisModuleOptions) => {
            return new RateLimitGuard(cacheProvider, {
              limit: apisOpts.rateLimit?.limit ?? 100,
              windowSeconds: apisOpts.rateLimit?.windowSeconds ?? 60,
            });
          },
          inject: [CACHE_PROVIDER_TOKEN, API_MODULE_OPTIONS_TOKEN],
        },
        {
          provide: APP_FILTER,
          useClass: GlobalHttpExceptionFilter,
        },
        {
          provide: APP_PIPE,
          useClass: PlatformValidationPipe,
        },
        {
          provide: APP_INTERCEPTOR,
          useClass: LoggingInterceptor,
        },
        {
          provide: APP_INTERCEPTOR,
          useClass: TimeoutInterceptor,
        },
        {
          provide: APP_INTERCEPTOR,
          useClass: AuditInterceptor,
        },
        {
          provide: APP_INTERCEPTOR,
          useClass: MetricsInterceptor,
        },
      ],
      exports: [JwtService],
    };
  }
}
