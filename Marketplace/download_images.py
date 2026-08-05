#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Download every product photo from Cloudinary, renamed by Seller SKU, ready to drag
into CartUp's image uploader.

    python3 Marketplace/download_images.py

Reads  : Marketplace/image-map.csv   (written by build_cartup_sheet.py)
Writes : Marketplace/images/DCBD-<SKU>-<n>.<ext>

CartUp's policy sheet requires the ImageKey from an upload batch made inside their
dashboard, so the workbook's image columns cannot be filled from our Cloudinary URLs
directly. The flow is: run this, bulk-upload Marketplace/images/ in CartUp, download
their ImageKey batch, then run splice_image_keys.py.

Files are fetched at full resolution — the delivery transforms the storefront applies
(c_limit,w_800 and friends) are deliberately not used, since CartUp should get the
originals.
"""

import csv
import os
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
IMAGE_MAP = os.path.join(HERE, "image-map.csv")
IMAGE_DIR = os.path.join(HERE, "images")


def main():
    if not os.path.exists(IMAGE_MAP):
        raise SystemExit("Not found: %s — run build_cartup_sheet.py first." % IMAGE_MAP)

    os.makedirs(IMAGE_DIR, exist_ok=True)

    with open(IMAGE_MAP, newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))

    downloaded = skipped = 0
    for row in rows:
        target = os.path.join(IMAGE_DIR, row["localFile"])
        if os.path.exists(target):
            skipped += 1
            continue
        try:
            with urllib.request.urlopen(row["cloudinaryUrl"], timeout=60) as response:
                data = response.read()
        except Exception as error:  # noqa: BLE001 — report and keep going
            print("  FAILED %s: %s" % (row["localFile"], error))
            continue
        with open(target, "wb") as out:
            out.write(data)
        downloaded += 1
        print("  %s (%.0f KB)" % (row["localFile"], len(data) / 1024.0))

    by_sku = {}
    for row in rows:
        by_sku.setdefault(row["sellerSku"], []).append(row)
    single = sorted(sku for sku, images in by_sku.items() if len(images) == 1)

    print("\nDownloaded %d, already present %d, total %d images across %d products."
          % (downloaded, skipped, len(rows), len(by_sku)))
    if single:
        print("\nOnly one photo on these %d products — worth shooting a second angle "
              "before listing:" % len(single))
        for sku in single:
            print("  %s" % sku)


if __name__ == "__main__":
    main()
