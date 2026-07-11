import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusChip } from "./StatusChip";

describe("StatusChip", () => {
  it("renders the humanized label for each order status", () => {
    const cases = {
      pending: "Pending",
      confirmed: "Confirmed",
      packed: "Packed",
      shipped: "Shipped",
      delivered: "Delivered",
      cancelled: "Cancelled",
      refunded: "Refunded",
    };
    for (const [status, label] of Object.entries(cases)) {
      const { unmount } = render(<StatusChip status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });

  it("maps pending → amber, delivered → lime, cancelled/refunded → red", () => {
    const { rerender } = render(<StatusChip status="pending" />);
    expect(screen.getByText("Pending")).toHaveStyle({ backgroundColor: "#F7EAD6", color: "#B45309" });

    rerender(<StatusChip status="delivered" />);
    expect(screen.getByText("Delivered")).toHaveStyle({ backgroundColor: "#EFF5DC", color: "#4F6B0B" });

    rerender(<StatusChip status="cancelled" />);
    expect(screen.getByText("Cancelled")).toHaveStyle({ backgroundColor: "#F9E3E1", color: "#B3261E" });

    rerender(<StatusChip status="refunded" />);
    expect(screen.getByText("Refunded")).toHaveStyle({ backgroundColor: "#F9E3E1", color: "#B3261E" });
  });

  it("falls back to the raw status when unknown", () => {
    render(<StatusChip status="mystery" />);
    expect(screen.getByText("mystery")).toBeInTheDocument();
  });
});
