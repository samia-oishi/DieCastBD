import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrderTracker } from "./OrderTracker";

describe("OrderTracker", () => {
  it("renders all five fulfillment steps for an in-progress order", () => {
    render(<OrderTracker status="shipped" />);
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
  });

  it("marks steps up to and including the current one as done", () => {
    const { container } = render(<OrderTracker status="packed" />);
    // FLOW = pending, confirmed, packed(idx 2), shipped, delivered → 3 done
    expect(container.querySelectorAll('[data-done="true"]')).toHaveLength(3);
  });

  it("marks only the first step done for a brand-new order", () => {
    const { container } = render(<OrderTracker status="pending" />);
    expect(container.querySelectorAll('[data-done="true"]')).toHaveLength(1);
  });

  it("shows a terminal banner (not the tracker) for a cancelled order", () => {
    render(<OrderTracker status="cancelled" />);
    expect(screen.queryByRole("list")).toBeNull();
    expect(screen.getByText(/cancelled/i)).toBeInTheDocument();
  });

  it("shows a refunded banner for a refunded order", () => {
    render(<OrderTracker status="refunded" />);
    expect(screen.getByText(/refunded/i)).toBeInTheDocument();
  });
});
