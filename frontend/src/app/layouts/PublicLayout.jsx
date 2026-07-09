import { Link, Outlet } from "react-router";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useCurrentUser, useLogoutMutation } from "@/features/auth/api/useAuth";

// Minimal auth-state header for Phase 2 verification — the full premium nav
// (mega menu, search, cart) is built in Phase 4 (Homepage).
function HeaderAuthState() {
  const { data: user, isLoading } = useCurrentUser();
  const logoutMutation = useLogoutMutation();

  if (isLoading) return null;

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to={ROUTES.LOGIN}>Sign in</Link>
        </Button>
        <Button asChild size="sm">
          <Link to={ROUTES.REGISTER}>Create account</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Button asChild variant="ghost" size="sm">
        <Link to={ROUTES.ACCOUNT}>{user.name}</Link>
      </Button>
      {(user.role === "admin" || user.role === "staff") && (
        <Button asChild variant="ghost" size="sm">
          <Link to={ROUTES.ADMIN}>Admin</Link>
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        disabled={logoutMutation.isPending}
        onClick={() => logoutMutation.mutate(undefined, { onError: () => toast.error("Could not sign out") })}
      >
        Sign out
      </Button>
    </div>
  );
}

export function PublicLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <Link to={ROUTES.HOME} className="font-heading text-lg tracking-wide">
          DiecastBD
        </Link>
        <HeaderAuthState />
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-border px-6 py-8 text-sm text-muted-foreground">
        © {new Date().getFullYear()} DiecastBD
      </footer>
    </div>
  );
}
