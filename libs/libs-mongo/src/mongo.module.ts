import { Module, DynamicModule, Global } from '@nestjs/common';
import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import { MongoModuleOptions, MongoModuleAsyncOptions } from '@new-hros/libs-core';
import { MongoHealthService } from './mongo-health.service';
import { Connection } from 'mongoose';
import { tenantSoftDeletePlugin } from './plugins/tenant-soft-delete.plugin';

@Global()
@Module({})
export class MongoModule {
  static forRoot(options: MongoModuleOptions): DynamicModule {
    const mongooseModule = MongooseModule.forRoot(options.uri, {
      connectionName: options.connectionName,
      connectionFactory: (connection: Connection) => {
        connection.plugin(tenantSoftDeletePlugin);
        return connection;
      },
    });

    const connectionToken = getConnectionToken(options.connectionName);

    return {
      module: MongoModule,
      imports: [mongooseModule],
      providers: [
        {
          provide: MongoHealthService,
          useFactory: (connection: Connection) => new MongoHealthService(connection),
          inject: [connectionToken],
        },
      ],
      exports: [MongooseModule, MongoHealthService],
    };
  }

  static forRootAsync(options: MongoModuleAsyncOptions): DynamicModule {
    const mongooseModule = MongooseModule.forRootAsync({
      connectionName: options.connectionName,
      imports: options.imports || [],
      useExisting: options.useExisting,
      useClass: options.useClass,
      useFactory: async (...args: any[]) => {
        const mongoOpts = await options.useFactory!(...args);
        return {
          uri: mongoOpts.uri,
          connectionFactory: (connection: Connection) => {
            connection.plugin(tenantSoftDeletePlugin);
            return connection;
          },
        };
      },
      inject: options.inject || [],
    });

    const connectionToken = getConnectionToken(options.connectionName);

    return {
      module: MongoModule,
      imports: [mongooseModule],
      providers: [
        {
          provide: MongoHealthService,
          useFactory: (connection: Connection) => new MongoHealthService(connection),
          inject: [connectionToken],
        },
      ],
      exports: [MongooseModule, MongoHealthService],
    };
  }
}
