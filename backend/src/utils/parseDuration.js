const UNIT_MS = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };

/** Parses "15m", "30d", etc. (the same strings used for JWT expiresIn) into milliseconds. */
export function parseDurationMs(duration) {
  const match = /^(\d+)(s|m|h|d)$/.exec(duration);
  if (!match) throw new Error(`Invalid duration format: ${duration}`);
  const [, amount, unit] = match;
  return Number(amount) * UNIT_MS[unit];
}
