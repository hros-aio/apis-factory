# Quickstart & Validation Guide: libs-events

This guide describes how to run validation scenarios to verify the event-handling library's behavior end-to-end.

## Prerequisites

1. **Running Apache Kafka Broker**: A running Kafka instance reachable at `localhost:9092`.
   - Start locally via Docker Compose:
     ```bash
     docker run -d --name local-kafka -p 9092:9092 -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092 -e KAFKA_ZOOKEEPER_CONNECT=zookeeper:2181 -e KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1 bitnami/kafka:latest
     ```
2. **Library Installation**: Ensure dependencies are installed in the workspace.
   ```bash
   pnpm install --filter @new-hros/libs-events
   ```

---

## Scenario 1: Basic Pub/Sub Validation

Verify that a service can publish an event payload, and a subscribing service automatically consumes it using NestJS's native `@EventPattern` decorator.

### Setup

1. Configure microservice bootstrapping in `main.ts` using `setupKafkaMicroservice`:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupKafkaMicroservice } from '@new-hros/libs-events';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Connect and start the Kafka microservice transporter with global retry/DLQ interceptor
  await setupKafkaMicroservice(app, {
    brokers: ['localhost:9092'],
    groupId: 'employee-service-group',
    clientId: 'employee-service-client',
    failedCount: 3,
    retryDelayMs: 1000,
  });

  await app.listen(3000);
}
bootstrap();
```

2. Register a consumer controller handler using the native NestJS `@EventPattern` decorator:

```typescript
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { EventEnvelope } from '@new-hros/libs-events';

@Controller()
export class EmployeeController {
  @EventPattern('employee.created')
  async handleEmployeeCreated(@Payload() event: EventEnvelope<EmployeePayload>) {
    console.log(`[Controller] Received event: ${event.id} with payload:`, event.payload);
  }
}
```

3. Trigger the publish event:

```typescript
import { Injectable } from '@nestjs/common';
import { EventPublisher } from '@new-hros/libs-events';

@Injectable()
export class EmployeeService {
  constructor(private readonly publisher: EventPublisher) {}

  async createEmployee(data: any) {
    await this.publisher.publish('employee.created', data);
  }
}
```

### Execution Command

Run the integration test suite:

```bash
pnpm test libs/libs-events/test/integration/kafka-flow.spec.ts
```

### Expected Output Logs

```text
[Events] Connected to Kafka broker at localhost:9092
[Events] EventPublisher dispatched message to topic employee.created (correlationId: 8f8b8a8c...)
[Controller] Received event: f81d4fae-7dec-11d0-a765-00a0c91e6bf6 with payload: { employeeId: 'emp-10243', name: 'Jane Doe' }
```

---

## Scenario 2: Error Retry and DLQ Routing Validation

Verify that a handler throwing an exception will trigger retries up to the configured limit, execute non-blockingly (permitting subsequent messages to be processed on the partition), and then successfully route the failed message to the `.DLQ` topic.

### Setup

Modify the controller to throw an exception when processing a failed test scenario:

```typescript
@Controller()
export class FaultyEmployeeController {
  @EventPattern('employee.created')
  async handleEmployeeCreated(@Payload() event: EventEnvelope<EmployeePayload>) {
    if (event.payload.name === 'fail') {
      throw new Error('Database connection failed');
    }
    console.log(`[Controller] Handled event successfully: ${event.id}`);
  }
}
```

### Execution Command

Trigger a message publish containing `{ name: 'fail' }` to `employee.created` and run the integration tests targeting DLQ isolation.

```bash
pnpm test libs/libs-events/test/integration/dlq-retry.spec.ts
```

### Expected Output Logs

```text
[Events] EventPublisher dispatched message to topic employee.created
[Controller] Processing message: fail
[Interceptor] Error processing message f81d4fae-7dec-11d0-a765-00a0c91e6bf6. Attempt 1/3 failed. Retrying in 1000ms...
[Interceptor] Error processing message f81d4fae-7dec-11d0-a765-00a0c91e6bf6. Attempt 2/3 failed. Retrying in 1000ms...
[Interceptor] Error processing message f81d4fae-7dec-11d0-a765-00a0c91e6bf6. Attempt 3/3 failed. Routing to DLQ...
[DLQ] Successfully routed failed message f81d4fae-7dec-11d0-a765-00a0c91e6bf6 to topic employee.created.DLQ
[Interceptor] Offset auto-committed by NestJS microservice, partition proceeding.
```
