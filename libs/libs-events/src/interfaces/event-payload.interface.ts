export interface EventEnvelope<T = any> {
  /**
   * Unique UUID v4 identifying the event instance.
   */
  eventId: string;

  /**
   * The type of the event.
   */
  eventType: string;

  /**
   * Version integer of the event schema.
   */
  eventVersion: number;

  /**
   * Tenant identifier code for multi-tenancy.
   */
  tenantCode: string;

  /**
   * ISO-8601 timestamp of when the event occurred.
   */
  occurredAt: string;

  /**
   * The name of the originating microservice or producer.
   */
  producer: string;

  /**
   * Correlation ID for tracing requests across microservices.
   */
  correlationId?: string | null;

  /**
   * ID of the causation event or command.
   */
  causationId?: string | null;

  /**
   * Distributed tracing ID.
   */
  traceId?: string | null;

  /**
   * The actual business domain data payload.
   */
  payload: T;
}

