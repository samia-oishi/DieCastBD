/** Splits one page of results across the in-stock run and the sold-out tail.
 *
 * The shop lists every buyable product before any sold-out one, across the
 * WHOLE result set rather than within a page — so somewhere there is a single
 * page that straddles the boundary and has to be filled from both halves.
 *
 * Pure arithmetic, kept out of the controller so it can be tested without a
 * database. It is worth testing: an off-by-one here doesn't throw, it silently
 * repeats one product on two pages or drops another entirely — the same class
 * of bug the `_id` sort tie-breaker exists to prevent, and just as invisible.
 *
 * @param skip           offset into the combined list
 * @param limit          page size
 * @param availableTotal how many in-stock products match the filter
 * @returns offsets and counts to read from each half; a count of 0 means "don't query"
 */
export function partitionPage({ skip, limit, availableTotal }) {
  // Entirely past the in-stock run — this page is all sold-out items, offset by
  // however far into the tail we are.
  if (skip >= availableTotal) {
    return { availableSkip: 0, fromAvailable: 0, soldOutSkip: skip - availableTotal, fromSoldOut: limit };
  }

  // Otherwise take as much of the in-stock run as this page can hold. When that
  // runs out mid-page, the remainder comes from the START of the sold-out set —
  // this is the one page that spans the boundary.
  const fromAvailable = Math.min(limit, availableTotal - skip);
  return { availableSkip: skip, fromAvailable, soldOutSkip: 0, fromSoldOut: limit - fromAvailable };
}
