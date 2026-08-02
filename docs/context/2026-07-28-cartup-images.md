# 2026-07-28 — CartUp images imported; upload rejection fixed

Continues `2026-07-27-cartup-marketplace-upload.md`. Recorded as decisions **#83**
through **#87** in `docs/plan.md` §7 with dated `docs/log.md` entries.

Merchant uploaded photos in the CartUp dashboard, returned the workbook with image URLs
filled in, and asked to reuse the same image for Variant Image plus a check on what's
missing.

## Repo state

Still all under `Marketplace/`, untracked. Nothing in `frontend/`/`backend/` changed.

```
Marketplace/
  Die-Cast Vehicles Product - DiecastBD.xlsx  THE file to upload — the only workbook here
  template/Die-Cast Vehicles Product.xlsx     CartUp's pristine template, restored to
                                              593,105 bytes. NOT a duplicate: every build is
                                              cut from it and verify diffs against it.
  cartup-image-urls.csv                       durable record of CartUp's media library
  build_cartup_sheet.py                       fills C-J + AG from that CSV
  import_cartup_urls.py                       harvests URLs from a returned workbook
  verify_cartup_sheet.py                      hard-FAILs on missing images; duplicate-image
                                              check; prints required-field coverage
  download_images.py, cartup_copy.py, image-map.csv, README.md, cartup-brand-request.md
  images/                                     50 Cloudinary photos — GITIGNORED
  (splice_image_keys.py and from-cartup/ DELETED)
```

Modified: `docs/plan.md` (decision #83), `docs/log.md`. Nothing committed. Branch `main`.

## Where it stands

**Done — `verify_cartup_sheet.py` exits 0. The workbook is ready to upload.** All 29
products carry an image, Variant Image mirrors Product Image 1 on every row, and all 29
URLs are distinct.

Normal loop from here:

```bash
python3 Marketplace/build_cartup_sheet.py
python3 Marketplace/verify_cartup_sheet.py
```

## What was found

**CartUp's "ImageKey" is a plain CDN URL** (`https://cdn.cartup.com/product/<uuid>.webp`).
Yesterday's reading of the policy sheet — that an opaque key had to be downloaded in a
batch — was wrong. The whole splice-after-build flow was replaced by
`cartup-image-urls.csv` + `import_cartup_urls.py`, so one `build` produces a complete file.

**One photo was on the wrong product.** `HWPC-001` (Cyberpunk 2077 Quadra Turbo-R V-Tech)
was carrying a photo of the **2021 Toyota GR Supra**, which is `HWFF-005` — the one product
that had no image. Moved to its real owner; the merchant then supplied the correct Cyberpunk
photo (`58423d79…`, card art reads `HXD63`, matching the product's model number).

**Never edit this workbook outside the scripts.** The returned file had been through Google
Sheets and came back with 19,500 `#ERROR!` cells cached across `payload_hidden`, all 16
dropdown validations stripped, `value_hidden` flipped to `hidden`, and 1,000 padded rows.

**CartUp rejected the first upload — `payload_hidden` was never computed.** Their importer
reads that hidden sheet, not the visible one. Its formulas only acquire values when a
spreadsheet app recalculates on save, which this build never does, so all 19,500 cells
shipped as formulas with no cached value and CartUp answered *"No products were found in
your excel upload"* despite a perfect-looking `product` sheet. The generator now computes
the payload itself (`compute_payload()`), and the verifier checks it every run. See
decision #84.

**Second upload got to content validation, and CartUp rejects `#` in product names.** Its
error workbook's Seller SKU / Parent SKU / Variant Combination sheets were all empty — the
`DCBD-` prefix, SKU uniqueness and one-variant-per-parent design all validated clean. The
only rule hit was `#` in Name (English)/(Bengali), on the 7 products carrying a collector or
race number. `cartup_name()` now rewrites `#` to `No.`; descriptions keep theirs (CartUp did
not object to those). See decision #85.

## Unfinished work

1. **`HWF1-002` is listed as #6 but the card is #30** — a **live-site** data fix, not a
   marketplace one. Merchant confirmed it's a single car (not a 2-car set). Zooming the
   CartUp photo shows the card reads **30**, model number **HRV11**, and the car carries 30
   on the nose: that's Liam Lawson, whereas the diecastbd.com title, slug and Bengali copy
   all say **#6** (Isack Hadjar). Fix on diecastbd.com first — the generator takes titles
   from the live API and the verifier fails on drift — then rebuild. The site's own
   HWF1-002 photos also show a two-car boxed set, which is misleading for a single car.
2. **21 products have an unused second photo** on file; Product Image 2 (col D) is empty on
   every row. Upload them the same way for richer listings.
3. **The promo window expires 28/07/2027.** Pricing is now MRP = site ×1.14 ×1.07, Special
   Price = site ×1.14 (what you're paid). When `SPECIAL_END` lapses every listing jumps to
   the 7%-higher MRP — extend `SPECIAL_START`/`SPECIAL_END` in `build_cartup_sheet.py` and
   rebuild before then. See decision #86.
4. Still open from yesterday: send `cartup-brand-request.md`; accessories `ACC-001/002/003`
   need their own category upload.

## Gotchas

- **Hashing cannot verify CartUp images against ours.** CartUp re-composites photos onto
  decorative backgrounds. The 5 MINI GT images matched at average-hash distance 0, but every
  Hot Wheels image scored ≥49/256 against *everything* — no match to anything, including
  itself. Identification had to be done visually by reading the card art off labelled contact
  sheets. If images need re-checking, do it that way, not by hash.
- **`import_cartup_urls.py` will not re-assign an image already on another product**, which
  is what makes the HWPC-001/HWFF-005 correction survive a re-import. `verify_cartup_sheet.py`
  enforces the same rule. Don't remove either guard.
- **cdn.cartup.com rejects Python 3.9's TLS** (`TLSV1_ALERT_PROTOCOL_VERSION`). Use `curl` to
  fetch those images; Cloudinary works fine from `urllib`.
- Re-running `build_cartup_sheet.py` is now safe for images — they come from
  `cartup-image-urls.csv`, not from the previous workbook. That CSV is the thing to protect.
- **CartUp prices are deliberately above site prices** — Special Price (what you're paid)
  is site ×1.14, MRP is 7% above that. The site's own sale prices on HW5P-001 / HWCC-007 /
  HWF1-002 are NOT mirrored; all 29 rows price off the site's regular price.
- **Marketplace titles intentionally differ from site titles** for HWCC-003, HWF1-001,
  HWF1-002, MGT-1022, MGT-1046, MGT-1094, MGT-1106 — `MINI GT No.1022` vs `MINI GT #1022`.
  The verifier runs the live title through `cartup_name()` before comparing, so this is not
  drift. Do not "fix" it by changing the site copy.
- **CartUp rejects two things learned the hard way, both now verifier-enforced:** `#` in
  either name column (rewritten to `No.`), and **text** in the Special Start/End Date
  columns — those need real Excel dates (serial + date number format) on BOTH sheets, even
  though the validation message quotes `dd/mm/yyyy hh:mm`. That string is the display
  format, not the storage format.
- **`xl/styles.xml` is now a patched part** (four total: product sheet, sharedStrings,
  payload sheet, styles) because the template ships no `<numFmts>` and needed a date format
  added.
- **A stale download looks exactly like an unfixed bug.** `verify_cartup_sheet.py` prints
  the approved file's path, build time, size and sha256 — check the upload matches.
- **`payload_hidden` is the sheet that matters.** The visible `product` sheet can be
  flawless and the upload will still import nothing if the payload has no cached values.
  `verify_cartup_sheet.py` prints `payload_hidden (what CartUp actually imports): N/N rows
  carry values` — if that ever reads 0/N, do not upload. Negative-tested: an uncomputed
  payload produces 377 verifier failures.
- `compute_payload()` derives its column mapping by **parsing the row-2 formulas**, not from
  a hard-coded table, so a revised template errors out rather than mis-mapping silently.
- Everything else from `2026-07-27-cartup-marketplace-upload.md` still applies (openpyxl
  hazard, dropdown validation, `DCBD-` prefix, live API as source, age-grade mapping).
