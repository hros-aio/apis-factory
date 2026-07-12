import { z } from 'zod';
import { AppSchema } from './app.schema';
import { DatabaseSchema } from './database.schema';
import { RedisSchema } from './redis.schema';
import { KafkaSchema } from './kafka.schema';
import { JwtSchema } from './jwt.schema';

export const ConfigurationSchema = z.object({
  app: AppSchema,
  database: DatabaseSchema,
  redis: RedisSchema,
  kafka: KafkaSchema,
  jwt: JwtSchema,
});
