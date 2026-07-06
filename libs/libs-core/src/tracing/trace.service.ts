export abstract class TraceService {
  abstract getCurrentTraceId(): string | null;
  abstract getCurrentSpanId(): string | null;
  abstract createChildSpan<T>(spanName: string, operation: () => Promise<T>): Promise<T>;
  abstract injectTraceContext(headers: Record<string, string>): void;
  abstract extractTraceContext(headers: Record<string, string>): void;
}
