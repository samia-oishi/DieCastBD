import { Outlet } from "react-router";

export function AuthLayout() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-sm">
        <Outlet />
      </div>
    </div>
  );
}
