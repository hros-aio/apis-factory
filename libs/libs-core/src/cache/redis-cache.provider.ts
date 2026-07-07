import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { ICacheProvider } from './interfaces/cache-provider.interface';
import { CacheModuleOptions } from './interfaces/cache-options.interface';

@Injectable()
export class RedisCacheProvider implements ICacheProvider {
  private readonly client: Redis | null = null;

  constructor(@Inject('CACHE_MODULE_OPTIONS') options: CacheModuleOptions) {
    if (options.redis) {
      // Direct require to bypass default export mismatch when esModuleInterop is disabled
      const RedisClient = require('ioredis');
      this.client = new RedisClient({
        host: options.redis.host,
        port: options.redis.port,
        password: options.redis.password,
        db: options.redis.db,
        keyPrefix: options.redis.keyPrefix,
        maxRetriesPerRequest: 3,
      }) as Redis;

      this.client.on('error', (err: any) => {
        console.error('Redis Connection Error:', err);
      });
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;
    try {
      const value = await this.client.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (err) {
      console.error(`Redis GET failed for key: ${key}`, err);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (!this.client) return;
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds && ttlSeconds > 0) {
        await this.client.set(key, serialized, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (err) {
      console.error(`Redis SET failed for key: ${key}`, err);
    }
  }

  async has(key: string): Promise<boolean> {
    if (!this.client) return false;
    try {
      const count = await this.client.exists(key);
      return count === 1;
    } catch (err) {
      console.error(`Redis EXISTS failed for key: ${key}`, err);
      return false;
    }
  }

  async del(key: string | string[]): Promise<void> {
    if (!this.client) return;
    try {
      const keys = Array.isArray(key) ? key : [key];
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (err) {
      console.error(`Redis DEL failed for keys: ${key}`, err);
    }
  }

  async flushAll(): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.flushdb();
    } catch (err) {
      console.error('Redis FLUSHALL failed', err);
    }
  }

  async flushNamespace(pattern: string): Promise<void> {
    if (!this.client) return;
    try {
      let cursor = '0';
      const matchPattern = pattern.endsWith('*') ? pattern : `${pattern}*`;
      do {
        const [newCursor, keys] = await this.client.scan(cursor, 'MATCH', matchPattern, 'COUNT', 100);
        cursor = newCursor;
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } while (cursor !== '0');
    } catch (err) {
      console.error(`Redis FLUSHNAMESPACE failed for pattern: ${pattern}`, err);
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
    }
  }
}
