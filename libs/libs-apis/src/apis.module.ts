import { Module, DynamicModule, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_PIPE, APP_INTERCEPTOR } from '@nestjs/core';
import { ApisModuleOptions, ApisModuleAsyncOptions, CacheProvider } from '@new-hros/libs-core';
import { TraceMiddleware } from './middleware/trace.middleware';
import { RequestLogMiddleware } from './middleware/request-log.middleware';
import { JwtAuthStrategy } from './guards/jwt-auth.strategy';
import { AuthGuard } from './guards/auth.guard';
import { PermissionGuard } from './guards/permission.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { GlobalHttpExceptionFilter } from './filters/exception.filter';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { TimeoutInterceptor } from './interceptors/timeout.interceptor';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { MetricsInterceptor } from './interceptors/metrics.interceptor';
import { PlatformValidationPipe } from './pipes/validation.pipe';

@Module({})
export class ApisModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TraceMiddleware, RequestLogMiddleware)
      .forRoutes('*');
  }

  static forRoot(options: ApisModuleOptions = {}): DynamicModule {
    const authStrategyProvider = {
      provide: 'AuthenticationStrategy',
      useFactory: () => {
        if (options.auth?.strategy) {
          return options.auth.strategy;
        }
        return new JwtAuthStrategy(options.auth?.publicKey || 'mock-public-key');
      },
    };

    return {
      module: ApisModule,
      providers: [
        authStrategyProvider,
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
          inject: ['CacheProvider'],
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
      exports: ['AuthenticationStrategy'],
    };
  }

  static forRootAsync(options: ApisModuleAsyncOptions): DynamicModule {
    const optionsProvider = {
      provide: 'ApisModuleOptions',
      useFactory: options.useFactory!,
      inject: options.inject || [],
    };

    const authStrategyProvider = {
      provide: 'AuthenticationStrategy',
      useFactory: (apisOpts: ApisModuleOptions) => {
        if (apisOpts.auth?.strategy) {
          return apisOpts.auth.strategy;
        }
        return new JwtAuthStrategy(apisOpts.auth?.publicKey || 'mock-public-key');
      },
      inject: ['ApisModuleOptions'],
    };

    return {
      module: ApisModule,
      imports: options.imports || [],
      providers: [
        optionsProvider,
        authStrategyProvider,
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
          inject: ['CacheProvider', 'ApisModuleOptions'],
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
      exports: ['AuthenticationStrategy'],
    };
  }
}
