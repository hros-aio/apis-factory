import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { HealthService } from '@new-hros/libs-core';
import { Public } from '../decorators/http-context.decorators';

@ApiTags('Health')
@Controller('health')
@Public()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Check application health status' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is degraded or down' })
  async check(@Res() res: Response): Promise<void> {
    const result = await this.healthService.checkAll();
    const isHealthy = result.status === 'up';

    const info: Record<string, unknown> = {};
    const error: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(result.components)) {
      if ((value as { status: string }).status === 'up') {
        info[key] = { status: 'up' };
      } else {
        error[key] = value;
      }
    }

    const payload = {
      status: isHealthy ? 'ok' : 'error',
      info,
      error,
      details: result.components,
    };

    if (isHealthy) {
      res.status(HttpStatus.OK).json(payload);
    } else {
      res.status(HttpStatus.SERVICE_UNAVAILABLE).json(payload);
    }
  }
}
