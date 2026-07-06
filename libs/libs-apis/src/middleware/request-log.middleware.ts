import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '@new-hros/libs-core';

@Injectable()
export class RequestLogMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    this.logger.info(`Incoming Request: ${req.method} ${req.originalUrl || req.url}`, 'HTTP');

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const message = `Request Complete: ${req.method} ${req.originalUrl || req.url} | Status: ${res.statusCode} | Duration: ${duration}ms`;

      if (res.statusCode >= 500) {
        this.logger.error(message, undefined, 'HTTP');
      } else if (res.statusCode >= 400) {
        this.logger.warn(message, 'HTTP');
      } else {
        this.logger.info(message, 'HTTP');
      }
    });

    next();
  }
}
