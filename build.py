"""Build one private bridal demo site per lead.

Usage:
    python build.py                       # build every lead in leads.json
    python build.py alice-wilford         # build one lead (or several) by slug

Output: demos/<slug>/index.html, a single self-contained page (engine CSS + JS
+ the lead's content inlined). Photos are read from demos/<slug>/img/.

The build stops with a clear message if a required field or photo is missing.
"""
import colorsys
import json
import re
import sys
from html import escape
from pathlib import Path

# Where the demos are deployed. Used for absolute link-preview (og:) URLs.
BASE_URL = "https://bridal-demos.vercel.app"
ROUTE = "bridal"   # URL folder the demos are served from. vercel.json copies demos into site/bridal/ (change both together)

HERE = Path(__file__).resolve().parent
DEMOS = HERE / "demos"
ENGINE = HERE / "engine"


class LeadError(Exception):
    pass


# --------------------------------------------------------------------------
# Presets: language flavour, font pairings, leaf motifs
# --------------------------------------------------------------------------

LANGUAGES = {
    "english": dict(chapters=["One", "Two", "Three", "Four", "Five", "Six"], scroll="Scroll",
                    farewell="See you soon.", greeting=["Hello,", "beautiful."], thanks="Thank you",
                    booking_label="Let’s talk", roots_word="Roots.", about_word="Lovely to meet you."),
    "italian": dict(chapters=["Uno", "Due", "Tre", "Quattro", "Cinque", "Sei"], scroll="Scorri",
                    farewell="Ci vediamo presto.", greeting=["Ciao,", "bella."], thanks="Grazie",
                    booking_label="Ci vediamo", roots_word="Radici.", about_word="Piacere."),
    "french":  dict(chapters=["Un", "Deux", "Trois", "Quatre", "Cinq", "Six"], scroll="Défiler",
                    farewell="À très bientôt.", greeting=["Bonjour,", "belle."], thanks="Merci",
                    booking_label="À bientôt", roots_word="Racines.", about_word="Enchantée."),
    "spanish": dict(chapters=["Uno", "Dos", "Tres", "Cuatro", "Cinco", "Seis"], scroll="Desliza",
                    farewell="¡Hasta pronto!", greeting=["Hola,", "guapa."], thanks="Gracias",
                    booking_label="Hasta pronto", roots_word="Raíces.", about_word="Encantada."),
    "german":  dict(chapters=["Eins", "Zwei", "Drei", "Vier", "Fünf", "Sechs", "Sieben", "Acht", "Neun", "Zehn"], scroll="Scrollen",
                    farewell="Bis bald.", greeting=["Hallo,", "schön."], thanks="Danke",
                    booking_label="Termin", roots_word="Wurzeln.", about_word="Schön, dich zu sehen.", html="de"),
    "hindi":   dict(chapters=["Ek", "Do", "Teen", "Chaar", "Paanch", "Chhah"], scroll="Scroll",
                    farewell="Phir milenge.", greeting=["Namaste,", "dulhan."], thanks="Shukriya",
                    booking_label="Milte hain", roots_word="Jadein.", about_word="Namaste."),
}

FONTS = {
    "italian":     ("Bodoni Moda", "Italianno", "Jost",
                    "family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400&family=Italianno&family=Jost:wght@300;400;500"),
    "soft-modern": ("Cormorant Garamond", "Pinyon Script", "Manrope",
                    "family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Pinyon+Script&family=Manrope:wght@300;400;500"),
    "boho":        ("Playfair Display", "Great Vibes", "Karla",
                    "family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Great+Vibes&family=Karla:wght@300;400;500"),
    "french":      ("Gilda Display", "Parisienne", "Montserrat",
                    "family=Gilda+Display&family=Parisienne&family=Montserrat:wght@300;400;500"),
    "royal":       ("Cinzel", "Allura", "Lato",
                    "family=Cinzel:wght@400;500&family=Allura&family=Lato:wght@300;400"),
}

# deep (footer), deep2, line-art colour for each leaf motif
MOTIFS = {
    "olive":      ("#3F4A35", "#4C5842", "#8C977A"),
    "eucalyptus": ("#3E4639", "#4B5446", "#8E9A86"),
    "laurel":     ("#384534", "#465441", "#8A9A7E"),
    "willow":     ("#40473F", "#4D554B", "#949C8C"),
}

COLOR_KEYS = ["ivory", "blush", "blush2", "accent", "accentDark", "ink", "muted",
              "deep", "deep2", "line", "silk", "silkEdge"]

# --------------------------------------------------------------------------
# Validation
# --------------------------------------------------------------------------

REQUIRED = ["slug", "business", "wordmark", "first_name", "city", "accent", "hero", "about",
            "journey", "reviews", "looks", "booking", "studio_lines"]


def instagram(lead: dict):
    """Normalise the optional 'instagram' field to {url, handle, cta?, button?}."""
    ig = lead.get("instagram")
    if not ig:
        return None
    if isinstance(ig, str):
        ig = {"url": ig}
    url = ig.get("url", "")
    handle = ig.get("handle") or re.sub(r".*instagram\.com/([^/?#]+).*", r"\1", url).lstrip("@")
    return {**ig, "url": url, "handle": handle}


def strs(v, lo, hi):
    return isinstance(v, list) and lo <= len(v) <= hi and all(isinstance(x, str) and x.strip() for x in v)


def images_needed(lead: dict) -> list[str]:
    need = ["hero.jpg", "detail.jpg", "portrait.jpg", "at-work.jpg", "party.jpg", "party-2.jpg"]
    need += [f"step{i}.jpg" for i in range(1, len(lead["journey"]) + 1)]
    need += [f"look{i}.jpg" for i in range(1, 8)]
    reels = lead.get("reels")
    if reels:
        need += [f"reel{i}.jpg" for i in range(1, len(reels["items"]) + 1)]
    need += [f"guide{i}.jpg" for i in range(1, len(lead.get("guides") or []) + 1)]
    need += [s["image"] for s in lead["booking"]["services"] if s.get("image")]
    sp = lead.get("spotlight")
    if sp and sp.get("image"):
        need.append(sp["image"])
    need += [x["image"] for x in (lead.get("services_section") or {}).get("items", []) if x.get("image")]
    return list(dict.fromkeys(need))


def validate(lead: dict) -> list[str]:
    errs = []
    for k in REQUIRED:
        v = lead.get(k)
        if v is None or v == "" or v == [] or v == {}:
            errs.append(f"missing field '{k}'")
    if errs:
        return errs

    slug = lead["slug"]
    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", slug):
        errs.append("'slug' must be lowercase letters, digits and dashes")
    if not (lead.get("phone") or lead.get("email") or lead.get("instagram")):
        errs.append("give at least one way to book: 'phone', 'email' or 'instagram'")
    ig = lead.get("instagram")
    if ig and not re.match(r"https://(www\.)?instagram\.com/[A-Za-z0-9._]+/?$", ig if isinstance(ig, str) else str(ig.get("url", ""))):
        errs.append("'instagram' must be a profile URL like https://www.instagram.com/handle/ (or {url, cta?, button?})")
    if not strs(lead["wordmark"], 2, 2):
        errs.append("'wordmark' must be 2 strings, e.g. [\"BRIDAL\", \"HAIRSTYLES\"]")
    if not re.fullmatch(r"#[0-9a-fA-F]{6}", str(lead["accent"])):
        errs.append("'accent' must be a 6-digit hex colour like #C9846A")
    lang = lead.get("language", "english")
    if lang not in LANGUAGES:
        errs.append(f"'language' must be one of: {', '.join(LANGUAGES)}")
    fonts = lead.get("fonts", "soft-modern")
    if isinstance(fonts, str) and fonts not in FONTS:
        errs.append(f"'fonts' must be one of: {', '.join(FONTS)} (or a custom object)")
    if isinstance(fonts, dict) and not all(fonts.get(k) for k in ("display", "script", "body", "href")):
        errs.append("custom 'fonts' must be {display, script, body, href}")
    if lead.get("motif", "olive") not in MOTIFS:
        errs.append(f"'motif' must be one of: {', '.join(MOTIFS)}")
    colors = lead.get("colors") or {}
    bad = [k for k in colors if k not in COLOR_KEYS or not re.fullmatch(r"#[0-9a-fA-F]{6}", str(colors[k]))]
    if bad:
        errs.append(f"'colors' has unknown keys or bad hex values: {', '.join(bad)}")

    h = lead["hero"]
    if not isinstance(h, dict) or not h.get("lead") or not strs(h.get("facts"), 1, 3) or not h.get("detail_caption"):
        errs.append("'hero' must be {lead, facts: 1 to 3 strings, detail_caption} (optional: greeting, eyebrow)")
    a = lead["about"]
    if not isinstance(a, dict) or not a.get("sub") or not strs(a.get("paragraphs"), 1, 4):
        errs.append("'about' must be {sub, paragraphs: 1 to 4 strings} (optional: heading, signature)")
    j = lead["journey"]
    if not isinstance(j, list) or not 3 <= len(j) <= 6 or not all(isinstance(x, dict) and x.get("title") and x.get("text") for x in j):
        errs.append("'journey' must be 3 to 6 x {title, text} (optional: short, kicker, quote, cite)")
    rv = lead["reviews"]
    if not isinstance(rv, list) or not 3 <= len(rv) <= 8 or not all(isinstance(x, dict) and x.get("text") and x.get("name") for x in rv):
        errs.append("'reviews' must be 3 to 8 x {text, name}: real reviews, word for word")
    lk = lead["looks"]
    if not isinstance(lk, list) or len(lk) != 7 or not all(isinstance(x, dict) and x.get("tag") and x.get("title") for x in lk):
        errs.append("'looks' must be exactly 7 x {tag, title}")
    r = lead.get("reels")
    if r is not None:
        items = r.get("items") if isinstance(r, dict) else None
        if not isinstance(r, dict) or not r.get("text") or not isinstance(items, list) or not 3 <= len(items) <= 8 \
                or not all(isinstance(x, dict) and x.get("title") for x in items):
            errs.append("'reels' must be {text, items: 3 to 8 x {title, duration?}}")
    g = lead.get("guides")
    if g is not None and (not isinstance(g, list) or not 1 <= len(g) <= 3 or not all(isinstance(x, dict) and x.get("title") and x.get("text") for x in g)):
        errs.append("'guides' must be 1 to 3 x {title, text, url?}")
    b = lead["booking"]
    sv = b.get("services") if isinstance(b, dict) else None
    if not isinstance(b, dict) or not strs(b.get("facts"), 1, 4) or not isinstance(sv, list) or not 2 <= len(sv) <= 4 \
            or not all(isinstance(x, dict) and x.get("title") and x.get("text") and x.get("image") and x.get("quote") for x in sv):
        errs.append("'booking' must be {facts: 1 to 4 strings, services: 2 to 4 x {title, text, image, quote}}")
    if not strs(lead["studio_lines"], 1, 3):
        errs.append("'studio_lines' must be 1 to 3 strings")
    for x in rv if isinstance(rv, list) else []:
        if isinstance(x, dict) and "placeholder" in x and not isinstance(x["placeholder"], bool):
            errs.append("a review's 'placeholder' must be true or false")

    # optional sections: selected clients, featured in, video testimonials
    for key, hi, need in (("clients", 16, ["name"]), ("featured", 12, ["outlet"]), ("videos", 8, ["name", "poster"])):
        v = lead.get(key)
        if v is None:
            continue
        items = v.get("items") if isinstance(v, dict) else None
        if not isinstance(items, list) or not 1 <= len(items) <= hi \
                or not all(isinstance(x, dict) and all(x.get(k) for k in need) for x in items):
            errs.append(f"'{key}' must be {{items: 1 to {hi} x {{{', '.join(need)}}}}} (optional: label, navLabel, heading, text)")
    for x in (lead.get("videos") or {}).get("items", []) if isinstance(lead.get("videos"), dict) else []:
        e = x.get("embed")
        if e and not re.match(r"https://(www\.)?(youtube(-nocookie)?\.com/embed/|player\.vimeo\.com/video/)", e):
            errs.append("a video 'embed' must be a YouTube or Vimeo embed URL (https://www.youtube.com/embed/ID or https://player.vimeo.com/video/ID)")

    if not errs:
        img = DEMOS / slug / "img"
        missing = [n for n in images_needed(lead) if not (img / n).is_file()]
        extra = [c["image"] for c in (lead.get("clients") or {}).get("items", []) if c.get("image")]
        extra += [v["poster"] for v in (lead.get("videos") or {}).get("items", [])]
        missing += [n for n in dict.fromkeys(extra) if not (img / n).is_file()]
        if missing:
            errs.append(f"missing image(s) in demos/{slug}/img/: {', '.join(missing)}")
        vids = [v["file"] for v in (lead.get("videos") or {}).get("items", []) if v.get("file")]
        miss_v = [n for n in vids if not (DEMOS / slug / "video" / n).is_file()]
        if miss_v:
            errs.append(f"missing video file(s) in demos/{slug}/video/: {', '.join(miss_v)}")
    return errs


# --------------------------------------------------------------------------
# Colour: whole palette from one accent (bridal pages are always light)
# --------------------------------------------------------------------------

def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def rgb_to_hex(rgb):
    return "#" + "".join(f"{round(max(0, min(1, c)) * 255):02x}" for c in rgb)


def hls(h, l, s):
    return rgb_to_hex(colorsys.hls_to_rgb(h % 1, max(0, min(1, l)), max(0, min(1, s))))


def luminance(hexc):
    def ch(c):
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (ch(c) for c in hex_to_rgb(hexc))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    la, lb = sorted((luminance(a), luminance(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def push_contrast(h, l, s, against, target):
    c = hls(h, l, s)
    for _ in range(100):
        if contrast(c, against) >= target:
            break
        l -= 0.01
        c = hls(h, l, s)
    return c


def palette(lead: dict) -> dict:
    h, l, s = colorsys.rgb_to_hls(*hex_to_rgb(lead["accent"]))
    ivory = hls(h, 0.967, min(max(s, 0.25), 0.45))
    blush = hls(h, 0.895, min(max(s, 0.30), 0.42))
    deep, deep2, line = MOTIFS[lead.get("motif", "olive")]
    pal = {
        "ivory": ivory,
        "blush": blush,
        "blush2": hls(h, 0.935, min(max(s, 0.28), 0.42)),
        "accent": push_contrast(h, l, max(s, 0.3), ivory, 2.6),
        "accentDark": push_contrast(h, min(l, 0.5), max(s, 0.3), blush, 4.5),
        "ink": hls(h, 0.19, min(s, 0.30)),
        "muted": push_contrast(h, 0.40, min(s, 0.18), blush, 4.6),
        "deep": deep, "deep2": deep2, "line": line,
        "silk": hls(h, 0.86, min(max(s, 0.30), 0.45)),
        "silkEdge": hls(h, 0.66, min(max(s, 0.25), 0.40)),
    }
    pal.update(lead.get("colors") or {})
    return pal


# --------------------------------------------------------------------------
# Lead -> engine config (window.SITE)
# --------------------------------------------------------------------------

DEFAULT_JOURNEY_HEADING = "From first hello *to the last dance.*"


def site_config(lead: dict) -> dict:
    L = LANGUAGES[lead.get("language", "english")]
    first, alts, pos = lead["first_name"], lead.get("alts") or {}, lead.get("positions") or {}
    lb = lead.get("labels") or {}

    def img(name, alt):
        key = name.rsplit(".", 1)[0]
        o = {"src": f"img/{name}", "alt": alts.get(key, alt)}
        if pos.get(key):
            o["pos"] = pos[key]
        return o

    f = lead.get("fonts", "soft-modern")
    if isinstance(f, str):
        d, sc, b, fam = FONTS[f]
        fonts = {"display": d, "script": sc, "body": b,
                 "href": f"https://fonts.googleapis.com/css2?{fam}&display=swap"}
    else:
        fonts = f

    h, a, bk = lead["hero"], lead["about"], lead["booking"]
    greet = h.get("greeting") or L["greeting"]
    pull = lead.get("pull") or {}
    reels = lead.get("reels")
    reviews = [{"text": r["text"].strip(),
                "name": r["name"] + (lb.get("review_suffix", " · review placeholder") if r.get("placeholder") else ""),
                **({"placeholder": True} if r.get("placeholder") else {})}
               for r in lead["reviews"]]

    def short_quote(r):
        t = r["text"].strip()
        return t if len(t) <= 130 else t[:127].rsplit(" ", 1)[0] + "…"

    cfg = {
        "meta": {"title": lead.get("title") or f"{lead['business']} · Bridal hair in {lead['city']}",
                 "description": lead.get("description") or h["lead"]},
        "brand": {"line1": lead["wordmark"][0], "line2": lead["wordmark"][1], "name": lead["business"],
                  **({"logo": f"img/{lead['logo']}"} if lead.get("logo") else {})},
        "person": {"first": first, "full": lead.get("full_name") or first, "phone": lead.get("phone", ""),
                   "email": lead.get("email", ""), "instagram": instagram(lead),
                   "socials": [{"label": k.capitalize() if k != "tiktok" else "TikTok", **({"url": v} if v else {})}
                               for k, v in (lead.get("socials") or {}).items()]},
        "theme": {"motif": lead.get("motif", "olive"), "colors": palette(lead), "fonts": fonts},
        "words": {"chapters": L["chapters"], "scroll": L["scroll"], "cta": lead.get("cta", "Check your date"),
                  **({"ctaUrl": lead["cta_url"]} if lead.get("cta_url") else {}),
                  "farewell": lead.get("farewell") or L["farewell"]},
        "hero": {
            "eyebrow": h.get("eyebrow") or f"Bridal hair by {first}  ·  " + ", ".join(x for x in (lead.get("area"), lead["city"]) if x),
            "greetingScript": greet[0], "greeting": greet[1], "lead": h["lead"], "secondary": lb.get("secondary", "See the work"),
            **({"cta2": h["cta2"]} if h.get("cta2") else {}),
            "facts": h["facts"], "image": img("hero.jpg", f"A bride styled by {first}"),
            "detail": img("detail.jpg", "A close-up of a bridal hair detail"), "detailCaption": h["detail_caption"],
        },
        "pull": {
            "label": pull.get("label", "Planning a wedding can feel overwhelming."),
            "text": pull.get("text", "The good news? You’ve just found one part you *don’t need to worry about.*"),
            "rootsScript": pull.get("roots_word") or L["roots_word"],
            "roots": pull.get("roots") or f"Calm hands, a clear plan and styles made to last, from your trial to the last dance.",
        },
        "about": {
            "label": lb.get("about", f"Meet {first}"), "heading": a.get("heading") or f"Hi, I’m *{first}.*",
            "sub": a["sub"], "paragraphs": a["paragraphs"], "signature": a.get("signature", first),
            "link": lb.get("about_link", "How your day unfolds"),
            "portrait": img("portrait.jpg", f"{lead.get('full_name') or first}, smiling"),
            "atWork": img("at-work.jpg", f"{first} styling a bride’s hair"),
        },
        "journey": {
            "label": lb.get("journey", "Your journey"), "navLabel": lb.get("journey", "Your journey"),
            "heading": lead.get("journey_heading", DEFAULT_JOURNEY_HEADING),
            "steps": [{"kicker": s.get("kicker") or f"{i:02d} · {s.get('short') or s['title']}",
                       "title": s["title"], "short": s.get("short") or s["title"], "text": s["text"],
                       "quote": s.get("quote", ""), "cite": s.get("cite", ""),
                       "image": img(f"step{i}.jpg", s["title"])}
                      for i, s in enumerate(lead["journey"], 1)],
        },
        "reels": reels and {
            "label": lb.get("reels", "Behind the scenes"), "heading": reels.get("heading", "Real mornings, *real brides.*"),
            **({"cta": reels["cta"]} if reels.get("cta") else {}),
            "text": reels["text"], "note": reels.get("note") or f"{first}’s reel plays here on the live site.",
            "items": [{**img(f"reel{i}.jpg", r["title"]), "title": r["title"], "duration": r.get("duration", "")}
                      for i, r in enumerate(reels["items"], 1)],
        },
        "testimonials": {"label": lb.get("words", "Kind words"), "photo": img("party.jpg", "A bride and her bridal party"),
                         "photoSmall": img("party-2.jpg", "A bridal party celebrating"), "items": reviews},
        "work": {"label": lb.get("work", "The work"), "heading": lead.get("looks_heading", "The work, *up close.*"),
                 "text": lead.get("looks_text", "Every bride, her own style."),
                 "moreLabel": lb.get("more", "Full portfolio"), "moreUrl": lead.get("portfolio_url") or ("" if lb.get("more") == "" else "#work"),
                 "items": [{**img(f"look{i}.jpg", f"{x['title']}, bridal hair by {first}"), "tag": x["tag"], "title": x["title"]}
                           for i, x in enumerate(lead["looks"], 1)]},
        "guides": {"heading": "For the *bride.*", "label": lead.get("guides_label", f"Honest answers, from {first}"),
                   "kicker": "Guide", "more": "Read the guide",
                   "items": [{"src": f"img/guide{i}.jpg", "title": g["title"], "text": g["text"], "url": g.get("url") or "#guides"}
                             for i, g in enumerate(lead.get("guides") or [], 1)]},
        "booking": {
            "label": bk.get("label") or L["booking_label"], "heading": bk.get("heading", "Check *your date.*"),
            "intro": bk.get("intro", "Tell me a little about your day. I’ll reply with my availability and a quote tailored to you."),
            "facts": bk["facts"],
            "services": [{"id": s.get("id") or re.sub(r"[^a-z0-9]+", "-", s["title"].lower()).strip("-"),
                          "title": s["title"], "text": s["text"], **img(s["image"], s["title"]), "quote": s["quote"]}
                         for s in bk["services"]],
            "thanksWord": L["thanks"],
            "thanksText": bk.get("thanks_text") or f"Your enquiry is with {first}. She’ll be in touch about",
            "submit": bk.get("submit", "Send my enquiry"),
            **({"noForm": True, "ctas": bk.get("ctas", [])} if bk.get("no_form") else {}),
            **{k: bk[k] for k in ("question", "labels", "hide", "people", "times") if k in bk},
            **({"thanksDateFallback": bk["thanks_fallback"]} if bk.get("thanks_fallback") else {}),
        },
        "footer": {"studio": lead["studio_lines"], "credit": lead.get("credit", "Demo site · concept by Codzo")},
    }

    # optional sections (only added when the lead has them, so other demos are unchanged)
    cl, ft, vd = lead.get("clients"), lead.get("featured"), lead.get("videos")
    if cl:
        cfg["clients"] = {
            "label": cl.get("label", "Selected clients"), "navLabel": cl.get("navLabel", "Clients"),
            "heading": cl.get("heading", "Selected *clients.*"), "text": cl.get("text", ""),
            "items": [{"name": c["name"], "role": c.get("role", ""), "url": c.get("url", ""),
                       **({"image": img(c["image"], c["name"])} if c.get("image") else {})} for c in cl["items"]]}
    if ft:
        cfg["featured"] = {
            "label": ft.get("label", "In the press"), "navLabel": ft.get("navLabel", "Press"),
            "heading": ft.get("heading", "As seen *in.*"), "text": ft.get("text", ""), "more": ft.get("more", "Read"),
            "items": [{"outlet": f["outlet"], "title": f.get("title", ""), "year": str(f.get("year", "")), "url": f.get("url", "")}
                      for f in ft["items"]]}
    if lead.get("ui"):
        cfg["ui"] = lead["ui"]
    if lead.get("sticky"):
        cfg["sticky"] = lead["sticky"]
    sp = lead.get("spotlight")
    if sp:
        cfg["spotlight"] = {k: sp[k] for k in ("label", "navLabel", "heading", "text", "text2", "ctas", "cards") if k in sp}
        cfg["spotlight"]["image"] = img(sp["image"], sp.get("alt", sp["heading"]))
    ss = lead.get("services_section")
    if ss:
        cfg["servicesSec"] = {"label": ss.get("label", "Services"), "navLabel": ss.get("navLabel", ss.get("label", "Services")),
                              "heading": ss.get("heading", "Services"), "text": ss.get("text", ""),
                              "items": [{"title": x["title"], "text": x["text"], "status": x.get("status", ""),
                                         **({"image": img(x["image"], x["title"])} if x.get("image") else {})} for x in ss["items"]]}
    fq = lead.get("faq")
    if fq:
        cfg["faq"] = {"label": fq.get("label", "FAQ"), "navLabel": fq.get("navLabel", fq.get("label", "FAQ")),
                      "heading": fq.get("heading", "Questions"), "text": fq.get("text", ""),
                      "items": [{"q": x["q"], "a": x["a"]} for x in fq["items"]]}
    inf = lead.get("info")
    if inf:
        cfg["info"] = {"label": inf.get("label", "Good to know"), "navLabel": inf.get("navLabel", "Good to know"),
                       "heading": inf.get("heading", "Good to *know.*"), "text": inf.get("text", ""),
                       "cards": [{"title": c["title"], "kind": c.get("kind", "bullets"), "items": list(c["items"]),
                                  **({"note": c["note"]} if c.get("note") else {})} for c in inf["cards"]]}
    if vd:
        cfg["videos"] = {
            "label": vd.get("label", "Client stories"), "navLabel": vd.get("navLabel", "Stories"),
            "heading": vd.get("heading", "Hear it *from them.*"), "text": vd.get("text", ""),
            "note": vd.get("note", "The video plays here on the live site."),
            "items": [{"name": v["name"], "role": v.get("role", ""), "quote": v.get("quote", ""),
                       "poster": img(v["poster"], f"Video: {v['name']}"),
                       "src": f"video/{v['file']}" if v.get("file") else "", "embed": v.get("embed", "")}
                      for v in vd["items"]]}
    return cfg


PAGE = """<!DOCTYPE html>
<html lang="__LANG__">
<head>
<meta charset="utf-8">
<script>if(!/\\/$/.test(location.pathname)&&!/\\.html$/.test(location.pathname))location.replace(location.pathname+"/"+location.search+location.hash);</script>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>__TITLE__</title>
<meta name="description" content="__DESCRIPTION__">
<meta name="theme-color" content="__THEME__">
<meta property="og:type" content="website">
<meta property="og:title" content="__TITLE__">
<meta property="og:description" content="__DESCRIPTION__">
<meta property="og:url" content="__URL__">
<meta property="og:image" content="__URL__img/hero.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<style>
__CSS__
</style>
</head>
<body>
<!-- Built by build.py from leads.json. Do not edit by hand: edit the lead and rebuild. -->
<script>window.SITE = __SITE__;</script>
<script>
__JS__
</script>
</body>
</html>
"""


def build(lead: dict) -> Path:
    errs = validate(lead)
    if errs:
        raise LeadError("\n  - " + "\n  - ".join(errs))
    cfg = site_config(lead)
    site = json.dumps(cfg, ensure_ascii=False, indent=1).replace("</", "<\\/")
    url = f"{BASE_URL}/{ROUTE}/{lead['slug']}/"
    html = PAGE
    for key, val in (("__LANG__", LANGUAGES[lead.get("language", "english")].get("html", "en")),
                     ("__TITLE__", escape(cfg["meta"]["title"])),
                     ("__DESCRIPTION__", escape(cfg["meta"]["description"])),
                     ("__THEME__", cfg["theme"]["colors"]["ivory"]), ("__URL__", url),
                     ("__CSS__", (ENGINE / "engine.css").read_text(encoding="utf-8")),
                     ("__SITE__", site),
                     ("__JS__", (ENGINE / "engine.js").read_text(encoding="utf-8"))):
        html = html.replace(key, val)
    out = DEMOS / lead["slug"] / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8", newline="\n")
    return out


def main(argv):
    try:
        leads = json.loads((HERE / "leads.json").read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        sys.exit(f"leads.json is not valid JSON: {e}")
    if not isinstance(leads, list):
        sys.exit("leads.json must be a list of lead objects")

    wanted = argv[1:]
    known = {l.get("slug") for l in leads}
    unknown = [w for w in wanted if w not in known]
    if unknown:
        sys.exit(f"No lead with slug: {', '.join(unknown)} (check leads.json)")
    targets = [l for l in leads if not wanted or l.get("slug") in wanted]
    if not targets:
        sys.exit("leads.json has no leads yet. Add one (see README.md).")

    failed = 0
    for lead in targets:
        try:
            print("built", build(lead).relative_to(HERE).as_posix())
        except LeadError as e:
            failed += 1
            print(f"FAILED {lead.get('slug', '?')}:{e}", file=sys.stderr)
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main(sys.argv)
