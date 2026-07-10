import { useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

// Deliberately does not call useCart()/addItem() — Buy Now must never touch
// the persistent cart. It hands the single product straight to Checkout via
// router state, which sources its line items from this instead of the cart
// whenever state.buyNowItem is present.
export function BuyNowButton({ product }) {
  const navigate = useNavigate();
  const outOfStock = product.availableStock <= 0;

  const onBuyNow = () => {
    navigate(ROUTES.CHECKOUT, { state: { buyNowItem: { product, qty: 1 } } });
  };

  return (
    <Button size="lg" variant="outline" className="w-full" onClick={onBuyNow} disabled={outOfStock}>
      Buy Now
    </Button>
  );
}
