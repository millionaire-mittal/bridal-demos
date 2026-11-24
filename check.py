"""Screenshot built demos at desktop and phone width, and run quick sanity checks.

Usage:
    python check.py                       # every built demo
    python check.py alice-wilford         # one or more slugs

Writes shots/<slug>-desktop.png (1400px) and shots/<slug>-mobile.png (390px),
and reports: console errors, horizontal overflow on mobile, whether the enquiry
form shows its thank-you state, and any [placeholder] text or placeholder
reviews still on the page. A demo with placeholders is marked NOT READY TO SEND.

Needs Playwright:  pip install playwright && python -m playwright install chromium
"""
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
SHOTS = HERE / "shots"

SCROLL_THROUGH = """async () => {
  const step = Math.round(innerHeight * 0.5);
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    scrollTo(0, y); await new Promise(r => setTimeout(r, 90));
  }
  document.querySelectorAll('[data-reveal],[data-blur],[data-fade],svg.bot,#bow').forEach(e => e.classList.add('in'));
  const imgs = [...document.images];
  imgs.forEach(i => { i.loading = 'eager'; });
  await Promise.all(imgs.map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; setTimeout(r, 4000); })));
  scrollTo(0, 0); await new Promise(r => setTimeout(r, 400));
}"""

FORM_TEST = """() => {
  document.getElementById('f-name').value = 'Asha Rao';
  document.getElementById('f-email').value = 'asha@example.com';
  var fd = document.getElementById('f-date'); if (fd) fd.value = '2027-06-12';
  document.getElementById('bookForm').dispatchEvent(new Event('submit', {cancelable: true}));
  const main = document.getElementById('bookMain');
  return {sent: main.classList.contains('sent'), thanks: main.querySelector('.thanks').innerText.trim()};
}"""

PLACEHOLDERS = """() => {
  const txt = document.body.innerText;
  const brackets = [...new Set((txt.match(/\\[[^\\]\\n]{1,60}\\]/g) || []))];
  const marked = [...document.querySelectorAll('.ph')].map(e => e.textContent);
  const reviews = (txt.match(/review placeholder/gi) || []).length;
  return {brackets, marked, reviews};
}"""


def check(slug: str, browser) -> bool:
    page_path = HERE / "demos" / slug / "index.html"
    if not page_path.is_file():
        print(f"{slug}: not built yet (run python build.py {slug})")
        return False
    ok, ready = True, True
    SHOTS.mkdir(exist_ok=True)
    for label, width, height, mobile in (("desktop", 1400, 900, False), ("mobile", 390, 844, True)):
        ctx = browser.new_context(viewport={"width": width, "height": height},
                                  device_scale_factor=1 if not mobile else 2,
                                  is_mobile=mobile, has_touch=mobile)
        page = ctx.new_page()
        errors = []
        page.on("console", lambda m: m.type == "error" and errors.append(m.text))
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(page_path.as_uri(), wait_until="load")
        page.evaluate(SCROLL_THROUGH)
        page.wait_for_timeout(600)
        overflow = page.evaluate("document.documentElement.scrollWidth - innerWidth")
        out = SHOTS / f"{slug}-{label}.png"
        page.screenshot(path=str(out), full_page=True)
        # Font requests fail when offline; they are not page errors.
        errors = [e for e in errors if "fonts.g" not in e and "ERR_INTERNET_DISCONNECTED" not in e
                  and "Failed to load resource" not in e]
        print(f"{slug} {label}: {out.relative_to(HERE).as_posix()}")
        if errors:
            ok = False
            print("  console errors:", *errors, sep="\n    ")
        if overflow > 0:
            ok = False
            print(f"  page is {overflow}px wider than the screen (horizontal scroll)")
        if not mobile:
            res = page.evaluate(FORM_TEST)
            if not res["sent"]:
                ok = False
                print("  enquiry form did not show its thank-you state")
            else:
                print("  form:", res["thanks"].replace("\n", " "))
            ph = page.evaluate(PLACEHOLDERS)
            if ph["brackets"] or ph["marked"] or ph["reviews"]:
                ready = False
                if ph["marked"]:
                    print("  placeholders on the page:", ", ".join(ph["marked"]))
                if ph["brackets"]:
                    print("  [bracketed] text still in the copy:", ", ".join(ph["brackets"][:12]),
                          "…" if len(ph["brackets"]) > 12 else "")
                if ph["reviews"]:
                    print(f"  {ph['reviews']} placeholder review(s): replace with real reviews")
        ctx.close()
    print(f"  => {'OK' if ok else 'PROBLEMS FOUND'}{'' if ready else ', NOT READY TO SEND (placeholders left)'}")
    return ok


def main(argv):
    slugs = argv[1:] or sorted(p.parent.name for p in (HERE / "demos").glob("*/index.html"))
    if not slugs:
        sys.exit("Nothing built yet. Run python build.py first.")
    with sync_playwright() as p:
        browser = p.chromium.launch()
        results = [check(s, browser) for s in slugs]
        browser.close()
    if not all(results):
        sys.exit(1)


if __name__ == "__main__":
    main(sys.argv)
