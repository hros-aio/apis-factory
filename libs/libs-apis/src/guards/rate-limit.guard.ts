import { CanActivate, ExecutionContext, Injectable, Inject } from '@nestjs/common';
import { CacheProvider, BusinessException } from '@new-hros/libs-core';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    @Inject('CacheProvider')
    private readonly cacheProvider: CacheProvider,
    private readonly options: { limit: number; windowSeconds: number } = { limit: 100, windowSeconds: 60 },
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const clientId = request.ip || request.socket.remoteAddress || 'global';
    
    const key = `ratelimit:${clientId}`;
    const currentCount = (await this.cacheProvider.get<number>(key)) || 0;

    if (currentCount >= this.options.limit) {
      throw new BusinessException('Too many requests, please try again later.', 'TOO_MANY_REQUESTS', 429);
    }

    await this.cacheProvider.set(key, currentCount + 1, this.options.windowSeconds);
    return true;
  }
}
