# Data Model Specification: libs-events

This document defines the schema contracts for events and Dead Letter Queue (DLQ) messages processed by the library.

## Entity: EventEnvelope

The standard container wrapping all message payloads dispatched or consumed through the system.

| Field | Type | Description | Validation |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Unique UUID v4 identifying the event instance. | Required, UUID format. |
| `topic` | `string` | The topic name the event is dispatched to. | Required, alphanumeric and dot/hyphen. |
| `producer` | `string` | The name of the originating microservice (e.g., `employee-service`). | Required, non-empty. |
| `timestamp` | `string` | ISO-8601 timestamp of event generation. | Required, ISO Date format. |
| `version` | `string` | Version tag of the event schema (e.g., `1.0.0`). | Required, semantic version format. |
| `correlationId`| `string` | Correlation ID for tracing requests across microservices. | Required, UUID/string format. |
| `payload` | `object` | The actual business domain data payload. | Required, valid JSON object. |

### Schema Example: EventEnvelope

```json
{
  "id": "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
  "topic": "employee.created",
  "producer": "employee-service",
  "timestamp": "2026-07-26T14:52:00.000Z",
  "version": "1.0.0",
  "correlationId": "8f8b8a8c-8d8e-8f9a-9b9c-9d9e9f0a0b0c",
  "payload": {
    "employeeId": "emp-10243",
    "name": "Jane Doe",
    "role": "Software Engineer",
    "department": "Engineering"
  }
}
```

---

## Entity: DLQEnvelope

The wrapper data object used to encapsulating events that failed handling and are routed to a `.DLQ` topic.

| Field | Type | Description | Validation |
| :--- | :--- | :--- | :--- |
| `originalEvent` | `EventEnvelope` | The full original event envelope, including metadata and payload. | Required. |
| `failedAt` | `string` | ISO-8601 timestamp when the failure occurred. | Required, ISO Date format. |
| `failureReason` | `string` | Error message and exception details from the handler failure. | Required, non-empty. |
| `retryCount` | `number` | The number of retry attempts made before routing to the DLQ. | Required, integer >= 0. |

### Schema Example: DLQEnvelope

```json
{
  "originalEvent": {
    "id": "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
    "topic": "employee.created",
    "producer": "employee-service",
    "timestamp": "2026-07-26T14:52:00.000Z",
    "version": "1.0.0",
    "correlationId": "8f8b8a8c-8d8e-8f9a-9b9c-9d9e9f0a0b0c",
    "payload": {
      "employeeId": "emp-10243",
      "name": "Jane Doe",
      "role": "Software Engineer",
      "department": "Engineering"
  }
  },
  "failedAt": "2026-07-26T14:55:12.345Z",
  "failureReason": "Database connection timeout during subscriber transaction",
  "retryCount": 3
}
```
