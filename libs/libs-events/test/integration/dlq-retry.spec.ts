import { Test, TestingModule } from '@nestjs/testing';
import { Controller, INestApplication } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { EventsModule } from '../../src/events.module';
import { EventPublisher } from '../../src/publisher/event-publisher.service';
import { setupKafkaMicroservice } from '../../src/transporter/setup-kafka-microservice';
import { EventEnvelope } from '../../src/interfaces/event-payload.interface';
import { ClientKafka, ServerKafka } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';

@Controller()
class FaultyEmployeeController {
  static executionCount = 0;
  static dlqPublishedMessage: any = null;

  @EventPattern('employee.created')
  async handleEmployeeCreated(@Payload() event: EventEnvelope<any>) {
    FaultyEmployeeController.executionCount++;
    if (event.payload.name === 'fail') {
      throw new Error('Database connection failed');
    }
  }
}

describe('Kafka Retry & DLQ Routing Integration', () => {
  let app: INestApplication;
  let publisher: EventPublisher;
  let emitSpy: jest.SpyInstance;

  beforeAll(async () => {
    jest.spyOn(ClientKafka.prototype, 'connect').mockResolvedValue(null as any);
    jest.spyOn(ClientKafka.prototype, 'close').mockResolvedValue(null as any);
    jest.spyOn(ServerKafka.prototype, 'listen').mockImplementation(async (callback: any) => {
      if (typeof callback === 'function') {
        callback();
      }
    });
    jest.spyOn(ServerKafka.prototype, 'close').mockImplementation(async () => {});

    FaultyEmployeeController.executionCount = 0;
    FaultyEmployeeController.dlqPublishedMessage = null;

    emitSpy = jest.spyOn(ClientKafka.prototype, 'emit').mockImplementation((topic: any, data: any) => {
      if (topic === 'employee.created.DLQ') {
        FaultyEmployeeController.dlqPublishedMessage = data;
      }
      return of({} as any);
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        EventsModule.register({
          brokers: ['localhost:9092'],
          groupId: 'faulty-employee-group',
          clientId: 'faulty-employee-client',
          failedCount: 3,
          retryDelayMs: 10,
        }),
      ],
      controllers: [FaultyEmployeeController],
    }).compile();

    app = moduleFixture.createNestApplication();

    await setupKafkaMicroservice(app, {
      client: {
        brokers: ['localhost:9092'],
      },
      consumer: {
        groupId: 'faulty-employee-group',
      },
      failedCount: 3,
      retryDelayMs: 10,
    });

    publisher = app.get<EventPublisher>(EventPublisher);
  });

  afterAll(async () => {
    await app.close();
    jest.restoreAllMocks();
  });

  it('should trigger retries and route to DLQ on handler exception', async () => {
    const payload = { employeeId: 'emp-666', name: 'fail' };

    const interceptor = app.get(require('../../src/interceptors/kafka-retry.interceptor').KafkaRetryInterceptor);

    const contextMock = {
      getType: () => 'rpc',
      switchToRpc: () => ({
        getData: () => ({
          id: 'test-msg-id',
          correlationId: 'test-corr-id',
          version: '1.0.0',
          payload,
        }),
        getContext: () => ({
          getTopic: () => 'employee.created',
        }),
      }),
    } as any;

    const nextHandlerMock = {
      handle: () => {
        FaultyEmployeeController.executionCount++;
        return throwError(() => new Error('Database connection failed'));
      },
    };

    const result = await interceptor.intercept(contextMock, nextHandlerMock).toPromise();

    expect(result).toEqual(
      expect.objectContaining({
        status: 'failed_routed_to_dlq',
      })
    );
    expect(FaultyEmployeeController.executionCount).toBe(3);
    expect(FaultyEmployeeController.dlqPublishedMessage).toBeDefined();
    expect(FaultyEmployeeController.dlqPublishedMessage?.payload).toEqual(payload);
  });
});
