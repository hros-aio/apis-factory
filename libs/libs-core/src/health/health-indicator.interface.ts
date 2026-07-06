export interface HealthIndicator {
  name: string;
  checkHealth(): Promise<{ status: 'up' | 'down'; details?: Record<string, any> }>;
}
