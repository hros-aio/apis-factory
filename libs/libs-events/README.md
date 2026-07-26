# Event Handling Library (@new-hros/libs-events)

The `@new-hros/libs-events` library provides a robust, resilient wrapper around NestJS's native Kafka microservices transporter. It simplifies bootstrapping, connection pooling, non-blocking retries, and automatic Dead Letter Queue (DLQ) routing.

## Features

- **Bootstrapper**: Easily connect and start Kafka microservices using a single application helper.
- **Connection pooling**: Centralized connection manager to prevent socket resource leaks.
- **Retry Mechanism**: Non-blocking asynchronous message processing retries.
- **Dead Letter Queue (DLQ)**: Automatically routes exhausted failure payloads to `<original-topic>.DLQ`.

---

## Getting Started

### 1. Register EventsModule

Import the `EventsModule` dynamically inside your service domain root modules (e.g. `AppModule`):

```typescript
import { Module } from '@nestjs/common';
import { EventsModule } from '@new-hros/libs-events';

@Module({
  imports: [
    EventsModule.register({
      brokers: ['localhost:9092'],
      groupId: 'employee-service-group',
      clientId: 'employee-service-client',
      failedCount: 3,
      retryDelayMs: 1000,
    }),
  ],
})
export class AppModule {}
```

### 2. Configure Consumer Transporter in Bootstrapping

Initialize and configure the microservice transporter inside `main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupKafkaMicroservice } from '@new-hros/libs-events';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await setupKafkaMicroservice(app, {
    client: {
      brokers: ['localhost:9092'],
      clientId: 'employee-service-client',
    },
    consumer: {
      groupId: 'employee-service-group',
    },
    failedCount: 3,
    retryDelayMs: 1000,
  });

  await app.listen(3000);
}
bootstrap();
```

### 3. Handle Events via `@EventPattern`

Register event handling methods inside your NestJS controllers:

```typescript
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { EventEnvelope } from '@new-hros/libs-events';

@Controller()
export class EmployeeController {
  @EventPattern('employee.created')
  async handleEmployeeCreated(@Payload() event: EventEnvelope<EmployeePayload>) {
    console.log(`Received event: ${event.id}`, event.payload);
  }
}
```

### 4. Publish Events via `EventPublisher`

Inject `EventPublisher` to dispatch events:

```typescript
import { Injectable } from '@nestjs/common';
import { EventPublisher } from '@new-hros/libs-events';

@Injectable()
export class EmployeeService {
  constructor(private readonly publisher: EventPublisher) {}

  async createEmployee(data: any) {
    await this.publisher.publish('employee.created', data, {
      version: '1.0.0',
    });
  }
}
```
