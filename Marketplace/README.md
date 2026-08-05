# CartUp marketplace upload

Tooling to fill CartUp's **Die-Cast Vehicles** bulk-upload workbook from the live
diecastbd.com catalogue. Nothing here touches `frontend/`, `backend/`, or the live
site — the only network calls are read-only GETs to the public products API and
Cloudinary.

## Files

| File | What it is |
|---|---|
| `Die-Cast Vehicles Product - DiecastBD.xlsx` | **The filled workbook — the only file you upload.** The one workbook in this folder |
| `template/Die-Cast Vehicles Product.xlsx` | CartUp's pristine empty template. Not a duplicate — every build is cut from it, and verify diffs against it. **Never edit.** |
| `cartup-image-urls.csv` | **Durable record of what's uploaded to CartUp's media library.** Seller SKU → slot → CDN URL |
| `build_cartup_sheet.py` | Generator: live API + `cartup-image-urls.csv` → workbook |
| `verify_cartup_sheet.py` | Pre-upload gate. Exit 0 = safe |
| `import_cartup_urls.py` | Harvests CDN URLs out of a workbook CartUp gave you back, into `cartup-image-urls.csv` |
| `download_images.py` | Pulls product photos from Cloudinary into `images/`, renamed by Seller SKU, ready to upload |
| `cartup_copy.py` | Hand-authored Bengali copy, colour mappings, and the official sources cited in the descriptions |
| `image-map.csv` | Seller SKU → Cloudinary URL → local file (which photos exist to upload) |
| `cartup-brand-request.md` | Message to send CartUp support |

Requires Python 3 and `openpyxl` (present in the system Python; the generator itself is
stdlib-only).

## Normal loop

```bash
cd /Users/niaz/Documents/Ecom/DieCastBD

python3 Marketplace/build_cartup_sheet.py      # live data + known image URLs -> workbook
python3 Marketplace/verify_cartup_sheet.py     # exit 0 = upload it
```

Re-run both any time prices, stock, or the catalogue change. The generator is the only
thing that writes the workbook.

## Adding images

CartUp's image columns hold `https://cdn.cartup.com/product/<uuid>.webp` URLs that their
own media library issues. (Their policy sheet calls these "ImageKeys" — there is no
separate opaque key, the URL *is* the value.) You cannot use Cloudinary URLs directly;
the photo has to be uploaded inside CartUp first.

```bash
python3 Marketplace/download_images.py         # Cloudinary -> Marketplace/images/
```

1. Upload the files you need from `Marketplace/images/` in the CartUp dashboard.
2. Harvest the URLs from the sheet CartUp gives back (it can sit anywhere — nothing keeps
   a copy of it) and rebuild:

```bash
python3 Marketplace/import_cartup_urls.py "<workbook CartUp gave you back>.xlsx"
python3 Marketplace/build_cartup_sheet.py
python3 Marketplace/verify_cartup_sheet.py
```

**Variant Image (col AG) is filled automatically** with slot 1's URL — each product has a
single variant, so the product image and the variant image are always the same photo. The
verifier fails if they ever diverge.

### Never edit the workbook outside these scripts

The file that came back from CartUp had been through Google Sheets, and it arrived with:

- **19,500 `#ERROR!` cells** cached across `payload_hidden` — every formula on the sheet
  CartUp's importer maps against, broken;
- **all 16 dropdown validations stripped**;
- `value_hidden` flipped from `veryHidden` to `hidden`, and the sheet padded to 1,000 rows.

Google Sheets and Excel both choke on this template because CartUp encodes its formulas as
`<f>=IF(...)</f>` — with a leading `=` *inside* the element, which isn't valid OOXML. The
pristine template has those formulas with **no cached values at all**, which is the state
CartUp ships and the state the generator preserves.

So the rule is: harvest URLs from a returned sheet with `import_cartup_urls.py`, then
regenerate. Don't hand-edit and don't upload a round-tripped file.

## What's in the sheet

29 products — the live catalogue minus `ACC-001/002/003` (card protectors, which are not
die-cast vehicles and need a different category template).

Pricing runs in two layers, both rounded to ৳10:

| | Formula | Example (HWCC-009, site ৳1,960) |
|---|---|---|
| **Special Price** (AJ) — what you're paid | site × `MARKUP` (1.14) | ৳2,230 |
| **Price / MRP** (AI) — the struck-through "was" | special × `MRP_UPLIFT` (1.07) | ৳2,390 |

`MARKUP` absorbs CartUp's seller commission; `MRP_UPLIFT` sits above it so every listing
shows a discount. Catalogue value at current stock: site ৳85,335 → **paid ৳97,270**
(+৳11,935). The displayed discount lands at 6.5–6.7% rather than exactly 7%, because both
figures round to ৳10 independently.

Set `MRP_UPLIFT = 1.0` to drop the promo and sell flat at the markup price.

Every field the template allows is filled except the video URL (none exist), Warranty
Period (no warranty is offered), and Free Items.

## Status

**All 29 products have an image and `verify_cartup_sheet.py` exits 0 — the workbook is
ready to upload.**

One image had been mis-assigned: the CartUp sheet had the **2021 Toyota GR Supra** photo on
`HWPC-001`'s row (Cyberpunk 2077) while `HWFF-005` — which *is* the GR Supra — had none.
Moved to its real owner, and HWPC-001 now has its own Cyberpunk card
(`58423d79…`, card art reads `HXD63`, matching the product's model number).
`import_cartup_urls.py` and `verify_cartup_sheet.py` both now refuse to let one photo be
claimed by two products.

## Outstanding

### 1. HWF1-002 is listed as #6 but the card is #30

Confirmed from the CartUp photo at full resolution: the card reads **30** with model number
**HRV11**, and the car carries 30 on the nose. #30 is Liam Lawson; **#6 is Isack Hadjar**.
The product title, slug and Bengali copy on diecastbd.com all say #6.

The merchant has confirmed it's a **single car, not a 2-car set** (the site's own photos show
a two-car boxed set, which is separately misleading).

Fixing this properly means correcting it on diecastbd.com first — the generator takes titles
straight from the live API and `verify_cartup_sheet.py` fails if the sheet drifts from it —
then re-running `build_cartup_sheet.py`. Until then the marketplace listing carries the same
#6 as the site.

### 2. Second photos are all unused

21 products have a second photo on file (`images/DCBD-*-2.*`) and none has been uploaded to
CartUp. Product Image 2 (col D) is empty on every row. Upload them the same way to make the
listings richer.

Separately, **8 products only ever had one photo** — `HW5P-002, HWCC-004, HWCC-009,
HWCC-011, HWCC-012, HWCC-013, HWFF-005, MGT-1094` — worth shooting a second angle.

### 3. Brand is set to "No Brand"

CartUp's Brand dropdown has 3,402 entries and **none is Hot Wheels, Mattel, MINI GT, or
TSM**. Brand is a mandatory dropdown-validated field, so `No Brand` is the only value that
both validates and isn't misleading. The real brand still appears in every title, tag list,
and description. Send `cartup-brand-request.md`; once they add the brands, change `BRAND` in
`build_cartup_sheet.py` and re-run.

### 4. The promo window expires 28/07/2027

`SPECIAL_START` / `SPECIAL_END` in `build_cartup_sheet.py` currently run 28/07/2026 to
28/07/2027. **When it lapses, every listing jumps from the special to the 7%-higher MRP.**
Extend it and re-run before then.

The dates are real Excel dates — a serial number in a cell carrying a date number format,
which is what the columns' `type="date"` validation requires. Writing them as
`dd/mm/yyyy hh:mm` **text** was tried first and CartUp rejected all 29 rows with *"Special
StartAt should be a valid date."* If they ever cause trouble again, `MRP_UPLIFT = 1.0`
drops the promo entirely and sells flat at the markup price.

Note the site's own sale prices (HW5P-001, HWCC-007, HWF1-002) are **not** mirrored here —
CartUp's special price is the pricing model, not a reflection of site promotions. All 29
products are priced off the site's regular price.

## CartUp's content rules

Learned from rejected uploads. `verify_cartup_sheet.py` enforces each one, so a regression
fails locally instead of at CartUp.

| Rule | Where it applies | How it's handled |
|---|---|---|
| Names cannot contain `#` | Name (English), Name (Bengali) | `#` becomes `No.` — `MINI GT No.1022`, `Ferrari SF-25 No.44`. Set by `HASH_REPLACEMENT` in `build_cartup_sheet.py` |
| Special dates must be **real dates**, not text | Special Start/End Date | Written as Excel date serials carrying a `dd/mm/yyyy hh:mm` number format, on both the product sheet and payload_hidden. `dd/mm/yyyy hh:mm` is the *display* format the column's validation message quotes — not the storage format |

`#` is fine in Description and What's-in-the-box — CartUp flagged only the name columns —
so the rewrite is deliberately scoped to those two rather than applied sheet-wide.

**Marketplace titles therefore differ slightly from diecastbd.com titles** for the seven
products carrying a collector or race number: HWCC-003, HWF1-001, HWF1-002, MGT-1022,
MGT-1046, MGT-1094, MGT-1106. That divergence is intentional and the verifier accounts for
it when comparing against the live API.

## CartUp reads the hidden sheet, so it has to be computed

**This is what "No products were found in your excel upload" means.**

CartUp's importer reads `payload_hidden`, not the visible `product` sheet. Every cell there
is a formula that either mirrors a product cell or VLOOKUPs one into a `value_hidden` table
— `Brand` → `519`, `Color` → `561`, and so on. Those formulas only acquire values when a
spreadsheet application recalculates on save.

This build never opens one. So the generator computes all 19,500 payload results itself and
writes them as cached `<v>` values alongside the untouched `<f>` formulas. Without that step
the visible sheet looks perfect and CartUp imports nothing.

`verify_cartup_sheet.py` checks it every run — it compares payload_hidden row *n−1* against
product row *n* for the key columns and requires the six dropdown columns to hold numeric
ids. It also fails if the payload holds cached `#ERROR!` / `#N/A` / `#NAME`, which is the
signature of a file that has been opened and saved by a spreadsheet app.

## Why the generator does XML surgery instead of using openpyxl

1. The template stores its formulas as `<f>=IF(product!A3&lt;&gt;"",...)</f>`, with a
   leading `=` *inside* the `<f>` element. openpyxl reads that as `"==IF(...)"` and writes
   it back verbatim, corrupting all 500 × 39 payload formulas. (Google Sheets goes further
   and caches `#ERROR!` into every one — see above.)
2. The template carries a `legacyDrawing` (`vmlDrawing1.vml` + `comments1.xml`) holding the
   per-column help notes, which openpyxl drops on save.

So the generator unzips the template, patches exactly three parts —
`xl/worksheets/sheet1.xml` (product), `xl/sharedStrings.xml`, and `xl/worksheets/sheet3.xml`
(payload) — and rezips every other part byte-identical. `verify_cartup_sheet.py` asserts
that byte-identity and that the payload formulas survived. openpyxl is used to *read* the
template's lookup tables; reading is safe, it is never used to write.

Rows 3–503 already exist in the template, fully styled, with every cell as
`<c r="A3" s="8" t="s"><v>46</v></c>` (shared-string 46 is `""`), so filling a cell is a
pure substitution — no rows or cells are inserted.

## Field mapping decisions

| Column | Value | Why |
|---|---|---|
| Recommended Age | `10 Years+` (Hot Wheels), `18 Years+` (MINI GT) | Mattel's official grade is 3+ and TSM's is 14+. CartUp has neither bucket. For Hot Wheels, 10+ is a subset of 3+ and stops ৳2,000 collector pieces surfacing as toddler toys. For MINI GT the next value **up** is used — never understate a safety age grade. Both official grades are stated verbatim in the description. |
| Main Materials | `Alloy` | Diecast bodies are zinc alloy. `Metal` and `Zinc` are also available but `Alloy` is the precise one. |
| Unit | `PCS` | Sold per piece, including the sealed 5-packs (one pack = one unit). |
| Warranty Type | `No Warranty` | Factually correct — no manufacturer or seller warranty exists on sealed collectibles. The policy text states authenticity and inspection only, and promises no repair or return. |
| Color | Dominant body colour | CartUp's colour list has no "as pictured" option and won't accept livery descriptions like `Blue (HKS livery)`. Multi-tone liveries map to the dominant body colour; only the F1 5-pack (five different cars) maps to `Multicolor`. |
| Seller SKU / Parent SKU | `DCBD-<SKU>` | CartUp requires Seller SKU to be unique across their **whole system**, so a bare `HWCC-009` risks colliding with another seller. Each product stands alone, so Parent SKU = Seller SKU (a shared Parent SKU would merge rows into one product's variants). |
| Package weight | product weight + 65–120 g | `specifications.Weight` is the product; CartUp bills delivery on the shipped parcel, so a packing allowance is added per packaging class. |
| Package dimensions | outer shipping size | Not the bare card — see `cartup_copy.SOURCES` for the official packaging measurements these derive from. |

## Data source

The live public API, **not** `docs/Inventory.md` (its retail column is pre-23-Jul and stale)
and not `backend/src/seeds/data/catalog.data.js` (no images, no live stock, no sale prices):

```
https://api.diecastbd.com/api/v1/products?limit=100
```

`verify_cartup_sheet.py` re-fetches it and fails if any title, stock figure, or price in the
sheet has drifted from live. If the API is ever down, `backend/scripts/catalog-diff.mjs
--backup-only` writes an equivalent dump to `backend/backups/`.

All English product copy is the owner's own text from the live catalogue. The Bengali copy in
`cartup_copy.py` is a rendering of that same text — brand, series, casting and livery names
stay in Latin script, which is how Bangladeshi collectors search. The facts appended to each
description (scale, construction, packaging, age grade) come from the sources cited in
`cartup_copy.SOURCES`. Nothing is invented.
