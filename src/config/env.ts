import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Environment variables schema validation using Zod.
 * 
 * Validates all required environment variables at application startup.
 * This ensures that missing or invalid configuration will fail fast.
 * 
 * @example
 * ```typescript
 * import { env } from './config/env';
 * console.log(env.PORT); // 3000
 * ```
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .string()
    .regex(/^\d+$/)
    .default('3000')
    .transform(Number),
  MONGODB_URI: z.string().url('MONGODB_URI must be a valid URL'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('*'),
});

type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Invalid environment variables:');
    error.issues.forEach((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
      console.error(`  - ${path}: ${issue.message}`);
    });
    process.exit(1);
  }
  console.error('❌ Failed to load environment variables:', error);
  throw error;
}

export { env };

