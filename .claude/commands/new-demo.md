---
description: Turn everything known about a bridal stylist into a finished private demo site
argument-hint: <client name or slug>, then paste their content, links, reviews and photos
---

Build a new bridal demo for: $ARGUMENTS

Follow CLAUDE.md. In order:

1. **Collect.** Read everything the user pasted or attached: website text, Instagram bio, Google/Bridebook reviews, phone, email, area, services, prices, screenshots, photos, screen recordings. If they gave a screen recording, run `python tools/frames.py <file>`, open the contact sheet, and crop each photo you need into `demos/<slug>/img/`, removing any cursor.
2. **Plan the story.** Pick `language` (their heritage, or `english`), `fonts`, `motif` and an `accent` taken from their own branding. Map their real services onto 3 to 6 journey steps, and pair each step with a real review line.
3. **Write the lead.** Add one entry to `leads.json`, copying the shape of `alice-wilford`. Reviews go in word for word. Anything you don't have becomes a `[bracketed]` placeholder or a review with `"placeholder": true`. Never invent a quote, a number, a price or a credential.
4. **Photos.** Save them under the exact names `build.py` expects (README → Photos). Prefer their own photos. If one is missing, reuse their best other photo, never a stranger's.
5. **Build and check:** `python build.py <slug>`, then `python check.py <slug>`. Fix anything it reports and rebuild.
6. **Look.** Open `shots/<slug>-desktop.png` and `shots/<slug>-mobile.png` and check the crops, text fit and overall feel.
7. **Report back** in a short list: the local URL (`http://localhost:8000/<slug>/` after `python -m http.server 8000 -d demos`), the live URL (`https://bridal-demos.vercel.app/<slug>/` once pushed), every placeholder still on the page, and anything you weren't sure about. Don't commit or push unless the user asks.
