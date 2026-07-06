import { TraceMiddleware } from '../src/middleware/trace.middleware';
import { RequestContextService } from '@new-hros/libs-core';
import { Request, Response } from 'express';

describe('TraceMiddleware', () => {
  let middleware: TraceMiddleware;

  beforeEach(() => {
    middleware = new TraceMiddleware();
  });

  it('should initialize and propagate trace context from headers', (done) => {
    const mockRequest = {
      headers: {
        'x-trace-id': 'custom-trace-id',
        'x-request-id': 'custom-request-id',
        'x-tenant-code': 'custom-tenant',
      },
      ip: '127.0.0.1',
    } as unknown as Request;

    const mockResponse = {
      setHeader: jest.fn(),
    } as unknown as Response;

    const next = () => {
      expect(RequestContextService.getTraceId()).toBe('custom-trace-id');
      expect(RequestContextService.getRequestId()).toBe('custom-request-id');
      expect(RequestContextService.getTenantCode()).toBe('custom-tenant');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('x-trace-id', 'custom-trace-id');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('x-request-id', 'custom-request-id');
      done();
    };

    middleware.use(mockRequest, mockResponse, next);
  });

  it('should generate new IDs if headers are missing', (done) => {
    const mockRequest = {
      headers: {},
      ip: '127.0.0.1',
    } as unknown as Request;

    const mockResponse = {
      setHeader: jest.fn(),
    } as unknown as Response;

    const next = () => {
      expect(RequestContextService.getTraceId()).toBeDefined();
      expect(RequestContextService.getRequestId()).toBeDefined();
      expect(RequestContextService.getTenantCode()).toBe('default');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('x-trace-id', expect.any(String));
      expect(mockResponse.setHeader).toHaveBeenCalledWith('x-request-id', expect.any(String));
      done();
    };

    middleware.use(mockRequest, mockResponse, next);
  });
});
