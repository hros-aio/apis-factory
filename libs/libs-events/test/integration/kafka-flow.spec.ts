import { Test, TestingModule } from '@nestjs/testing';
import { Controller, INestApplication } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { EventsModule } from '../../src/events.module';
import { EventPublisher } from '../../src/publisher/event-publisher.service';
import { setupKafkaMicroservice } from '../../src/transporter/setup-kafka-microservice';
import { EventEnvelope } from '../../src/interfaces/event-payload.interface';
import { ClientKafka, ServerKafka } from '@nestjs/microservices';
import { of } from 'rxjs';

@Controller()
class TestEmployeeController {
  static receivedEvent: EventEnvelope<any> | null = null;

  @EventPattern('employee.created')
  async handleEmployeeCreated(@Payload() event: EventEnvelope<any>) {
    TestEmployeeController.receivedEvent = event;
  }
}

describe('Kafka Pub/Sub Flow Integration', () => {
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

    emitSpy = jest.spyOn(ClientKafka.prototype, 'emit').mockImplementation((topic: any, data: any) => {
      if (topic === 'employee.created') {
        TestEmployeeController.receivedEvent = data;
      }
      return of({} as any);
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        EventsModule.register({
          brokers: ['localhost:9092'],
          groupId: 'employee-service-group',
          clientId: 'employee-service-client',
          failedCount: 3,
          retryDelayMs: 1000,
        }),
      ],
      controllers: [TestEmployeeController],
    }).compile();

    app = moduleFixture.createNestApplication();

    await setupKafkaMicroservice(app, {
      client: {
        brokers: ['localhost:9092'],
      },
      consumer: {
        groupId: 'employee-service-group',
      },
    });

    publisher = app.get<EventPublisher>(EventPublisher);
  });

  afterAll(async () => {
    await app.close();
    jest.restoreAllMocks();
  });

  it('should successfully publish and route event payload to controller', async () => {
    const payload = { employeeId: 'emp-10243', name: 'Jane Doe' };

    await publisher.publish('employee.created', payload);

    expect(emitSpy).toHaveBeenCalled();
    expect(TestEmployeeController.receivedEvent).toBeDefined();
    expect(TestEmployeeController.receivedEvent?.payload).toEqual(payload);
    expect(TestEmployeeController.receivedEvent?.topic).toBe('employee.created');
  });
});
