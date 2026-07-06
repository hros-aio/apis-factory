import { Reflector } from '@nestjs/core';
import { AuthGuard } from '../src/guards/auth.guard';
import { AuthenticationStrategy } from '../src/guards/auth-strategy.interface';
import { RequestContextService, RequestContext, UnauthorizedException, PermissionDeniedException } from '@new-hros/libs-core';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let reflector: jest.Mocked<Reflector>;
  let mockStrategy: jest.Mocked<AuthenticationStrategy>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;
    mockStrategy = {
      authenticate: jest.fn(),
    };
    guard = new AuthGuard(reflector, mockStrategy);
  });

  it('should bypass authentication if route is decorated as public', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const mockContext = {
      getHandler: () => {},
      getClass: () => {},
    } as any;

    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
  });

  it('should authenticate token and populate request context', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const mockUser = {
      userId: 'user-123',
      sessionId: 'session-456',
      tenantCode: 'tenant-abc',
      roles: ['admin'],
      scopes: ['read'],
      permissions: ['users.read'],
    };
    mockStrategy.authenticate.mockResolvedValue(mockUser);

    const mockRequest = {
      headers: {
        authorization: 'Bearer valid-token',
      },
    };
    const mockContext = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as any;

    const ctx: RequestContext = {
      traceId: 'trace-123',
      requestId: 'req-456',
      serviceName: 'test',
      tenantCode: 'tenant-abc',
      requestTimestamp: new Date(),
      clientMetadata: { ip: '127.0.0.1' },
    };

    const result = await RequestContextService.run(ctx, async () => {
      return guard.canActivate(mockContext);
    });

    expect(result).toBe(true);
    expect(mockStrategy.authenticate).toHaveBeenCalledWith('valid-token');
  });

  it('should throw UnauthorizedException if header is missing', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const mockRequest = { headers: {} };
    const mockContext = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as any;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw PermissionDeniedException if tenant boundary is violated', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const mockUser = {
      userId: 'user-123',
      sessionId: 'session-456',
      tenantCode: 'tenant-xyz',
      roles: [],
      scopes: [],
      permissions: [],
    };
    mockStrategy.authenticate.mockResolvedValue(mockUser);

    const mockRequest = {
      headers: {
        authorization: 'Bearer valid-token',
      },
    };
    const mockContext = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as any;

    const ctx: RequestContext = {
      traceId: 'trace-123',
      requestId: 'req-456',
      serviceName: 'test',
      tenantCode: 'tenant-abc',
      requestTimestamp: new Date(),
      clientMetadata: { ip: '127.0.0.1' },
    };

    await RequestContextService.run(ctx, async () => {
      await expect(guard.canActivate(mockContext)).rejects.toThrow(PermissionDeniedException);
    });
  });
});
