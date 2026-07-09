import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router";
import toast from "react-hot-toast";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Footer } from "@/components/shared/Footer";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { useCurrentUser, useLogoutMutation } from "@/features/auth/api/useAuth";
import { CartDrawer } from "@/features/cart/components/CartDrawer";
import logo from "@/assets/logo/logo.jpg";

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
      <Button asChild variant="ghost" size="icon-sm" aria-label="Wishlist">
        <Link to={ROUTES.WISHLIST}>
          <Heart />
        </Link>
      </Button>
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
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/90 px-6 py-3 backdrop-blur-sm sm:px-10">
        <div className="flex items-center gap-8">
          <Link to={ROUTES.HOME}>
            <img src={logo} alt="DiecastBD" className="h-5 w-auto sm:h-6" />
          </Link>
          <NavLink
            to={ROUTES.SHOP}
            className={({ isActive }) =>
              cn(
                "text-sm transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            Shop
          </NavLink>
        </div>
        <div className="flex items-center gap-3">
          {/* Cart works for guests too (localStorage-backed) — deliberately not gated behind auth. */}
          <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
          <HeaderAuthState />
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
