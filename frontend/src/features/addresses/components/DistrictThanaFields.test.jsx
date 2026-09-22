import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DistrictThanaFields } from "./DistrictThanaFields";

const FieldWrapper = ({ label, error, children }) => (
  <div>
    <div>{label}</div>
    {children}
    {error && <p role="alert">{error}</p>}
  </div>
);

/** Drives the field the way the real forms do, so one selection writing BOTH
 * district and thana is exercised through actual state updates. */
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

const trigger = () => screen.getByRole("button", { expanded: false });
const search = () => screen.getByPlaceholderText(/Search thana or district/i);
const value = () => screen.getByTestId("value").textContent;

async function open(user) {
  await user.click(trigger());
}

describe("DistrictThanaFields — one combined area search", () => {
  // The whole point: the customer answers once, and the district comes with it.
  it("sets BOTH district and thana from a single choice", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await open(user);
    await user.type(search(), "Dhanmondi");
    await user.click(await screen.findByRole("option", { name: /Dhanmondi/ }));
    expect(value()).toBe("Dhaka City|Dhanmondi");
  });

  // Steadfast splits the capital into Dhaka City and Dhaka Sub-Urban. That is
  // their internal boundary; nobody knows which half they live in, and now
  // nobody has to.
  it("resolves the Dhaka City / Sub-Urban split without asking the customer", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await open(user);
    await user.type(search(), "Savar");
    await user.click(await screen.findByRole("option", { name: /Savar/ }));
    expect(value()).toBe("Dhaka Sub-Urban|Savar");
  });

  // A district's aliases must not leak onto every thana inside it, or typing
  // one Dhaka area would match all 59 of them.
  it("matches the area typed, not every area in its district", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await open(user);
    await user.type(search(), "Banani");
    expect(await screen.findAllByRole("option")).toHaveLength(1);
  });

  it("finds a thana under the official spelling when the courier uses another", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await open(user);
    await user.type(search(), "Jatrabari");
    await user.click(await screen.findByRole("option", { name: /Jattrabari/ }));
    expect(value()).toBe("Dhaka City|Jattrabari");
  });

  it("lets someone search by district to browse its areas", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await open(user);
    await user.type(search(), "Bagerhat");
    const options = await screen.findAllByRole("option");
    expect(options.length).toBeGreaterThan(1);
  });

  // Steadfast's coverage feed carries a few test rows. They were survivable
  // inside a district dropdown; in one combined list they are options a real
  // customer could pick as their delivery area.
  it("never offers the courier's test rows as a delivery area", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await open(user);
    await user.type(search(), "Null");
    expect(screen.queryByRole("option", { name: /^Null$/ })).not.toBeInTheDocument();
  });

  it("reports no matches instead of an empty list", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await open(user);
    await user.type(search(), "zzzznowhere");
    expect(await screen.findByText(/No area matches/i)).toBeInTheDocument();
  });

  // An address saved before this list existed must not appear blank and invite
  // someone to "fix" a delivery address that was always correct.
  it("still shows a stored area that is no longer in the courier's list", () => {
    render(<Harness initial={{ district: "Old District", thana: "Retired Thana" }} />);
    expect(trigger()).toHaveTextContent("Retired Thana");
  });

  it("does not submit the surrounding form when choosing with the keyboard", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    await open(user);
    await user.type(search(), "Dhanmondi");
    await user.keyboard("{Enter}");
    expect(onSubmit).not.toHaveBeenCalled();
    expect(value()).toBe("Dhaka City|Dhanmondi");
  });
});
