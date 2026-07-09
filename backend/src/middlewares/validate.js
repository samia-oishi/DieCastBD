import { ApiError } from "../utils/apiError.js";

/**
 * @param {{ body?: import('zod').ZodType, params?: import('zod').ZodType, query?: import('zod').ZodType }} schemas
 */
export function validate(schemas) {
  return (req, res, next) => {
    for (const [key, schema] of Object.entries(schemas)) {
      const result = schema.safeParse(req[key]);
      if (!result.success) {
        return next(ApiError.badRequest("Validation failed", result.error.flatten().fieldErrors));
      }
      // Mutate in place rather than reassigning — req.query has no setter in Express 5.
      Object.assign(req[key], result.data);
    }
    next();
  };
}
