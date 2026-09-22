import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { hasSessionHint, setSessionHint, clearSessionHint } from "./sessionHint";

describe("session hint", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("says no for a browser that has never signed in", () => {
    expect(hasSessionHint()).toBe(false);
  });

  it("remembers a sign-in and forgets a sign-out", () => {
    setSessionHint();
    expect(hasSessionHint()).toBe(true);
    clearSessionHint();
    expect(hasSessionHint()).toBe(false);
  });

  // The marker only decides whether to ASK the server. Failing open costs one
  // request — the behaviour before this existed — while failing closed would
  // lock a signed-in user out of their own account in a private window.
  it("falls back to asking the server when localStorage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("denied");
    });
    expect(hasSessionHint()).toBe(true);
  });

  it("does not throw when localStorage rejects writes", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota");
    });
    expect(() => setSessionHint()).not.toThrow();
  });

  it("is never treated as proof of identity — only '1' counts, nothing is parsed", () => {
    localStorage.setItem("dcbd.session", '{"role":"admin"}');
    expect(hasSessionHint()).toBe(false);
  });
});
