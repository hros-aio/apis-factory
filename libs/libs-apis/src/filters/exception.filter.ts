import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BusinessException, RequestContextService } from '@new-hros/libs-core';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let errors: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseBody = exception.getResponse() as any;
      message = responseBody.message || exception.message;
      code = responseBody.code || 'HTTP_ERROR';
      errors = responseBody.errors || undefined;
    } else if (exception instanceof BusinessException) {
      status = exception.status;
      code = exception.code;
      message = exception.message;
      errors = (exception as any).errors || undefined;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const traceId = RequestContextService.getTraceId();

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      code,
      message,
      errors,
      traceId,
    });
  }
}
