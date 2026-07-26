import { Test } from '@nestjs/testing';
import { setupKafkaMicroservice } from '../../src/transporter/setup-kafka-microservice';
import { INestApplication } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';

describe('setupKafkaMicroservice', () => {
  let appMock: jest.Mocked<INestApplication>;

  beforeEach(() => {
    appMock = {
      connectMicroservice: jest.fn(),
      startAllMicroservices: jest.fn().mockResolvedValue({} as any),
    } as any;
  });

  it('should connect microservice and start microservices', async () => {
    const options = {
      client: {
        brokers: ['localhost:9092'],
        clientId: 'test-client',
      },
      consumer: {
        groupId: 'test-group',
      },
      failedCount: 5,
      retryDelayMs: 2000,
    };

    await expect(setupKafkaMicroservice(appMock, options)).resolves.not.toThrow();

    expect(appMock.connectMicroservice).toHaveBeenCalledWith(
      expect.objectContaining({
        transport: Transport.KAFKA,
        options: expect.objectContaining({
          client: expect.objectContaining({
            brokers: ['localhost:9092'],
            clientId: 'test-client',
          }),
          consumer: expect.objectContaining({
            groupId: 'test-group',
          }),
        }),
      })
    );

    expect(appMock.startAllMicroservices).toHaveBeenCalled();
  });
});
