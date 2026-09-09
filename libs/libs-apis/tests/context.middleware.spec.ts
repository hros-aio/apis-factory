import { ConfigurationService, RequestContextService } from '@new-hros/libs-core';
import * as crypto from 'crypto';
import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { ContextMiddleware, requestFromToken } from '../src/middleware';

describe('ContextMiddleware', () => {
  let middleware: ContextMiddleware;
  let mockConfigService: jest.Mocked<ConfigurationService>;
  let privateKey: string;
  let publicKey: string;

  beforeAll(() => {
    const keys = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    privateKey = keys.privateKey;
    publicKey = keys.publicKey;
  });

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'jwt.publicKey') return publicKey;
        return undefined;
      }),
    } as unknown as jest.Mocked<ConfigurationService>;

    middleware = new ContextMiddleware(mockConfigService);
  });

  it('should initialize and propagate trace context and jwt user info', (done) => {
    const payload = {
      sub: 'user-001',
      sid: 'session-001',
      tenantCode: 'tenant-test',
    };
    const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });

    const mockRequest = {
      headers: {
        'x-trace-id': 'custom-trace-id',
        'x-request-id': 'custom-request-id',
        authorization: `Bearer ${token}`,
      },
      ip: '127.0.0.1',
    } as unknown as Request;

    const mockResponse = {
      setHeader: jest.fn(),
    } as unknown as Response;

    const next = () => {
      expect(RequestContextService.getTraceId()).toBe('custom-trace-id');
      expect(RequestContextService.getRequestId()).toBe('custom-request-id');
      expect(RequestContextService.getTenantCode()).toBe('tenant-test');
      expect(RequestContextService.getUser()).toMatchObject({
        userId: 'user-001',
        sessionId: 'session-001',
        tenantCode: 'tenant-test',
      });
      expect(mockResponse.setHeader).toHaveBeenCalledWith('x-trace-id', 'custom-trace-id');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('x-request-id', 'custom-request-id');
      done();
    };

    middleware.use(mockRequest, mockResponse, next);
  });

  it('should fallback to query/body tenantCode when token is missing or invalid', (done) => {
    const mockRequest = {
      headers: {
        'x-trace-id': 'trace-123',
        'x-request-id': 'req-123',
      },
      query: {
        tenantCode: 'query-tenant',
      },
      ip: '127.0.0.1',
    } as unknown as Request;

    const mockResponse = {
      setHeader: jest.fn(),
    } as unknown as Response;

    const next = () => {
      expect(RequestContextService.getTraceId()).toBe('trace-123');
      expect(RequestContextService.getRequestId()).toBe('req-123');
      expect(RequestContextService.getTenantCode()).toBe('query-tenant');
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
      expect(mockResponse.setHeader).toHaveBeenCalledWith('x-trace-id', expect.any(String));
      expect(mockResponse.setHeader).toHaveBeenCalledWith('x-request-id', expect.any(String));
      done();
    };

    middleware.use(mockRequest, mockResponse, next);
  });

  it('should extract token correctly via requestFromToken', () => {
    const reqWithToken = {
      headers: { authorization: 'Bearer test-token-123' },
    } as unknown as Request;
    expect(requestFromToken(reqWithToken)).toBe('test-token-123');

    const reqWithoutToken = {
      headers: {},
    } as unknown as Request;
    expect(requestFromToken(reqWithoutToken)).toBe('');
  });
});
