import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DistrictThanaFields } from "./DistrictThanaFields";

const FieldWrapper = ({ label, error, children }) => (
  <div>
    <div>{label}</div>
    {children}
    {error && <p role="alert">{error}</p>}
  </div>
);

/** Drives the pair the way the real forms do, so the district→thana dependency
 * is exercised through actual state updates rather than mocked callbacks. */
function Harness({ onSubmit = () => {}, initial = { district: "", thana: "" } }) {
  const [v, setV] = useState(initial);
  return (
    // Mirrors AddressForm: a div, not a form, that submits on Enter from any
    // input inside it. The dropdown must not trip this.
    <div
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.target.tagName === "INPUT") onSubmit(v);
      }}
    >
      <DistrictThanaFields
        district={v.district}
        thana={v.thana}
        onDistrictChange={(district) => setV((s) => ({ ...s, district }))}
        onThanaChange={(thana) => setV((s) => ({ ...s, thana }))}
        FieldWrapper={FieldWrapper}
      />
      <div data-testid="value">{`${v.district}|${v.thana}`}</div>
    </div>
  );
}

const districtTrigger = () => screen.getAllByRole("button", { expanded: false })[0];
const triggers = () => screen.getAllByRole("button").filter((b) => b.hasAttribute("aria-haspopup"));

describe("DistrictThanaFields", () => {
  it("filters districts as you type and selects the one you click", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(districtTrigger());
    await user.type(screen.getByRole("combobox"), "chatt");

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    await user.click(options[0]);

    expect(screen.getByTestId("value")).toHaveTextContent("Chattogram|");
  });

  it("finds a renamed district under its old spelling", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(districtTrigger());
    await user.type(screen.getByRole("combobox"), "chittagong");

    // The old name matches, but the current name is what's displayed and stored.
    expect(screen.getByRole("option")).toHaveTextContent("Chattogram");
  });

  it("keeps the thana dropdown disabled until a district is chosen", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const [, thana] = triggers();
    expect(thana).toBeDisabled();
    expect(thana).toHaveTextContent("Select a district first");

    await user.click(districtTrigger());
    await user.type(screen.getByRole("combobox"), "dhaka");
    await user.click(screen.getAllByRole("option")[0]);

    expect(triggers()[1]).toBeEnabled();
  });

  it("offers Dhaka's metro thanas, which no official upazila list contains", async () => {
    const user = userEvent.setup();
    render(<Harness initial={{ district: "Dhaka", thana: "" }} />);

    await user.click(triggers()[1]);
    await user.type(screen.getByRole("combobox"), "dhanmondi");
    await user.click(screen.getByRole("option"));

    expect(screen.getByTestId("value")).toHaveTextContent("Dhaka|Dhanmondi");
  });

  it("clears a thana that does not exist in the newly chosen district", async () => {
    const user = userEvent.setup();
    render(<Harness initial={{ district: "Dhaka", thana: "Dhanmondi" }} />);

    await user.click(districtTrigger());
    await user.type(screen.getByRole("combobox"), "khulna");
    await user.click(screen.getAllByRole("option")[0]);

    // Shipping "Dhanmondi, Khulna" would be worse than asking again.
    expect(screen.getByTestId("value")).toHaveTextContent("Khulna|");
    expect(triggers()[1]).toHaveTextContent("Select thana");
  });

  it("does not submit the surrounding form when Enter picks an option", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);

    await user.click(districtTrigger());
    await user.type(screen.getByRole("combobox"), "khulna");
    await user.keyboard("{Enter}");

    expect(screen.getByTestId("value")).toHaveTextContent("Khulna|");
    // The Enter that chose a district must not also save a half-filled address.
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("moves through the list with the arrow keys", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(districtTrigger());
    await user.type(screen.getByRole("combobox"), "ba"); // Bagerhat, Bandarban, Barguna, …
    const before = screen.getAllByRole("option")[0].textContent;

    await user.keyboard("{ArrowDown}{Enter}");
    // ArrowDown moved off the first match before Enter committed it.
    const chosen = screen.getByTestId("value").textContent.split("|")[0];
    expect(chosen).not.toBe(before);
    expect(chosen).toMatch(/^Ba/);
  });

  it("reports no matches instead of an empty list", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(districtTrigger());
    await user.type(screen.getByRole("combobox"), "atlantis");

    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(screen.getByText("No district matches")).toBeInTheDocument();
  });

  it("closes on Escape without clearing the current selection", async () => {
    const user = userEvent.setup();
    render(<Harness initial={{ district: "Dhaka", thana: "Gulshan" }} />);

    await user.click(districtTrigger());
    expect(screen.getByRole("combobox")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getByTestId("value")).toHaveTextContent("Dhaka|Gulshan");
  });

  it("marks the current selection so reopening shows what is chosen", async () => {
    const user = userEvent.setup();
    render(<Harness initial={{ district: "Dhaka", thana: "" }} />);

    await user.click(districtTrigger());
    const selected = screen.getAllByRole("option", { selected: true });
    expect(selected).toHaveLength(1);
    expect(within(selected[0]).getByText("Dhaka")).toBeInTheDocument();
  });
});
