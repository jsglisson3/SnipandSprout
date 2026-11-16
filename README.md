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
| `build.mjs` | The whole build. One block per page (Home, Shop, Workshops, Visit, About, 404); the shared header and footer; the menu at the top of every page (a short numbered list set big like the sign at her Plant Bar, beside one photo with a ticket), the numbered sections of the inner pages and the ribbon of plant-marker sayings; the security policy; and the copy step. Facts that repeat (email, links, hours) are at the top. |
| `src/site.css`, `src/site.js` | All styling and behaviour: open-now status in Central time (and today's line in the Visit hours), the calendar menu, the gallery, the private event form. Every page reads fine without the script. |
| `src/shop-section.html`, `src/shop-section.css` | The Shop page's three tabs (DIY Terrarium Kits, Terrarium Bar, Plant Bar) in Dani's own words. No script: radio buttons and CSS. Prices and Square links are typed in here. |
| `src/stray-badge.html` | The Stray Wolf footer badge, the dark logo version, copied unchanged from Stray Wolf's badge kit. Its styles are the kit's, in `site.css` under "Stray Wolf Technology footer badge". Holding it opens the Client Portal. |
| `src/portal.html` | Her Client Portal page: Stray Wolf's standard page with her details. The build fills in her short name, the service address and the list of photos on her site. |
| `src/_headers`, `src/robots.txt`, `src/favicon.svg` | Cloudflare's response headers, the search-engine file, the tab icon. |
| `img/`, `img/shop/` | Every photo the site uses, already cropped and sized (WebP). |
| `fonts/` | Instrument Serif and Newsreader, served from the site itself (SIL Open Font License). |
| `vendor/` | Stray Wolf's shared files, **copied unchanged**: `site-notes.js` and `html2canvas.min.js` (Client Portal), `shop.js` and `shop.css` (shop list). They must stay byte-identical to the copies on Stray Wolf's other client sites; per-site words go in `data-` settings in `build.mjs`. |
| `portal-brand/` | The Stray Wolf logos and fonts the portal page uses, and `site-preview.jpg`, the small picture of the home page in its Edit mode card. |
| `version.json` | The site's version and latest changes, newest first. The Stray Wolf admin reads it from the live site. It is public, so say only what a visitor could see. |

## Security

Each page carries a content security policy written by the build: nothing loads from anywhere but this site
and the Site Notes service, and inline code is allowed by exact hash only. `src/_headers` adds HTTPS-only,
no MIME sniffing, no framing by other sites, and keeps the `.pages.dev` copy out of search engines.

## Changing things

- **Hours:** `HOURS3` and `week()` in `build.mjs`, `H` in `src/site.js`, the hours in `src/shop-section.html`
  and in `src/portal.html`.
- **The next workshop:** `slip`, `C.gcal`, the hero line on Workshops and the calendar file at the bottom of
  `build.mjs`.
- **A Shop price or Square link:** `src/shop-section.html`. Square charges what is set in Square, so change
  both.
- **Items and workshop seats:** nothing to edit here. They come from Stray Wolf Admin, Shop.
- With every change add a line to `version.json`.

## To confirm with Dani before launch

1. Email: the site uses snipandsproutco@gmail.com. Her current site links hello@snipandsprout.co.
2. Monday and Tuesday opening: 10 AM (her website) or 9 AM (recent Instagram posts). The site says 10.
3. The Plant Bar details and the $12 bring-your-own-pot fee are still current.
4. Photos with customers in them (`ig-group`, `ig-trio`) are fine to use.
5. The storefront photo (`ig-storefront`) came from a friend's post.
6. The supplier's photos (Teardrop, the vessel thumbnails) are fine to use.
7. The November 22 workshop's length (the calendar entry assumes one hour).
8. Her logo file. The header uses a drawn stand-in for her mark.
9. About says the shop has been in downtown Springdale since August 2026 (from her grand opening post).
10. The DIY kit's price and styles: her Squarespace store says from $28 with six types (Closed, Open, Teardrop,
    Skull, Dino, Mini Witchy); her Square kit link and this site say $55 with four.

## Launch (only after Dani says yes)

1. Stray Wolf Admin (set up Nov 16 with the short name `snip-and-sprout` and a Generic shop): her three
   Square items are Hidden because the Shop section shows them; her store's other items are On the site.
   Move the Squarespace store links to Square links when the Squarespace site retires.
2. Cloudflare Pages, in Dani's account: connect the repository, build command `npm run build`, output `dist`.
3. Set `DRAFT` to `false` in `build.mjs`, add the canonical address and a sitemap, set up Google Analytics.
4. Point her domain at Cloudflare Pages, then retire the Squarespace site.
