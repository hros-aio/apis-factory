import { Module, DynamicModule, Global } from '@nestjs/common';
import { KafkaConnectionManager } from './kafka-connection.manager';
import { EventsConfig } from '../interfaces/events-config.interface';

@Global()
@Module({})
export class KafkaConnectionModule {
  static register(config: EventsConfig): DynamicModule {
    return {
      module: KafkaConnectionModule,
      providers: [
        {
          provide: 'KAFKA_CONFIG',
          useValue: config,
        },
        KafkaConnectionManager,
      ],
      exports: ['KAFKA_CONFIG', KafkaConnectionManager],
    };
  }
}
