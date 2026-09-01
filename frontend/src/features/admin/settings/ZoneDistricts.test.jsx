import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";

import { ZoneDistricts } from "./SettingsPage";

/** Renders the picker against a real react-hook-form instance, so the
 * useWatch/setValue wiring is exercised rather than mocked. */
function Harness({ zones, index = 0, onChange }) {
  const { control, setValue } = useForm({ defaultValues: { shippingZones: zones } });
  const set = (...args) => {
    setValue(...args);
    onChange?.(args[1]);
  };
  return <ZoneDistricts control={control} setValue={set} index={index} zones={zones} />;
}

const ZONES = [
  { name: "Inside Dhaka", fee: 70, districts: ["Dhaka City"] },
  { name: "Outside Dhaka", fee: 120, districts: [], isDefault: true },
];

describe("ZoneDistricts", () => {
  it("renders without crashing and lists the zone's districts as chips", () => {
    render(<Harness zones={ZONES} />);
    expect(screen.getByText("Dhaka City")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /remove dhaka city/i })).toBeInTheDocument();
  });

  it("adds a district", async () => {
    const onChange = vi.fn();
    render(<Harness zones={ZONES} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: /add a district/i }));
    await userEvent.type(screen.getByPlaceholderText(/search 65 districts/i), "Gazipur");
    await userEvent.click(await screen.findByRole("option", { name: "Gazipur" }));
    expect(onChange).toHaveBeenCalledWith(["Dhaka City", "Gazipur"]);
  });

  it("removes a district", async () => {
    const onChange = vi.fn();
    render(<Harness zones={ZONES} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: /remove dhaka city/i }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  // The failure this prevents is invisible: a district on two zones resolves to
  // whichever is listed first, so the merchant would see it set on the zone
  // they meant while customers there were charged the other zone's fee.
  it("hides districts already claimed by another zone", async () => {
    render(<Harness zones={ZONES} index={1} />);
    await userEvent.click(screen.getByRole("button", { name: /add a district/i }));
    const list = screen.getByRole("listbox");
    expect(within(list).queryByRole("option", { name: "Dhaka City" })).toBeNull();
    expect(within(list).getByRole("option", { name: "Dhaka Sub-Urban" })).toBeInTheDocument();
  });

  it("offers Steadfast's district names, so a zone can't point at one no customer can pick", async () => {
    render(<Harness zones={[{ name: "Z", districts: [] }]} />);
    await userEvent.click(screen.getByRole("button", { name: /add a district/i }));
    const list = screen.getByRole("listbox");
    expect(within(list).getAllByRole("option").length).toBe(65);
    expect(within(list).getByRole("option", { name: "Dhaka City" })).toBeInTheDocument();
  });
});
