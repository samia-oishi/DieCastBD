import { describe, it, expect, vi } from "vitest";
import { cacheControl, edgeCacheControl } from "../../src/middlewares/cacheControl.js";

function run(middleware) {
  const headers = {};
  const res = { set: (k, v) => { headers[k] = v; } };
  const next = vi.fn();
  middleware({}, res, next);
  return { header: headers["Cache-Control"], next };
}

describe("cacheControl", () => {
  it("lets browsers and the edge both reuse the response", () => {
    const { header, next } = run(cacheControl(300));
    expect(header).toBe("public, max-age=300, stale-while-revalidate=150");
    expect(next).toHaveBeenCalled();
  });
});

describe("edgeCacheControl", () => {
  // Vercel Fluid Active CPU reached 98% of the monthly allowance on 2026-09-22
  // with /settings — read by every storefront page — as the top confirmed
  // cause, because a flat `no-cache` meant one function invocation per page
  // view. s-maxage is what collapses N page views into one invocation.
  it("caches at the edge so a page view does not cost an invocation", () => {
    const { header } = run(edgeCacheControl(60, 120));
    expect(header).toContain("s-maxage=60");
    expect(header).toContain("stale-while-revalidate=120");
  });

  // The admin bug this replaced: a saved hero style appeared to revert because
  // the refetch after PATCH came from the browser's own HTTP cache.
  it("still forbids the browser from reusing a stale copy", () => {
    const { header } = run(edgeCacheControl(60));
    expect(header).toContain("max-age=0");
    expect(header).toContain("must-revalidate");
    expect(header).not.toMatch(/(^|[ ,])max-age=[1-9]/);
  });

  it("defaults the stale window to twice the edge window", () => {
    expect(run(edgeCacheControl(30)).header).toContain("stale-while-revalidate=60");
  });
});
