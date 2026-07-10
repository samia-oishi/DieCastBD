import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import { signAccessToken, verifyAccessToken, verifyRefreshToken } from "../../src/utils/jwt.js";
import { env } from "../../src/config/env.js";

describe("jwt round-trip", () => {
  it("signs and verifies an access token, preserving claims", () => {
    const token = signAccessToken({ sub: "user-1", role: "admin", tv: 3 });
    const decoded = verifyAccessToken(token);
    expect(decoded.sub).toBe("user-1");
    expect(decoded.role).toBe("admin");
    expect(decoded.tv).toBe(3);
  });

  it("rejects an access token that was tampered with", () => {
    const token = signAccessToken({ sub: "user-1", role: "customer" });
    const tampered = token.slice(0, -3) + "xxx";
    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  it("does not accept an access token as a refresh token (separate secrets)", () => {
    // A stolen access token must not be replayable on the refresh endpoint.
    const accessToken = signAccessToken({ sub: "user-1", role: "customer" });
    expect(() => verifyRefreshToken(accessToken)).toThrow();
  });

  it("rejects a token signed with a foreign secret", () => {
    const forged = jwt.sign({ sub: "attacker", role: "admin" }, "not-the-real-secret");
    expect(() => verifyAccessToken(forged)).toThrow();
  });

  it("rejects an expired token", () => {
    const expired = jwt.sign({ sub: "user-1" }, env.JWT_ACCESS_SECRET, { expiresIn: -10 });
    expect(() => verifyAccessToken(expired)).toThrow();
  });
});
