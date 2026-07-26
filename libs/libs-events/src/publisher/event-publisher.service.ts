import { Injectable, Inject } from '@nestjs/common';
import { KafkaConnectionManager } from '../connection/kafka-connection.manager';
import { EventEnvelope } from '../interfaces/event-payload.interface';
import { EventsConfig } from '../interfaces/events-config.interface';
import { EventPublishException } from '../exceptions/event-processing.exception';
import { lastValueFrom } from 'rxjs';
import { randomUUID } from 'crypto';

@Injectable()
export class EventPublisher {
  constructor(
    private readonly connectionManager: KafkaConnectionManager,
    @Inject('KAFKA_CONFIG') private readonly config: EventsConfig
  ) {}

  async publish<T>(
    topic: string,
    payload: T,
    metadata?: {
      correlationId?: string;
      version?: string;
    }
  ): Promise<void> {
    const envelope: EventEnvelope<T> = {
      id: randomUUID(),
      topic,
      producer: this.config.clientId,
      timestamp: new Date().toISOString(),
      version: metadata?.version || '1.0.0',
      correlationId: metadata?.correlationId || randomUUID(),
      payload,
    };

    const client = this.connectionManager.getClient();
    try {
      await lastValueFrom(client.emit(topic, envelope));
    } catch (error) {
      throw new EventPublishException(
        `Failed to publish event to topic ${topic}`,
        error
      );
    }
  }
}
