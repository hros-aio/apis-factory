import { HealthIndicator } from './health-indicator.interface';

export class HealthService {
  private readonly indicators = new Set<HealthIndicator>();

  registerIndicator(indicator: HealthIndicator): void {
    this.indicators.add(indicator);
  }

  async checkAll(): Promise<{ status: 'up' | 'down'; components: Record<string, any> }> {
    let overallStatus: 'up' | 'down' = 'up';
    const components: Record<string, any> = {};

    for (const indicator of this.indicators) {
      try {
        const result = await indicator.checkHealth();
        components[indicator.name] = result;
        if (result.status === 'down') {
          overallStatus = 'down';
        }
      } catch (err: any) {
        components[indicator.name] = { status: 'down', error: err.message };
        overallStatus = 'down';
      }
    }

    return { status: overallStatus, components };
  }
}
