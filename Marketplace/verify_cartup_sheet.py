#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verify the filled CartUp workbook before uploading.

    python3 Marketplace/verify_cartup_sheet.py

Checks, in the order that matters:
  1. Structure  — every zip part except the two we patch is byte-identical to the
                  template, and payload_hidden's formulas survived intact.
  2. Dropdowns  — every value written to a validated column exists verbatim in
                  value_hidden. A single mismatch makes payload_hidden return #N/A
                  and the import fails.
  3. Mandatory  — all ** and * columns are populated (images excepted, they need
                  CartUp ImageKeys).
  4. Types      — weight/dimensions/stock/price are numeric cells, not text.
  5. Policy     — Seller SKU uniqueness, special-price rules, 2 MB size limit.
  6. Live data  — titles, stock and prices still match the live catalogue.

Exit code 0 = safe to upload.
"""

import datetime
import hashlib
import json
import os
import re
import sys
import time
import urllib.request
import zipfile

import openpyxl

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_cartup_sheet as build  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
TEMPLATE = build.TEMPLATE
OUTPUT = build.OUTPUT

PATCHED_PARTS = {"xl/worksheets/sheet1.xml", "xl/sharedStrings.xml",
                 "xl/worksheets/sheet3.xml", "xl/styles.xml"}

# payload_hidden column -> the product-sheet column it mirrors. CartUp's importer reads
# payload_hidden, so if these are blank the upload fails with "No products were found in
# your excel upload" no matter how complete the visible sheet looks.
PAYLOAD_MIRRORS = {"A": "A", "AE": "AE", "AF": "AF", "AH": "AH", "AI": "AI", "C": "C", "AG": "AG"}
PAYLOAD_RESOLVED = {"L": "Brand", "M": "Unit", "O": "Recommended Age",
                    "P": "Main Materials", "X": "Warranty Type", "AD": "Color"}

# column letter -> (label, value_hidden column holding the allowed values)
VALIDATED = {
    "L": ("Brand", "A"),
    "M": ("Unit", "C"),
    "O": ("Recommended Age", "E"),
    "P": ("Main Materials", "G"),
    "X": ("Warranty Type", "I"),
    "AD": ("Color", "M"),
}

MANDATORY = {
    "A": "Name (English)", "L": "Brand", "M": "Unit",
    "Z": "Package Weight (kg)", "AA": "Package Length (cm)",
    "AB": "Package Width (cm)", "AC": "Package Height (cm)",
    "AD": "Color", "AE": "Seller SKU", "AF": "Parent SKU",
    "AH": "Current Stock Qty", "AI": "Price (MRP)",
    "O": "Recommended Age", "P": "Main Materials",
}

VALIDATED_ORDER = ["Brand", "Unit", "Recommended Age", "Main Materials", "Warranty Type", "Color"]

IMAGE_COLUMNS = {"C": "Product Image 1", "AG": "Variant Image"}

NUMERIC_COLUMNS = {
    "Z": "Package Weight (kg)", "AA": "Package Length (cm)",
    "AB": "Package Width (cm)", "AC": "Package Height (cm)",
    "AH": "Current Stock Qty", "AI": "Price (MRP)",
}

failures = []
warnings = []


def check(condition, message):
    if not condition:
        failures.append(message)
    return condition


def main():
    if not os.path.exists(OUTPUT):
        raise SystemExit("Not found: %s — run build_cartup_sheet.py first." % OUTPUT)

    # ---------------------------------------------------------------- 1. structure
    with zipfile.ZipFile(TEMPLATE) as src, zipfile.ZipFile(OUTPUT) as out:
        src_names, out_names = src.namelist(), out.namelist()
        check(src_names == out_names, "Zip entry list or order changed.")
        for name in set(src_names) & set(out_names):
            if name in PATCHED_PARTS:
                continue
            check(src.read(name) == out.read(name), "Part modified unexpectedly: %s" % name)
        payload = out.read("xl/worksheets/sheet3.xml").decode("utf-8")
        check("<f>=IF(" in payload, "payload_hidden formulas were corrupted.")
        check(
            payload.count("<f>=IF(") == src.read("xl/worksheets/sheet3.xml").decode("utf-8").count("<f>=IF("),
            "payload_hidden formula count changed.",
        )
        check("#ERROR" not in payload and "#N/A" not in payload and "#NAME" not in payload,
              "payload_hidden contains cached formula errors — the file has been opened and "
              "saved by a spreadsheet app. Rebuild from the template; do not upload this.")

    size_mb = os.path.getsize(OUTPUT) / 1024.0 / 1024.0
    check(size_mb < 2.0, "File is %.2f MB — over CartUp's 2 MB limit." % size_mb)

    # ------------------------------------------------------------------ load sheets
    workbook = openpyxl.load_workbook(OUTPUT, data_only=True)
    product = workbook["product"]
    values = workbook["value_hidden"]

    def lookup_table(column_letter):
        """value_hidden Name -> Value, first match wins, exactly like payload_hidden's VLOOKUP."""
        name_index = openpyxl.utils.column_index_from_string(column_letter)
        table = {}
        for row in range(2, values.max_row + 1):
            name = values.cell(row, name_index).value
            if name is not None and name not in table:
                table[name] = values.cell(row, name_index + 1).value
        return table

    def cell(column_letter, row):
        return product["%s%d" % (column_letter, row)]

    first = build.FIRST_DATA_ROW
    rows = []
    row_number = first
    while cell("A", row_number).value not in (None, ""):
        rows.append(row_number)
        row_number += 1
    print("Data rows: %d (rows %d-%d)" % (len(rows), first, rows[-1] if rows else first))

    check(len(rows) > 0, "No data rows found.")
    check(
        cell("A", rows[-1] + 1).value in (None, ""),
        "Row %d has data after the last contiguous row — a gap would truncate the import." % (rows[-1] + 1),
    )

    # ---------------------------------------------------------------- 2. dropdowns
    # There is no Excel here to recalculate payload_hidden, so resolve each value the
    # same way its VLOOKUP would and report the ids. Anything unresolvable is the #N/A
    # that would fail the import.
    resolved = {}
    for column_letter, (label, source_column) in VALIDATED.items():
        table = lookup_table(source_column)
        for row in rows:
            value = cell(column_letter, row).value
            if check(
                value in table,
                "Row %d %s: %r is not in CartUp's dropdown (payload_hidden would be #N/A)." % (row, label, value),
            ):
                resolved.setdefault(label, {})[value] = table[value]

    print("\npayload_hidden would resolve:")
    for label in VALIDATED_ORDER:
        if label in resolved:
            pairs = ", ".join("%s=%s" % (name, id_) for name, id_ in sorted(resolved[label].items()))
            print("  %-16s %s" % (label + ":", pairs))

    # ---------------------------------------------------------------- 3. mandatory
    # The required list is not hard-coded — it is re-derived from the template's own
    # header markers every run, so a template revision cannot silently widen it.
    template = openpyxl.load_workbook(TEMPLATE, data_only=True)["product"]
    required = {}
    for column in range(1, template.max_column + 1):
        header = str(template.cell(2, column).value or "")
        if header.startswith("*"):
            required[openpyxl.utils.get_column_letter(column)] = header.lstrip("*")
    unexpected = set(required) - set(MANDATORY) - set(IMAGE_COLUMNS)
    check(not unexpected,
          "Template marks columns %s as required but this script does not check them."
          % sorted(unexpected))

    missing_images = {label: 0 for label in IMAGE_COLUMNS.values()}
    filled = {column: 0 for column in required}
    for row in rows:
        for column_letter in required:
            if cell(column_letter, row).value not in (None, ""):
                filled[column_letter] += 1
        for column_letter, label in MANDATORY.items():
            value = cell(column_letter, row).value
            check(value not in (None, ""), "Row %d: mandatory %s is empty." % (row, label))
        for column_letter, label in IMAGE_COLUMNS.items():
            if cell(column_letter, row).value in (None, ""):
                missing_images[label] += 1
    for label, count in missing_images.items():
        if count:
            failures.append(
                "%s empty on %d/%d rows — CartUp rejects rows without it. Upload the photo "
                "in CartUp, then import_cartup_urls.py and rebuild." % (label, count, len(rows))
            )

    # Product Image 1 and Variant Image must be the same photo, and no photo may be
    # shared between two products (that is how the HWFF-005 / HWPC-001 mix-up showed up).
    seen_image = {}
    for row in rows:
        image1, variant = cell("C", row).value, cell("AG", row).value
        if image1 not in (None, ""):
            check(image1 == variant,
                  "Row %d: Variant Image does not match Product Image 1." % row)
            if image1 in seen_image:
                failures.append("Rows %d and %d share the same image — one of them is wrong."
                                % (seen_image[image1], row))
            seen_image[image1] = row

    # ------------------------------------------------- 3b. CartUp's content rules
    # Learned from a rejected upload ("Upload Issues - Cartup.xlsx"): CartUp refuses "#"
    # in either name column. It does NOT object to "#" in descriptions or What's-in-the-box,
    # so the rule is deliberately scoped to A and B rather than applied sheet-wide.
    # Checked on BOTH sheets: the visible one because that is what gets edited, and
    # payload_hidden because that is what CartUp actually imports.
    payload = workbook["payload_hidden"]
    for row in rows:
        for column_letter, label in (("A", "Name (English)"), ("B", "Name (Bengali)")):
            for value, where in ((cell(column_letter, row).value, "product"),
                                 (payload["%s%d" % (column_letter, row - 1)].value, "payload_hidden")):
                if value in (None, ""):
                    continue
                check("#" not in value,
                      "Row %d %s (%s) contains '#', which CartUp rejects: %r"
                      % (row, label, where, value))

    # -------------------------------------------------------------------- 4. types
    for row in rows:
        for column_letter, label in NUMERIC_COLUMNS.items():
            value = cell(column_letter, row).value
            check(
                isinstance(value, (int, float)),
                "Row %d %s: %r is %s, must be a number." % (row, label, value, type(value).__name__),
            )

    # ------------------------------------------------------------------- 5. policy
    seller_skus = [cell("AE", row).value for row in rows]
    check(len(seller_skus) == len(set(seller_skus)), "Duplicate Seller SKU — must be unique.")

    parent_skus = [cell("AF", row).value for row in rows]
    duplicated_parents = {p for p in parent_skus if parent_skus.count(p) > 1}
    if duplicated_parents:
        warnings.append(
            "Shared Parent SKU %s — CartUp will merge these rows into one product's variants."
            % sorted(duplicated_parents)
        )

    for row in rows:
        special = cell("AJ", row).value
        start, end = cell("AK", row).value, cell("AL", row).value
        if special in (None, ""):
            check(
                start in (None, "") and end in (None, ""),
                "Row %d: special price dates set without a special price." % row,
            )
            continue
        mrp = cell("AI", row).value
        check(special < mrp, "Row %d: special price %s is not below MRP %s." % (row, special, mrp))
        check(special >= mrp * 0.25, "Row %d: special price exceeds the 75%% max discount." % row)
        check(start not in (None, "") and end not in (None, ""), "Row %d: special price needs both dates." % row)
        # Must be REAL dates on both sheets, not text. CartUp answered "Special StartAt
        # should be a valid date." to every row when these were written as
        # dd/mm/yyyy hh:mm strings — the column carries an Excel date validation, so the
        # display format is not the storage format.
        for column_letter, label in (("AK", "Special Start Date"), ("AL", "Special End Date")):
            for value, where in ((cell(column_letter, row).value, "product"),
                                 (payload["%s%d" % (column_letter, row - 1)].value, "payload_hidden")):
                check(isinstance(value, datetime.datetime),
                      "Row %d %s (%s) is %s %r, not a real date — CartUp rejects text here."
                      % (row, label, where, type(value).__name__, value))
        check(start < end, "Row %d: special price starts after it ends." % row)

    # -------------------------------------------------- 6. payload_hidden is computed
    # This is the sheet CartUp's importer actually reads. Its formulas only get values
    # when a spreadsheet app recalculates, which this build never does — so the values
    # are computed and written directly. If that step regressed, every cell here would be
    # an empty formula and CartUp would answer "No products were found in your excel
    # upload" while the visible sheet looked perfect. Hence: check it, every run.
    payload_sheet = workbook["payload_hidden"]
    payload_first = first - 1  # payload row 2 mirrors product row 3

    def payload_cell(column_letter, product_row):
        return payload_sheet["%s%d" % (column_letter, product_row - 1)].value

    for row in rows:
        for payload_column, product_column in PAYLOAD_MIRRORS.items():
            got, want = payload_cell(payload_column, row), cell(product_column, row).value
            check(got == want,
                  "payload_hidden %s%d is %r but product %s%d is %r — the payload sheet is "
                  "not computed; CartUp would import nothing."
                  % (payload_column, row - 1, got, product_column, row, want))
        for payload_column, label in PAYLOAD_RESOLVED.items():
            got = payload_cell(payload_column, row)
            check(isinstance(got, (int, float)),
                  "payload_hidden %s%d (%s) is %r, expected a numeric id."
                  % (payload_column, row - 1, label, got))

    blank_after = payload_cell("A", rows[-1] + 1)
    check(blank_after in (None, ""),
          "payload_hidden has data past the last product row (%r)." % blank_after)

    computed = sum(1 for row in rows if payload_cell("A", row) not in (None, ""))
    print("payload_hidden (what CartUp actually imports): %d/%d rows carry values, rows %d-%d."
          % (computed, len(rows), payload_first, rows[-1] - 1))

    # ---------------------------------------------------------------- 7. live data
    with urllib.request.urlopen(build.API_URL, timeout=60) as response:
        live = {p["sku"]: p for p in json.load(response)["data"]}

    for row in rows:
        seller_sku = cell("AE", row).value
        sku = seller_sku[len(build.SKU_PREFIX):]
        product_data = live.get(sku)
        if not check(product_data is not None, "Row %d: %s is not in the live catalogue." % (row, sku)):
            continue
        check(
            cell("A", row).value == build.cartup_name(product_data["title"]),
            "Row %d: title drifted from live catalogue (%r vs %r)."
            % (row, cell("A", row).value, build.cartup_name(product_data["title"])),
        )
        check(
            cell("AH", row).value == product_data["stock"],
            "Row %d %s: stock %s != live %s." % (row, sku, cell("AH", row).value, product_data["stock"]),
        )
        expected_mrp = build.listed_price(product_data["price"])
        check(
            cell("AI", row).value == expected_mrp,
            "Row %d %s: MRP %s != expected %s." % (row, sku, cell("AI", row).value, expected_mrp),
        )
        if build.SPECIAL_PRICES and build.MRP_UPLIFT > 1.0:
            expected_special = build.marketplace_price(product_data["price"])
            check(
                cell("AJ", row).value == expected_special,
                "Row %d %s: special price %s != expected %s (this is what you get paid)."
                % (row, sku, cell("AJ", row).value, expected_special),
            )

    live_cars = {s for s in live if not s.startswith(build.EXCLUDE_PREFIXES)}
    sheet_cars = {s[len(build.SKU_PREFIX):] for s in seller_skus}
    missing = live_cars - sheet_cars
    check(not missing, "Live catalogue SKUs missing from the sheet: %s" % sorted(missing))

    # ------------------------------------------------------------------- report
    print("\nRequired fields (%d marked * or ** in the template), across %d rows:"
          % (len(required), len(rows)))
    for column_letter in sorted(required, key=openpyxl.utils.column_index_from_string):
        count = filled[column_letter]
        print("  %-3s %-24s %d/%d%s" % (column_letter, required[column_letter][:24],
                                        count, len(rows), "" if count == len(rows) else "   <-- MISSING"))

    print()
    for warning in warnings:
        print("  warn  %s" % warning)
    if failures:
        print()
        for failure in failures:
            print("  FAIL  %s" % failure)
        print("\n%d check(s) failed." % len(failures))
        return 1

    # Stamp the exact file, so a stale download is obvious rather than looking like a
    # rule that "was not fixed" — upload the file described on this line, nothing else.
    stamp = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(os.path.getmtime(OUTPUT)))
    with open(OUTPUT, "rb") as handle:
        digest = hashlib.sha256(handle.read()).hexdigest()[:12]

    print("\nAll checks passed. Ready to upload:")
    print("  %s" % OUTPUT)
    print("  built %s · %.2f MB · sha256 %s" % (stamp, size_mb, digest))
    return 0


if __name__ == "__main__":
    sys.exit(main())
