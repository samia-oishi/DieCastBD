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
      // Replace req[key]'s contents entirely with the validated/stripped data — mutating in
      // place rather than reassigning, since req.query has no setter in Express 5. Clearing
      // first matters: Zod strips unknown keys from result.data, but Object.assign alone
      // would leave those original unknown keys (e.g. a smuggled "role") sitting on req.body.
      for (const existingKey of Object.keys(req[key])) delete req[key][existingKey];
      Object.assign(req[key], result.data);
    }
    next();
  };
}
