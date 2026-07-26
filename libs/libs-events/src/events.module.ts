import { Module, DynamicModule } from '@nestjs/common';
import { KafkaConnectionModule } from './connection/kafka-connection.module';
import { EventsConfig } from './interfaces/events-config.interface';
import { EventPublisher } from './publisher/event-publisher.service';
import { KafkaRetryInterceptor } from './interceptors/kafka-retry.interceptor';

@Module({})
export class EventsModule {
  static register(config: EventsConfig): DynamicModule {
    return {
      module: EventsModule,
      imports: [KafkaConnectionModule.register(config)],
      providers: [EventPublisher, KafkaRetryInterceptor],
      exports: [KafkaConnectionModule, EventPublisher, KafkaRetryInterceptor],
    };
  }
}
