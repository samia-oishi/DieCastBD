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

  // Merchant decision, 2026-09-22: AI assistants are a real way customers find
  // the shop now, so they are treated as a search channel, not as scrapers.
  // The user-initiated agents are the ones that answer "where can I buy Hot
  // Wheels in Bangladesh"; the broad crawlers are what put the shop in those
  // answers at all. Blocking either removes the store from AI results.
  it("lets AI assistants read the shop", () => {
    const blocked = blockedAgents();
    for (const agent of [
      "gptbot",
      "oai-searchbot",
      "chatgpt-user",
      "claudebot",
      "claude-user",
      "claude-searchbot",
      "perplexitybot",
    ]) {
      expect(blocked.has(agent), `"${agent}" must stay allowed — AI search is a discovery channel`).toBe(false);
    }
  });

  // Common Crawl is a full-site scrape into a public dataset with no path from
  // it to a customer, which is why it is the one AI-adjacent agent still blocked.
  it("still blocks the crawlers that cost CPU and send nobody", () => {
    const blocked = blockedAgents();
    for (const agent of ["ahrefsbot", "semrushbot", "ccbot"]) {
      expect(blocked.has(agent)).toBe(true);
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
