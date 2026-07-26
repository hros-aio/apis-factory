import { INestApplication } from '@nestjs/common';
import { KafkaOptions, Transport } from '@nestjs/microservices';

export type ResilientKafkaOptions = KafkaOptions['options'] & {
  failedCount?: number;
  retryDelayMs?: number;
};

export class ConsumerConfigStore {
  static failedCount = 3;
  static retryDelayMs = 1000;
}

/**
 * Configures, connects, and starts the Kafka microservice transporter.
 * Saves the custom failedCount and retryDelayMs configurations for the global interceptor.
 */
export async function setupKafkaMicroservice(
  app: INestApplication,
  options: ResilientKafkaOptions
): Promise<void> {
  if (options.failedCount !== undefined) {
    ConsumerConfigStore.failedCount = options.failedCount;
  }
  if (options.retryDelayMs !== undefined) {
    ConsumerConfigStore.retryDelayMs = options.retryDelayMs;
  }

  app.connectMicroservice({
    transport: Transport.KAFKA,
    options: options,
  });

  try {
    const { KafkaRetryInterceptor } = require('../interceptors/kafka-retry.interceptor');
    const interceptor = app.get(KafkaRetryInterceptor);
    app.useGlobalInterceptors(interceptor);
  } catch (error) {
    console.warn('[Events] KafkaRetryInterceptor could not be resolved from container. Booting microservice without retries.');
  }

  await app.startAllMicroservices();
}
