# Research and Decision Log: Event Handling Library (libs-events)

This document outlines the technical decisions and architectural research for the `libs-events` library.

## Dec-001: NestJS Kafka Integration Approach

- **Decision**: Utilize native `@nestjs/microservices` (`ClientKafka` and custom deserializers/interceptors) as the primary abstraction for Kafka communication.
- **Rationale**: 
  - Standardizes connection management, serialization, and deserialization using the monorepo's primary framework (NestJS).
  - Integrates natively with NestJS dependency injection and controller decorators for event subscription mapping.
  - Automatically handles connection lifecycles, broker handshake, and health checks.
- **Alternatives Considered**: 
  - Raw `kafkajs` client: Rejected because it requires writing boilerplate connection pooling, manually mapping handlers, and lacks native integration with NestJS decorators.

## Dec-002: Dead Letter Queue (DLQ) & Retry Policy

- **Decision**: Implement a non-blocking retry strategy with fixed delay backoff, routing persistent failures to a `<original-topic>.DLQ` topic. Rely on standard NestJS auto-commit, but intercept exceptions in a global interceptor/wrapper to copy the failed message to the DLQ upon retry exhaustion.
- **Rationale**: 
  - **DLQ Suffix naming**: Suffixing the original topic name with `.DLQ` (e.g., `order.created.DLQ`) ensures zero configuration overhead and intuitive mapping for debugging.
  - **Fixed Delay retry**: A constant delay backoff (e.g., 2 seconds) meets standard processing requirements without excessive queue complexity.
  - **Non-blocking Retries**: Retries are non-blocking on the partition (asynchronous retries), allowing subsequent events on the partition to continue processing immediately. This prevents a failing message ("poison pill") from blocking the entire service partition.
  - **Auto-commit with Copy-to-DLQ**: Relying on standard auto-commit simplifies offset tracking. The library-provided interceptor intercepts exceptions and writes a copy of the payload to the DLQ upon exhausting retries.
- **Alternatives Considered**: 
  - Blocking retries: Pausing partition processing during retries. Rejected because it blocks processing for other users/entities in the queue.
  - Exponential backoff: Rejected for simplicity in initial implementation, but config parameters can allow changing delay values.

## Dec-003: Shared Connection Management

- **Decision**: Implement a centralized `KafkaConnectionManager` service that exposes a shared Kafka client instance. Both the publishing service (`EventPublisher`) and the consumer microservice transporter (`setupKafkaMicroservice`) leverage this shared connection manager where appropriate.
- **Rationale**: 
  - Prevents socket exhaustion by sharing the same TCP connection/client pool for publishers and consumers where appropriate.
  - Simplifies lifecycle hooks (e.g., connecting on NestJS bootstrap and disconnecting on shutdown).
- **Alternatives Considered**: 
  - Independent connections for publishing and consuming: Rejected due to extra broker connections and socket overhead.

## Dec-004: Application-Level Microservice Bootstrapper (`setupKafkaMicroservice`)

- **Decision**: Expose an application-level helper function `setupKafkaMicroservice(app, config)` that programmatically connects and starts the NestJS Kafka microservice. It extends standard NestJS `KafkaOptions['options']` with custom retry/DLQ parameters, and automatically registers a global interceptor/wrapper under the hood to handle retries and DLQ routing for all `@EventPattern` controller handlers.
- **Rationale**:
  - Leverages NestJS's native controller discovery and `@EventPattern` routing, avoiding redundant custom registry classes.
  - Reusing and extending `KafkaOptions['options']` allows consuming apps to configure TLS, SASL, and standard consumer options directly without library duplication.
  - Automatically registering the global interceptor removes boilerplate setup code from the microservices.
- **Alternatives Considered**: 
  - Standalone `createConsumer(config, callback)` function: Rejected because it duplicates the handler registration and routing logic already natively provided by NestJS microservices.
  - Custom controller decorators: Rejected to keep usage standard using `@EventPattern`.
