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
      eventType?: string;
      eventVersion?: number;
      tenantCode?: string;
      occurredAt?: string;
      correlationId?: string | null;
      causationId?: string | null;
      traceId?: string | null;
    }
  ): Promise<void> {
    const envelope: EventEnvelope<T> = {
      eventId: randomUUID(),
      eventType: metadata?.eventType || topic,
      eventVersion: metadata?.eventVersion ?? 1,
      tenantCode: metadata?.tenantCode || '',
      occurredAt: metadata?.occurredAt || new Date().toISOString(),
      producer: this.config.clientId,
      correlationId: metadata?.correlationId ?? randomUUID(),
      causationId: metadata?.causationId ?? null,
      traceId: metadata?.traceId ?? null,
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
