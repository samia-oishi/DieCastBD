export function sendSuccess(res, { data = null, message = "OK", meta, status = 200 } = {}) {
  return res.status(status).json({
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
  });
}
