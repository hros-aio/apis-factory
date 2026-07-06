import { RequestContextService } from '../src/request-context/request-context.service';
import { RequestContext } from '../src/interfaces/context.interface';

describe('RequestContextService', () => {
  it('should isolate request context across parallel execution threads', async () => {
    const runIsolatedTask = async (id: string, delayMs: number) => {
      const mockContext: RequestContext = {
        traceId: `trace-${id}`,
        requestId: `req-${id}`,
        serviceName: 'test-service',
        tenantCode: `tenant-${id}`,
        requestTimestamp: new Date(),
        clientMetadata: { ip: '127.0.0.1' },
      };

      return RequestContextService.run(mockContext, async () => {
        // Assert initial store matches
        expect(RequestContextService.getTraceId()).toBe(`trace-${id}`);
        expect(RequestContextService.getTenantCode()).toBe(`tenant-${id}`);

        // Sleep to simulate asynchronous work
        await new Promise((resolve) => setTimeout(resolve, delayMs));

        // Assert store is still isolated and has not been contaminated by other runs
        expect(RequestContextService.getTraceId()).toBe(`trace-${id}`);
        expect(RequestContextService.getTenantCode()).toBe(`tenant-${id}`);
        return RequestContextService.current();
      });
    };

    // Run multiple asynchronous tasks in parallel with varying execution times
    const results = await Promise.all([
      runIsolatedTask('A', 50),
      runIsolatedTask('B', 10),
      runIsolatedTask('C', 30),
    ]);

    expect(results[0]?.traceId).toBe('trace-A');
    expect(results[1]?.traceId).toBe('trace-B');
    expect(results[2]?.traceId).toBe('trace-C');
  });

  it('should return null when accessed outside an active context execution', () => {
    expect(RequestContextService.current()).toBeNull();
    expect(RequestContextService.getTraceId()).toBeNull();
    expect(RequestContextService.getTenantCode()).toBeNull();
  });
});
