import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ConsumerConfigStore } from '../transporter/setup-kafka-microservice';
import { EventPublisher } from '../publisher/event-publisher.service';

@Injectable()
export class KafkaRetryInterceptor implements NestInterceptor {
  constructor(
    private readonly publisher: EventPublisher
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const type = context.getType();
    if (type !== 'rpc') {
      return next.handle();
    }

    const rpcContext = context.switchToRpc();
    const data = rpcContext.getData();

    if (!data) {
      return next.handle();
    }

    return next.handle().pipe(
      catchError((error) => {
        return from(this.handleRetryAndFallback(context, next, error));
      })
    );
  }

  private async handleRetryAndFallback(context: ExecutionContext, next: CallHandler, initialError: any): Promise<any> {
    const rpcContext = context.switchToRpc();
    const data = rpcContext.getData();
    const kafkaContext = rpcContext.getContext();
    const topic = kafkaContext.getTopic();

    const failedCount = ConsumerConfigStore.failedCount;
    const retryDelayMs = ConsumerConfigStore.retryDelayMs;

    let lastError = initialError;

    for (let attempt = 1; attempt < failedCount; attempt++) {
      console.log(`[Interceptor] Error processing message ${data.id}. Attempt ${attempt}/${failedCount} failed. Retrying in ${retryDelayMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      try {
        const result = await next.handle().toPromise();
        return result;
      } catch (error) {
        lastError = error;
      }
    }

    const dlqTopic = `${topic}.DLQ`;
    console.log(`[Interceptor] Error processing message ${data.id}. Attempt ${failedCount}/${failedCount} failed. Routing to DLQ...`);
    try {
      await this.publisher.publish(dlqTopic, data.payload, {
        correlationId: data.correlationId || data.id,
        version: data.version,
      });
      console.log(`[DLQ] Successfully routed failed message ${data.id} to topic ${dlqTopic}`);
    } catch (dlqError) {
      console.error(`[DLQ] Failed to publish message ${data.id} to DLQ topic ${dlqTopic}:`, dlqError);
    }

    return { status: 'failed_routed_to_dlq', error: lastError.message };
  }
}
