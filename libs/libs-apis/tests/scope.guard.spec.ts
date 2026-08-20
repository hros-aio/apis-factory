import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { CompanyScopeGuard, TenantScopeGuard } from '../src/guards';

describe('Scope Guards', () => {
  describe('CompanyScopeGuard', () => {
    let guard: CompanyScopeGuard;

    beforeEach(() => {
      guard = new CompanyScopeGuard();
    });

    const createMockExecutionContext = (request: unknown): ExecutionContext =>
      ({
        switchToHttp: () => ({
          getRequest: (): unknown => request,
        }),
      }) as unknown as ExecutionContext;

    it('should allow access when user companyId matches param companyId', () => {
      const request = {
        params: { companyId: 'company-a' },
        user: { companyId: 'company-a', roles: ['ADMIN'] },
      };

      const result = guard.canActivate(createMockExecutionContext(request));
      expect(result).toBe(true);
    });

    it('should allow access when user is SUPER_ADMIN even if companyId differs', () => {
      const request = {
        params: { companyId: 'company-b' },
        user: { companyId: 'company-a', roles: ['SUPER_ADMIN'] },
      };

      const result = guard.canActivate(createMockExecutionContext(request));
      expect(result).toBe(true);
    });

    it('should allow access when user has multiple authorized companies including target', () => {
      const request = {
        params: { companyId: 'company-b' },
        user: { companyId: 'company-a', companies: ['company-a', 'company-b'], roles: ['ADMIN'] },
      };

      const result = guard.canActivate(createMockExecutionContext(request));
      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user companyId does not match param companyId', () => {
      const request = {
        params: { companyId: 'company-b' },
        user: { companyId: 'company-a', companies: ['company-a'], roles: ['ADMIN'] },
      };

      expect(() => guard.canActivate(createMockExecutionContext(request))).toThrow(
        ForbiddenException,
      );
    });

    it('should allow access when path is not company-scoped', () => {
      const request = {
        params: {},
        url: '/health',
        user: { companyId: 'company-a', roles: ['ADMIN'] },
      };

      const result = guard.canActivate(createMockExecutionContext(request));
      expect(result).toBe(true);
    });
  });

  describe('TenantScopeGuard', () => {
    let guard: TenantScopeGuard;

    beforeEach(() => {
      guard = new TenantScopeGuard();
    });

    const createMockExecutionContext = (request: unknown): ExecutionContext =>
      ({
        switchToHttp: () => ({
          getRequest: (): unknown => request,
        }),
      }) as unknown as ExecutionContext;

    it('should allow access when param tenantId matches user tenantCode', () => {
      const request = {
        params: { tenantId: 'tenant-1' },
        user: { tenantCode: 'tenant-1' },
      };

      const result = guard.canActivate(createMockExecutionContext(request));
      expect(result).toBe(true);
    });

    it('should allow access when header x-tenant-id matches user tenantCode', () => {
      const request = {
        headers: { 'x-tenant-id': 'tenant-1' },
        user: { tenantCode: 'tenant-1' },
      };

      const result = guard.canActivate(createMockExecutionContext(request));
      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when param tenantId does not match user tenantCode', () => {
      const request = {
        params: { tenantId: 'tenant-2' },
        user: { tenantCode: 'tenant-1' },
      };

      expect(() => guard.canActivate(createMockExecutionContext(request))).toThrow(
        ForbiddenException,
      );
    });
  });
});
