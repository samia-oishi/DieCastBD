import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ShopPage } from "./ShopPage";

const fetchNextPage = vi.fn();
let queryState;

// Partial mock — FilterSidebar pulls useFilterOptions from this same module,
// and replacing the whole module would strip it.
vi.mock("./api/useProducts", async (importOriginal) => ({
  ...(await importOriginal()),
  useInfiniteProducts: () => queryState,
}));
vi.mock("@/features/brands/api/useBrands", () => ({ useBrands: () => ({ data: [] }) }));
vi.mock("@/features/settings/api/useSettings", () => ({ useSettings: () => ({ data: {} }) }));

// Drives the sentinel by hand — jsdom has no layout, so real intersection is a
// browser concern. What's testable here is the BUDGET logic around it.
const observers = [];
class MockIO {
  constructor(cb) { this.cb = cb; this.disconnected = false; observers.push(this); }
  observe() {}
  disconnect() { this.disconnected = true; }
  unobserve() {}
}
const intersect = () => {
  const live = observers.filter((o) => !o.disconnected).at(-1);
  live?.cb([{ isIntersecting: true }], live);
};

const product = (id) => ({
  _id: id, slug: `p-${id}`, title: `Product ${id}`, price: 1000,
  thumbnail: { url: "http://x/i.jpg" }, gallery: [], availableStock: 5, brand: { name: "MINI GT" },
});

function makeState({ pages = [[1, 2]], total = 48, hasNextPage = true, isFetchingNextPage = false } = {}) {
  return {
    data: { pages: pages.map((ids) => ({ data: ids.map(product), meta: { page: 1, limit: 24, total, totalPages: Math.ceil(total / 24) } })) },
    isLoading: false, isPlaceholderData: false, isFetchingNextPage, hasNextPage, fetchNextPage,
  };
}

const renderShop = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={["/shop"]}>
        <ShopPage />
      </MemoryRouter>
    </QueryClientProvider>
  );

beforeEach(() => {
  fetchNextPage.mockClear();
  observers.length = 0;
  vi.stubGlobal("IntersectionObserver", MockIO);
  queryState = makeState();
});
afterEach(() => { vi.unstubAllGlobals(); cleanup(); });

describe("ShopPage infinite scroll", () => {
  it("renders no numbered pagination", () => {
    renderShop();
    expect(screen.queryByLabelText("Go to page 2")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: /pagination/i })).not.toBeInTheDocument();
  });

  it("shows Load more while there are more pages, and hides it at the end", () => {
    renderShop();
    expect(screen.getByRole("button", { name: /Load more/ })).toBeInTheDocument();
    cleanup();
    queryState = makeState({ pages: [[1, 2]], total: 2, hasNextPage: false });
    renderShop();
    expect(screen.queryByRole("button", { name: /Load more/ })).not.toBeInTheDocument();
  });

  it("fetches once per Load more click", async () => {
    renderShop();
    await userEvent.click(screen.getByRole("button", { name: /Load more/ }));
    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  // The merchant-chosen behaviour: scrolling auto-loads twice, then waits for a
  // tap so the footer (and its internal links) stays reachable.
  it("auto-loads only twice, then stops until the user taps", () => {
    renderShop();
    intersect();
    intersect();
    intersect();
    intersect();
    expect(fetchNextPage).toHaveBeenCalledTimes(2);
  });

  it("a manual tap re-arms auto-loading", async () => {
    renderShop();
    intersect();
    intersect();
    expect(fetchNextPage).toHaveBeenCalledTimes(2);
    await userEvent.click(screen.getByRole("button", { name: /Load more/ }));
    expect(fetchNextPage).toHaveBeenCalledTimes(3);
    intersect(); // budget was reset by the click
    expect(fetchNextPage).toHaveBeenCalledTimes(4);
  });

  it("de-dupes a product repeated across pages", () => {
    queryState = makeState({ pages: [[1, 2], [2, 3]], total: 3 });
    renderShop();
    expect(screen.getAllByText("Product 2")).toHaveLength(1);
    expect(screen.getByText("All 3 pieces")).toBeInTheDocument();
  });

  it("counts the de-duped list, not the raw page sum", () => {
    queryState = makeState({ pages: [[1, 2], [2, 3]], total: 10 });
    renderShop();
    expect(screen.getByText("Showing 3 of 10")).toBeInTheDocument();
  });

  it("announces the count to screen readers", () => {
    renderShop();
    expect(screen.getByText(/Showing \d+ of \d+/)).toHaveAttribute("aria-live", "polite");
  });

  it("does not auto-load while a fetch is already in flight", () => {
    queryState = makeState({ isFetchingNextPage: true });
    renderShop();
    intersect();
    expect(fetchNextPage).not.toHaveBeenCalled();
  });
});
