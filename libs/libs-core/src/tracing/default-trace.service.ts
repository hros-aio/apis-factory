import { TraceService } from './trace.service';
import { RequestContextService } from '../request-context/request-context.service';

export class DefaultTraceService extends TraceService {
  getCurrentTraceId(): string | null {
    return RequestContextService.getTraceId();
  }

  getCurrentSpanId(): string | null {
    return null;
  }

  async createChildSpan<T>(_spanName: string, operation: () => Promise<T>): Promise<T> {
    return operation();
  }

  injectTraceContext(headers: Record<string, string>): void {
    const traceId = this.getCurrentTraceId();
    if (traceId) {
      headers['x-trace-id'] = traceId;
    }
  }

  extractTraceContext(headers: Record<string, string>): void {
    // Core middleware handles parsing correlation headers at API layer.
  }
}
