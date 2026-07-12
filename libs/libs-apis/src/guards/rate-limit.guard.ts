import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { BusinessException, CACHE_PROVIDER_TOKEN, CacheProvider } from '@new-hros/libs-core';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    @Inject(CACHE_PROVIDER_TOKEN)
    private readonly cacheProvider: CacheProvider,
    private readonly options: { limit: number; windowSeconds: number } = {
      limit: 100,
      windowSeconds: 60,
    },
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const clientId = request.ip || request.socket.remoteAddress || 'global';

    const key = `ratelimit:${clientId}`;
    const record = await this.cacheProvider.get<{ count: number; expiresAt: number }>(key);
    const currentCount = record ? record.count : 0;

    if (currentCount >= this.options.limit) {
      throw new BusinessException(
        'Too many requests, please try again later.',
        'TOO_MANY_REQUESTS',
        429,
      );
    }

    if (currentCount === 0) {
      const expiresAt = Date.now() + this.options.windowSeconds * 1000;
      await this.cacheProvider.set(key, { count: 1, expiresAt }, this.options.windowSeconds);
    } else {
      const expiresAt = record!.expiresAt;
      const remainingTtl = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      await this.cacheProvider.set(key, { count: currentCount + 1, expiresAt }, remainingTtl);
    }
    return true;
  }
}
