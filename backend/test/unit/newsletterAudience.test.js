import { describe, it, expect, vi, beforeEach } from "vitest";

// The audience merges four collections into one deduplicated list. The risks
// are all quiet ones: double-counting a person who both signed up and ordered,
// losing which door an address came in through, or letting a phone number into
// a list that feeds an email tool.

let subscribers = [];
let accounts = [];
let guests = [];
let alerts = [];
let userQueries = [];

const lean = (rows) => ({ select: () => ({ lean: async () => rows }) });

vi.mock("../../src/modules/newsletter/newsletter.model.js", () => ({
  NewsletterSubscriber: { find: () => lean(subscribers) },
}));
vi.mock("../../src/modules/restockAlerts/restockAlert.model.js", () => ({
  RestockAlert: { find: () => lean(alerts) },
}));
vi.mock("../../src/modules/users/user.model.js", () => ({
  User: {
    find: (filter) => {
      userQueries.push(filter);
      return lean(filter.isGuest === true ? guests : accounts);
    },
  },
}));

const { listAudience, getAudienceCounts } = await import("../../src/modules/newsletter/audience.service.js");

const d = (iso) => new Date(iso);

beforeEach(() => {
  userQueries = [];
  subscribers = [{ _id: "s1", email: "signup@example.com", subscribedAt: d("2026-07-10") }];
  accounts = [{ email: "buyer@example.com", name: "Ana", createdAt: d("2026-08-01") }];
  guests = [{ email: "guest@example.com", name: "Guest", createdAt: d("2026-08-15") }];
  alerts = [{ contact: "waiting@example.com", createdAt: d("2026-09-01") }];
});

const emails = (items) => items.map((p) => p.email);

describe("audience sources", () => {
  it("gathers all four doors an address can arrive through", async () => {
    const { items } = await listAudience({ source: "all" });
    expect(emails(items).sort()).toEqual([
      "buyer@example.com",
      "guest@example.com",
      "signup@example.com",
      "waiting@example.com",
    ]);
  });

  it("tags each address with where it came from", async () => {
    const { items } = await listAudience({ source: "all" });
    const bySource = Object.fromEntries(items.map((p) => [p.email, p.sources]));
    expect(bySource["signup@example.com"]).toEqual(["newsletter"]);
    expect(bySource["buyer@example.com"]).toEqual(["customer"]);
    expect(bySource["guest@example.com"]).toEqual(["order"]);
    expect(bySource["waiting@example.com"]).toEqual(["notify"]);
  });

  it("separates account holders from guest checkouts by the isGuest flag", async () => {
    await listAudience({ source: "all" });
    // Guest checkout extends User rather than having its own model, so this
    // flag is the only thing distinguishing "signed up" from "typed an email
    // to get a receipt".
    expect(userQueries.some((f) => f.isGuest === true)).toBe(true);
    expect(userQueries.some((f) => f.isGuest?.$ne === true)).toBe(true);
  });

  it("keeps a phone-shaped restock contact out of an email list", async () => {
    alerts = [{ contact: "01711030574", createdAt: d("2026-09-01") }, { contact: "ok@example.com", createdAt: d("2026-09-02") }];
    const { items } = await listAudience({ source: "notify" });
    // The export feeds an email tool; a phone number in the email column
    // corrupts the import rather than just looking odd.
    expect(emails(items)).toEqual(["ok@example.com"]);
  });
});

describe("deduplication", () => {
  beforeEach(() => {
    subscribers = [{ _id: "s1", email: "both@example.com", subscribedAt: d("2026-08-20") }];
    accounts = [{ email: "Both@Example.com", name: "Ana", createdAt: d("2026-07-01") }];
    guests = [];
    alerts = [];
  });

  it("treats one person as one row, however many doors they came through", async () => {
    const { items, meta } = await listAudience({ source: "all" });
    expect(items).toHaveLength(1);
    expect(meta.total).toBe(1);
  });

  it("matches addresses case-insensitively", async () => {
    const { items } = await listAudience({ source: "all" });
    expect(items[0].email).toBe("both@example.com");
    expect(items[0].sources.sort()).toEqual(["customer", "newsletter"]);
  });

  it("keeps the earliest date, which is how long we have had the address", async () => {
    const { items } = await listAudience({ source: "all" });
    expect(items[0].firstSeen).toEqual(d("2026-07-01"));
  });

  it("carries a name over from whichever source had one", async () => {
    const { items } = await listAudience({ source: "all" });
    expect(items[0].name).toBe("Ana");
  });

  it("still appears under every source that filters for it", async () => {
    expect((await listAudience({ source: "newsletter" })).items).toHaveLength(1);
    expect((await listAudience({ source: "customer" })).items).toHaveLength(1);
    expect((await listAudience({ source: "order" })).items).toHaveLength(0);
  });

  it("counts the union for `all`, not the sum of the sources", async () => {
    const counts = await getAudienceCounts();
    // A chip row adding up to more than the list it filters reads as a bug.
    expect(counts.all).toBe(1);
    expect(counts.newsletter).toBe(1);
    expect(counts.customer).toBe(1);
  });
});

describe("filtering and paging", () => {
  it("searches the name as well as the address", async () => {
    accounts = [{ email: "x@example.com", name: "Sameen Rayyan", createdAt: d("2026-08-01") }];
    subscribers = [];
    guests = [];
    alerts = [];
    expect((await listAudience({ q: "sameen" })).items).toHaveLength(1);
    expect((await listAudience({ q: "SAMEEN" })).items).toHaveLength(1);
  });

  it("reports the total for the FILTER, not the whole audience", async () => {
    const { meta } = await listAudience({ source: "notify" });
    expect(meta.total).toBe(1);
  });

  it("pages without dropping or repeating anyone", async () => {
    subscribers = Array.from({ length: 5 }, (_, i) => ({
      _id: `s${i}`,
      email: `p${i}@example.com`,
      subscribedAt: d(`2026-08-0${i + 1}`),
    }));
    accounts = [];
    guests = [];
    alerts = [];
    const first = await listAudience({ page: 1, limit: 2 });
    const second = await listAudience({ page: 2, limit: 2 });
    expect(first.items).toHaveLength(2);
    expect(second.items).toHaveLength(2);
    expect(first.meta.totalPages).toBe(3);
    expect(emails(first.items).some((e) => emails(second.items).includes(e))).toBe(false);
  });

  it("never reports zero pages, so the pager cannot render an empty range", async () => {
    subscribers = [];
    accounts = [];
    guests = [];
    alerts = [];
    const { meta } = await listAudience({});
    expect(meta.total).toBe(0);
    expect(meta.totalPages).toBe(1);
  });
});
