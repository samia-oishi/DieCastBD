#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fill CartUp's "Die-Cast Vehicles Product" bulk-upload template from the live
diecastbd.com catalogue.

    python3 Marketplace/build_cartup_sheet.py

Reads   : Marketplace/template/Die-Cast Vehicles Product.xlsx  (CartUp's template, never modified)
          https://api.diecastbd.com/api/v1/products            (live catalogue, read-only GET)
          Marketplace/cartup-image-urls.csv                    (CartUp media library URLs)
          Marketplace/cartup_copy.py                           (Bengali copy + mappings)
Writes  : Marketplace/Die-Cast Vehicles Product - DiecastBD.xlsx

TWO THINGS THIS FILE EXISTS TO GET RIGHT
----------------------------------------
(1) payload_hidden must be COMPUTED, not just filled.

    CartUp's importer reads `payload_hidden`, not the visible `product` sheet. Every cell
    there is a formula that mirrors a product cell, or VLOOKUPs one into a value_hidden
    table. Those formulas only acquire values when a spreadsheet application recalculates
    on save. This build never opens one — so without compute_payload() below, every cell
    is a formula with no cached value and CartUp answers

        "No products were found in your excel upload."

    while the visible sheet looks perfect. That exact upload failure is why this step
    exists; verify_cartup_sheet.py re-checks it on every run.

(2) The workbook must NOT be round-tripped through a spreadsheet app.

    The template stores its formulas as
        <f>=IF(product!A3&lt;&gt;"",product!A3,"")</f>
    i.e. with a leading "=" *inside* the <f> element, which is not how OOXML normally
    encodes formulas. openpyxl reads that as "==IF(...)" and writes it back verbatim,
    corrupting all 500 x 39 payload formulas. Google Sheets goes further and caches
    #ERROR! into every one of them. The template also carries a legacyDrawing
    (xl/drawings/vmlDrawing1.vml + comments1.xml) with the per-column help notes, which
    openpyxl drops on save.

So: unzip, patch exactly three parts (product sheet, shared strings, payload sheet),
rezip everything else byte-identical. openpyxl is used to READ the template's lookup
tables — reading is safe; it is never used to write.

Rows 3..503 of the product sheet already exist, fully styled, with every cell in the
form <c r="A3" s="8" t="s"><v>46</v></c> (shared-string 46 is the empty string), so
filling a cell is a pure substitution — no rows or cells are inserted.
"""

import csv
import datetime
import json
import os
import re
import shutil
import sys
import urllib.request
import zipfile

import openpyxl

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cartup_copy import (  # noqa: E402
    AUTHENTICITY_BN,
    AUTHENTICITY_EN,
    BN,
    COLOR_MAP,
    FEATURE_BN,
    WARRANTY_BN,
    WARRANTY_EN,
)

# ================================================================================
# Configuration
# ================================================================================

API_URL = "https://api.diecastbd.com/api/v1/products?limit=100"

HERE = os.path.dirname(os.path.abspath(__file__))
# CartUp's pristine, empty template. Not a duplicate of the output — it is the base every
# build is cut from, and what verify diffs against to prove the untouched sheets survived.
# Kept in template/ so the folder root holds exactly one workbook: the one you upload.
TEMPLATE = os.path.join(HERE, "template", "Die-Cast Vehicles Product.xlsx")
OUTPUT = os.path.join(HERE, "Die-Cast Vehicles Product - DiecastBD.xlsx")
IMAGE_MAP = os.path.join(HERE, "image-map.csv")

# Durable record of what has been uploaded to CartUp's media library:
# sellerSku, position (1-8), url. Position 1 also fills the mandatory Variant Image.
# CartUp's uploader hands back plain CDN URLs (https://cdn.cartup.com/product/<uuid>.webp)
# and those go straight into the image columns — despite the policy sheet calling them
# "ImageKeys", there is no separate opaque key. Maintained via import_cartup_urls.py.
CARTUP_IMAGE_URLS = os.path.join(HERE, "cartup-image-urls.csv")

# Pricing, in two layers:
#
#   Special Price (AJ) = live site price x MARKUP   <- what you are actually paid
#   Price / MRP   (AI) = Special Price x MRP_UPLIFT <- the struck-through "was" price
#
# MARKUP absorbs CartUp's seller commission; MRP_UPLIFT sits above it so every listing
# shows a discount. Both round to the nearest ROUND_TO taka. Setting MRP_UPLIFT to 1.0
# turns the promo off (see SPECIAL_PRICES below) and sells at the MARKUP price flat.
MARKUP = 1.14
MRP_UPLIFT = 1.07
ROUND_TO = 10

# Special Price needs BOTH dates or CartUp rejects the row. Configured here as readable
# dd/mm/yyyy hh:mm, but written to the workbook as REAL Excel dates — a serial number
# carrying a date number format — not as text.
#
# Text in that exact format was tried first and CartUp answered "Special StartAt should be
# a valid date." on all 29 rows. Columns AK/AL carry an Excel `type="date"` validation, so
# dd/mm/yyyy hh:mm is the *display* format, not the storage format; the cell has to hold a
# genuine date. Writing text there is what a human typing into Excel could never produce.
#
# Extend the window before it lapses: when it does, listings jump from the special to the
# (7% higher) MRP.
SPECIAL_PRICES = True
SPECIAL_START = "28/07/2026 00:00"
SPECIAL_END = "28/07/2027 23:59"

# Excel's 1900 date system counts days from this epoch (the two-day offset is Excel's
# historical 1900-leap-year bug, which every reader compensates for the same way).
EXCEL_EPOCH = datetime.datetime(1899, 12, 30)
DATE_FORMAT = "%d/%m/%Y %H:%M"

# Seller SKU must be unique across CartUp's whole system (policy sheet), so the bare
# catalogue SKU is prefixed to avoid colliding with another seller's.
SKU_PREFIX = "DCBD-"

# CartUp rejects "#" in Name (English) and Name (Bengali):
#   "Product name in English cannot contain '#'. Please choose a different name."
# It does NOT object to "#" in the descriptions or What's-in-the-box, so only the names
# are rewritten. Seven titles carry a collector or race number — MINI GT #1022,
# Boulevard #150, Ferrari SF-25 #44, VCARB #6 — and dropping the "#" outright would leave
# "SF-25 44", so it becomes "No." instead: "SF-25 No.44", "MINI GT No.1022".
HASH_REPLACEMENT = "No."

# Accessories are not die-cast vehicles — they need a different category template.
EXCLUDE_PREFIXES = ("ACC-",)

# CartUp dropdown values. Every one is verified present in value_hidden; see
# verify_cartup_sheet.py, which re-checks them against the workbook itself.
BRAND = "No Brand"          # CartUp's brand list has no Hot Wheels / Mattel / MINI GT / TSM
UNIT = "PCS"
MATERIAL = "Alloy"          # diecast bodies are zinc alloy
WARRANTY_TYPE = "No Warranty"

# Official manufacturer age grades -> nearest available CartUp bucket.
#   Hot Wheels (Mattel): officially 3 years and up. CartUp has no "3 Years+", and
#     these are ~2,000 BDT collector pieces, so 10 Years+ (a subset of 3+) is used and
#     the official grade is stated verbatim in the description.
#   MINI GT (TSM Models): officially 14 and over. CartUp has no 14+ bucket, so the
#     next value UP is used — never understate a safety age grade.
AGE_HOT_WHEELS = "10 Years+"
AGE_MINI_GT = "18 Years+"

# Packaging classes -> (length, width, height) shipping cm, and packing allowance kg.
# Dimensions are outer shipping size (packaging + mailer), which is what CartUp bills
# delivery on — not the bare card. Sources in cartup_copy.SOURCES.
PACKAGING = {
    # HW Premium blister card 16.5 x 13.3 x 4.3 cm
    "carded": {"dims": (18, 15, 6), "pack_kg": 0.065},
    # MINI GT collector box approx 10 x 4.5 x 3.5 cm
    "mgt_box": {"dims": (13, 9, 6), "pack_kg": 0.075},
    # HW multi-pack approx 25.4 x 17.8 x 5.1 cm
    "five_pack": {"dims": (28, 20, 7), "pack_kg": 0.120},
}

# ================================================================================
# Template layout (verified against the file, not assumed)
# ================================================================================

FIRST_DATA_ROW = 3
LAST_DATA_ROW = 503
EMPTY_SST = 46  # shared-string index of "" that every blank data cell points at

COL = {
    "nameEn": "A", "nameBn": "B",
    "image1": "C", "image2": "D", "image3": "E", "image4": "F",
    "image5": "G", "image6": "H", "image7": "I", "image8": "J",
    "videoUrl": "K", "brand": "L", "unit": "M", "tags": "N",
    "age": "O", "material": "P",
    "highlightsEn": "Q", "highlightsBn": "R",
    "descBn": "S", "descEn": "T", "inTheBox": "U",
    "warrantyEn": "V", "warrantyBn": "W", "warrantyType": "X", "warrantyPeriod": "Y",
    "weightKg": "Z", "lengthCm": "AA", "widthCm": "AB", "heightCm": "AC",
    "color": "AD", "sellerSku": "AE", "parentSku": "AF", "variantImage": "AG",
    "stock": "AH", "price": "AI",
    "specialPrice": "AJ", "specialStart": "AK", "specialEnd": "AL",
    "freeItems": "AM",
}

NUMERIC_FIELDS = {
    "weightKg", "lengthCm", "widthCm", "heightCm", "stock", "price", "specialPrice",
}

# Written as an Excel date serial carrying DATE_NUMFMT, not as text. See SPECIAL_START.
DATE_FIELDS = {"specialStart", "specialEnd"}

# A number format id and a cellXf index, both appended to styles.xml at build time.
# 164 is the first id available to a document (0-163 are Excel's built-ins).
DATE_NUMFMT_ID = 164
DATE_NUMFMT_CODE = "dd/mm/yyyy\\ hh:mm"

# CartUp image slot (1-8) -> workbook field
POSITION_FIELD = {position: "image%d" % position for position in range(1, 9)}


# ================================================================================
# Catalogue -> row mapping
# ================================================================================

def fetch_catalogue():
    with urllib.request.urlopen(API_URL, timeout=60) as resp:
        payload = json.load(resp)
    if not payload.get("success"):
        raise SystemExit("API returned success=false: %s" % payload.get("message"))
    products = payload["data"]
    total = (payload.get("meta") or {}).get("total")
    if total is not None and total != len(products):
        raise SystemExit(
            "Catalogue is paginated (%d of %d returned) — raise the API limit." % (len(products), total)
        )
    return [p for p in products if not p["sku"].startswith(EXCLUDE_PREFIXES)]


def packaging_class(product):
    sku = product["sku"]
    if sku.startswith("HW5P-"):
        return "five_pack"
    if sku.startswith("MGT-"):
        # MGT-1106 ships on a blister card, the rest in a collector display box.
        return "carded" if "Blister Card" in (product.get("series") or "") else "mgt_box"
    return "carded"


def package_weight_kg(product, pkg_class):
    grams = (product.get("specifications") or {}).get("Weight")
    if not grams:
        raise SystemExit("%s has no specifications.Weight — cannot set package weight." % product["sku"])
    match = re.match(r"\s*([\d.]+)\s*g\s*$", grams)
    if not match:
        raise SystemExit("%s: unparseable weight %r (expected e.g. '135 g')." % (product["sku"], grams))
    return round(float(match.group(1)) / 1000.0 + PACKAGING[pkg_class]["pack_kg"], 2)


def _round(taka):
    return int(round(taka / float(ROUND_TO)) * ROUND_TO)


def marketplace_price(taka):
    """What you are actually paid: the site price plus the commission markup."""
    return _round(taka * MARKUP)


def listed_price(taka):
    """Price(MRP) — the struck-through figure the special price discounts from."""
    return _round(marketplace_price(taka) * MRP_UPLIFT)


def packaging_phrase(pkg_class, is_mini_gt):
    if pkg_class == "five_pack":
        return "sealed in the original Hot Wheels 5-pack box"
    if pkg_class == "mgt_box":
        return "in the original MINI GT collector display box"
    return (
        "on the original MINI GT blister card" if is_mini_gt
        else "sealed on the original Hot Wheels premium blister card"
    )


def packaging_phrase_bn(pkg_class, is_mini_gt):
    if pkg_class == "five_pack":
        return "অরিজিনাল Hot Wheels ৫-প্যাক বক্সে সিলড"
    if pkg_class == "mgt_box":
        return "অরিজিনাল MINI GT কালেক্টর ডিসপ্লে বক্সে"
    return (
        "অরিজিনাল MINI GT ব্লিস্টার কার্ডে" if is_mini_gt
        else "অরিজিনাল Hot Wheels প্রিমিয়াম ব্লিস্টার কার্ডে সিলড"
    )


def excel_serial(stamp):
    """'28/07/2026 00:00' -> the Excel date serial for that moment."""
    moment = datetime.datetime.strptime(stamp, DATE_FORMAT)
    return (moment - EXCEL_EPOCH).total_seconds() / 86400.0


def add_date_style(styles_xml):
    """Append a date number format + cellXf, returning (xml, new cellXf index).

    The template ships no <numFmts> at all and 13 cellXfs, none of them a date format.
    A date serial in a General-formatted cell reads back as a bare number — to Excel and
    to any importer that decides date-ness from the number format — so the format has to
    be added rather than reusing an existing style.
    """
    if "<numFmts" in styles_xml:
        raise SystemExit("Template already defines <numFmts>; the date style needs rechecking.")

    numfmts = ('<numFmts count="1"><numFmt numFmtId="%d" formatCode="%s"/></numFmts>'
               % (DATE_NUMFMT_ID, DATE_NUMFMT_CODE))
    styles_xml = re.sub(r"(<styleSheet[^>]*>)", r"\1" + numfmts, styles_xml, count=1)

    cell_xfs = re.search(r'<cellXfs count="(\d+)">(.*?)</cellXfs>', styles_xml, re.S)
    if not cell_xfs:
        raise SystemExit("styles.xml has no <cellXfs>.")
    count = int(cell_xfs.group(1))
    # Same font/fill as style 8, which every data cell on the product sheet already uses,
    # so the date cells look like their neighbours — only the number format differs.
    new_xf = ('<xf numFmtId="%d" fontId="3" fillId="0" borderId="0" xfId="0" '
              'applyFont="1" applyNumberFormat="1"/>' % DATE_NUMFMT_ID)
    styles_xml = (styles_xml[: cell_xfs.start()]
                  + '<cellXfs count="%d">%s%s</cellXfs>' % (count + 1, cell_xfs.group(2), new_xf)
                  + styles_xml[cell_xfs.end():])
    return styles_xml, count


def cartup_name(text):
    """Product names as CartUp will accept them. See HASH_REPLACEMENT."""
    return text.replace("#", HASH_REPLACEMENT)


def load_cartup_image_urls():
    """sellerSku -> {position: url} for everything already uploaded to CartUp."""
    if not os.path.exists(CARTUP_IMAGE_URLS):
        return {}
    urls = {}
    with open(CARTUP_IMAGE_URLS, newline="", encoding="utf-8") as handle:
        for entry in csv.DictReader(handle):
            url = (entry.get("url") or "").strip()
            if not url:
                continue
            position = int(entry["position"])
            if position not in POSITION_FIELD:
                raise SystemExit("%s has image position %d — the template only has 8 image columns."
                                 % (entry["sellerSku"], position))
            urls.setdefault(entry["sellerSku"], {})[position] = url
    return urls


def build_row(product, image_urls):
    sku = product["sku"]
    bn = BN.get(sku)
    if bn is None:
        raise SystemExit("No Bengali copy for %s — add it to cartup_copy.BN." % sku)

    is_mini_gt = sku.startswith("MGT-")
    pkg_class = packaging_class(product)
    dims = PACKAGING[pkg_class]["dims"]

    live_color = product.get("color") or ""
    if live_color not in COLOR_MAP:
        raise SystemExit("No CartUp colour mapping for %s colour %r." % (sku, live_color))

    features = product.get("features") or []
    missing_bn = [f for f in features if f not in FEATURE_BN]
    if missing_bn:
        raise SystemExit("No Bengali highlight for %s: %s" % (sku, missing_bn))

    manufacturer = product.get("manufacturer") or ""
    age_grade_en = (
        "Manufacturer age grade: 14 years and over (TSM Models official)." if is_mini_gt
        else "Manufacturer age grade: 3 years and up (Mattel official)."
    )
    age_grade_bn = (
        "প্রস্তুতকারকের বয়সসীমা: ১৪ বছর ও তদূর্ধ্ব (TSM Models অফিসিয়াল)।" if is_mini_gt
        else "প্রস্তুতকারকের বয়সসীমা: ৩ বছর ও তদূর্ধ্ব (Mattel অফিসিয়াল)।"
    )

    spec_line_en = " · ".join(filter(None, [
        "Scale: %s" % (product.get("scale") or ""),
        "Manufacturer: %s" % manufacturer if manufacturer else "",
        "Series: %s" % (product.get("series") or "") if product.get("series") else "",
        "Model no: %s" % (product.get("modelNumber") or "") if product.get("modelNumber") else "",
    ]))
    spec_line_bn = " · ".join(filter(None, [
        "স্কেল: %s" % (product.get("scale") or ""),
        "প্রস্তুতকারক: %s" % manufacturer if manufacturer else "",
        "সিরিজ: %s" % (product.get("series") or "") if product.get("series") else "",
        "মডেল নম্বর: %s" % (product.get("modelNumber") or "") if product.get("modelNumber") else "",
    ]))

    desc_en = "\n".join([
        product["description"],
        "",
        spec_line_en,
        "Construction: %s" % (product.get("material") or ""),
        "Packaging: %s" % packaging_phrase(pkg_class, is_mini_gt),
        age_grade_en,
        AUTHENTICITY_EN,
    ])
    desc_bn = "\n".join([
        bn["desc"],
        "",
        spec_line_bn,
        "গঠন: %s" % (product.get("material") or ""),
        "প্যাকেজিং: %s" % packaging_phrase_bn(pkg_class, is_mini_gt),
        age_grade_bn,
        AUTHENTICITY_BN,
    ])

    # Comma, not an em dash — most titles already contain one.
    in_the_box = "1 x %s, %s" % (cartup_name(product["title"]), packaging_phrase(pkg_class, is_mini_gt))
    if pkg_class == "five_pack":
        in_the_box += " (contains 5 x 1:64 diecast vehicles)"

    row = {
        "nameEn": cartup_name(product["title"]),
        "nameBn": cartup_name(bn["title"]),
        "brand": BRAND,
        "unit": UNIT,
        "tags": ", ".join(product.get("tags") or []),
        "age": AGE_MINI_GT if is_mini_gt else AGE_HOT_WHEELS,
        "material": MATERIAL,
        "highlightsEn": "; ".join(features),
        "highlightsBn": "; ".join(FEATURE_BN[f] for f in features),
        "descEn": desc_en,
        "descBn": desc_bn,
        "inTheBox": in_the_box,
        "warrantyEn": WARRANTY_EN,
        "warrantyBn": WARRANTY_BN,
        "warrantyType": WARRANTY_TYPE,
        "weightKg": package_weight_kg(product, pkg_class),
        "lengthCm": dims[0],
        "widthCm": dims[1],
        "heightCm": dims[2],
        "color": COLOR_MAP[live_color],
        "sellerSku": SKU_PREFIX + sku,
        "parentSku": SKU_PREFIX + sku,
        "stock": product["stock"],
        "price": listed_price(product["price"]),
    }

    # Image columns C-J, plus AG (Variant Image) which reuses slot 1 — CartUp requires
    # both a product image and a variant image, and there is only ever one variant here.
    for position, url in sorted(image_urls.get(SKU_PREFIX + sku, {}).items()):
        row[POSITION_FIELD[position]] = url
        if position == 1:
            row["variantImage"] = url

    # Every product carries a special price, not only the ones on sale on the site — the
    # promo here is the pricing model (MRP sits MRP_UPLIFT above what you're paid), not a
    # reflection of site sales. The site's own salePrice on HW5P-001 / HWCC-007 / HWF1-002
    # stays a site-only promotion and is deliberately not mirrored.
    if SPECIAL_PRICES and MRP_UPLIFT > 1.0:
        special = marketplace_price(product["price"])
        if special >= row["price"]:
            raise SystemExit("%s: special price %d is not below MRP %d — raise MRP_UPLIFT."
                             % (sku, special, row["price"]))
        if special < row["price"] * 0.25:
            raise SystemExit("%s: special price exceeds CartUp's 75%% max discount." % sku)
        row["specialPrice"] = special
        row["specialStart"] = SPECIAL_START
        row["specialEnd"] = SPECIAL_END

    return row


# ================================================================================
# OOXML surgery
# ================================================================================

XML_ESCAPES = (("&", "&amp;"), ("<", "&lt;"), (">", "&gt;"))


def xml_escape(text):
    for old, new in XML_ESCAPES:
        text = text.replace(old, new)
    return text


class SharedStrings:
    """Appends new <si> entries to sharedStrings.xml and hands back their indices.

    Chosen over inline strings so the result is byte-for-byte the kind of workbook
    Excel itself produces — any server-side parser sees an entirely ordinary file.
    """

    def __init__(self, xml):
        header = re.match(r'^(.*?<sst\b[^>]*>)', xml, re.S)
        if not header:
            raise SystemExit("sharedStrings.xml: no <sst> element.")
        self.head = header.group(1)
        self.body = xml[header.end():]
        if not self.body.endswith("</sst>"):
            raise SystemExit("sharedStrings.xml: unexpected tail.")
        self.body = self.body[: -len("</sst>")]
        self.count = int(re.search(r'\bcount="(\d+)"', self.head).group(1))
        self.unique = int(re.search(r'\buniqueCount="(\d+)"', self.head).group(1))
        self.next_index = self.unique
        self.added = []
        self.cache = {}

    def index_of(self, text):
        if text in self.cache:
            self.count += 1
            return self.cache[text]
        # xml:space="preserve" keeps leading/trailing whitespace and newlines intact.
        self.added.append('<si><t xml:space="preserve">%s</t></si>' % xml_escape(text))
        index = self.next_index
        self.cache[text] = index
        self.next_index += 1
        self.unique += 1
        self.count += 1
        return index

    def serialise(self):
        head = re.sub(r'\bcount="\d+"', 'count="%d"' % self.count, self.head, count=1)
        head = re.sub(r'\buniqueCount="\d+"', 'uniqueCount="%d"' % self.unique, head, count=1)
        return head + self.body + "".join(self.added) + "</sst>"


def number_literal(value):
    """Trailing '.0' stripped so whole numbers land as 18 rather than 18.0."""
    literal = repr(float(value))
    return literal[:-2] if literal.endswith(".0") else literal


def patch_sheet(sheet_xml, rows, sst, date_style=None):
    """Replace the placeholder cells of rows 3..N with real values."""
    for offset, row in enumerate(rows):
        row_number = FIRST_DATA_ROW + offset
        if row_number > LAST_DATA_ROW:
            raise SystemExit("More products than the template's %d data rows." % (LAST_DATA_ROW - FIRST_DATA_ROW + 1))

        row_match = re.search(r'<row r="%d"[^>]*>.*?</row>' % row_number, sheet_xml, re.S)
        if not row_match:
            raise SystemExit("Row %d not found in the product sheet." % row_number)
        row_xml = row_match.group(0)

        for field, value in row.items():
            ref = "%s%d" % (COL[field], row_number)
            cell_re = re.compile(r'<c r="%s"([^>]*)>.*?</c>' % ref, re.S)
            cell_match = cell_re.search(row_xml)
            if not cell_match:
                raise SystemExit("Cell %s not found." % ref)

            attrs = cell_match.group(1)
            style = re.search(r'\bs="(\d+)"', attrs)
            style_attr = ' s="%s"' % style.group(1) if style else ""

            if field in DATE_FIELDS:
                # A real Excel date: serial number in a date-formatted cell. Text here is
                # what CartUp rejected with "Special StartAt should be a valid date."
                cell = '<c r="%s" s="%d"><v>%s</v></c>' % (
                    ref, date_style, number_literal(excel_serial(value)))
            elif field in NUMERIC_FIELDS:
                cell = '<c r="%s"%s><v>%s</v></c>' % (ref, style_attr, number_literal(value))
            else:
                cell = '<c r="%s"%s t="s"><v>%d</v></c>' % (ref, style_attr, sst.index_of(str(value)))

            row_xml = row_xml[: cell_match.start()] + cell + row_xml[cell_match.end():]

        sheet_xml = sheet_xml[: row_match.start()] + row_xml + sheet_xml[row_match.end():]

    return sheet_xml


def sheet_part(parts, sheet_name):
    """Resolve a sheet name to its zip part via workbook.xml + rels."""
    workbook_xml = parts["xl/workbook.xml"].decode("utf-8")
    rels_xml = parts["xl/_rels/workbook.xml.rels"].decode("utf-8")
    rid = re.search(r'name="%s"[^>]*r:id="(rId\d+)"' % sheet_name, workbook_xml)
    if not rid:
        raise SystemExit("Sheet %r not found in workbook.xml." % sheet_name)
    target = re.search(r'Id="%s"[^>]*Target="([^"]+)"' % rid.group(1), rels_xml).group(1)
    return "xl/" + target.lstrip("/")


def lookup_tables():
    """Table name -> {label: id}, first match wins, exactly like the payload VLOOKUPs."""
    workbook = openpyxl.load_workbook(TEMPLATE, data_only=True)
    values = workbook["value_hidden"]
    tables = {}
    for name, ref in values.tables.items():
        first, last = ref.split(":")
        name_column = openpyxl.utils.column_index_from_string(re.match(r"([A-Z]+)", first).group(1))
        last_row = int(re.search(r"(\d+)$", last).group(1))
        mapping = {}
        for row in range(2, last_row + 1):
            label = values.cell(row, name_column).value
            if label is not None and label not in mapping:
                mapping[label] = values.cell(row, name_column + 1).value
        tables[name] = mapping
    return tables


def compute_payload(payload_xml, rows, tables, date_style):
    """Write the cached result of every payload_hidden formula.

    CartUp's importer reads this sheet, not the visible one. Its formulas normally get
    their values when Excel recalculates on save — but this build never opens Excel, so
    without this step every cell is a formula with no cached value and the upload comes
    back "No products were found in your excel upload". Each formula is either a
    pass-through of a product cell or a VLOOKUP of one into a value_hidden table, so the
    results are computed directly here and written as <v> alongside the untouched <f>.
    """
    # payload row 2 mirrors product row 3
    offset = FIRST_DATA_ROW - 2

    columns = {}
    for column, formula in re.findall(r'<c r="([A-Z]+)2"[^>]*><f>(.*?)</f>', payload_xml):
        for entity, char in (("&quot;", '"'), ("&apos;", "'"), ("&lt;", "<"),
                             ("&gt;", ">"), ("&amp;", "&")):
            formula = formula.replace(entity, char)
        lookup = re.search(r"VLOOKUP\('product'!([A-Z]+)\d+,\s*(product_attribute_\d+)\[", formula)
        if lookup:
            columns[column] = (lookup.group(1), lookup.group(2))
            continue
        passthrough = re.search(r"IF\(product!([A-Z]+)\d+<>", formula)
        if not passthrough:
            raise SystemExit("Unrecognised payload formula in column %s: %s" % (column, formula))
        columns[column] = (passthrough.group(1), None)

    field_of = {letter: field for field, letter in COL.items()}

    def value_for(column, payload_row):
        source_column, table = columns[column]
        index = payload_row - 2
        if index >= len(rows):
            return ""
        raw = rows[index].get(field_of.get(source_column), "")
        if raw in (None, ""):
            return ""
        if table is None:
            return raw
        resolved = tables[table].get(raw)
        if resolved is None:
            raise SystemExit("Row %d column %s: %r is not in %s — payload would be #N/A."
                             % (payload_row + offset, source_column, raw, table))
        return resolved

    def patch_cell(match):
        column, payload_row, attrs, formula = match.group(1), int(match.group(2)), match.group(3), match.group(4)
        if column not in columns:
            return match.group(0)
        value = value_for(column, payload_row)
        attrs = re.sub(r'\s+t="[^"]*"', "", attrs)
        source_field = field_of.get(columns[column][0])
        if source_field in DATE_FIELDS and value != "":
            # Mirrors a date cell, so this one must carry the date format too — CartUp
            # reads THIS sheet, and an unformatted serial reads back as a plain number.
            attrs = re.sub(r'\s+s="\d+"', "", attrs) + ' s="%d"' % date_style
            return '<c r="%s%d"%s><f>%s</f><v>%s</v></c>' % (
                column, payload_row, attrs, formula, number_literal(excel_serial(value)))
        if isinstance(value, (int, float)) and not isinstance(value, bool):
            return '<c r="%s%d"%s><f>%s</f><v>%s</v></c>' % (
                column, payload_row, attrs, formula, number_literal(value))
        # Excel marks string-valued formula results with t="str"; "" is how the IF's
        # else-branch presents, and is what every unused row holds.
        return '<c r="%s%d"%s t="str"><f>%s</f><v>%s</v></c>' % (
            column, payload_row, attrs, formula, xml_escape(str(value)))

    body = payload_xml
    return re.sub(r'<c r="([A-Z]+)(\d+)"([^>]*)><f>(.*?)</f></c>', patch_cell, body, flags=re.S)


def write_workbook(rows):
    with zipfile.ZipFile(TEMPLATE) as src:
        names = src.namelist()
        parts = {name: src.read(name) for name in names}
        infos = {info.filename: info for info in src.infolist()}

    styles, date_style = add_date_style(parts["xl/styles.xml"].decode("utf-8"))

    sst = SharedStrings(parts["xl/sharedStrings.xml"].decode("utf-8"))
    sheet = patch_sheet(parts["xl/worksheets/sheet1.xml"].decode("utf-8"), rows, sst, date_style)

    payload_name = sheet_part(parts, "payload_hidden")
    payload = compute_payload(parts[payload_name].decode("utf-8"), rows, lookup_tables(), date_style)

    parts["xl/styles.xml"] = styles.encode("utf-8")
    parts["xl/worksheets/sheet1.xml"] = sheet.encode("utf-8")
    parts["xl/sharedStrings.xml"] = sst.serialise().encode("utf-8")
    parts[payload_name] = payload.encode("utf-8")

    # Rezip in the original entry order, preserving each entry's compression type.
    with zipfile.ZipFile(OUTPUT, "w") as out:
        for name in names:
            info = zipfile.ZipInfo(name, date_time=infos[name].date_time)
            info.compress_type = infos[name].compress_type
            info.external_attr = infos[name].external_attr
            out.writestr(info, parts[name])


# ================================================================================
# Image handoff
# ================================================================================

def write_image_map(products):
    """SKU -> Cloudinary URL, with a blank imageKey column to paste CartUp's keys into.

    CartUp's policy sheet requires the ImageKey from their own uploaded-image batch, so
    the workbook's image columns cannot be filled from here. download_images.py fetches
    these files; splice_image_keys.py writes the keys back into the workbook.
    """
    with open(IMAGE_MAP, "w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["sellerSku", "position", "column", "cloudinaryUrl", "localFile", "imageKey"])
        for product in products:
            seller_sku = SKU_PREFIX + product["sku"]
            urls = []
            thumbnail = (product.get("thumbnail") or {}).get("url")
            if thumbnail:
                urls.append(thumbnail)
            for image in product.get("gallery") or []:
                if image.get("url") and image["url"] not in urls:
                    urls.append(image["url"])
            for position, url in enumerate(urls, start=1):
                extension = os.path.splitext(url.split("?")[0])[1] or ".jpg"
                local = "%s-%d%s" % (seller_sku, position, extension)
                # Position 1 also fills the mandatory Variant Image column (AG).
                column = "C (Product Image 1) + AG (Variant Image)" if position == 1 else "D (Product Image 2)"
                writer.writerow([seller_sku, position, column, url, local, ""])


# ================================================================================

def main():
    if not os.path.exists(TEMPLATE):
        raise SystemExit("Template not found: %s" % TEMPLATE)

    products = sorted(fetch_catalogue(), key=lambda p: p["sku"])
    print("Fetched %d products (accessories excluded)." % len(products))

    image_urls = load_cartup_image_urls()
    rows = [build_row(product, image_urls) for product in products]
    write_workbook(rows)
    write_image_map(products)

    without_image = [p["sku"] for p in products if not image_urls.get(SKU_PREFIX + p["sku"])]
    size_kb = os.path.getsize(OUTPUT) / 1024.0
    print("Wrote %s (%.0f KB, %d rows)." % (os.path.basename(OUTPUT), size_kb, len(rows)))
    print("Wrote %s." % os.path.basename(IMAGE_MAP))
    print("CartUp images: %d/%d products." % (len(products) - len(without_image), len(products)))
    if without_image:
        print("  NO IMAGE YET: %s — CartUp will reject these rows." % ", ".join(without_image))
    if size_kb > 2048:
        raise SystemExit("Output exceeds CartUp's 2 MB limit.")
    if SPECIAL_PRICES and MRP_UPLIFT > 1.0:
        paid = sum(marketplace_price(p["price"]) * p["stock"] for p in products)
        site = sum(p["price"] * p["stock"] for p in products)
        print("Pricing: MRP = site +%.0f%% then +%.0f%%; Special = site +%.0f%% (what you're paid)."
              % ((MARKUP - 1) * 100, (MRP_UPLIFT - 1) * 100, (MARKUP - 1) * 100))
        print("Promo window %s to %s." % (SPECIAL_START, SPECIAL_END))
        print("Catalogue at current stock: site %s -> paid %s (+%s)."
              % (format(site, ","), format(paid, ","), format(paid - site, ",")))
    else:
        print("Special prices disabled (columns AJ-AL left empty).")


if __name__ == "__main__":
    main()
