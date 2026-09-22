import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";

import { ProtectedRoute } from "./ProtectedRoute";
import { setSessionHint } from "@/features/auth/api/sessionHint";

function renderAt(path = "/account") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/account" element={<div>ACCOUNT PAGE</div>} />
          </Route>
          <Route path="/login" element={<div>LOGIN PAGE</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("ProtectedRoute with the session-hint optimisation", () => {
  beforeEach(() => localStorage.clear());

  // The trap this guards: skipping the /auth/me request leaves the query
  // DISABLED, and a disabled TanStack query reports isLoading=false AND
  // isError=false — which the guard would read as "loaded, no error" and
  // render the protected page to a complete stranger.
  it("sends a visitor with no session to login instead of rendering the page", async () => {
    renderAt();
    expect(await screen.findByText("LOGIN PAGE")).toBeInTheDocument();
    expect(screen.queryByText("ACCOUNT PAGE")).not.toBeInTheDocument();
  });

  it("does not skip the check for a browser that has signed in before", () => {
    setSessionHint();
    renderAt();
    // The request is allowed to run, so the guard waits rather than deciding.
    expect(screen.queryByText("ACCOUNT PAGE")).not.toBeInTheDocument();
    expect(screen.queryByText("LOGIN PAGE")).not.toBeInTheDocument();
  });
});
