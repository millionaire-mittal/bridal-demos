# bridal-demos

Private demo websites for bridal hair and makeup artists. Each demo is a scroll-told story of the bride's day with the stylist, built from the stylist's own photos, words and reviews. It's shown privately to that stylist to sell them a website.

One engine, one entry per stylist, one self-contained page each:

```
leads.json  ->  python build.py <slug>  ->  demos/<slug>/index.html  ->  Vercel, served at /bridal/<slug>/
```

Every demo has: a greeting in the stylist's heritage language, arch-framed photos, line-art botanicals that draw themselves, an olive (or eucalyptus, laurel, willow) tree that grows as you scroll and shrinks back as you scroll up, a pinned "your journey" chapter, reels that slide sideways, rotating reviews, a 7-look portfolio, a booking form with a service picker, and one silk ribbon threading the whole page that ties into a bow at the form. It also works on mobile and respects reduced motion.

## Fastest way: Claude Code

Open the repo in VS Code with Claude Code and run:

```
/new-demo sophia-bristol
```

Then paste everything you have: their website text, Instagram bio, reviews, phone, email and services, and attach photos or a screen recording of their site. Claude writes the lead, places the photos, builds, checks, and tells you what's still missing. The rules it follows are in `CLAUDE.md`.

## Repo layout

| Path | What it is |
| --- | --- |
| `leads.json` | One object per stylist (the only file you edit for a new demo) |
| `engine/engine.css`, `engine/engine.js` | The design and every effect, shared by all demos |
| `build.py` | Validates a lead and renders `demos/<slug>/index.html` |
| `check.py` | Screenshots a demo at 1400px and 390px and runs sanity checks |
| `tools/frames.py` | Pulls frames out of a screen recording of their site |
| `demos/<slug>/img/` | That stylist's photos |
| `.claude/commands/new-demo.md` | The `/new-demo` command |
| `vercel.json` | Serves `demos/` with clean URLs and a `noindex` header |

## Lead format

| Field | Example | Notes |
| --- | --- | --- |
| `slug` | `"alice-wilford"` | Folder and URL name. Lowercase, digits, dashes |
| `business` | `"Bridal Hairstyles by Alice"` | |
| `wordmark` | `["BRIDAL", "HAIRSTYLES"]` | Two-line logo in the nav and footer |
| `first_name`, `full_name` | `"Alice"`, `"Alice Paonessa"` | `full_name` optional. If the stylist's name isn't public, use the brand (e.g. `"VKX Glam"`) |
| `area`, `city` | `"Wilford"`, `"Nottingham"` | `area` optional |
| `phone`, `email` | | Optional, shown as written. A lead needs at least one of phone, email or instagram |
| `instagram` | `{"url": "https://www.instagram.com/vkxglam/", "handle": "vkxglam", "cta": "DM @vkxglam to book"}` | Optional. For DM-to-book stylists: adds a DM link in the hero, a "DM on Instagram" button by the form, and Instagram in the footer |
| `socials` | `{"instagram": "https://…"}` | Optional. Empty string shows the name without a link |
| `language` | `"italian"` | `english` (default), `italian`, `french`, `spanish`, `hindi`. Sets the greeting, chapter numbers (*Uno, Due…*), the "Scroll" word, the farewell and the thank-you word |
| `fonts` | `"italian"` | `italian`, `soft-modern` (default), `boho`, `french`, `royal`, or `{display, script, body, href}` |
| `motif` | `"olive"` | `olive`, `eucalyptus`, `laurel`, `willow`: leaf shape of every drawing and the tree |
| `accent` | `"#C9846A"` | One hex colour from their branding. The whole palette is generated from it |
| `colors` | | Optional exact overrides: `ivory blush blush2 accent accentDark ink muted deep deep2 line silk silkEdge` |
| `hero` | `{lead, facts, detail_caption}` | `facts`: 1 to 3 short strings. Optional `greeting: ["Ciao,", "bella."]`, `eyebrow` |
| `pull` | `{roots}` | Optional. The line under the growing tree. Also `roots_word`, `label`, `text` |
| `about` | `{sub, paragraphs}` | 1 to 4 paragraphs in their voice. Optional `heading`, `signature` |
| `journey` | 3 to 6 × `{title, text, short?, kicker?, quote?, cite?}` | The pinned chapter. One screen per step. Pair each step with a real review line |
| `reels` | `{text, items: 3 to 8 × {title, duration?}}` | Optional. Leave out to hide the section |
| `reviews` | 3 to 8 × `{text, name}` | Real reviews, word for word. `"placeholder": true` marks one to replace |
| `looks` | exactly 7 × `{tag, title}` | Portfolio. Look 1 shows largest, look 7 is landscape |
| `looks_text` | one sentence | Under the portfolio heading |
| `guides` | 1 to 3 × `{title, text, url?}` | Optional (their blog or FAQ) |
| `booking` | `{facts, services}` | `facts`: 1 to 4 strings, where `[brackets]` show as an underlined placeholder. `services`: 2 to 4 × `{title, text, image, quote}`; the side photo and quote change when one is picked |
| `studio_lines` | `["Wilford, Nottingham", "Trials by appointment"]` | Footer |
| `positions` | `{"step2": "50% 30%"}` | Optional focal point per photo (by file name) |
| `alts` | `{"hero": "A bride holding…"}` | Optional alt text per photo. Sensible defaults otherwise |
| `clients` | `{items: [{name, role?, image?, url?}]}` | Optional "Selected clients" section |
| `featured` | `{items: [{outlet, title?, year?, url?}]}` | Optional "As seen in" press section |
| `videos` | `{items: [{name, role?, quote?, file or embed, poster}]}` | Optional video testimonials. `python tools/video.py raw.mov <slug> <name>` makes the mp4 and poster |
| `title` | `"Luxury Makeup Artist in Mumbai \| Name"` | Optional page title (default `<business> · Bridal hair in <city>`) |

In headings, `*asterisks*` set words in the accent italic.

### Photos

Put them in `demos/<slug>/img/` with exactly these names:

| File | What |
| --- | --- |
| `hero.jpg` | Best single bride photo, portrait 3:4 |
| `detail.jpg` | Close-up of a hair detail |
| `portrait.jpg` | The stylist, smiling |
| `at-work.jpg` | The stylist styling someone |
| `step1.jpg` … `stepN.jpg` | One per journey step, portrait |
| `reel1.jpg` … | One per reel (a still from the video), only if `reels` is set |
| `party.jpg`, `party-2.jpg` | Bridal party group shots, landscape |
| `look1.jpg` … `look7.jpg` | Portfolio. `look7` landscape |
| `guide1.jpg` … | One per guide, only if `guides` is set |

Plus any file named in a service's `image`. Keep images around 1400px on the long side. `example-bridal` shows a labelled placeholder for each one.

## Add a new stylist

1. **Find and qualify** them: great reviews and photos, but a weak or dated website (or none).
2. **Gather:** their website text, Instagram, reviews, contact details, services and photos. A screen recording of their site plus `tools/frames.py` captures everything at once.
3. **Write the lead**, by hand or with `/new-demo`. Copy `alice-wilford` as the reference.
4. **Build:** `python build.py <slug>` (`python3` on macOS or Linux). Missing fields or photos are listed exactly.
5. **Check:** `python check.py <slug>`, then look at both screenshots. A demo with placeholders is reported as **NOT READY TO SEND**.
6. **Commit and push.** Vercel redeploys, and the demo is live at `/bridal/<slug>/`. No ZIP download or per-demo Vercel project is needed.

## Preview locally

```
python -m http.server 8000 -d demos
```

Open `http://localhost:8000/<slug>/`. Playwright for `check.py`: `pip install playwright && python -m playwright install chromium`.

## Deploy

Import `millionaire-mittal/bridal-demos` into Vercel and connect the GitHub repo for automatic deploys on push. `vercel.json` serves the shared `demos/` output and rewrites `/bridal/<slug>/` to the matching `demos/<slug>/` page, with clean URLs, trailing slashes and `noindex`. Add each stylist as a lead and their photos under `demos/<slug>/img/`; build and push the new demo, and it is hosted on the same Vercel project at `https://bridal-demos.vercel.app/bridal/<slug>/`. Set `BASE_URL` in `build.py` to the real domain so WhatsApp link previews show the hero photo, then rebuild.

## Rules that protect the pitch

- **Real data only.** Their reviews, their photos, their words. Never invent a review, price or credential.
- **Demos are private.** Keep this repo private on GitHub; every page is `noindex`, and the footer reads "Demo site". Send each link only to that stylist.
- **If they say no**, delete their folder and lead, and push.
- **Paying clients move to their own repo and domain** (a Next.js build), not a shared demo link.
