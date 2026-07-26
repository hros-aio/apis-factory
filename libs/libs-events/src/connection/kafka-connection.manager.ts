import { Injectable, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { EventsConfig } from '../interfaces/events-config.interface';

@Injectable()
export class KafkaConnectionManager implements OnModuleInit, OnModuleDestroy {
  private readonly client: ClientKafka;

  constructor(
    @Inject('KAFKA_CONFIG') private readonly config: EventsConfig
  ) {
    this.client = new ClientKafka({
      client: {
        brokers: this.config.brokers,
        clientId: this.config.clientId,
      },
      consumer: {
        groupId: this.config.groupId,
      }
    });
  }

  async onModuleInit() {
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.close();
  }

  getClient(): ClientKafka {
    return this.client;
  }
}
