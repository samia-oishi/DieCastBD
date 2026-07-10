import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrderStatusStepper } from "./OrderStatusStepper";

describe("OrderStatusStepper", () => {
  it("renders all five fulfillment steps for an in-progress order", () => {
    render(<OrderStatusStepper status="shipped" />);
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
  });

  it("marks steps up to and including the current one as active", () => {
    const { container } = render(<OrderStatusStepper status="packed" />);
    // FLOW = pending, confirmed, packed(idx 2), shipped, delivered → 3 active
    expect(container.querySelectorAll(".step-primary")).toHaveLength(3);
  });

  it("marks only the first step active for a brand-new order", () => {
    const { container } = render(<OrderStatusStepper status="pending" />);
    expect(container.querySelectorAll(".step-primary")).toHaveLength(1);
  });

  it("shows a terminal banner (not the stepper) for a cancelled order", () => {
    render(<OrderStatusStepper status="cancelled" />);
    expect(screen.queryByRole("list")).toBeNull();
    expect(screen.getByText(/cancelled/i)).toBeInTheDocument();
  });

  it("shows a refunded banner for a refunded order", () => {
    render(<OrderStatusStepper status="refunded" />);
    expect(screen.getByText(/refunded/i)).toBeInTheDocument();
  });
});
