import { Heart } from "lucide-react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/shared/ProductCard";
import { Container } from "@/components/shared/Container";
import { ROUTES } from "@/constants/routes";
import { useWishlist } from "./api/useWishlist";

export function WishlistPage() {
  const { data: products, isLoading } = useWishlist();

  return (
    <Container className="py-10">
      <h1 className="mb-6 font-heading text-3xl text-foreground">My Wishlist</h1>

      {isLoading && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && products?.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <Heart className="size-10 text-muted-foreground/40" strokeWidth={1.25} />
          <p className="text-muted-foreground">Nothing saved yet.</p>
          <Button asChild size="sm">
            <Link to={ROUTES.SHOP}>Browse the collection</Link>
          </Button>
        </div>
      )}

      {!isLoading && products?.length > 0 && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </Container>
  );
}
