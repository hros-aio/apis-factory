import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestContextService } from '@new-hros/libs-core';
import { AuthenticatedUser } from 'src/interfaces/auth.interface';

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
  if (request && request.user) {
    return request.user;
  }
  return RequestContextService.getUser();
});
