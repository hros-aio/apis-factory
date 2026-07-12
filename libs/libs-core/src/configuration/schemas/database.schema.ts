import { z } from 'zod';

export const DatabaseSchema = z.object({
  host: z.string().min(1).default('localhost'),
  port: z.coerce.number().int().min(1).max(65535).default(5432),
  username: z.string().min(1),
  password: z.string().min(1),
  name: z.string().min(1).optional(),
});
