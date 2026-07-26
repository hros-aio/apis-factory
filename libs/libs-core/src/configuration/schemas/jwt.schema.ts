import { z } from 'zod';

export const JwtSchema = z.object({
  publicKey: z.string().min(1),
  privateKey: z.string().min(1).optional(),
});
