import { z } from 'zod';

export const AppSchema = z.object({
  name: z.string().min(1).default('api-service'),
  port: z.coerce.number().int().min(1).max(65535).default(3000),
  env: z.enum(['production', 'development', 'test']).default('development'),
});
