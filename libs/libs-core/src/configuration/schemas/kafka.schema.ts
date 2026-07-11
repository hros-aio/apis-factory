import { z } from 'zod';

export const KafkaSchema = z.object({
  brokers: z.array(z.string().min(1)).min(1),
});
