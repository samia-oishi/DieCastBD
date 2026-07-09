// Express 5 makes req.query a getter with no setter, which breaks packages like
// express-mongo-sanitize that sanitize by reassigning req.query wholesale.
// This mutates the existing object in place instead, so it works for
// req.body, req.params, and req.query alike.
function stripDangerousKeys(value) {
  if (Array.isArray(value)) {
    value.forEach(stripDangerousKeys);
    return;
  }

  if (value !== null && typeof value === "object") {
    for (const key of Object.keys(value)) {
      if (key.startsWith("$") || key.includes(".")) {
        delete value[key];
        continue;
      }
      stripDangerousKeys(value[key]);
    }
  }
}

export function sanitizeInput(req, res, next) {
  stripDangerousKeys(req.body);
  stripDangerousKeys(req.params);
  stripDangerousKeys(req.query);
  next();
}
