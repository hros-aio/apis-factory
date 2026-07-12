import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from '../src/cache/cache.service';
import { MemoryCacheProvider } from '../src/cache/memory-cache.provider';
import { RedisCacheProvider } from '../src/cache/redis-cache.provider';
import { CacheModule } from '../src/cache/cache.module';

// Mock ioredis client
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    return {
      get: jest.fn(),
      set: jest.fn(),
      exists: jest.fn(),
      del: jest.fn(),
      flushdb: jest.fn(),
      scan: jest.fn().mockResolvedValue(['0', []]),
      on: jest.fn(),
      quit: jest.fn(),
    };
  });
});

describe('CacheService', () => {
  let service: CacheService;
  let l1: MemoryCacheProvider;
  let l2: RedisCacheProvider;
  let mockRedisClient: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        CacheModule.register({
          l1DefaultTtl: 10,
          l1MaxItems: 100,
          redis: {
            host: 'localhost',
            port: 6379,
          },
        }),
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    l1 = module.get<MemoryCacheProvider>(MemoryCacheProvider);
    l2 = module.get<RedisCacheProvider>(RedisCacheProvider);
    mockRedisClient = (l2 as any).client;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('set', () => {
    it('should write to both L1 and L2 caches', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };
      const ttl = 30;

      await service.set(key, value, ttl);

      const l1Value = await l1.get(key);
      expect(l1Value).toEqual(value);
      expect(mockRedisClient.set).toHaveBeenCalledWith(key, JSON.stringify(value), 'EX', ttl);
    });
  });

  describe('get', () => {
    it('should read from L1 first if present', async () => {
      const key = 'test-key';
      const value = { data: 'l1-value' };

      await l1.set(key, value);

      const result = await service.get(key);

      expect(result).toEqual(value);
      expect(mockRedisClient.get).not.toHaveBeenCalled();
    });

    it('should fall back to L2 on L1 miss and hydrate L1 on hit', async () => {
      const key = 'test-key';
      const value = { data: 'l2-value' };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(value));
      expect(await l1.get(key)).toBeNull();

      const result = await service.get(key);

      expect(result).toEqual(value);
      expect(mockRedisClient.get).toHaveBeenCalledWith(key);
      expect(await l1.get(key)).toEqual(value);
    });

    it('should return null if both L1 and L2 miss', async () => {
      const key = 'test-key';
      mockRedisClient.get.mockResolvedValue(null);

      const result = await service.get(key);

      expect(result).toBeNull();
    });
  });

  describe('has', () => {
    it('should return true if L1 has the key', async () => {
      const key = 'test-key';
      await l1.set(key, 'value');

      const result = await service.has(key);

      expect(result).toBe(true);
      expect(mockRedisClient.exists).not.toHaveBeenCalled();
    });

    it('should fall back to L2 if L1 does not have the key', async () => {
      const key = 'test-key';
      mockRedisClient.exists.mockResolvedValue(1);

      const result = await service.has(key);

      expect(result).toBe(true);
      expect(mockRedisClient.exists).toHaveBeenCalledWith(key);
    });
  });

  describe('del', () => {
    it('should delete from both L1 and L2 caches', async () => {
      const key = 'test-key';
      await l1.set(key, 'value');

      await service.del(key);

      expect(await l1.get(key)).toBeNull();
      expect(mockRedisClient.del).toHaveBeenCalledWith(key);
    });
  });

  describe('flushAll', () => {
    it('should flush all keys in both L1 and L2', async () => {
      await l1.set('key1', 'val1');
      await l1.set('key2', 'val2');

      await service.flushAll();

      expect(await l1.get('key1')).toBeNull();
      expect(await l1.get('key2')).toBeNull();
      expect(mockRedisClient.flushdb).toHaveBeenCalled();
    });
  });

  describe('flushNamespace', () => {
    it('should flush only keys matching pattern in L1 and L2', async () => {
      await l1.set('auth:session:1', 'val1');
      await l1.set('user:profile:2', 'val2');

      mockRedisClient.scan.mockResolvedValueOnce(['0', ['auth:session:1']]);

      await service.flushNamespace('auth:session:*');

      expect(await l1.get('auth:session:1')).toBeNull();
      expect(await l1.get('user:profile:2')).toEqual('val2');

      expect(mockRedisClient.scan).toHaveBeenCalled();
      expect(mockRedisClient.del).toHaveBeenCalledWith('auth:session:1');
    });
  });
});
