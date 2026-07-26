import { Test, TestingModule } from '@nestjs/testing';
import { EventPublisher } from '../../src/publisher/event-publisher.service';
import { KafkaConnectionManager } from '../../src/connection/kafka-connection.manager';
import { ClientKafka } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';
import { EventPublishException } from '../../src/exceptions/event-processing.exception';

describe('EventPublisher', () => {
  let publisher: EventPublisher;
  let connectionManagerMock: jest.Mocked<KafkaConnectionManager>;
  let clientMock: jest.Mocked<ClientKafka>;

  beforeEach(async () => {
    clientMock = {
      emit: jest.fn(),
    } as any;

    connectionManagerMock = {
      getClient: jest.fn().mockReturnValue(clientMock),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventPublisher,
        {
          provide: KafkaConnectionManager,
          useValue: connectionManagerMock,
        },
        {
          provide: 'KAFKA_CONFIG',
          useValue: {
            clientId: 'test-client-id',
          },
        },
      ],
    }).compile();

    publisher = module.get<EventPublisher>(EventPublisher);
  });

  it('should be defined', () => {
    expect(publisher).toBeDefined();
  });

  it('should successfully publish an event payload', async () => {
    clientMock.emit.mockReturnValue(of({} as any));

    const payload = { employeeId: 'emp-123', name: 'John Doe' };
    await expect(publisher.publish('employee.created', payload)).resolves.not.toThrow();

    expect(clientMock.emit).toHaveBeenCalledWith(
      'employee.created',
      expect.objectContaining({
        id: expect.any(String),
        topic: 'employee.created',
        producer: expect.any(String),
        timestamp: expect.any(String),
        correlationId: expect.any(String),
        version: '1.0.0',
        payload,
      })
    );
  });

  it('should throw EventPublishException if Kafka emit fails', async () => {
    clientMock.emit.mockReturnValue(throwError(() => new Error('Kafka broker unavailable')));

    const payload = { employeeId: 'emp-123' };
    await expect(publisher.publish('employee.created', payload)).rejects.toThrow(EventPublishException);
  });
});
