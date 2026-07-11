import { z } from 'zod';

export const RedisSchema = z.object({
  host: z.string().min(1),
  port: z.coerce.number().int().min(1).max(65535).default(6379),
});
