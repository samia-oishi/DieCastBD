import { describe, it, expect, vi } from "vitest";
import { sanitizeInput } from "../../src/middlewares/sanitize.js";

// NoSQL-injection defense: strips keys that could smuggle Mongo operators
// ($gt, $where, dotted paths) through req.body/params/query before they reach a query.
describe("sanitizeInput", () => {
  function run(payload) {
    const req = { body: payload, params: {}, query: {} };
    const next = vi.fn();
    sanitizeInput(req, {}, next);
    expect(next).toHaveBeenCalledOnce();
    return req.body;
  }

  it("strips keys beginning with $", () => {
    const cleaned = run({ email: "a@b.com", $gt: "" });
    expect(cleaned).toEqual({ email: "a@b.com" });
  });

  it("strips keys containing a dot", () => {
    const cleaned = run({ "user.role": "admin", name: "ok" });
    expect(cleaned).toEqual({ name: "ok" });
  });

  it("recurses into nested objects", () => {
    const cleaned = run({ filter: { price: 10, $where: "1==1" } });
    expect(cleaned).toEqual({ filter: { price: 10 } });
  });

  it("recurses through arrays", () => {
    const cleaned = run({ items: [{ qty: 1, $ne: null }] });
    expect(cleaned).toEqual({ items: [{ qty: 1 }] });
  });

  it("leaves clean payloads untouched", () => {
    const clean = { email: "a@b.com", nested: { qty: 2 } };
    expect(run(clean)).toEqual(clean);
  });
});
