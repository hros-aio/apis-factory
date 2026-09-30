import { Test, TestingModule } from '@nestjs/testing';
import { KafkaRetryInterceptor } from '../../src/interceptors/kafka-retry.interceptor';
import { EventPublisher } from '../../src/publisher/event-publisher.service';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { ConsumerConfigStore } from '../../src/transporter/setup-kafka-microservice';

describe('KafkaRetryInterceptor', () => {
  let interceptor: KafkaRetryInterceptor;
  let publisherMock: jest.Mocked<EventPublisher>;
  let executionContextMock: jest.Mocked<ExecutionContext>;
  let rpcMock: any;
  let kafkaContextMock: any;

  beforeEach(async () => {
    ConsumerConfigStore.failedCount = 3;
    ConsumerConfigStore.retryDelayMs = 10; // short delay for tests

    publisherMock = {
      publish: jest.fn().mockResolvedValue(undefined),
    } as any;

    kafkaContextMock = {
      getTopic: jest.fn().mockReturnValue('test-topic'),
    };

    rpcMock = {
      getData: jest.fn().mockReturnValue({
        eventId: 'msg-123',
        eventType: 'test-topic',
        eventVersion: 1,
        tenantCode: 'test-tenant',
        correlationId: 'corr-123',
        payload: { test: 'data' },
      }),
      getContext: jest.fn().mockReturnValue(kafkaContextMock),
    };

    executionContextMock = {
      getType: jest.fn().mockReturnValue('rpc'),
      switchToRpc: jest.fn().mockReturnValue(rpcMock),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KafkaRetryInterceptor,
        {
          provide: EventPublisher,
          useValue: publisherMock,
        },
      ],
    }).compile();

    interceptor = module.get<KafkaRetryInterceptor>(KafkaRetryInterceptor);
  });

  it('should pass through success calls without retry', async () => {
    const callHandlerMock: jest.Mocked<CallHandler> = {
      handle: jest.fn().mockReturnValue(of('success-result')),
    };

    const result = await interceptor.intercept(executionContextMock, callHandlerMock).toPromise();

    expect(result).toBe('success-result');
    expect(callHandlerMock.handle).toHaveBeenCalledTimes(1);
    expect(publisherMock.publish).not.toHaveBeenCalled();
  });

  it('should retry on failure and succeed if subsequent attempt succeeds', async () => {
    const callHandlerMock: jest.Mocked<CallHandler> = {
      handle: jest.fn()
        .mockReturnValueOnce(throwError(() => new Error('First attempt failed')))
        .mockReturnValueOnce(of('success-result')),
    };

    const result = await interceptor.intercept(executionContextMock, callHandlerMock).toPromise();

    expect(result).toBe('success-result');
    expect(callHandlerMock.handle).toHaveBeenCalledTimes(2);
    expect(publisherMock.publish).not.toHaveBeenCalled();
  });

  it('should retry up to failedCount and publish to DLQ on exhaustion', async () => {
    const callHandlerMock: jest.Mocked<CallHandler> = {
      handle: jest.fn().mockReturnValue(throwError(() => new Error('Persistent failure'))),
    };

    const result = await interceptor.intercept(executionContextMock, callHandlerMock).toPromise();

    expect(result).toEqual(
      expect.objectContaining({
        status: 'failed_routed_to_dlq',
      })
    );
    expect(callHandlerMock.handle).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    expect(publisherMock.publish).toHaveBeenCalledWith(
      'test-topic.DLQ',
      { test: 'data' },
      {
        eventType: 'test-topic',
        eventVersion: 1,
        tenantCode: 'test-tenant',
        correlationId: 'corr-123',
        causationId: 'msg-123',
        traceId: null,
      }
    );
  });
});
