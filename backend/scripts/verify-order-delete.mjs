/* Regression check for deleteOrders() — the stock-critical admin bulk-delete path.
   Creates one real order in EACH stock bucket against the dev DB, deletes them, and
   asserts inventory lands exactly back where it started, plus that a full recoverable
   snapshot was audited. Run: node --env-file=.env scripts/verify-order-delete.mjs */
import mongoose from "mongoose";
import { Product } from "../src/modules/products/product.model.js";
import { Order } from "../src/modules/orders/order.model.js";
import { InventoryLog } from "../src/modules/inventoryLogs/inventoryLog.model.js";
import { AuditLog } from "../src/modules/auditLogs/auditLog.model.js";
import { User } from "../src/modules/users/user.model.js";
import { createOrderFromItems, transitionOrderStatus, deleteOrders } from "../src/modules/orders/order.service.js";

await mongoose.connect(process.env.MONGODB_URI);

const admin = await User.findOne({ role: "admin" }) ?? await User.findOne({});
const product = await Product.findOne({ status: "active", isDeleted: false, stock: { $gte: 6 }, paymentOptions: "cod" });

const snap = async (label) => {
  const p = await Product.findById(product._id);
  console.log(`   ${label.padEnd(26)} stock=${p.stock} reserved=${p.reservedStock} available=${p.stock - p.reservedStock}`);
  return { stock: p.stock, reserved: p.reservedStock };
};

console.log(`\nProduct: ${product.title}`);
const before = await snap("BASELINE");

const mk = async (qty) =>
  createOrderFromItems({
    userId: admin._id,
    items: [{ productId: product._id.toString(), qty }],
    shippingAddress: { recipientName: "Delete Test", phone: "01712345678", addressLine1: "1 Test Rd", city: "Dhaka" },
    phone: "01712345678",
    paymentMethod: "cod",
    paymentOption: "cod",
    shippingZone: "Inside Dhaka",
  });

console.log("\n1. Creating one order in each stock bucket…");
const pendingOrder = await mk(1); // reserved  — holds reservedStock
const committedOrder = await mk(2); // -> committed — decrements stock
const cancelledOrder = await mk(3); // -> released  — holds nothing

await transitionOrderStatus({ orderId: committedOrder._id, newStatus: "confirmed", actorId: admin._id });
await transitionOrderStatus({ orderId: cancelledOrder._id, newStatus: "cancelled", actorId: admin._id });

console.log(`   pending   ${pendingOrder.orderNumber}  (qty 1, reserved)`);
console.log(`   confirmed ${committedOrder.orderNumber}  (qty 2, committed)`);
console.log(`   cancelled ${cancelledOrder.orderNumber}  (qty 3, released)`);
const during = await snap("WITH ORDERS LIVE");

console.log("\n2. Deleting all three…");
const ids = [pendingOrder._id, committedOrder._id, cancelledOrder._id];
const result = await deleteOrders({ orderIds: ids, actorId: admin._id });
console.log(`   -> ${JSON.stringify(result)}`);
const after = await snap("AFTER DELETE");

console.log("\n3. Assertions");
const gone = await Order.countDocuments({ _id: { $in: ids } });
const audits = await AuditLog.countDocuments({ entityType: "Order", entityId: { $in: ids.map(String) }, action: "DELETE /admin/orders" });
const logs = await InventoryLog.countDocuments({ reason: { $regex: "deleted \\(was" }, product: product._id });

const ok = (label, pass, detail) => console.log(`   ${pass ? "✅" : "❌"} ${label}${detail ? ` — ${detail}` : ""}`);
ok("stock restored to baseline", after.stock === before.stock, `${before.stock} -> ${after.stock}`);
ok("reservedStock restored to baseline", after.reserved === before.reserved, `${before.reserved} -> ${after.reserved}`);
ok("all 3 orders removed", gone === 0, `${gone} left`);
ok("reported 3 units returned (1 reserved + 2 committed; cancelled gives 0)", result.unitsReturnedToStock === 3, `got ${result.unitsReturnedToStock}`);
ok("full 'before' snapshot audited per order", audits === 3, `${audits} audit rows`);
ok("stock movements logged to InventoryLog", logs >= 2, `${logs} rows`);

const restored = await AuditLog.findOne({ entityId: String(pendingOrder._id), action: "DELETE /admin/orders" });
ok("audit snapshot is recoverable", !!restored?.before?.orderNumber, `orderNumber in snapshot: ${restored?.before?.orderNumber}`);

await mongoose.disconnect();
