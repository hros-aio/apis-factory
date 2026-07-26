# API Contracts: libs-events

This document defines the exported classes, methods, and configurations exposed by the `libs-events` library.

## 1. Module Configuration Interface

Subscribing or publishing services must supply configuration conforming to the `EventsConfig` structure:

```typescript
export interface EventsConfig {
  /**
   * Kafka brokers connection strings.
   */
  brokers: string[];
  
  /**
   * Consumer Group ID for this service.
   */
  groupId: string;
  
  /**
   * The number of times a message is retried on handler failure before DLQ routing.
   */
  failedCount: number;
  
  /**
   * Time in milliseconds to wait between retry attempts.
   */
  retryDelayMs: number;
  
  /**
   * Unique client ID identifier registered with the broker.
   */
  clientId: string;
}
```

---

## 2. EventPublisher

A stateless service used to dispatch events to the Kafka broker.

```typescript
export class EventPublisher {
  /**
   * Publishes a message payload wrapped in an EventEnvelope to the specified topic.
   * Resolves when the message is successfully acknowledged by the broker partition.
   * Throws EventPublishException if broker write fails or times out.
   */
  async publish<T>(
    topic: string,
    payload: T,
    metadata?: {
      correlationId?: string;
      version?: string;
    }
  ): Promise<void>;
}
```

---

## 3. Application-Level Microservice Bootstrapper (`setupKafkaMicroservice`)

Exposes a helper function to bootstrap the Kafka microservice transporter with built-in retry and DLQ routing capabilities.

```typescript
import { INestApplication } from '@nestjs/common';
import { KafkaOptions } from '@nestjs/microservices';

export interface ResilientKafkaOptions extends KafkaOptions['options'] {
  /**
   * Max number of retries before routing to DLQ (defaults to 3).
   */
  failedCount?: number;
  
  /**
   * Delay between retries in milliseconds (defaults to 1000ms).
   */
  retryDelayMs?: number;
}

/**
 * Configures, connects, and starts the Kafka microservice transporter for the NestJS application.
 * Automatically registers the global retry and DLQ routing interceptor/wrapper under the hood.
 */
export function setupKafkaMicroservice(
  app: INestApplication,
  options: ResilientKafkaOptions
): Promise<void>;
```
