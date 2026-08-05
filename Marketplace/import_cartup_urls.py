#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Pull CartUp image URLs out of a workbook you've edited in CartUp / Excel / Google Sheets
and merge them into `cartup-image-urls.csv`, the durable record the generator reads.

    python3 Marketplace/import_cartup_urls.py "<workbook CartUp gave you back>.xlsx"

Why this exists: after uploading photos in the CartUp dashboard you get back a sheet with
`https://cdn.cartup.com/product/<uuid>.webp` URLs in the image columns. Those URLs are the
only thing worth keeping from that file — the round-trip through Google Sheets/Excel
mangles the workbook itself (see README, "Never edit the workbook outside these scripts").
So: harvest the URLs here, then re-run build_cartup_sheet.py to get a clean workbook with
them in place. The source file can live anywhere; nothing keeps a copy of it.

Merges rather than overwrites — a URL already on file is kept unless the imported sheet
has a different one, which is reported rather than applied silently.
"""

import csv
import os
import sys

import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
URLS_CSV = os.path.join(HERE, "cartup-image-urls.csv")

SELLER_SKU_COLUMN = "AE"
# workbook column -> CartUp image slot
IMAGE_COLUMNS = {"C": 1, "D": 2, "E": 3, "F": 4, "G": 5, "H": 6, "I": 7, "J": 8}
FIRST_DATA_ROW = 3


def load_existing():
    if not os.path.exists(URLS_CSV):
        return {}
    with open(URLS_CSV, newline="", encoding="utf-8") as handle:
        return {
            (row["sellerSku"], int(row["position"])): (row.get("url") or "").strip()
            for row in csv.DictReader(handle)
        }


def main():
    if len(sys.argv) != 2:
        raise SystemExit(__doc__.strip())
    source = sys.argv[1]
    if not os.path.exists(source):
        raise SystemExit("Not found: %s" % source)

    sheet = openpyxl.load_workbook(source, data_only=True)["product"]

    found = {}
    row_number = FIRST_DATA_ROW
    while sheet["%s%d" % (SELLER_SKU_COLUMN, row_number)].value not in (None, ""):
        seller_sku = str(sheet["%s%d" % (SELLER_SKU_COLUMN, row_number)].value).strip()
        for column, position in IMAGE_COLUMNS.items():
            url = sheet["%s%d" % (column, row_number)].value
            url = str(url).strip() if url not in (None, "") else ""
            if url:
                found[(seller_sku, position)] = url
        row_number += 1

    if not found:
        raise SystemExit("No image URLs found in %s." % os.path.basename(source))

    existing = load_existing()
    added, conflicts, duplicates = [], [], []

    for key, url in sorted(found.items()):
        current = existing.get(key, "")
        if current == url:
            continue
        if current:
            conflicts.append((key, current, url))
            continue
        # One CartUp image must never sit on two products. This is exactly how the
        # HWFF-005 / HWPC-001 mix-up presented: one photo claimed by two SKUs, one of
        # which was therefore wrong. Refuse it rather than silently re-introducing it.
        owner = next((k for k, v in existing.items() if v == url and k != key), None)
        if owner:
            duplicates.append((key, url, owner))
            continue
        existing[key] = url
        added.append(key)

    keys = sorted(existing, key=lambda k: (k[0], k[1]))
    with open(URLS_CSV, "w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["sellerSku", "position", "url"])
        for seller_sku, position in keys:
            writer.writerow([seller_sku, position, existing[(seller_sku, position)]])

    print("Read %d URLs from %s." % (len(found), os.path.basename(source)))
    print("Added %d new; %s now holds %d URLs across %d products."
          % (len(added), os.path.basename(URLS_CSV),
             sum(1 for v in existing.values() if v), len({k[0] for k in keys})))
    for (seller_sku, position), current, incoming in conflicts:
        print("  CONFLICT %s slot %d — kept %s, sheet had %s"
              % (seller_sku, position, current, incoming))
    for (seller_sku, position), url, owner in duplicates:
        print("  SKIPPED  %s slot %d — that image is already %s slot %d. One photo cannot "
              "belong to two products; upload the correct one for %s."
              % (seller_sku, position, owner[0], owner[1], seller_sku))

    missing = sorted({k[0] for k in keys} - {k[0] for k, v in existing.items() if v and k[1] == 1})
    if missing:
        print("\nStill no image: %s" % ", ".join(missing))
    print("\nNow re-run build_cartup_sheet.py, then verify_cartup_sheet.py.")


if __name__ == "__main__":
    main()
