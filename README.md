# Snip & Sprout Co. website

The new website for Snip & Sprout Co., Dani's indoor plant boutique at 413 E. Emma Ave. in downtown
Springdale, AR. Built by Stray Wolf Technology.

**Status: draft.** Nothing here is live. Her Squarespace site and store stay up and untouched until Dani
agrees to switch. While `DRAFT` is `true` in `build.mjs`, every page tells search engines not to list it.

## How it fits together

```
 src/ + img/ + fonts/  ──  node build.mjs  ──►  dist/  ──►  Cloudflare Pages (Dani's own account)
                                                  │
              visitors' browsers  ◄───────────────┤
                    │                             │
                    │  shop list, Client Portal   │
                    ▼                             │
     Site Notes service (Stray Wolf, Cloudflare)  │        Square: every checkout
     items, requests and photos kept in the admin ┘        (this site never takes a payment)
```

- **Plain HTML, CSS and JavaScript.** No framework and no dependencies. `build.mjs` writes the pages.
- **Payments are Square's.** Every Buy and Reserve button opens a Square checkout link.
- **The shop list** (`vendor/shop.js`) shows the items and classes kept for her in Stray Wolf Admin, on the
  Shop page ("Also in the shop") and the Workshops page (seats). If the list is empty or can't be reached,
  the page keeps what it already says.
- **Business info** (`vendor/info.js`): her hours, holidays and special days, email, address and social links are
  kept for her in Stray Wolf Admin (her page, Business info) and in her Client Portal (Shop hours, Contact info,
  Your social pages). Every page reads them and fills the spots marked `data-info`, within a minute of a save.
  What is typed in `build.mjs` is only the fallback, for before anything is saved or when the service can't be
  reached. Holidays in the next two weeks show under each hours table, and the open-now line knows about them.
- **The Client Portal** (`/portal/`) is where Dani sends change requests and photos, and sees where each one
  stands, and keeps her own shop list (Your shop: items, prices, photos, Square links). The same script gives
  her Edit mode on her own pages.

## Build and preview

```
npm run build      # writes dist/, the folder Cloudflare Pages publishes
npm run preview    # the same, for a shareable preview: no security-policy tag, portal in demo mode
```

Node 20 or newer. Nothing to install. `dist/` is generated: don't edit or commit it.

## The demo

Until launch, the site runs as a demo at https://snipandsprout.pages.dev (Cloudflare Pages project `snipandsprout`
in Stray Wolf's account: build command `npm run build`, output `dist`, `NODE_VERSION=22`, kept out of search
engines). Every push to `main` builds and publishes it. If a push doesn't show up there, check that the
Cloudflare Workers and Pages app on GitHub still has this repository under Repository access
(https://github.com/settings/installations, Configure).

## What's where

| Path | What it is |
|---|---|
| `build.mjs` | The whole build. One block per page (Home, Shop, Workshops, Gallery, Visit, About, 404); the shared header (her logo tag, then the menu with Shop first as a button) and footer; each page's own top, written inside that page's block; the sections of the inner pages (`course`) and their closing invitation (`invite`); the security policy; and the copy step. Facts that repeat (email, links, hours) are at the top. |
| `src/site.css`, `src/site.js` | All styling and behaviour: the calendar menu, the photo frame on Home (its photos change by themselves, with a pause button), the Gallery's full-screen photo viewer, the private event form, and the shop scene in the footer (the watering can and the plants growing, with a pause button). Every page reads fine without the script. |
| `src/shop-section.html`, `src/shop-section.css` | The Shop page's three tabs (DIY Terrarium Kits, Terrarium Bar, Plant Bar) in Dani's own words. No script: radio buttons and CSS. Prices and Square links are typed in here. |
| `src/stray-badge.html` | The Stray Wolf footer badge, the dark logo version, copied unchanged from Stray Wolf's badge kit. Its styles are the kit's, in `site.css` under "Stray Wolf Technology footer badge". Holding it opens the Client Portal. |
| `src/portal.html` | Her Client Portal page: Stray Wolf's standard page with her details. The build fills in her short name, the service address and the list of photos on her site. |
| `src/shop-scene.svg` | Her shop across the top of the footer: the counter and wall shelves with plants, pots and her terrariums, and her watering can. A still picture until `site.js` plays it; still for anyone who asked for less motion. Drawn by `tools/make-shop-scene.py` (Python, no packages): change that and run it again rather than editing the SVG. |
| `src/leaves.svg` | Fine leaf outlines tiled behind every page, faint enough that the page still reads as her cream paper (a soft sage wash across the top of each page sits with it, in `site.css`). Drawn by `tools/make-leaves.py` (Python, no packages): change that and run it again rather than editing the SVG. |
| `src/logo.svg`, `src/logo-tag.svg` | Her logo (Snip &, SPROUT, PLANT CO.), redrawn as outlines so it stays sharp at every size: `logo.svg` for light grounds (Client Portal), and `logo-tag.svg`, her logo on its olive box as she uses it, hanging from the header like a shop tag and sitting above the blurb in the footer. |
| `src/_headers`, `src/robots.txt` | Cloudflare's response headers, and the search-engine file (the build adds the line naming `sitemap.xml`, the list of pages it writes, each with the date of the latest version). |
| `src/favicon.svg`, `src/favicon.ico`, `src/apple-touch-icon.png` | The tab icon, the same icon for browsers that don't take an SVG, and the icon a phone shows when the site is saved to its home screen (the sprout on a full olive square). |
| `img/`, `img/shop/`, `img/gal/` | Every photo the site uses, already cropped and sized (WebP). `img/gal/` holds the Gallery's 4:5 tiles, and the whole photo (`-full`) for the ones that are only on the Gallery. `img/share.jpg` (1200 × 630, her Plant Bar) is the picture shown when a link to the site is shared in a text or a post. |
| `fonts/` | Figtree (everything) and Lora (the header menu), served from the site itself (SIL Open Font License). |
| `vendor/` | Stray Wolf's shared files, **copied unchanged**: `site-notes.js`, `shop-manager.js`, `shop-manager.css` (`site-notes.js` loads the last two from beside itself when she has a shop) and `html2canvas.min.js` (Client Portal), `shop.js` and `shop.css` (shop list), `info.js` (business info on every page), `info-editor.js` and `info-editor.css` (the hours and contact editor in her portal; `site-notes.js` loads them from beside itself). They must stay byte-identical to the copies on Stray Wolf's other client sites; per-site words go in `data-` settings in `build.mjs`. |
| `portal-brand/` | The Stray Wolf logos and fonts the portal page uses, and `site-preview.jpg`, the small picture of the home page in its Edit mode card. |
| `version.json` | The site's version and latest changes, newest first. The Stray Wolf admin reads it from the live site. It is public, so say only what a visitor could see. |

## Security

Each page carries a content security policy written by the build: nothing loads from anywhere but this site
and the Site Notes service, and inline code is allowed by exact hash only. `src/_headers` adds HTTPS-only,
no MIME sniffing, no framing by other sites, and keeps the `.pages.dev` copy out of search engines.

## Changing things

- **Hours, a holiday, her email, address or a social link:** not here. Save them in Stray Wolf Admin (her page,
  Business info) or in her portal; the pages follow within a minute. Only if the typed fallback should change
  too: `WEEK`, `HOURS3` and the Store block's hours in `build.mjs` (the three must agree), `C.email`, `C.ig`,
  `C.etsy`, and the "On your site now" lists in `src/portal.html`.
- **A new kind of social link** (TikTok, say): add a footer line like the Facebook one in `build.mjs`, marked
  `data-info="social:tiktok"`, and its name to `data-note-fields` on the social box in `src/portal.html`.
- **The next workshop:** `WS` near the top of `build.mjs` (its name, day, time, start and end, and lowest price).
  The Home band, the Workshops page, both calendar links and the event details search engines read all follow
  it. Once the day has passed the next build leaves the event details out; the pages keep showing the workshop
  until `WS` is changed.
- **A Shop price or Square link:** `src/shop-section.html`. Square charges what is set in Square, so change
  both.
- **Items and workshop seats:** nothing to edit here. They come from Stray Wolf Admin, Shop.
- With every change add a line to `version.json`.

## To confirm with Dani before launch

1. Email: the site uses snipandsproutco@gmail.com. Her current site links hello@snipandsprout.co.
2. Monday and Tuesday opening: 10 AM (her website) or 9 AM (recent Instagram posts). The site says 10.
3. The Plant Bar details and the $12 bring-your-own-pot fee are still current.
4. Photos with customers in them (`ig-group`, `ig-trio`, and on the Gallery `workshop-table` and `workshop-one`) are fine to use.
5. The storefront photo (`ig-storefront`) came from a friend's post.
6. The supplier's photos (Teardrop, the vessel thumbnails) are fine to use.
7. The November 22 workshop's length (the calendar entry assumes one hour).
8. Her logo says "Snip & Sprout Plant Co."; the site's text says "Snip & Sprout Co." Which name she wants used.
9. About says the shop has been in downtown Springdale since August 2026 (from her grand opening post).
10. The DIY kit's price and styles: her Squarespace store says from $28 with six types (Closed, Open, Teardrop,
    Skull, Dino, Mini Witchy); her Square kit link and this site say $55 with four.

## Launch (only after Dani says yes)

1. Stray Wolf Admin (set up Nov 16 with the short name `snip-and-sprout` and a Generic shop): her three
   Square items are Hidden because the Shop section shows them; her store's other items are On the site.
   Move the Squarespace store links to Square links when the Squarespace site retires.
2. Cloudflare Pages, in Dani's account: connect the repository, build command `npm run build`, output `dist`.
3. In `build.mjs`, set `DRAFT` to `false` and `C.url` to her own domain (each page's own address, the share picture,
   `sitemap.xml`, `robots.txt` and the shop and event details for search engines all follow it), and set up Google
   Analytics. Then add the domain in Google Search Console and give it `sitemap.xml`.
4. Point her domain at Cloudflare Pages, then retire the Squarespace site.
