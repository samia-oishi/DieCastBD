// Collector diecast is seeded with naturally thin per-SKU stock (1-4 units
// typical) — a bulkier-retail threshold (e.g. 10) would flag nearly the whole
// catalog as low-stock and make the signal useless. Shared by the analytics
// rollup and the inventory admin view so "low stock" never means two different
// things in two different places.
export const LOW_STOCK_THRESHOLD = 2;
