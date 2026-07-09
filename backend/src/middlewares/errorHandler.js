import { isProduction } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";

export function notFoundHandler(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const isApiError = err instanceof ApiError;
  const status = isApiError ? err.status : err.status || 500;
  const message = isApiError || status < 500 ? err.message : "Internal server error";

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    success: false,
    message,
    ...(err.errors ? { errors: err.errors } : {}),
    ...(!isProduction && status >= 500 ? { stack: err.stack } : {}),
  });
}
