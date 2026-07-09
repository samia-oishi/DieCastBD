import { AuditLog } from "../modules/auditLogs/auditLog.model.js";

/**
 * Wraps an admin mutation route so every write is logged automatically —
 * controllers don't need to remember to call anything. For PATCH/DELETE routes
 * with a :id param, fetches a "before" snapshot via the given Model prior to
 * the controller running. Fire-and-forget: a logging failure never breaks the
 * actual admin action.
 */
export function auditLog(entityType, Model) {
  return async (req, res, next) => {
    let before = null;
    if (Model && req.params.id && (req.method === "PATCH" || req.method === "DELETE")) {
      before = await Model.findById(req.params.id).lean().catch(() => null);
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        AuditLog.create({
          actor: req.user?.id,
          action: `${req.method} ${req.originalUrl}`,
          entityType,
          entityId: req.params.id ?? body?.data?.id ?? body?.data?._id,
          before,
          after: body?.data,
          ip: req.ip,
        }).catch((err) => console.error("Audit log write failed:", err.message));
      }
      return originalJson(body);
    };

    next();
  };
}
