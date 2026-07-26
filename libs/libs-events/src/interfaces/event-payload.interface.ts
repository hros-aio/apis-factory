export interface EventEnvelope<T = any> {
  /**
   * Unique UUID v4 identifying the event instance.
   */
  id: string;

  /**
   * The topic name the event is dispatched to.
   */
  topic: string;

  /**
   * The name of the originating microservice.
   */
  producer: string;

  /**
   * ISO-8601 timestamp of event generation.
   */
  timestamp: string;

  /**
   * Version tag of the event schema (e.g. 1.0.0).
   */
  version: string;

  /**
   * Correlation ID for tracing requests across microservices.
   */
  correlationId: string;

  /**
   * The actual business domain data payload.
   */
  payload: T;
}
