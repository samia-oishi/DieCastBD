import { Suspense } from "react";
import { Outlet } from "react-router";
import { FullPageLoader } from "@/components/shared/FullPageLoader";
import { ScrollToTop } from "@/components/shared/ScrollToTop";

// Each auth page renders its own full-screen split (AuthShell), so the layout is
// just a scroll reset + suspense boundary.
export function AuthLayout() {
  return (
    <div className="min-h-svh bg-paper text-ink">
      <ScrollToTop />
      <Suspense fallback={<FullPageLoader />}>
        <Outlet />
      </Suspense>
    </div>
  );
}
