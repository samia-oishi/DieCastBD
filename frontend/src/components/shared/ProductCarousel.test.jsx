import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ProductCarousel } from "./ProductCarousel";

// The homepage carousels ask the API for in-stock products only, so a section
// whose every item is sold out now comes back empty. What it must NOT do then
// is render its heading and "View all" over an empty row.
const PRODUCT = {
  _id: "1",
  slug: "toyota-supra",
  title: "MINI GT Toyota Supra",
  price: 2390,
  availableStock: 3,
  brand: { name: "MINI GT", slug: "mini-gt" },
};

// ProductCard reaches for the cart/auth queries, so the tree needs a client
// even though nothing here asserts on them.
const renderCarousel = (props) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <ProductCarousel title="New arrivals" viewAllHref="/shop" {...props} />
      </MemoryRouter>
    </QueryClientProvider>
  );

describe("ProductCarousel", () => {
  it("renders the section when there are products", () => {
    renderCarousel({ products: [PRODUCT] });
    expect(screen.getByText("New arrivals")).toBeInTheDocument();
    expect(screen.getByText(PRODUCT.title)).toBeInTheDocument();
  });

  it("renders nothing at all when every product is filtered out", () => {
    const { container } = renderCarousel({ products: [] });
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing rather than an empty heading before the fetch resolves", () => {
    const { container } = renderCarousel({ products: undefined });
    expect(container).toBeEmptyDOMElement();
  });

  it("still shows the heading and skeletons while loading", () => {
    renderCarousel({ products: undefined, isLoading: true });
    expect(screen.getByText("New arrivals")).toBeInTheDocument();
  });
});
