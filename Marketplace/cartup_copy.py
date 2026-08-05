# -*- coding: utf-8 -*-
"""
Hand-authored copy and value mappings for the CartUp bulk-upload sheet.

Everything here is either (a) a Bengali rendering of the product copy that already
exists on diecastbd.com, or (b) a mapping from a live catalogue value onto one of the
values CartUp's dropdowns actually accept. No product facts are invented here — the
English source of truth is the live API, and the official-source facts appended to the
descriptions (age grade, scale, construction, packaging) are recorded in SOURCES below.

Convention for Bengali: brand, series, casting and livery names stay in Latin script,
which is how Bangladeshi collectors write and search for them. Only the surrounding
prose is Bengali.
"""

# --------------------------------------------------------------------------------
# Official sources for the facts appended to every description
# --------------------------------------------------------------------------------
SOURCES = {
    "hot_wheels_age": (
        "Mattel official product pages list Hot Wheels Car Culture / Premium at "
        "age grade 3 years and up (not suitable for children under 36 months). "
        "https://shopping.mattel.com/en-gb/products/"
        "hot-wheels-car-culture-circuit-legends-vehicles-fpy86-en-gb"
    ),
    "mini_gt_age": (
        "MINI GT (TSM Model / TrueScale Miniatures) models are recommended for "
        "ages 14 and over. https://www.wonderlandmodels.com/brands/mini-gt/"
    ),
    "hw_premium_card": (
        "Hot Wheels Premium / Car Culture blister card measures 6.5 in x 5.25 in "
        "(16.5 x 13.3 cm); blister bubble 4.75 x 2.75 x 1.7 in. Protector-case "
        "manufacturer specs, Sterling / Platinum Protectors."
    ),
    "mini_gt_box": (
        "MINI GT 1:64 product packaging measures approximately 10 x 4.5 x 3.5 cm."
    ),
    "hw_five_pack": (
        "Hot Wheels multi-pack packaging runs approximately 10 x 7 x 2 in "
        "(25.4 x 17.8 x 5.1 cm)."
    ),
}

# --------------------------------------------------------------------------------
# Live catalogue colour  ->  exact value from CartUp's Color dropdown
# (value_hidden!M2:M16273 — verified present, with the id payload_hidden resolves to)
# --------------------------------------------------------------------------------
COLOR_MAP = {
    "Red": "Red",                              # 561
    "Red (5-car set)": "Red",
    "Blue": "Blue",                            # 562
    "Blue (HKS livery)": "Blue",
    "Blue (Toyo Tires livery)": "Blue",
    "Light blue": "Light Blue",                # 1086
    "Dark blue": "Dark Blue",                  # 963
    "Black": "Black",                          # 575
    "Black / orange": "Black",
    "White": "White",                          # 560
    "White / red": "White",
    "White / red / blue": "White",
    "White / navy blue": "White",
    "White / orange (#20)": "White",
    "Silver": "Silver",                        # 594
    "Silver metallic": "Silver",
    "Yellow": "Yellow",                        # 576
    "Green": "Green",                          # 563
    "Dark green": "Dark Green",                # 592
    "Orange": "Orange",                        # 585
    "Maroon": "Maroon",                        # 599
    "Multi-colour (5-car set)": "Multicolor",  # 605
}

# --------------------------------------------------------------------------------
# Every distinct `features` bullet in the live catalogue -> Bengali
# --------------------------------------------------------------------------------
FEATURE_BN = {
    "Real Riders rubber tyres": "Real Riders রাবার টায়ার",
    "Metal body & metal base": "মেটাল বডি ও মেটাল বেস",
    "TSM Models premium build": "TSM Models প্রিমিয়াম বিল্ড",
    "Rubber tyres": "রাবার টায়ার",
    "Aero Styles premium series": "Aero Styles প্রিমিয়াম সিরিজ",
    "Car Culture premium series": "Car Culture প্রিমিয়াম সিরিজ",
    "Collector display box": "কালেক্টর ডিসপ্লে বক্স",
    "Fast & Furious premium": "Fast & Furious প্রিমিয়াম লাইন",
    "Gold Label premium series": "Gold Label প্রিমিয়াম সিরিজ",
    "LB Super Silhouette widebody": "LB Super Silhouette ওয়াইডবডি",
    "Pandem widebody kit": "Pandem ওয়াইডবডি কিট",
    "Blister card packaging": "ব্লিস্টার কার্ড প্যাকেজিং",
    "Top Secret GT-300 livery": "Top Secret GT-300 লিভারি",
    "VeilSide Combat widebody": "VeilSide Combat ওয়াইডবডি",
    "Fully detailed interior": "সম্পূর্ণ ডিটেইলড ইন্টেরিয়র",
    "Fast & Furious 25th Anniversary": "Fast & Furious ২৫তম বার্ষিকী সংস্করণ",
    "Custom widebody aero": "কাস্টম ওয়াইডবডি এয়ারো",
    "GT3 race aero": "GT3 রেস এয়ারো",
    "LB-Kaido Works widebody": "LB-Kaido Works ওয়াইডবডি",
    "Liberty Walk widebody": "Liberty Walk ওয়াইডবডি",
    "Car Culture 10th Anniversary": "Car Culture ১০ম বার্ষিকী সংস্করণ",
    "Includes matching trailer": "সঙ্গে ম্যাচিং ট্রেইলার",
    "Toyo Tires livery": "Toyo Tires লিভারি",
    "Boulevard premium series": "Boulevard প্রিমিয়াম সিরিজ",
    "HKS racing livery": "HKS রেসিং লিভারি",
    "Officially licensed Stranger Things": "অফিসিয়াল লাইসেন্সপ্রাপ্ত Stranger Things",
    "Officially licensed Cyberpunk 2077": "অফিসিয়াল লাইসেন্সপ্রাপ্ত Cyberpunk 2077",
    "One-of-one in Bangladesh": "বাংলাদেশে মাত্র একটি",
    "Lewis Hamilton's Ferrari debut car": "Lewis Hamilton-এর Ferrari অভিষেকের গাড়ি",
    "Sealed 5-car F1 grid set": "সিলড ৫টি F1 গাড়ির গ্রিড সেট",
    "5 official F1 team liveries": "৫টি অফিসিয়াল F1 টিম লিভারি",
    "Great gift for F1 fans": "F1 ভক্তদের জন্য দারুণ উপহার",
    "Sealed 5-car Ferrari set": "সিলড ৫টি Ferrari গাড়ির সেট",
    "Officially licensed Ferrari liveries": "অফিসিয়াল লাইসেন্সপ্রাপ্ত Ferrari লিভারি",
    "Collectible sealed packaging": "সংগ্রাহকদের জন্য সিলড প্যাকেজিং",
}

# --------------------------------------------------------------------------------
# Per-SKU Bengali title and description (renderings of the live English copy)
# --------------------------------------------------------------------------------
BN = {
    "HW5P-001": {
        "title": "Hot Wheels Ferrari 5-Pack (সিলড) — ১:৬৪ ডাইকাস্ট মডেল কার সেট",
        "desc": (
            "সিলড ৫টি Ferrari গাড়ির সেট — Hot Wheels-এ Ferrari-র প্রত্যাবর্তন উপলক্ষে। "
            "সেটে আছে F40, SF90, 12Cilindri, Dino এবং 365 GTB/4। সিলড প্যাক একইসঙ্গে "
            "ডিসপ্লে পিস এবং সময়ের সঙ্গে দাম বাড়া কালেক্টিবল।"
        ),
    },
    "HW5P-002": {
        "title": "Hot Wheels Formula 1 5-Pack (সিলড) — ১:৬৪ ডাইকাস্ট মডেল কার সেট",
        "desc": (
            "সিলড ৫টি F1 গ্রিড সেট: Oracle Red Bull, Mercedes-AMG Petronas, BWT Alpine, "
            "MoneyGram Haas এবং Atlassian Williams। যেকোনো F1 ভক্তের জন্য সবচেয়ে সহজ উপহার।"
        ),
    },
    "HWCC-001": {
        "title": "Hot Wheels Car Culture — Ferrari 250 GTO ১:৬৪ ডাইকাস্ট মডেল কার (Vintage Racing Club)",
        "desc": (
            "Ferrari 250 GTO — পৃথিবীর সবচেয়ে দামি গাড়ি (একটি আসল গাড়ি ৭ কোটি ডলারে বিক্রি হয়েছে)। "
            "Car Culture প্রিমিয়াম বিল্ড, মেটাল বেস ও Real Riders রাবার টায়ার সহ।"
        ),
    },
    "HWCC-002": {
        "title": "Hot Wheels Car Culture — Porsche 917K ১:৬৪ ডাইকাস্ট মডেল কার (Vintage Racing Club)",
        "desc": (
            "Le Mans-জয়ী Porsche 917K, তার আইকনিক #20 রেসিং লিভারিতে। প্রিমিয়াম Car Culture "
            "বিল্ড — মেটাল বডি, মেটাল বেস ও Real Riders রাবার টায়ার।"
        ),
    },
    "HWCC-003": {
        "title": "Hot Wheels Boulevard #150 — Nissan Skyline GT-R R32 Pandem (HKS) ১:৬৪ ডাইকাস্ট মডেল কার",
        "desc": (
            "Godzilla — সম্পূর্ণ Pandem ওয়াইডবডি এবং কিংবদন্তি HKS রঙে। Boulevard প্রিমিয়াম — "
            "মেটাল বেস, Real Riders রাবার টায়ার। এ বছরের সবচেয়ে চাহিদাসম্পন্ন R32 কাস্টিংগুলোর একটি।"
        ),
    },
    "HWCC-004": {
        "title": "Hot Wheels Car Culture — BMW M3 E46 ১:৬৪ ডাইকাস্ট মডেল কার (Power Trip)",
        "desc": (
            "E46 M3 — গাড়িপ্রেমীদের BMW — গাঢ় সবুজ রঙে, প্রিমিয়াম Power Trip কার্ডে। "
            "মেটাল বডি ও মেটাল বেস, সঙ্গে Real Riders রাবার টায়ার।"
        ),
    },
    "HWCC-005": {
        "title": "Hot Wheels Car Culture — Nissan Skyline GT-R R32 Pandem হলুদ ১:৬৪ ডাইকাস্ট মডেল কার (Ronin Run II)",
        "desc": (
            "Ronin Run II সিরিজের Pandem-কিট R32 GT-R, উজ্জ্বল হলুদ রঙে। প্রিমিয়াম মেটাল বেস "
            "এবং Real Riders রাবার টায়ার।"
        ),
    },
    "HWCC-006": {
        "title": "Hot Wheels Car Culture — Mad Mike Mazda RX-3 Wagon + Trailer ১:৬৪ ডাইকাস্ট মডেল কার (Ronin Run II)",
        "desc": (
            "Mad Mike-এর রোটারি Mazda RX-3 ওয়াগন, সঙ্গে ম্যাচিং ট্রেইলার পিস — একটি প্রিমিয়াম "
            "কার্ডে দুটি মডেল।"
        ),
    },
    "HWCC-007": {
        "title": "Hot Wheels Car Culture — Ferrari Testarossa ১:৬৪ ডাইকাস্ট মডেল কার (Modern Classics, 10th Anniversary)",
        "desc": (
            "আশির দশকের পোস্টার কার — Ferrari Testarossa, তার চিরচেনা লাল রঙে, Car Culture-এর "
            "১০ম বার্ষিকী কার্ডে। মেটাল বডি ও মেটাল বেস, Real Riders রাবার টায়ার।"
        ),
    },
    "HWCC-008": {
        "title": "Hot Wheels Car Culture — Nissan Skyline 2000GT-R LBWK ১:৬৪ ডাইকাস্ট মডেল কার (Japan Historics)",
        "desc": (
            "Hakosuka Skyline 2000GT-R, Liberty Walk ওয়াইডবডি সহ — পুরোনো দিনের JDM-এর সঙ্গে "
            "আধুনিক টিউনার কালচারের মিলন। প্রিমিয়াম গোল্ড-লেবেল বিল্ড।"
        ),
    },
    "HWCC-009": {
        "title": "Hot Wheels Car Culture — LB-Kaido Works Nissan Skyline GT-R R32 ১:৬৪ ডাইকাস্ট মডেল কার (Aero Styles)",
        "desc": (
            "LB-Kaido Works ওয়াইডবডি R32, পরিচ্ছন্ন সাদা রেস ট্রিমে — একদম নতুন Aero Styles "
            "সিরিজের হিরো কার। মেটাল বডি ও মেটাল বেস, Real Riders রাবার টায়ার।"
        ),
    },
    "HWCC-010": {
        "title": "Hot Wheels Car Culture — 2008 Audi A4 DTM ১:৬৪ ডাইকাস্ট মডেল কার (Aero Styles)",
        "desc": (
            "২০০৮ সালের Audi A4 DTM টুরিং কার, গাঢ় কালো রঙে — প্রিমিয়াম Aero Styles কার্ডে "
            "মোটরস্পোর্টের ঐতিহ্য।"
        ),
    },
    "HWCC-011": {
        "title": "Hot Wheels Car Culture — LB Super Silhouette Nissan Silvia S15 ১:৬৪ ডাইকাস্ট মডেল কার (Aero Styles)",
        "desc": (
            "Liberty Walk Super Silhouette S15 Silvia — সবচেয়ে বেশি চাওয়া JDM কাস্টিংগুলোর একটি, "
            "সাদা রঙে লাল রাইজিং-সান অ্যাকসেন্ট সহ।"
        ),
    },
    "HWCC-012": {
        "title": "Hot Wheels Car Culture — Lexus RC F GT3 ১:৬৪ ডাইকাস্ট মডেল কার (Aero Styles)",
        "desc": (
            "নীল ওয়ার্কস লিভারিতে Lexus RC F GT3 রেসার — প্রিমিয়াম Aero Styles কার্ডে সম্পূর্ণ "
            "GT3 এয়ারো।"
        ),
    },
    "HWCC-013": {
        "title": "Hot Wheels Car Culture — '70 Chevy Nova Custom ১:৬৪ ডাইকাস্ট মডেল কার (Aero Styles)",
        "desc": (
            "ওয়াইডবডি এয়ারো সহ কাস্টম '70 Chevy Nova — Aero Styles লাইনের জন্য নতুন করে ভাবা "
            "আমেরিকান মাসল।"
        ),
    },
    "HWF1-001": {
        "title": "Hot Wheels F1 Premium — Ferrari SF-25 #44 Lewis Hamilton ১:৬৪ ডাইকাস্ট মডেল কার",
        "desc": (
            "Lewis Hamilton-এর Ferrari SF-25 — Ferrari-র লাল রঙে তাঁর প্রথম গাড়ি। প্রিমিয়াম "
            "গোল্ড-লেবেল বিল্ড, মেটাল বেস ও Real Riders রাবার টায়ার সহ। এ মৌসুমের সবচেয়ে "
            "আলোচিত F1 ডাইকাস্ট।"
        ),
    },
    "HWF1-002": {
        "title": "Hot Wheels F1 Premium — Visa Cash App Racing Bulls VCARB #6 ১:৬৪ ডাইকাস্ট মডেল কার",
        "desc": (
            "Racing Bulls VCARB #6, প্রিমিয়াম গোল্ড-লেবেল ট্রিমে — মেটাল বেস, Real Riders "
            "রাবার টায়ার। প্রিমিয়াম F1 কালেকশন শুরু করার সবচেয়ে সাশ্রয়ী উপায়।"
        ),
    },
    "HWFF-001": {
        "title": "Hot Wheels Fast & Furious — Nissan Silvia S13 ১:৬৪ ডাইকাস্ট মডেল কার (Tokyo Drift)",
        "desc": (
            "Han-এর Tokyo Drift Silvia S13, Fast & Furious-এর ২৫তম বার্ষিকী কার্ডে। প্রিমিয়াম "
            "বিল্ড, Real Riders রাবার টায়ার।"
        ),
    },
    "HWFF-002": {
        "title": "Hot Wheels Fast & Furious — Mazda RX-7 FD সাদা ১:৬৪ ডাইকাস্ট মডেল কার",
        "desc": (
            "রোটারি আইকন — সাদা রঙে Mazda RX-7 FD, Fast & Furious প্রিমিয়াম কার্ডে, মেটাল বেস "
            "ও Real Riders রাবার টায়ার সহ।"
        ),
    },
    "HWFF-003": {
        "title": "Hot Wheels Fast & Furious — Mercedes-Benz 500 SEL ১:৬৪ ডাইকাস্ট মডেল কার",
        "desc": (
            "Fast & Furious প্রিমিয়াম লাইনের Mercedes-Benz 500 SEL — আশির দশকের নিরাভরণ "
            "মাসল, Real Riders রাবার টায়ার সহ।"
        ),
    },
    "HWFF-004": {
        "title": "Hot Wheels Fast & Furious — Honda Civic EG হলুদ ১:৬৪ ডাইকাস্ট মডেল কার (Race-Off)",
        "desc": (
            "মূল F&F হিরো কার — হলুদ রঙে Honda Civic EG। প্রিমিয়াম Fast & Furious কার্ড, "
            "মেটাল বেস, Real Riders রাবার টায়ার।"
        ),
    },
    "HWFF-005": {
        "title": "Hot Wheels Fast & Furious — 2021 Toyota GR Supra ১:৬৪ ডাইকাস্ট মডেল কার",
        "desc": (
            "F9-এর কমলা রঙে আধুনিক Supra — Fast & Furious প্রিমিয়াম, মেটাল বডি ও মেটাল বেস "
            "এবং Real Riders রাবার টায়ার সহ।"
        ),
    },
    "HWPC-001": {
        "title": "Hot Wheels Pop Culture — Cyberpunk 2077 Quadra Turbo-R V-Tech ১:৬৪ ডাইকাস্ট মডেল কার",
        "desc": (
            "অফিসিয়াল লাইসেন্সপ্রাপ্ত Cyberpunk 2077 Quadra Turbo-R V-Tech, প্রিমিয়াম Pop "
            "Culture কার্ড আর্টে। মেটাল বডি ও মেটাল বেস, Real Riders রাবার টায়ার। শুধু গাড়ির "
            "সংগ্রাহক নয়, গেমারদের কাছেও সমান আকর্ষণীয়।"
        ),
    },
    "HWPC-002": {
        "title": "Hot Wheels Pop Culture — Stranger Things 1983 BMW 733i ১:৬৪ ডাইকাস্ট মডেল কার",
        "desc": (
            "লাইসেন্সপ্রাপ্ত Stranger Things 1983 BMW 733i, প্রিমিয়াম গোল্ড-লেবেল ফিনিশ ও Real "
            "Riders রাবার টায়ার সহ। শেষ সিজনের জনপ্রিয়তার সঙ্গে সঙ্গে ডাইকাস্ট সংগ্রাহকদের "
            "বাইরেও এর চাহিদা।"
        ),
    },
    "MGT-1022": {
        "title": "MINI GT #1022 Nissan Silvia S15 LB Super Silhouette ১:৬৪ ডাইকাস্ট মডেল কার",
        "desc": (
            "সম্পূর্ণ রেস লিভারিতে Liberty Walk Super Silhouette S15 — MINI GT-র সবচেয়ে "
            "চাহিদাসম্পন্ন LBWK রিলিজগুলোর একটি।"
        ),
    },
    "MGT-1046": {
        "title": "MINI GT #1046 Mazda RX-7 (FD3S) RE Amemiya 20B নীল ১:৬৪ ডাইকাস্ট মডেল কার",
        "desc": (
            "RE Amemiya-র কিংবদন্তি 20B ৩-রোটর RX-7, তার চিরচেনা হালকা নীল রঙে। TSM-মানের "
            "ট্যাম্পো, রাবার টায়ার ও সম্পূর্ণ ইন্টেরিয়র ডিটেইল — ১:৬৪ JDM-এর মানদণ্ড।"
        ),
    },
    "MGT-1094": {
        "title": "MINI GT #1094 Toyota Supra (A80) VeilSide Combat লাল ১:৬৪ ডাইকাস্ট মডেল কার",
        "desc": (
            "লাল রঙে VeilSide Combat-কিট A80 Supra — সম্পূর্ণ ওয়াইডবডি, TSM ডিটেইল, "
            "কালার বক্স প্যাকেজিং।"
        ),
    },
    "MGT-1106": {
        "title": "MINI GT #1106 Mazda RX-7 RE Amemiya সিলভার ১:৬৪ ডাইকাস্ট মডেল কার (Blister Card)",
        "desc": (
            "সিলভার মেটালিক রঙে RE Amemiya RX-7, সংগ্রাহকদের প্রিয় ব্লিস্টার কার্ডে। "
            "২০২৬ সালের রিলিজ — বাংলাদেশে সবার আগে।"
        ),
    },
    "MGT-TS01": {
        "title": "MINI GT Toyota Supra A80 Top Secret GT-300 লাল ১:৬৪ ডাইকাস্ট মডেল কার",
        "desc": (
            "Smokey Nagata-র Top Secret GT-300 Supra — যে টিউনার কিংবদন্তি সাধারণ রাস্তায় "
            "৩০০ কিমি/ঘণ্টা গতি তুলেছিল। MINI GT-র দ্রুততম বিক্রি হওয়া JDM রিলিজগুলোর একটি।"
        ),
    },
}

# --------------------------------------------------------------------------------
# Shared boilerplate
# --------------------------------------------------------------------------------
WARRANTY_EN = (
    "No manufacturer or seller warranty is offered on collectible diecast models. "
    "Every piece is supplied factory-sealed in its original packaging, is 100% "
    "authentic, and is hand-inspected before dispatch. Report any transit damage "
    "with the unopened parcel on delivery."
)

WARRANTY_BN = (
    "কালেক্টিবল ডাইকাস্ট মডেলের ক্ষেত্রে কোনো ম্যানুফ্যাকচারার বা সেলার ওয়ারেন্টি দেওয়া হয় না। "
    "প্রতিটি পিস অরিজিনাল প্যাকেজিংয়ে ফ্যাক্টরি-সিলড অবস্থায় সরবরাহ করা হয়, ১০০% আসল, এবং "
    "পাঠানোর আগে হাতে যাচাই করা হয়। ডেলিভারির সময় পার্সেল না খুলে ট্রানজিটে কোনো ক্ষতি হয়ে "
    "থাকলে সঙ্গে সঙ্গে জানান।"
)

AUTHENTICITY_EN = "100% authentic — imported and hand-verified by DiecastBD."
AUTHENTICITY_BN = "১০০% আসল — DiecastBD কর্তৃক আমদানিকৃত ও হাতে যাচাইকৃত।"
