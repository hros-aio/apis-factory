import { CacheProvider } from './cache-provider.interface';
import { MemoryCacheProvider } from './memory-cache.provider';

export class RedisCacheProvider extends MemoryCacheProvider implements CacheProvider {
  constructor(private readonly options: { host?: string; port?: number; password?: string }) {
    super();
  }
}
