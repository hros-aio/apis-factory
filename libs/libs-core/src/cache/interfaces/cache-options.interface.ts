export interface CacheModuleOptions {
  /** Local in-memory L1 cache TTL default in seconds */
  l1DefaultTtl?: number;

  /** Max items allowed in L1 cache */
  l1MaxItems?: number;

  /** Redis connection options for L2 cache */
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
    keyPrefix?: string;
  };
}

export interface CacheModuleAsyncOptions {
  useFactory: (...args: any[]) => Promise<CacheModuleOptions> | CacheModuleOptions;
  inject?: any[];
}
