import { HealthIndicator } from '@new-hros/libs-core';
import { Connection } from 'mongoose';

export class MongoHealthService implements HealthIndicator {
  readonly name = 'mongodb';

  constructor(private readonly connection: Connection) {}

  async checkHealth(): Promise<{ status: 'up' | 'down'; details?: Record<string, any> }> {
    try {
      const isConnected = this.connection.readyState === 1;
      return {
        status: isConnected ? 'up' : 'down',
        details: { readyState: this.connection.readyState },
      };
    } catch (err: any) {
      return { status: 'down', details: { error: err.message } };
    }
  }
}
