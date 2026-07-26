# Feature Specification: Event Handling Library (libs-events)

**Feature Branch**: `007-libs-events`

**Created**: 2026-07-26

**Status**: Draft

**Input**: User description: "create new libs for handle events, with naming libs-events, in this lib install kafka and nest/microservices create common connection and create two class EventRegistry to handle event and class EventPublisher, handle DLQ when failed after failedCount from config"

## Clarifications

### Session 2026-07-26
- Q: How should the common consumer function be implemented to configure and subscribe Kafka consumers in NestJS apps? → A: Option A - Application-Level Bootstrapper: The helper function (e.g., `setupKafkaMicroservice(app, config)`) takes the NestJS app instance and configuration, connects the Kafka microservice transport using standard options, and starts it. This allows controller decorators (like `@EventPattern`) to handle the events natively without duplicating handlers.
- Q: How should the retry and DLQ routing logic be implemented and registered in the NestJS Kafka Microservice setup? → A: Option A - Global Interceptor / Transporter Wrapper: The bootstrapper automatically registers a global interceptor or wraps the Kafka deserializer under the hood to handle retries and DLQ routing for all incoming events.
- Q: How should the configuration object for the `setupKafkaMicroservice` function be structured? → A: Option A - Extended Microservice Options: The configuration extends the native NestJS `KafkaOptions['options']` configuration, adding custom properties like `failedCount` and `retryDelayMs`.
- Q: How should offset committing be managed in the `setupKafkaMicroservice` wrapper to support retries and DLQ routing? → A: Option B - Auto-commit with Copy-to-DLQ: Rely on standard NestJS auto-commit, but intercept exceptions and copy the message to the DLQ upon retry exhaustion.
- Q: Should retries of a failed message block the partition's message consumption loop (maintaining strict ordering) or run asynchronously (allowing subsequent messages to pass)? → A: Option B - Non-blocking Retries: The failed event is sent to a separate retry topic or scheduled asynchronously, allowing the consumer to immediately proceed to the next message in the queue.
- Q: Should we completely remove the `EventRegistry` component and any library-level subscription registry from the requirements, relying entirely on NestJS microservices' native handler registration? → A: Option A - Rely Entirely on NestJS: Remove `EventRegistry` and `Subscription Registry` from requirements and entities. Let NestJS handle routing via native controller decorators (like `@EventPattern`) directly.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reliable Event Publishing (Priority: P1)

As a business domain service, I want to publish domain events to a shared message broker, so that other services in the system are immediately notified of state changes.

**Why this priority**: This is the core capability required for any asynchronous message-driven communication in the system.

**Independent Test**: Can be fully tested by dispatching a test event payload via the publisher and verifying that the message is successfully written to the message broker topic.

**Acceptance Scenarios**:

1. **Given** a running message broker connection, **When** a service dispatches an event with a valid topic and payload, **Then** the event is successfully published and registered on the broker.
2. **Given** a temporary disconnection to the message broker, **When** a service attempts to publish an event, **Then** the publisher raises a distinct connection or delivery exception.

---

### User Story 2 - Automated Event Subscription via `@EventPattern` (Priority: P1)

As a subscribing service, I want to subscribe to specific event topics using native NestJS decorators, so that my controllers react and handle events automatically.

**Why this priority**: Completes the end-to-end pub/sub flow, allowing separate microservices to consume events asynchronously.

**Independent Test**: Define a test controller method decorated with `@EventPattern('topic-name')`, publish a message to that topic, and verify that the handler is executed with the event payload.

**Acceptance Scenarios**:

1. **Given** a controller method decorated with `@EventPattern` for a topic, **When** a message is received on that topic, **Then** the handler is triggered with the correct payload.
2. **Given** multiple controller methods decorated with `@EventPattern` for the same topic, **When** a message is received, **Then** the microservice routes the message to all matched handlers.

---

### User Story 3 - Resilient Event Processing and DLQ Fallback (Priority: P2)

As a service owner, I want failing event handling executions to retry a configured number of times, and if they continue to fail, route them to a Dead Letter Queue (DLQ) so that transient errors are retried and permanent failures do not block the queue.

**Why this priority**: Prevents a single corrupted or unprocessable message ("poison pill") from blocking the entire event consumer partition/queue, and ensures reliability.

**Independent Test**: Register a handler that deliberately throws an error, publish a message, and verify that the consumer retries it up to the configured limit, then successfully routes it to the DLQ.

**Acceptance Scenarios**:

1. **Given** a handler that fails during processing, **When** the event is processed, **Then** the system retries processing the event up to the limit specified in the configuration.
2. **Given** an event that has reached its retry limit, **When** the final retry fails, **Then** the event is routed to the designated Dead Letter Queue (DLQ) and the consumer resumes processing subsequent events in the queue.

---

### Edge Cases

- **Malformed Event Payload**: If an incoming message cannot be parsed, the consumer must log the deserialization error and route the raw payload immediately to the DLQ to prevent infinite parsing retries.
- **DLQ Connection Failure**: If the system attempts to route a failed message to the DLQ but the broker connection or DLQ write fails, the consumer must halt processing and sound an alert to prevent message loss.
- **Broker Disconnection During Processing**: If the connection drops mid-processing, the consumer must not commit the current message offset so that it is re-processed once connection is re-established.
- **Zero or Invalid Retry Count**: If `failedCount` is configured as 0 or is invalid, the system should default to a safe value (e.g., retry 3 times) rather than failing to run.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide an event publisher component to allow services to publish messages to designated topics.
- **FR-003**: The system MUST support automatic retry of failed event handling executions up to a configurable maximum count (`failedCount`).
- **FR-004**: The system MUST route events that exceed the retry limit to a Dead Letter Queue (DLQ) topic named by suffixing the original topic name with `.DLQ`.
- **FR-005**: The system MUST support configurable retry backoff strategies, defaulting to a fixed delay backoff strategy between retry attempts.
- **FR-006**: The system MUST support non-blocking retries during consumer failures, allowing subsequent messages on the partition to be processed without blocking the queue while failed events are retried asynchronously or routed to the DLQ.
- **FR-007**: The publisher and consumer microservice transporter MUST share a common broker connection manager that handles connection state and automatic reconnection.
- **FR-008**: The system MUST provide an application-level bootstrapper function (e.g., `setupKafkaMicroservice`) that programmatically connects and starts the Kafka microservice transporter for the given NestJS application using standard connection configurations. This configuration MUST extend NestJS's standard `KafkaOptions['options']`, adding custom properties like `failedCount` and `retryDelayMs`. The bootstrapper MUST automatically register a global interceptor or custom deserializer/transporter wrapper that handles event retries and DLQ routing for all `@EventPattern` handlers.

### Key Entities *(include if feature involves data)*

- **Event Message**: Represents the event envelope containing unique event ID, topic name, producer service name, timestamp, schema version, and payload data.
- **Dead Letter Queue (DLQ)**: The destination queue/topic used to isolate messages that cannot be processed successfully after the maximum retry threshold.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of event handling failures exceeding the retry threshold are successfully moved to the DLQ with original payload and exception metadata preserved.
- **SC-002**: Event publishing operation introduces less than 50ms overhead to the calling thread under normal connection conditions.
- **SC-003**: Event processing queue continues processing subsequent messages on the partition while a failing message is retried or routed to the DLQ.
- **SC-004**: 99.9% of event registration, subscription, retry, and DLQ routing actions are logged with correlation IDs for tracing.

## Assumptions

- The backend services are built using the monorepo's standard framework (NestJS) and language (TypeScript).
- The underlying message broker provider is Apache Kafka, accessed via `@nestjs/microservices`.
- Configuration parameters (broker URL, retry limits, client credentials) are loaded from the monorepo's unified configuration service.
- The message format uses JSON serialization/deserialization by default.
- TLS/SSL connection to the broker is handled by the common connection configuration.
- The Dead Letter Queue (DLQ) topic name is determined by suffixing the original topic name with `.DLQ`.
- The system defaults to a fixed delay backoff strategy between retry attempts.
- Retries are non-blocking on the partition (asynchronous retries), allowing subsequent events to be processed while a failed message is retried or routed to the DLQ.

