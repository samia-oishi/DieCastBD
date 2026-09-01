export class ApiError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }

  static badRequest(message = "Bad request", errors) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message);
  }

  static forbidden(message = "Forbidden") {
    return new ApiError(403, message);
  }

  static notFound(message = "Not found") {
    return new ApiError(404, message);
  }

  static conflict(message = "Conflict") {
    return new ApiError(409, message);
  }

  /** An upstream service we depend on failed or answered unusably. Distinct
   * from 500 so the client can say "the courier is unreachable" rather than
   * implying our own bug. */
  static badGateway(message = "Upstream service error") {
    return new ApiError(502, message);
  }
}
