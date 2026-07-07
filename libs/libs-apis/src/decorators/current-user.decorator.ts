import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestContextService } from '@new-hros/libs-core';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (request && request.user) {
      return request.user;
    }
    return RequestContextService.getUser();
  },
);
