import { Suspense } from "react";
import { Outlet } from "react-router";
import { FullPageLoader } from "@/components/shared/FullPageLoader";

export function AuthLayout() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-sm">
        <Suspense fallback={<FullPageLoader />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}
