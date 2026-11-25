# bridal-demos: notes for Claude Code

This repo turns a bridal hair or makeup artist's real content into a private, personalised demo website that Codzo uses to pitch them.

Pipeline: `leads.json` → `python build.py <slug>` → `demos/<slug>/index.html` → `python check.py <slug>` → push → Vercel serves the demo at `/bridal/<slug>/` from the shared project.

The quickest route for a new client is the `/new-demo` command.

## Hard rules

- **Real content only.** Reviews word for word, from their Google, Bridebook, Instagram or website. Never write or "improve" a review, and never invent prices, years, awards, review counts or credentials. Missing facts become `[bracketed]` placeholders, and missing reviews get `"placeholder": true`. `check.py` lists them all.
- **Their photos only.** Use photos from the client's own site or Instagram. Never use stock photos of other brides, and never use photos of a different stylist's work.
- **Edit `leads.json`, not `demos/*/index.html`.** The HTML is generated. To change the design for everyone, edit `engine/engine.css` or `engine/engine.js`, then run `python build.py` to rebuild all demos.
- **Copy in their voice.** First person, warm, short sentences. Rewrite their own website copy rather than inventing new claims. Use the heritage language only as seasoning (greeting, chapter numbers, one or two words); everything else is in English.
- **Publishing:** `/new-demo` commits and pushes the new demo itself (only `leads.json` and `demos/<slug>`). Changes to `engine/`, `build.py` or other demos need the user's OK before pushing. Never force-push. Demos are private: `noindex`, and the link is shared only with that stylist.

## Lead fields at a glance

Required: `slug business wordmark first_name city accent hero about journey reviews looks booking studio_lines`, plus at least one of `phone email instagram`

Optional: `full_name area phone email instagram socials language fonts motif colors description pull reels guides looks_text looks_heading journey_heading portfolio_url positions alts cta farewell title clients featured videos`

`alice-wilford` in `leads.json` is the complete reference. Field rules and presets are in README.md. `build.py` prints exactly what's wrong if a lead or photo doesn't fit.

## Choosing the flavour

| Client | language | fonts | motif |
| --- | --- | --- | --- |
| Italian heritage, classic luxury | italian | italian | olive |
| Modern, soft, minimal | english | soft-modern | eucalyptus |
| Boho, outdoor weddings | english | boho | willow |
| French or Parisian chic | french | french | laurel |
| Spanish or Latin heritage | spanish | boho | olive |
| Indian bridal (MUAs) | hindi | royal | laurel |

Take `accent` from their logo or Instagram grid. One hex is enough, because the whole palette is generated from it.

## Photos from a screen recording

`python tools/frames.py recording.mp4` → `frames/<name>/contact.jpg`. Pick frames, crop each photo with Pillow, paint out the cursor, and save it under the required name in `demos/<slug>/img/`. Aim for about 1400px on the long side and under 300 KB.

## Instagram-only stylists

Many stylists only take bookings by DM. Give them an `instagram` object (see `vkxglam-london`) so the page offers a DM button next to the enquiry form. If the stylist's own photo isn't confirmed, keep the labelled `portrait.jpg` and `at-work.jpg` placeholders and say so in your report. Never guess who the person in a photo is.

## Clients, press and video testimonials (optional sections)

Add `clients` (selected clients), `featured` (press) and `videos` (video testimonials) to a lead and the demo grows a dedicated section for each. Leave them out and nothing changes. Only list names, outlets and quotes the stylist has confirmed. Never infer who is in a photo.

- `clients`: `{items: [{name, role?, image?, url?}]}`. With any `image` it shows portrait cards, otherwise a typographic list.
- `featured`: `{items: [{outlet, title?, year?, url?}]}`. Outlet names are set as text, so no logos are needed.
- `videos`: `{items: [{name, role?, quote?, file | embed, poster}]}`. `file` is an mp4 in `demos/<slug>/video/`, or `embed` is a YouTube or Vimeo embed URL. Run `python tools/video.py raw.mov <slug> <name>` to compress a raw clip (keep each under about 25 MB) and make its poster, then use `"file": "<name>.mp4", "poster": "video-<name>.jpg"`. Quotes go in word for word, and the audio can't be transcribed by Claude, so ask the user for the words.
- Each of the three also takes `label navLabel heading text`.


## Non-bridal clients (booking form labels)

The enquiry form defaults to bridal wording (wedding date, venue, who needs styling, ready by). For other kinds of business, set these optional keys inside `booking`: `question` (the chip question), `labels` (`date venue venuePlaceholder people time msg msgPlaceholder`), `hide` (any of `date people time venue` to drop a field) and `thanks_fallback` (the word after "about" on the thank-you screen). See `cotton-craaft` in `leads.json`. Leave them out and nothing changes.

## Terms, aftercare and other info cards (optional)

`info`: `{label, navLabel, heading, text?, cards: [{title, kind: "bullets" | "steps", items: [str], note?}]}` adds a section of side-by-side cards after the work gallery. Use it for the client's own terms and conditions or aftercare, word for word. See `henna-by-prabh`.

## German salon demo (Elis Coiffeur) and the extra optional blocks

`language: "german"` sets `lang="de"` and German chapter numbers. The fixed interface wording can be overridden per lead, all optional: `labels` (`journey about about_link secondary words work more reels review_suffix`; `more: ""` hides the portfolio link), `ui` (`skip aboutNav top studio contact follow dm call or soon phTitle stickyLabel`), `credit`, `cta_url` (makes every main button open that URL), `hero.cta2` (second hero link, e.g. a `tel:` link), `sticky` (a mobile contact bar of `{label, url}` buttons), `booking.no_form` with `booking.ctas` (replaces the enquiry form by buttons), and three new sections: `services_section` (cards with optional image and status), `spotlight` (a dark highlight section with cards and CTAs, used for Extensions) and `faq` (`{label, heading, items: [{q, a}]}`). See `elis-coiffeur` in `leads.json`. `ROUTE` in `build.py` is the URL folder (`bridal`); a `/salon/` route would also need `vercel.json` to copy the demos there.
