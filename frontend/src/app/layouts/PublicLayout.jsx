import { Link, Outlet } from "react-router";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Footer } from "@/components/shared/Footer";
import { ROUTES } from "@/constants/routes";
import { useCurrentUser, useLogoutMutation } from "@/features/auth/api/useAuth";
import logo from "@/assets/logo/logo.jpg";

// Auth-state header. The full premium nav (mega menu, search, cart) is added
// in Phase 5/7 once the pages it would link to actually exist.
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
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/90 px-6 py-3 backdrop-blur-sm sm:px-10">
        <Link to={ROUTES.HOME}>
          <img src={logo} alt="DiecastBD" className="h-5 w-auto sm:h-6" />
        </Link>
        <HeaderAuthState />
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
