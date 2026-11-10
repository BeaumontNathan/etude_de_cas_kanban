import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Request validation middleware using Zod schemas.
 * 
 * Validates request body, query, or params against a Zod schema.
 * On validation failure, returns 400 with detailed error messages.
 * On success, proceeds to next middleware.
 * 
 * @param schema - Zod schema to validate against
 * @param source - Which part of request to validate ('body', 'query', or 'params')
 * 
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { validate } from './middlewares/validate.middleware';
 * 
 * const createOFSchema = z.object({
 *   title: z.string().min(1),
 *   columnId: z.string(),
 * });
 * 
 * router.post('/ofs', validate(createOFSchema, 'body'), createOF);
 * ```
 */
export function validate<T>(
  schema: ZodSchema<T>,
  source: 'body' | 'query' | 'params' = 'body'
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = req[source];
      schema.parse(data);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: 'Validation error',
          details: error.issues.map((issue) => ({
            path: issue.path.length > 0 ? issue.path.join('.') : 'root',
            message: issue.message,
          })),
        });
      } else {
        next(error);
      }
    }
  };
}

