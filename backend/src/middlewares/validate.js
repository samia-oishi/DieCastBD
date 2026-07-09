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
      if (key === "query") {
        // req.query has no setter in Express 5 AND isn't cached — it's a getter that
        // re-parses the raw query string fresh on every access, so mutating the object
        // it returns is silently discarded. Shadowing the property on this req instance
        // is the only way validated/defaulted query data (e.g. page/limit) actually sticks.
        Object.defineProperty(req, "query", { value: result.data, writable: true, configurable: true });
      } else {
        // req.body / req.params ARE plain assigned properties, so in-place mutation works —
        // but still need to clear first: Zod strips unknown keys from result.data, and
        // Object.assign alone would leave those original unknown keys (e.g. a smuggled
        // "role") sitting on req.body.
        for (const existingKey of Object.keys(req[key])) delete req[key][existingKey];
        Object.assign(req[key], result.data);
      }
    }
    next();
  };
}
