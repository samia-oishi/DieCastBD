import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "./cartStore";

const product = (id, availableStock) => ({ _id: id, availableStock, title: id, price: 100 });

// The guest cart must never let quantity exceed availableStock, no matter how the
// customer gets there (repeated adds, direct qty edit) — that invariant guards the
// checkout stock-validation from ever seeing an impossible cart.
describe("cartStore (guest)", () => {
  beforeEach(() => useCartStore.setState({ items: [] }));

  it("adds a new item", () => {
    useCartStore.getState().addItem(product("a", 5), 2);
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].qty).toBe(2);
  });

  it("increments quantity when the same product is added again", () => {
    const p = product("a", 5);
    useCartStore.getState().addItem(p, 2);
    useCartStore.getState().addItem(p, 1);
    expect(useCartStore.getState().items[0].qty).toBe(3);
  });

  it("caps quantity at availableStock across repeated adds", () => {
    const p = product("a", 5);
    useCartStore.getState().addItem(p, 4);
    useCartStore.getState().addItem(p, 4); // 4+4=8, but only 5 in stock
    expect(useCartStore.getState().items[0].qty).toBe(5);
  });

  it("caps a direct quantity edit at availableStock", () => {
    useCartStore.getState().addItem(product("a", 5), 1);
    useCartStore.getState().updateQty("a", 99);
    expect(useCartStore.getState().items[0].qty).toBe(5);
  });

  it("removes an item when its quantity is set to zero or below", () => {
    useCartStore.getState().addItem(product("a", 5), 2);
    useCartStore.getState().updateQty("a", 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("removes a specific item and clears the whole cart", () => {
    useCartStore.getState().addItem(product("a", 5), 1);
    useCartStore.getState().addItem(product("b", 5), 1);
    useCartStore.getState().removeItem("a");
    expect(useCartStore.getState().items.map((i) => i.product._id)).toEqual(["b"]);
    useCartStore.getState().clear();
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});
