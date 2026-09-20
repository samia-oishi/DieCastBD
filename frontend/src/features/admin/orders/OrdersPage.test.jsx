import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { OrdersPage } from "./OrdersPage";

const deleteMutate = vi.fn();
const bulkStatusMutate = vi.fn();
let listParams;

// The list query and the two bulk mutations are the page's external dependencies;
// stubbing them keeps this focused on the selection + confirmation behaviour.
vi.mock("./api/useAdminOrders", () => ({
  useAdminOrders: (params) => {
    listParams = params;
    return { data: { data: ORDERS, meta: { page: 1, limit: 20, total: 3, totalPages: 1 } }, isLoading: false };
  },
  useDeleteOrdersMutation: () => ({ mutate: deleteMutate, isPending: false }),
  useBulkUpdateOrderStatusMutation: () => ({ mutate: bulkStatusMutate, isPending: false }),
}));

// The list now shows per-status filter chips fed by their own count hook; stub it
// so the test stays focused on selection + delete behaviour (no real queries fire).
vi.mock("./api/useOrderStatusCounts", () => ({
  useOrderStatusCounts: () => ({ all: 3, pending: 1, confirmed: 1, packed: 0, shipped: 0, delivered: 0, cancelled: 1, refunded: 0, booked: 1 }),
}));

// pending = reserved (1 unit), confirmed = committed (2 units) → 3 units come back.
// cancelled = released → holds no stock, contributes 0.
const ORDERS = [
  { _id: "a1", orderNumber: "DBD-1", status: "pending", total: 1000, createdAt: "2026-07-13T00:00:00Z", user: { name: "Guest" }, items: [{ qty: 1 }] },
  { _id: "b2", orderNumber: "DBD-2", status: "confirmed", total: 2000, createdAt: "2026-07-13T00:00:00Z", user: { name: "Ana", email: "a@b.com" }, items: [{ qty: 2 }], courier: { consignmentId: "298773184", status: "pending" } },
  { _id: "c3", orderNumber: "DBD-3", status: "cancelled", total: 3000, createdAt: "2026-07-13T00:00:00Z", user: { name: "Bob", email: "b@c.com" }, items: [{ qty: 5 }] },
];

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <OrdersPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const dialog = () => screen.getByRole("alertdialog");

describe("OrdersPage — bulk select & delete", () => {
  beforeEach(() => {
    deleteMutate.mockClear();
    bulkStatusMutate.mockClear();
  });

  it("shows no delete action until something is selected", async () => {
    renderPage();
    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();

    await userEvent.click(screen.getByLabelText("Select order DBD-1"));
    // The bulk bar shows a lime count badge + "selected" and the Delete action.
    const bar = screen.getByText("selected").closest("div");
    expect(within(bar).getByText("1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  it("select-all toggles every row on the page, and toggles them back off", async () => {
    renderPage();
    const selectAll = screen.getByLabelText("Select all orders on this page");

    await userEvent.click(selectAll);
    const bar = screen.getByText("selected").closest("div");
    expect(within(bar).getByText("3")).toBeInTheDocument();

    await userEvent.click(selectAll);
    await waitFor(() => expect(screen.queryByText("selected")).not.toBeInTheDocument());
  });

  it("the confirmation counts ONLY the units that actually return to stock", async () => {
    renderPage();
    await userEvent.click(screen.getByLabelText("Select all orders on this page"));
    await userEvent.click(screen.getByRole("button", { name: /delete/i }));

    // pending(1) + confirmed(2) = 3. The cancelled order's 5 units are already
    // back in the pool — counting them would double-credit the stock.
    expect(within(dialog()).getByText(/3 items will be returned to stock/i)).toBeInTheDocument();
    expect(within(dialog()).getByText(/permanent/i)).toBeInTheDocument();
    expect(within(dialog()).getByRole("heading", { name: /delete 3 orders\?/i })).toBeInTheDocument();
  });

  it("omits the stock line entirely when nothing is coming back", async () => {
    renderPage();
    await userEvent.click(screen.getByLabelText("Select order DBD-3")); // cancelled → released
    await userEvent.click(screen.getByRole("button", { name: /delete/i }));

    expect(within(dialog()).queryByText(/returned to stock/i)).not.toBeInTheDocument();
    expect(within(dialog()).getByRole("heading", { name: /delete 1 order\?/i })).toBeInTheDocument();
  });

  it("deletes nothing until the dialog is confirmed, then sends exactly the selected ids", async () => {
    renderPage();
    await userEvent.click(screen.getByLabelText("Select order DBD-1"));
    await userEvent.click(screen.getByLabelText("Select order DBD-3"));
    await userEvent.click(screen.getByRole("button", { name: /delete/i }));

    expect(deleteMutate).not.toHaveBeenCalled(); // opening the dialog must not delete

    await userEvent.click(within(dialog()).getByRole("button", { name: /delete 2 orders/i }));
    expect(deleteMutate).toHaveBeenCalledTimes(1);
    expect(deleteMutate.mock.calls[0][0]).toEqual(["a1", "c3"]);
  });

  it("cancelling the dialog deletes nothing", async () => {
    renderPage();
    await userEvent.click(screen.getByLabelText("Select order DBD-1"));
    await userEvent.click(screen.getByRole("button", { name: /delete/i }));
    await userEvent.click(within(dialog()).getByRole("button", { name: /cancel/i }));

    expect(deleteMutate).not.toHaveBeenCalled();
  });
});

describe("OrdersPage — Booked filter", () => {
  beforeEach(() => {
    listParams = undefined;
    bulkStatusMutate.mockClear();
  });

  it("offers Booked as its own chip", () => {
    renderPage();
    expect(screen.getByRole("button", { name: /booked/i })).toBeInTheDocument();
  });

  it("asks the API for booked, NOT for a status called booked", async () => {
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: /booked/i }));
    await waitFor(() => expect(listParams.booked).toBe(true));
    // The two live on different axes — a booked order can be confirmed, packed
    // or delivered, so sending it as a status would return nothing.
    expect(listParams.status).toBeUndefined();
  });

  it("clears the booked filter again when another status is picked", async () => {
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: /booked/i }));
    await waitFor(() => expect(listParams.booked).toBe(true));

    await userEvent.click(screen.getByRole("button", { name: /^pending/i }));
    await waitFor(() => expect(listParams.status).toBe("pending"));
    expect(listParams.booked).toBeUndefined();
  });

  it("marks a booked order apart from the rest of the list", () => {
    const { container } = renderPage();
    // Every row carries the accent border so the columns stay aligned; only a
    // booked one has it coloured.
    const accented = container.querySelectorAll(".border-l-brand");
    expect(accented).toHaveLength(1);
  });
});

describe("OrdersPage — bulk status change", () => {
  beforeEach(() => {
    bulkStatusMutate.mockClear();
  });

  it("offers no status action until something is selected", () => {
    renderPage();
    expect(screen.queryByRole("button", { name: /change status/i })).not.toBeInTheDocument();
  });

  it("changes nothing until the dialog is confirmed, then sends the selected ids", async () => {
    renderPage();
    await userEvent.click(screen.getByLabelText("Select order DBD-1"));
    await userEvent.click(screen.getByRole("button", { name: /change status/i }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Packed" }));

    // Dialog is open; nothing has been sent yet.
    expect(bulkStatusMutate).not.toHaveBeenCalled();

    await userEvent.click(within(dialog()).getByRole("button", { name: /move to packed/i }));
    expect(bulkStatusMutate).toHaveBeenCalledTimes(1);
    expect(bulkStatusMutate.mock.calls[0][0]).toMatchObject({ ids: ["a1"], status: "packed" });
  });

  it("cancelling the dialog changes nothing", async () => {
    renderPage();
    await userEvent.click(screen.getByLabelText("Select order DBD-1"));
    await userEvent.click(screen.getByRole("button", { name: /change status/i }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Packed" }));
    await userEvent.click(within(dialog()).getByRole("button", { name: /cancel/i }));
    expect(bulkStatusMutate).not.toHaveBeenCalled();
  });

  it("warns that cancelling hands stock back, and says how much", async () => {
    renderPage();
    await userEvent.click(screen.getByLabelText("Select all orders on this page"));
    await userEvent.click(screen.getByRole("button", { name: /change status/i }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Cancelled" }));
    // pending 1 + confirmed 2 hold stock; the already-cancelled one holds none.
    expect(within(dialog()).getByText(/3 items will be returned to stock/i)).toBeInTheDocument();
    expect(within(dialog()).getByText(/1 is already cancelled and will be skipped/i)).toBeInTheDocument();
  });

  it("does not offer refunded in bulk — that is a money decision per order", async () => {
    renderPage();
    await userEvent.click(screen.getByLabelText("Select order DBD-1"));
    await userEvent.click(screen.getByRole("button", { name: /change status/i }));
    await screen.findByRole("menuitem", { name: "Packed" });
    expect(screen.queryByRole("menuitem", { name: /refunded/i })).not.toBeInTheDocument();
  });
});
