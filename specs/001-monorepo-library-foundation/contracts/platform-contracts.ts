// ============================================================================
// Core Layer Contracts (libs-core)
// ============================================================================

export interface AuthContext {
  userId: string;
  sessionId: string;
  tenantCode: string;
  roles: string[];
  scopes: string[];
  permissions: string[];
}

export interface RequestContext {
  traceId: string;
  requestId: string;
  serviceName: string;
  tenantCode: string;
  companyId?: string;
  user?: AuthContext;
  clientMetadata: {
    ip: string;
    userAgent?: string;
    [key: string]: any;
  };
  requestTimestamp: Date;
}

export declare class RequestContextService {
  static current(): RequestContext | null;
  static getTraceId(): string | null;
  static getRequestId(): string | null;
  static getTenantCode(): string | null;
  static getUser(): AuthContext | null;
  static getAuthContext(): AuthContext | null;
}

export interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
}

export interface LoggerService {
  debug(message: string, context?: string): void;
  info(message: string, context?: string): void;
  warn(message: string, context?: string): void;
  error(message: string, trace?: string, context?: string): void;
  audit(action: string, actor: string, details: any): void;
  security(event: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', details: any): void;
}

export interface TraceService {
  getCurrentTraceId(): string | null;
  getCurrentSpanId(): string | null;
  createChildSpan<T>(spanName: string, operation: () => Promise<T>): Promise<T>;
  injectTraceContext(headers: Record<string, string>): void;
  extractTraceContext(headers: Record<string, string>): void;
}

// ============================================================================
// Platform Strategy Contracts (libs-core / libs-apis)
// ============================================================================

export interface AuthenticationStrategy {
  authenticate(token: string): Promise<AuthContext>;
}

export interface AuthorizationStrategy {
  authorize(user: AuthContext, requiredPermissions: string[]): Promise<boolean>;
}

export interface RateLimitStrategy {
  isRateLimited(clientId: string, limit: number, windowSeconds: number): Promise<boolean>;
}

export interface LoggingStrategy {
  logRequest(request: any, response: any, durationMs: number): void;
}

export interface TraceStrategy {
  generateTraceId(): string;
  generateSpanId(): string;
}

export interface ExceptionStrategy {
  formatException(exception: any): { statusCode: number; body: any };
}

export interface HealthIndicator {
  name: string;
  checkHealth(): Promise<{ status: 'up' | 'down'; details?: Record<string, any> }>;
}

export interface HealthService {
  registerIndicator(indicator: HealthIndicator): void;
  checkAll(): Promise<{ status: 'up' | 'down'; components: Record<string, any> }>;
}

// ============================================================================
// SQL Layer Contracts (libs-sql)
// ============================================================================

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export declare class BaseRepository<Entity> {
  create(entity: Partial<Entity>): Promise<Entity>;
  findById(id: string): Promise<Entity | null>;
  findPaginated(options: PaginationOptions, filter?: any): Promise<PaginatedResult<Entity>>;
  update(id: string, entity: Partial<Entity>): Promise<Entity>;
  delete(id: string): Promise<void>; // Soft delete by default
  restore(id: string): Promise<void>;
}

export declare class TransactionService {
  runInTransaction<T>(work: () => Promise<T>): Promise<T>;
}

export declare class UnitOfWork {
  execute<T>(work: () => Promise<T>): Promise<T>;
}

// ============================================================================
// Mongo Layer Contracts (libs-mongo)
// ============================================================================

export declare class BaseMongoRepository<Document> {
  create(doc: Partial<Document>): Promise<Document>;
  findById(id: string): Promise<Document | null>;
  findPaginated(options: PaginationOptions, filter?: any): Promise<PaginatedResult<Document>>;
  update(id: string, doc: Partial<Document>): Promise<Document>;
  delete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
}

// ============================================================================
// Decorators
// ============================================================================
export declare function CurrentUser(): ParameterDecorator;
export declare function CurrentUserId(): ParameterDecorator;
export declare function Tenant(): ParameterDecorator;
export declare function TenantCode(): ParameterDecorator;
export declare function SessionId(): ParameterDecorator;
export declare function TraceId(): ParameterDecorator;
export declare function RequestContext(): ParameterDecorator;
export declare function RequirePermission(permission: string): MethodDecorator & ClassDecorator;
export declare function Roles(roles: string[]): MethodDecorator & ClassDecorator;
export declare function Scopes(scopes: string[]): MethodDecorator & ClassDecorator;
export declare function Public(): MethodDecorator;
