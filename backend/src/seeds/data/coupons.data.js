// Real, usable test coupons — not admin-manageable yet (that UI is Phase 10),
// but checkout needs something real to apply and validate against.
export const couponsSeed = [
  {
    code: "WELCOME10",
    type: "percentage",
    value: 10,
    minOrderValue: 0,
    maxDiscount: 500,
  },
  {
    code: "SAVE500",
    type: "fixed",
    value: 500,
    minOrderValue: 3000,
  },
];
