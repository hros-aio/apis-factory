import { Module, DynamicModule, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SqlModuleOptions, SqlModuleAsyncOptions } from '@new-hros/libs-core';
import { TransactionService } from './transaction.service';
import { UnitOfWork } from './unit-of-work.service';
import { SqlHealthService } from './sql-health.service';
import { EntityManager } from 'typeorm';

@Global()
@Module({})
export class SqlModule {
  static forRoot(options: SqlModuleOptions): DynamicModule {
    const typeOrmModule = TypeOrmModule.forRoot({
      type: 'postgres',
      host: options.host,
      port: options.port,
      username: options.username,
      password: options.password,
      database: options.database,
      url: options.url,
      autoLoadEntities: options.autoLoadEntities ?? true,
      synchronize: options.synchronize ?? false,
      logging: false,
    });

    return {
      module: SqlModule,
      imports: [typeOrmModule],
      providers: [
        {
          provide: TransactionService,
          useFactory: (manager: EntityManager) => new TransactionService(manager),
          inject: [EntityManager],
        },
        UnitOfWork,
        {
          provide: SqlHealthService,
          useFactory: (manager: EntityManager) => new SqlHealthService(manager),
          inject: [EntityManager],
        },
      ],
      exports: [TypeOrmModule, TransactionService, UnitOfWork, SqlHealthService],
    };
  }

  static forRootAsync(options: SqlModuleAsyncOptions): DynamicModule {
    const typeOrmModule = TypeOrmModule.forRootAsync({
      name: options.name,
      imports: options.imports || [],
      useExisting: options.useExisting,
      useClass: options.useClass,
      useFactory: async (...args: any[]) => {
        const sqlOpts = await options.useFactory!(...args);
        return {
          type: 'postgres',
          host: sqlOpts.host,
          port: sqlOpts.port,
          username: sqlOpts.username,
          password: sqlOpts.password,
          database: sqlOpts.database,
          url: sqlOpts.url,
          autoLoadEntities: sqlOpts.autoLoadEntities ?? true,
          synchronize: sqlOpts.synchronize ?? false,
          logging: false,
        };
      },
      inject: options.inject || [],
    });

    return {
      module: SqlModule,
      imports: [typeOrmModule],
      providers: [
        {
          provide: TransactionService,
          useFactory: (manager: EntityManager) => new TransactionService(manager),
          inject: [EntityManager],
        },
        UnitOfWork,
        {
          provide: SqlHealthService,
          useFactory: (manager: EntityManager) => new SqlHealthService(manager),
          inject: [EntityManager],
        },
      ],
      exports: [TypeOrmModule, TransactionService, UnitOfWork, SqlHealthService],
    };
  }
}
