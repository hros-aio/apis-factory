import { Injectable } from '@nestjs/common';
import { MemoryCacheProvider } from './memory-cache.provider';
import { RedisCacheProvider } from './redis-cache.provider';

@Injectable()
export class CacheService {
  constructor(
    private readonly l1: MemoryCacheProvider,
    private readonly l2: RedisCacheProvider,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    const l1Value = await this.l1.get<T>(key);
    if (l1Value !== null) {
      return l1Value;
    }

    const l2Value = await this.l2.get<T>(key);
    if (l2Value !== null) {
      await this.l1.set<T>(key, l2Value);
      return l2Value;
    }

    return null;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await Promise.all([
      this.l1.set<T>(key, value, ttlSeconds),
      this.l2.set<T>(key, value, ttlSeconds),
    ]);
  }

  async has(key: string): Promise<boolean> {
    const hasL1 = await this.l1.has(key);
    if (hasL1) return true;
    return this.l2.has(key);
  }

  async del(key: string | string[]): Promise<void> {
    await Promise.all([this.l1.del(key), this.l2.del(key)]);
  }

  async flushAll(): Promise<void> {
    await Promise.all([this.l1.flushAll(), this.l2.flushAll()]);
  }

  async flushNamespace(pattern: string): Promise<void> {
    await Promise.all([this.l1.flushNamespace(pattern), this.l2.flushNamespace(pattern)]);
  }
}
