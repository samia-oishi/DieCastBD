import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const robots = readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "../../../public/robots.txt"),
  "utf8"
);

/** The agents named in each `Disallow: /` group.
 *
 * A group is one or more consecutive `User-agent:` lines followed by its rules;
 * the next `User-agent:` AFTER a rule line starts a new group. Getting that
 * wrong merges every group into one — which is how the first version of this
 * test reported that `*` was blocked when it plainly isn't.
 */
function blockedAgents() {
  const blocked = new Set();
  let group = [];
  let sawRule = false;

  for (const raw of robots.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;

    const agent = line.match(/^User-agent:\s*(.+)$/i);
    if (agent) {
      if (sawRule) {
        group = [];
        sawRule = false;
      }
      group.push(agent[1].trim());
      continue;
    }

    if (/^(Allow|Disallow):/i.test(line)) {
      sawRule = true;
      if (/^Disallow:\s*\/\s*$/i.test(line)) for (const a of group) blocked.add(a.toLowerCase());
    }
  }
  return blocked;
}

describe("robots.txt", () => {
  // The crawler blocks added 2026-09-22 are a COST control, and the one way
  // they could do real damage is by catching a search or preview bot. That
  // would deindex the store, which is worth incomparably more than the CPU.
  it("never blocks a crawler that brings customers", () => {
    const blocked = blockedAgents();
    for (const agent of ["*", "googlebot", "bingbot", "duckduckbot", "facebookexternalhit", "twitterbot"]) {
      expect(blocked.has(agent), `"${agent}" must never be blocked — it is the traffic`).toBe(false);
    }
  });

  it("still lets everything else crawl the whole site", () => {
    // The `User-agent: *` group deliberately carries no Disallow (plan.md #89):
    // a URL Google may not crawl is a URL where it can never see a noindex.
    const starGroup = robots.split(/^User-agent:/m).find((g) => g.trim().startsWith("*"));
    expect(starGroup).toBeTruthy();
    expect(starGroup).toMatch(/Allow:\s*\//);
    expect(starGroup.split(/\n\s*\n/)[0]).not.toMatch(/^\s*Disallow:\s*\//m);
  });

  it("keeps advertising the sitemap", () => {
    expect(robots).toMatch(/^Sitemap:\s*https:\/\/diecastbd\.com\/sitemap\.xml$/m);
  });
});
