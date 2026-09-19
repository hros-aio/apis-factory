import { DynamicModule, Global, Module } from '@nestjs/common';
import { HealthService } from './health/health.service';
import { LoggerService } from './logger';
import { ConsoleLoggerService } from './logger/console-logger.service';
import { DefaultTraceService } from './tracing/default-trace.service';
import { TraceService } from './tracing/trace.service';

@Global()
@Module({})
export class CoreModule {
  static forRoot(): DynamicModule {
    const loggerProvider = new ConsoleLoggerService();
    const traceProvider = new DefaultTraceService();
    const healthProvider = new HealthService();

    return {
      module: CoreModule,
      providers: [
        { provide: LoggerService, useValue: loggerProvider },
        { provide: TraceService, useValue: traceProvider },
        { provide: HealthService, useValue: healthProvider },
      ],
      exports: [LoggerService, TraceService, HealthService],
    };
  }
}
