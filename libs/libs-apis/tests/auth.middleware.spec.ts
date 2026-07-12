import { Test, TestingModule } from '@nestjs/testing';
import { API_MODULE_OPTIONS_TOKEN } from '../src/apis.module';
import { UnauthorizedException } from '@new-hros/libs-core';
import * as crypto from 'crypto';
import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { AuthMiddleware } from '../src/auth/auth.middleware';
import { JwtService } from '../src/auth/jwt.service';

describe('AuthMiddleware & JwtService', () => {
  let middleware: AuthMiddleware;
  let jwtService: JwtService;
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtService,
        {
          provide: API_MODULE_OPTIONS_TOKEN,
          useValue: {
            auth: {
              publicKey,
            },
          },
        },
      ],
    }).compile();

    jwtService = module.get<JwtService>(JwtService);
    middleware = new AuthMiddleware(jwtService);
  });

  const generateToken = (payload: any, options: jwt.SignOptions = {}) => {
    return jwt.sign(payload, privateKey, { algorithm: 'RS256', ...options });
  };

  describe('AuthMiddleware', () => {
    it('should pass and attach authContent for a valid token', () => {
      const payload = {
        sub: 'user-123',
        sessionId: 'session-456',
        tenantCode: 'VN001',
      };
      const token = generateToken(payload);

      const mockRequest = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      } as unknown as Request;

      const mockResponse = {} as Response;
      const next = jest.fn();

      middleware.use(mockRequest, mockResponse, next);

      expect(next).toHaveBeenCalled();
      expect(mockRequest.sessionId).toBe('session-456');
      expect(mockRequest.tenantCode).toBe('VN001');
    });

    it('should not throw and not set authContent if Authorization header is missing', () => {
      const mockRequest = {
        headers: {},
      } as unknown as Request;

      const mockResponse = {} as Response;
      const next = jest.fn();

      middleware.use(mockRequest, mockResponse, next);

      expect(next).toHaveBeenCalled();
      expect(mockRequest.sessionId).toBeUndefined();
    });

    it('should not throw and not set authContent if Authorization format is invalid', () => {
      const mockRequest = {
        headers: {
          authorization: 'InvalidTokenHere',
        },
      } as unknown as Request;

      const mockResponse = {} as Response;
      const next = jest.fn();

      middleware.use(mockRequest, mockResponse, next);

      expect(next).toHaveBeenCalled();
      expect(mockRequest.sessionId).toBeUndefined();
    });

    it('should not throw and not set authContent if signature is invalid', () => {
      const payload = {
        sub: 'user-123',
        sessionId: 'session-456',
        tenantCode: 'VN001',
      };
      const differentKeys = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });
      const badToken = jwt.sign(payload, differentKeys.privateKey, { algorithm: 'RS256' });

      const mockRequest = {
        headers: {
          authorization: `Bearer ${badToken}`,
        },
      } as unknown as Request;

      const mockResponse = {} as Response;
      const next = jest.fn();

      middleware.use(mockRequest, mockResponse, next);

      expect(next).toHaveBeenCalled();
      expect(mockRequest.sessionId).toBeUndefined();
    });
  });

  describe('JwtService Verification', () => {
    it('should verify a valid token and return context', () => {
      const payload = {
        sub: 'user-123',
        sessionId: 'session-456',
        tenantCode: 'VN001',
      };
      const token = generateToken(payload);
      const result = jwtService.verify(token);

      expect(result.sessionId).toBe('session-456');
      expect(result.tenantCode).toBe('VN001');
    });

    it('should throw UnauthorizedException if signature is invalid', () => {
      const payload = {
        sub: 'user-123',
        sessionId: 'session-456',
        tenantCode: 'VN001',
      };
      const differentKeys = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });
      const badToken = jwt.sign(payload, differentKeys.privateKey, { algorithm: 'RS256' });

      expect(() => jwtService.verify(badToken)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if token is expired', () => {
      const payload = {
        sub: 'user-123',
        sessionId: 'session-456',
        tenantCode: 'VN001',
      };
      const expiredToken = generateToken(payload, { expiresIn: '-1s' });

      expect(() => jwtService.verify(expiredToken)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if sessionId claim is missing', () => {
      const payload = {
        sub: 'user-123',
        tenantCode: 'VN001',
      };
      const token = generateToken(payload);

      expect(() => jwtService.verify(token)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if tenantCode claim is missing', () => {
      const payload = {
        sub: 'user-123',
        sessionId: 'session-456',
      };
      const token = generateToken(payload);

      expect(() => jwtService.verify(token)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if token algorithm is HS256', () => {
      const payload = {
        sub: 'user-123',
        sessionId: 'session-456',
        tenantCode: 'VN001',
      };
      const hs256Token = jwt.sign(payload, 'secret', { algorithm: 'HS256' });

      expect(() => jwtService.verify(hs256Token)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if public key is not configured', async () => {
      const unconfiguredModule = await Test.createTestingModule({
        providers: [
          JwtService,
          {
            provide: API_MODULE_OPTIONS_TOKEN,
            useValue: {},
          },
        ],
      }).compile();

      const badJwtService = unconfiguredModule.get<JwtService>(JwtService);
      const payload = {
        sub: 'user-123',
        sessionId: 'session-456',
        tenantCode: 'VN001',
      };
      const token = generateToken(payload);

      expect(() => badJwtService.verify(token)).toThrow(UnauthorizedException);
    });
  });
});
