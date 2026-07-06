import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { RequestContextService } from '@new-hros/libs-core';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    return RequestContextService.getUser();
  },
);

export const TenantCode = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    return RequestContextService.getTenantCode();
  },
);

export const TraceId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    return RequestContextService.getTraceId();
  },
);

export const Public = () => SetMetadata('isPublic', true);

export const RequirePermission = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);
