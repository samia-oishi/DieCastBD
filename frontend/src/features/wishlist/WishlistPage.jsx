import { Heart, ShieldCheck } from "lucide-react";
import { Link } from "react-router";

import { Seo } from "@/components/shared/Seo";
import { ROUTES } from "@/constants/routes";
import { useWishlist } from "./api/useWishlist";
import { WishlistCard } from "./components/WishlistCard";

export function WishlistPage() {
  const { data: products, isLoading } = useWishlist();
  const count = products?.length ?? 0;

  return (
    <>
      <Seo title="My wishlist" noindex />
      <div className="mx-auto w-full max-w-[1160px] px-4 pb-6 pt-6 md:px-10 md:pb-10 md:pt-10">
        <h1 className="font-display text-[26px] font-extrabold tracking-[-0.01em] text-ink md:text-[34px] md:tracking-[-0.02em]">My wishlist</h1>
        {!isLoading && count > 0 && (
          <p className="mt-1.5 text-[12.5px] text-muted-foreground md:mt-2 md:text-[14.5px]">
            {count} piece{count !== 1 ? "s" : ""} on your radar — we'll flag price drops and restocks.
          </p>
        )}

        {isLoading ? (
          <div className="mt-4 grid grid-cols-2 gap-3 md:mt-[26px] md:grid-cols-[repeat(auto-fill,minmax(250px,1fr))] md:gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] w-full animate-pulse rounded-[18px] bg-line-soft md:rounded-[20px]" />
            ))}
          </div>
        ) : count === 0 ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <Heart className="size-10 text-faint/40" strokeWidth={1.25} />
            <p className="text-sm text-muted-foreground">Nothing saved yet.</p>
            <Link to={ROUTES.SHOP} className="rounded-full bg-brand px-5 py-2.5 text-[13.5px] font-bold text-ink transition-colors hover:bg-brand-bright">
              Browse the collection
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3 md:mt-[26px] md:grid-cols-[repeat(auto-fill,minmax(250px,1fr))] md:gap-5">
              {products.map((product) => (
                <WishlistCard key={product._id} product={product} />
              ))}
            </div>
            <div className="mt-6 hidden items-center gap-2 text-[13px] text-muted-foreground md:flex">
              <ShieldCheck size={14} strokeWidth={2} className="text-brand-deep" />
              Tap the heart to remove a piece — we'll still email you if it drops in price.
            </div>
          </>
        )}
      </div>
    </>
  );
}
