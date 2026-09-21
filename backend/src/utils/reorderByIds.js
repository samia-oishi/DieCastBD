/** Persist a merchant-chosen display order as dense `sortOrder` values.
 *
 * Brands and categories are listed by `{ sortOrder: 1, name: 1 }` everywhere —
 * shop filters, the homepage shelf, the /collections hub. The admin screens let
 * the merchant drag rows into the order they want; this writes that order down.
 *
 * `ids` is the WHOLE list in its new order, not a delta: position in the array
 * becomes `sortOrder`, so the result is always dense (0,1,2,…) with no ties for
 * the name-sort to break arbitrarily. One bulkWrite, so a reorder of twenty
 * rows is one round trip and either all of it lands or none of it does.
 *
 * Returns the number of documents actually moved. Unknown ids are ignored
 * rather than failing the whole call — a stale admin tab holding a deleted
 * brand should still be able to order the ones that remain.
 */
export async function reorderByIds(Model, ids) {
  const ops = ids.map((id, index) => ({
    updateOne: { filter: { _id: id }, update: { $set: { sortOrder: index } } },
  }));
  if (!ops.length) return 0;
  const result = await Model.bulkWrite(ops, { ordered: false });
  return result.modifiedCount ?? 0;
}
