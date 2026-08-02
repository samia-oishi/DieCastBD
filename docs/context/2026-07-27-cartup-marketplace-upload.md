# 2026-07-27 — CartUp marketplace bulk-upload sheet

## What this session did

Merchant was accepted as a seller on **CartUp** and given a category-specific bulk-upload
workbook. Built the tooling to fill it from the live catalogue, plus the handoff needed for
the one step the workbook can't carry (images).

Everything lives in the new `Marketplace/` folder. **Nothing in `frontend/` or `backend/`
changed** — no deploy-path risk to the live Vercel site. The only network calls are
read-only GETs to `api.diecastbd.com` and Cloudinary.

Recorded as decision **#82** in `docs/plan.md` §7 and a dated entry in `docs/log.md`.

## Repo state

New, all untracked (`Marketplace/` was untracked before this session too):

```
Marketplace/
  Die-Cast Vehicles Product.xlsx              CartUp's template — NEVER modified
  Die-Cast Vehicles Product - DiecastBD.xlsx  the filled output (0.58 MB, 29 rows)
  build_cartup_sheet.py                       live API -> workbook (stdlib only)
  verify_cartup_sheet.py                      pre-upload gate (needs openpyxl)
  download_images.py                          Cloudinary -> images/, renamed by Seller SKU
  splice_image_keys.py                        writes CartUp ImageKeys into the workbook
  cartup_copy.py                              Bengali copy, colour map, cited sources
  image-map.csv                               SKU -> URL -> local file -> imageKey (blank)
  images/                                     50 downloaded photos — GITIGNORED (15 MB)
  README.md                                   the upload runbook
  cartup-brand-request.md                     message to send CartUp support
  .gitignore                                  images/ and *.xlsx.bak
```

Modified: `docs/plan.md` (decision #82), `docs/log.md` (dated entry).

Nothing was committed. Branch is still `main`.

## Where it stands

The workbook is complete and passes every check **except the image columns**, which are
empty by design. CartUp will reject every row until they're filled — Product Image 1 and
Variant Image are both mandatory.

```
python3 Marketplace/verify_cartup_sheet.py
# -> All checks passed (0.58 MB) — but the image columns are still empty,
#    so CartUp will reject the rows. Fill the ImageKeys first.
```

## Unfinished work — merchant actions

1. **Fill the ImageKeys.** Bulk-upload `Marketplace/images/` in the CartUp dashboard,
   download their ImageKey batch, paste each key into `image-map.csv`'s `imageKey` column
   (matched on `localFile`), then `python3 Marketplace/splice_image_keys.py` and re-verify.
   Verifier must say "Ready to upload."
2. **Send `cartup-brand-request.md`** to CartUp support. Once Hot Wheels / MINI GT exist,
   change `BRAND` in `build_cartup_sheet.py` and re-run.
3. **8 products have only one photo** — `HW5P-002, HWCC-004, HWCC-009, HWCC-011, HWCC-012,
   HWCC-013, HWFF-005, MGT-1094`. Worth shooting a second angle before listing.
4. **Decide on Special Price** — off by default (`SPECIAL_PRICES = False`). Three SKUs have
   live sale prices; at +14% they'd be ৳3,070 (HW5P-001) / ৳1,860 (HWCC-007) / ৳1,810
   (HWF1-002).
5. **Accessories** (`ACC-001/002/003`) still need a separate upload under an accessories
   category template — they were excluded here as not die-cast vehicles.

## Gotchas for whoever picks this up

- **Never save this workbook with openpyxl.** `payload_hidden` stores formulas as
  `<f>=IF(product!A3&lt;&gt;"",...)</f>` — leading `=` *inside* the `<f>` element, which is
  not standard OOXML. openpyxl reads it as `"==IF(...)"` and writes it back, corrupting all
  500 × 39 payload formulas. It also drops the `legacyDrawing` VML holding the per-column
  help comments. The scripts do direct XML surgery for exactly this reason, and
  `verify_cartup_sheet.py` asserts every non-patched zip part is byte-identical.
- **Six columns are dropdown-validated** against the `veryHidden` `value_hidden` sheet
  (Brand L, Unit M, Age O, Materials P, Warranty Type X, Color AD). One non-verbatim value
  makes `payload_hidden` return `#N/A` and the whole import fails. There's no Excel here to
  recalculate, so the verifier simulates the VLOOKUP (first match, column 2) and prints the
  resolved ids.
- **CartUp's brand list has no diecast brands at all** — 3,402 entries, no Hot Wheels,
  Mattel, MINI GT or TSM. `No Brand` (id 519) is the only honest value that validates.
- **Seller SKU is prefixed `DCBD-`** because CartUp requires uniqueness across their whole
  system, not just this seller. Parent SKU = Seller SKU; a *shared* Parent SKU would merge
  rows into one product's variants.
- **Data source is the live API**, not `docs/Inventory.md` (retail column is pre-23-Jul and
  stale) and not `catalog.data.js` (no images, stock, or sale prices). The API caps `limit`
  at 100; the generator hard-fails if `meta.total` exceeds what it received, so the catalogue
  growing past 100 SKUs will surface loudly rather than silently truncating.
- **Age grades**: Mattel officially grades Hot Wheels 3+, TSM grades MINI GT 14+. CartUp has
  neither bucket, so `10 Years+` / `18 Years+` are used — never understating a safety grade —
  and the official grade is quoted verbatim in every description.
- Re-running `build_cartup_sheet.py` **overwrites the workbook and wipes any spliced
  ImageKeys**. Splice again after any rebuild.
