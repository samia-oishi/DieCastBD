import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QtyStepper } from "./QtyStepper";

describe("QtyStepper", () => {
  it("increments and decrements within [min, max]", () => {
    const onChange = vi.fn();
    render(<QtyStepper value={2} onChange={onChange} min={1} max={5} />);
    fireEvent.click(screen.getByLabelText("Increase quantity"));
    expect(onChange).toHaveBeenCalledWith(3);
    fireEvent.click(screen.getByLabelText("Decrease quantity"));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("disables decrement at min and increment at max", () => {
    const { rerender } = render(<QtyStepper value={1} onChange={() => {}} min={1} max={5} />);
    expect(screen.getByLabelText("Decrease quantity")).toBeDisabled();
    expect(screen.getByLabelText("Increase quantity")).not.toBeDisabled();

    rerender(<QtyStepper value={5} onChange={() => {}} min={1} max={5} />);
    expect(screen.getByLabelText("Increase quantity")).toBeDisabled();
  });

  it("clamps the increment at max even if clicked", () => {
    const onChange = vi.fn();
    render(<QtyStepper value={5} onChange={onChange} min={1} max={5} />);
    // Button is disabled at max, so onChange must not fire.
    fireEvent.click(screen.getByLabelText("Increase quantity"));
    expect(onChange).not.toHaveBeenCalled();
  });
});
