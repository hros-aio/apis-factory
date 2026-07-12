export interface ICacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  has(key: string): Promise<boolean>;
  del(key: string | string[]): Promise<void>;
  flushAll(): Promise<void>;
  flushNamespace(pattern: string): Promise<void>;
}
