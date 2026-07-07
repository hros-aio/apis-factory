import { Injectable, Inject } from '@nestjs/common';
import { ICacheProvider } from './interfaces/cache-provider.interface';
import { CacheModuleOptions } from './interfaces/cache-options.interface';

  @Injectable()
  export class MemoryCacheProvider implements ICacheProvider {
    private readonly cache = new Map<string, { serialized: string; expiresAt: number | null }>();
    private readonly defaultTtl: number;
    private readonly maxItems: number;

    constructor(@Inject('CACHE_MODULE_OPTIONS') options: CacheModuleOptions) {
      this.defaultTtl = options.l1DefaultTtl !== undefined ? options.l1DefaultTtl : 60;
      this.maxItems = options.l1MaxItems !== undefined ? options.l1MaxItems : 1000;
    }

    async get<T>(key: string): Promise<T | null> {
      const entry = this.cache.get(key);
      if (!entry) return null;

      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        this.cache.delete(key);
        return null;
      }

      try {
        return JSON.parse(entry.serialized) as T;
      } catch {
        return null;
      }
    }

    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
      if (this.cache.size >= this.maxItems) {
        this.evict();
      }

      const ttl = ttlSeconds !== undefined ? ttlSeconds : this.defaultTtl;
      const expiresAt = ttl > 0 ? Date.now() + ttl * 1000 : null;

      try {
        const serialized = JSON.stringify(value);
        this.cache.set(key, { serialized, expiresAt });
      } catch {
        // Safe fallback in case of serialization failure
      }
    }

    async has(key: string): Promise<boolean> {
      const entry = this.cache.get(key);
      if (!entry) return false;

      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        this.cache.delete(key);
        return false;
      }

      return true;
    }

    async del(key: string | string[]): Promise<void> {
      const keys = Array.isArray(key) ? key : [key];
      for (const k of keys) {
        this.cache.delete(k);
      }
    }

    async flushAll(): Promise<void> {
      this.cache.clear();
    }

    async flushNamespace(pattern: string): Promise<void> {
      // Replace wildcard * with RegExp .* representation
      const regexPattern = new RegExp(`^${pattern.replace(/\*/g, '.*')}`);
      for (const key of this.cache.keys()) {
        if (regexPattern.test(key)) {
          this.cache.delete(key);
        }
      }
    }

    private evict(): void {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (entry.expiresAt && now > entry.expiresAt) {
          this.cache.delete(key);
        }
      }

      if (this.cache.size >= this.maxItems) {
        const oldestKey = this.cache.keys().next().value;
        if (oldestKey !== undefined) {
          this.cache.delete(oldestKey);
        }
      }
    }
  }
