import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "react-hot-toast";

import { queryClient } from "@/lib/queryClient";
import { CartMergeOnLogin } from "@/features/cart/components/CartMergeOnLogin";

export function AppProviders({ children }) {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <CartMergeOnLogin />
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "var(--color-card)",
              color: "var(--color-foreground)",
              border: "1px solid var(--color-border)",
            },
          }}
        />
      </QueryClientProvider>
    </HelmetProvider>
  );
}
