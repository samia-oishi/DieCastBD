import { Heart } from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import toast from "react-hot-toast";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth/api/useAuth";
import { useIsWishlisted, useToggleWishlistMutation } from "../api/useWishlist";
import { ROUTES } from "@/constants/routes";

export function WishlistButton({ product, className, size = "default", showLabel = false }) {
  const { data: user } = useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const isWishlisted = useIsWishlisted(product._id);
  const toggleMutation = useToggleWishlistMutation();

  const onClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      const redirect = encodeURIComponent(location.pathname);
      navigate(`${ROUTES.LOGIN}?redirect=${redirect}`);
      return;
    }

    toggleMutation.mutate(
      { productId: product._id, product, isWishlisted },
      { onError: () => toast.error("Could not update wishlist") }
    );
  };

  const label = isWishlisted ? "Wishlisted" : "Add to Wishlist";
  const icon = (
    <Heart className={cn(size === "default" ? "size-4" : "size-5", isWishlisted && "fill-primary text-primary")} />
  );

  if (showLabel) {
    // Same Button component + size as ShareButton next to it — a hand-rolled
    // <button> here previously had different padding/height and looked mismatched.
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onClick}
        aria-pressed={isWishlisted}
        className={cn(isWishlisted && "border-primary text-primary", className)}
      >
        {icon}
        {label}
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={isWishlisted}
      className={cn(
        "flex items-center justify-center rounded-full bg-white/94 shadow-[0_1px_4px_rgba(16,18,8,.12)] transition-colors",
        size === "default" ? "size-8.5" : "size-9",
        className
      )}
    >
      {icon}
    </button>
  );
}
