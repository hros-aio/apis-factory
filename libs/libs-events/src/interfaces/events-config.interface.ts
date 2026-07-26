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
