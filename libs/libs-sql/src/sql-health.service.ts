import { HealthIndicator } from '@new-hros/libs-core';
import { EntityManager } from 'typeorm';

export class SqlHealthService implements HealthIndicator {
  readonly name = 'postgres';

  constructor(private readonly entityManager: EntityManager) {}

  async checkHealth(): Promise<{ status: 'up' | 'down'; details?: Record<string, any> }> {
    try {
      await this.entityManager.query('SELECT 1');
      return { status: 'up' };
    } catch (err: any) {
      return { status: 'down', details: { error: err.message } };
    }
  }
}
