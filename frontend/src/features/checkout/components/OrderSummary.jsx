function formatPrice(amount) {
  return `৳${Math.round(amount).toLocaleString("en-US")}`;
}

export function OrderSummary({ items, subtotal, discount, shippingFee }) {
  const total = subtotal - discount + shippingFee;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.product._id} className="flex justify-between text-sm">
            <span className="text-foreground">
              {item.product.title} <span className="text-muted-foreground">× {item.qty}</span>
            </span>
            <span className="text-foreground">{formatPrice(item.lineTotal)}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-4 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-primary">
            <span>Discount</span>
            <span>-{formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-muted-foreground">
          <span>Shipping</span>
          <span>{shippingFee > 0 ? formatPrice(shippingFee) : "Free"}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-foreground">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  );
}
