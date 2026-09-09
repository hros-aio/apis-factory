import { Reflector } from '@nestjs/core';
import { AuthGuard } from '../src/guards/auth.guard';
import { RequestContextService, RequestContext, AuthContext, UnauthorizedException, PermissionDeniedException, CacheProvider } from '@new-hros/libs-core';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let reflector: jest.Mocked<Reflector>;
  let mockCacheService: jest.Mocked<CacheProvider>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;
    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      has: jest.fn(),
      del: jest.fn(),
      flushAll: jest.fn(),
      flushNamespace: jest.fn(),
    } as any;
    guard = new AuthGuard(reflector, mockCacheService);
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

    const mockSession: AuthContext = {
      userId: 'user-123',
      sessionId: 'session-456',
      tenantCode: 'tenant-abc',
      roles: ['admin'],
      scopes: [],
      permissions: [],
    };
    mockCacheService.get.mockResolvedValue(mockSession);

    const mockContext = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as any;

    const ctx: RequestContext = {
      traceId: 'trace-123',
      requestId: 'req-456',
      tenantCode: 'tenant-abc',
      user: {
        userId: 'user-123',
        sessionId: 'session-456',
        tenantCode: 'tenant-abc',
        roles: [],
        scopes: [],
        permissions: [],
      },
      requestTimestamp: new Date(),
      clientMetadata: { ip: '127.0.0.1' },
    };

    const result = await RequestContextService.run(ctx, async () => {
      return guard.canActivate(mockContext);
    });

    expect(result).toBe(true);
    expect(mockCacheService.get).toHaveBeenCalledWith('auth:session:session-456');
    expect(ctx.user).toEqual(mockSession);
  });

  it('should throw UnauthorizedException if sessionId is missing', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const mockContext = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as any;

    const ctx: RequestContext = {
      traceId: 'trace-123',
      requestId: 'req-456',
      tenantCode: 'tenant-abc',
      requestTimestamp: new Date(),
      clientMetadata: { ip: '127.0.0.1' },
    };

    await RequestContextService.run(ctx, async () => {
      await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
    });
  });

  it('should throw UnauthorizedException if session is missing from cache', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    mockCacheService.get.mockResolvedValue(null);

    const mockContext = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as any;

    const ctx: RequestContext = {
      traceId: 'trace-123',
      requestId: 'req-456',
      tenantCode: 'tenant-abc',
      user: {
        userId: 'user-123',
        sessionId: 'session-456',
        tenantCode: 'tenant-abc',
        roles: [],
        scopes: [],
        permissions: [],
      },
      requestTimestamp: new Date(),
      clientMetadata: { ip: '127.0.0.1' },
    };

    await RequestContextService.run(ctx, async () => {
      await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
    });
  });

  it('should throw PermissionDeniedException if tenant boundary is violated', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);

    const mockSession: AuthContext = {
      userId: 'user-123',
      sessionId: 'session-456',
      tenantCode: 'tenant-xyz',
      roles: [],
      scopes: [],
      permissions: [],
    };
    mockCacheService.get.mockResolvedValue(mockSession);

    const mockContext = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as any;

    const ctx: RequestContext = {
      traceId: 'trace-123',
      requestId: 'req-456',
      tenantCode: 'tenant-abc',
      user: {
        userId: 'user-123',
        sessionId: 'session-456',
        tenantCode: 'tenant-abc',
        roles: [],
        scopes: [],
        permissions: [],
      },
      requestTimestamp: new Date(),
      clientMetadata: { ip: '127.0.0.1' },
    };

    await RequestContextService.run(ctx, async () => {
      await expect(guard.canActivate(mockContext)).rejects.toThrow(PermissionDeniedException);
    });
  });
});
