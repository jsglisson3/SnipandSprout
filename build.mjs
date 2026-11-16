// Snip & Sprout Co. website. Static pages for Cloudflare Pages, no dependencies.
//
//   node build.mjs             ->  dist/   what Cloudflare Pages publishes (npm run build)
//   node build.mjs --preview   ->  dist/   the same pages for a shareable preview: no security policy
//                                          tag (a preview frame adds its own scripts) and the Client Portal
//                                          in its built-in demo mode, so it can be shown without the service
//
// Pages are written by the functions below; styling and behaviour live in src/. Everything in vendor/ is
// copied unchanged (Stray Wolf's Client Portal and shop list, the same files on every client site).
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const dist = here + 'dist/';
const PREVIEW = process.argv.includes('--preview');
// While the site is a draft no search engine may list it. Set to false at launch (see README, Launch).
const DRAFT = true;

// A preview has no server to turn /portal/ into its index page, and no service to log in to.
const PORTAL = PREVIEW ? 'portal/index.html' : 'portal/';
const PORTAL_HOME = PREVIEW ? '../index.html' : '../';

const read = (file) => readFileSync(here + file, 'utf8');
const sha256 = (text) => `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`;

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist + 'portal', { recursive: true });
cpSync(here + 'img', dist + 'img', { recursive: true });
cpSync(here + 'fonts', dist + 'fonts', { recursive: true });
cpSync(here + 'portal-brand', dist + 'portal/brand', { recursive: true });
for (const f of ['site-notes.js', 'html2canvas.min.js', 'shop.js', 'shop.css']) cpSync(here + 'vendor/' + f, dist + f);

const C = {
  email: 'snipandsproutco@gmail.com',
  ig: 'https://www.instagram.com/snipandsprout.co/',
  etsy: 'https://www.etsy.com/shop/SnipAndSproutCo',
  workshop: 'https://www.snipandsproutco.com/store/p/terrarium-workshop',
  maps: 'https://www.google.com/maps/search/?api=1&query=413+E+Emma+Ave+Springdale+AR+72764',
  gcal: 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=November%20Terrarium%20Workshop%20at%20Snip%20%26%20Sprout%20Co.&dates=20261122T190000Z/20261122T200000Z&location=413%20E.%20Emma%20Ave.%2C%20Springdale%2C%20AR%2072764&details=Starts%20at%201%20PM.%20Seating%20is%20limited.',
  stray: 'https://straywolftech.com',
  // Stray Wolf's Site Notes service: the Client Portal and the shop list both read from it.
  site: 'snip-and-sprout',                              // her short name in Stray Wolf Admin
  api: 'https://site-notes.jsglisson.workers.dev',
};

const I = {
  arrow: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 10h11M11 5l5 5-5 5"/></svg>',
  out: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M8 4H4v12h12v-4M11 4h5v5M16 4l-7 7"/></svg>',
  pin: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M10 18s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z"/><circle cx="10" cy="8" r="2.2"/></svg>',
  home: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M3 9.5 10 4l7 5.5V17H3Z"/><path d="M8 17v-4h4v4"/></svg>',
  bag: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 7h12l-1 10H5Z"/><path d="M7.5 7V6a2.5 2.5 0 0 1 5 0v1"/></svg>',
  cal: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M3.5 5.5h13v11h-13ZM3.5 9h13M7 3.5v3M13 3.5v3"/></svg>',
  leaf: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M10 17V8"/><path d="M10 11c-3.4 0-5.5-2-5.5-5 3 0 5.5 1.8 5.5 5ZM10 9c0-3 2-5 5.5-5 0 3-2.2 5-5.5 5Z"/></svg>',
  cam: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M3 6.5h3l1.2-2h5.6l1.2 2h3v9H3Z"/><circle cx="10" cy="11" r="2.8"/></svg>',
  send: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M17 3 9 11M17 3l-5 14-3-6-6-3Z"/></svg>',
  mark: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#4b5446"/><g fill="none" stroke="#f5f1ea" stroke-width="1.7" stroke-linecap="round"><path d="M16 25V12"/><path d="M16 17c-4 0-6.5-2.4-6.5-6 3.4 0 6.5 2.2 6.5 6ZM16 14c0-3.6 2.5-6 6.5-6 0 3.6-2.6 6-6.5 6Z" fill="#f5f1ea" fill-opacity=".2"/></g></svg>',
};

const HOURS3 = `<table class="hours3" data-hours3>
  <caption class="sr">Shop hours</caption>
  <tbody>
    <tr data-days="1,2"><th scope="row">Mon – Tue</th><td>10 AM – 3 PM</td></tr>
    <tr data-days="3,4,5"><th scope="row">Wed – Fri</th><td>9 AM – 6 PM</td></tr>
    <tr data-days="6,0"><th scope="row">Sat – Sun</th><td>9 AM – 2 PM</td></tr>
  </tbody>
</table>`;

const week = () => {
  const days = [[1, 'Monday', 'Mon', 10, 15], [2, 'Tuesday', 'Tue', 10, 15], [3, 'Wednesday', 'Wed', 9, 18], [4, 'Thursday', 'Thu', 9, 18], [5, 'Friday', 'Fri', 9, 18], [6, 'Saturday', 'Sat', 9, 14], [0, 'Sunday', 'Sun', 9, 14]];
  const f = (h) => (h > 12 ? h - 12 : h) + (h >= 12 ? ' PM' : ' AM');
  return `<table class="week" data-week data-in>
  <caption class="sr">Shop hours for each day of the week</caption>
  <tbody>
${days.map(([d, long, short, o, c]) => `    <tr data-day="${d}"><th scope="row"><span class="dlong">${long}</span><span class="dshort">${short}</span></th><td><div class="week__track" aria-hidden="true"><span class="week__bar" style="left:${((o - 9) / 9 * 100).toFixed(2)}%;width:${((c - o) / 9 * 100).toFixed(2)}%"></span><span class="week__now"></span></div></td><td>${f(o)} – ${f(c)}</td></tr>`).join('\n')}
  </tbody>
</table>
<div class="week__scale" aria-hidden="true"><span>9 AM</span><span>noon</span><span>3 PM</span><span>6 PM</span></div>`;
};

const NEIGHBORS = `<div class="neighbors"><span>In Bloom Floral Company</span><span>Two Friends Community Books</span><span>KaGie's</span></div>`;

const nav = (file) => `<header class="nav">
  <a class="brand" href="index.html" aria-label="Snip &amp; Sprout Co. home">${I.mark}<span>Snip &amp; Sprout Co.</span></a>
  <nav class="nav__links" aria-label="Main">
    ${[['workshops.html', 'Workshops'], ['visit.html', 'Visit'], ['about.html', 'About']].map(([h, t]) => `<a href="${h}"${h === file ? ' aria-current="page"' : ''}>${t}</a>`).join('\n    ')}
    <a class="btn" href="shop.html"${file === 'shop.html' ? ' aria-current="page"' : ''}>Shop</a>
  </nav>
</header>`;

const stage = (pics, stake) => `<aside class="stage" aria-label="Photographs from the shop">
    <div class="stage__pics">
      ${pics.map((p, i) => `<img src="img/${p.src}" width="${p.w}" height="${p.h}" alt="${p.alt}" data-stage="${p.key}"${p.pos ? ` style="object-position:${p.pos}"` : ''}${i === 0 ? ' class="is-on" fetchpriority="high"' : ' loading="lazy"'}>`).join('\n      ')}
    </div>
    <span class="stake stage__stake" data-stage-stake><span class="stake__label">${stake}</span></span>
    <div class="stage__bar">
      <span class="open" data-open><span class="open__dot" aria-hidden="true"></span><span data-open-text>Open every day</span></span>
      <a href="${C.maps}" target="_blank" rel="noopener">413 E. Emma Ave., Springdale</a>
    </div>
  </aside>`;

// The one inline script: marks the page as script-enabled before first paint, so entrances don't flash.
const JS_FLAG = `document.documentElement.classList.add('js')`;

// The security policy, as a tag in each page (the same approach as Stray Wolf's other sites). Nothing
// loads from anywhere but this site and the Site Notes service. Inline code is allowed by exact hash
// only: the script above, and each style="" attribute or <style> block actually present in that page.
const csp = (html) => {
  const styles = [...new Set([...html.matchAll(/ style="([^"]*)"/g)].map((m) => m[1]))];
  const blocks = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
  const styleSrc = ["'self'", ...(styles.length ? ["'unsafe-hashes'"] : []), ...styles.map(sha256), ...blocks.map(sha256)];
  return [
    "default-src 'self'",
    `script-src 'self' ${sha256(JS_FLAG)}`,
    `style-src ${styleSrc.join(' ')}`,
    `img-src 'self' data: blob: ${C.api}`,
    "font-src 'self'",
    `connect-src 'self' ${C.api}`,
    "frame-src 'none'", "form-action 'self'", "base-uri 'self'", "object-src 'none'", "worker-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
};
// Adds the policy tag (and the draft's noindex tag) right after the charset line.
const secure = (html) => html.replace('<meta charset="utf-8">', '<meta charset="utf-8">'
  + (PREVIEW ? '' : `\n<meta http-equiv="Content-Security-Policy" content="${csp(html)}">`)
  + (DRAFT ? '\n<meta name="robots" content="noindex, nofollow">' : ''));

const head = (p) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">${p.base ? `\n<base href="${p.base}">` : ''}
<title>${p.title}</title>
<meta name="description" content="${p.desc}">
<meta property="og:title" content="${p.title}">
<meta property="og:description" content="${p.desc}">
<meta property="og:image" content="img/hero-dani.webp">
<meta property="og:type" content="website">
<meta name="theme-color" content="#262c20">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="preload" href="fonts/instrument-serif.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/newsreader.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="site.css">${(p.css || []).map((f) => `\n<link rel="stylesheet" href="${f}">`).join('')}
<script>${JS_FLAG}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Store","name":"Snip & Sprout Co.","description":"Indoor plant boutique with pottery, a Plant Bar, a Terrarium Bar and workshops.","address":{"@type":"PostalAddress","streetAddress":"413 E. Emma Ave.","addressLocality":"Springdale","addressRegion":"AR","postalCode":"72764","addressCountry":"US"},"email":"${C.email}","sameAs":["${C.ig}","${C.etsy}"],"openingHoursSpecification":[{"@type":"OpeningHoursSpecification","dayOfWeek":["Monday","Tuesday"],"opens":"10:00","closes":"15:00"},{"@type":"OpeningHoursSpecification","dayOfWeek":["Wednesday","Thursday","Friday"],"opens":"09:00","closes":"18:00"},{"@type":"OpeningHoursSpecification","dayOfWeek":["Saturday","Sunday"],"opens":"09:00","closes":"14:00"}]}</script>
</head>
<body class="${p.body || ''}">
<a class="skip" href="#main">Skip to content</a>
`;

// The Client Portal's script goes on every page: it is how Dani's Edit mode works on her own site, and
// it makes the footer badge and the header logo the hidden doors to her portal (press and hold).
const siteNotes = `<script src="site-notes.js" data-site="${C.site}" data-api="${PREVIEW ? 'demo' : C.api}" data-login-url="${PORTAL}" data-door=".stray" data-door-logo=".brand" data-caption-example="the new terrariums" defer></script>`;
// The shop list (vendor/shop.js) fills every [data-shop] box from the items kept in Stray Wolf Admin.
const shopList = `<script src="shop.js" data-site="${C.site}" data-api="${C.api}" data-book="Reserve a seat" defer></script>`;

const foot = (p) => `<footer class="foot"><div class="wrap foot__line">
  <span>Snip &amp; Sprout Co. Plants, pottery and workshops in downtown Springdale.</span>
  <nav class="foot__links" aria-label="Elsewhere">
    <a href="${C.ig}" target="_blank" rel="noopener">Instagram</a>
    <a href="${C.etsy}" target="_blank" rel="noopener">Etsy</a>
    <a href="mailto:${C.email}">Email Dani</a>
    <a href="${PORTAL}">Owner portal</a>
  </nav>
  <span class="foot__right"><span>© <span data-year>2026</span> · Payments by Square</span>
    <a class="stray" href="${C.stray}" target="_blank" rel="noopener"><span class="stray__mark" aria-hidden="true">SW</span>Site by Stray Wolf</a></span>
</div></footer>
<nav class="tabbar" aria-label="Quick links">
  ${[['index.html', 'Home', I.home], ['shop.html', 'Shop', I.bag], ['workshops.html', 'Workshops', I.cal], ['visit.html', 'Visit', I.pin], ['about.html', 'About', I.leaf]].map(([h, t, ic]) => `<a href="${h}"${h === p.file ? ' aria-current="page"' : ''}>${ic}<span>${t}</span></a>`).join('\n  ')}
</nav>
<script src="site.js" defer></script>
${siteNotes}${p.shop ? '\n' + shopList : ''}
</body>
</html>
`;

const written = new Map();   // file -> its HTML, kept so the portal can list the photos on each page
const page = (p, body) => {
  const html = secure(head(p) + body + foot(p));
  written.set(p.file, html);
  writeFileSync(dist + p.file, html);
};

// A page built on the split stage: the sheet on one half, her photograph on the other.
const splitPage = (p, sheet, after = '') => page(p, `<main id="main">
<div class="split">
  ${stage(p.pics, p.stake)}
  <div class="sheet">
    ${nav(p.file)}
    <div class="sheet__in">
${sheet}
    </div>
  </div>
</div>
${after}</main>
`);

/* ---------------- shared pieces ---------------- */
const slip = `<div class="slip" data-in>
      <h3>Sunday, November 22</h3>
      <div class="slip__row"><span>Starts</span><i></i><span>1 PM</span></div>
      <div class="slip__row"><span>Where</span><i></i><span>413 E. Emma Ave.</span></div>
      <h3>Choose your terrarium</h3>
      <p>Open, Closed, Skull, Teardrop Glass or Pumpkin</p>
      <h3>On the table for you</h3>
      <div class="slip__row"><span>All supplies</span><i></i><span>included</span></div>
      <div class="slip__row"><span>Hands-on help</span><i></i><span>included</span></div>
      <div class="slip__row"><span>Your terrarium</span><i></i><span>yours to keep</span></div>
      <div class="slip__total"><span>A seat at the table</span><span>from $40</span></div>
    </div>`;

const countdown = `<div class="count" data-count="2026-11-22T13:00:00-06:00" role="timer" aria-label="Time until the workshop">
        <div><b data-d>6</b><span>days</span></div>
        <div><b data-h>19</b><span>hours</span></div>
        <div><b data-m>0</b><span>minutes</span></div>
      </div>`;

const calendar = `<div class="cal" data-cal>
          <button class="textbtn" type="button" aria-expanded="false" aria-controls="cal-menu">Add to my calendar</button>
          <div class="cal__menu" id="cal-menu">
            <a href="${C.gcal}" target="_blank" rel="noopener">Google Calendar</a>
            <a href="workshop.ics" download data-ics>Apple or Outlook</a>
          </div>
        </div>`;
// On Home the button leads to the Workshops page, the one place a seat is reserved.
const workshopActsHome = `<div class="band__acts">
        <a class="btn btn--paper" href="workshops.html#next">Reserve a seat ${I.arrow}</a>
        ${calendar}
      </div>`;
// On Workshops the seats come from Dani's shop list (classes kept in Stray Wolf Admin, each with its
// Square checkout link). Until that list has a class, the button inside the box is what shows.
const workshopActs = `<div class="band__acts">
        <div class="seats" data-shop data-kind="class" data-group="off">
          <a class="btn" href="${C.workshop}" target="_blank" rel="noopener">Reserve a seat ${I.out}</a>
        </div>
        ${calendar}
      </div>`;

/* ---------------- Home ---------------- */
const P = {
  dani: { key: 'hero', src: 'ig-dani.webp', w: 818, h: 1448, alt: 'Dani, the owner, smiling beside a big alocasia inside Snip &amp; Sprout', pos: '50% 28%' },
  plan: { key: 'plan', src: 'hero-dani.webp', w: 1400, h: 1750, alt: 'Dani potting a plant at the Plant Bar', pos: '60% 50%' },
  kits: { key: 'kits', src: 'kit-flatlay.webp', w: 1200, h: 1500, alt: 'A DIY terrarium kit laid out in labelled bags: drainage layer, soil, moss and the how-to card' },
  tbar: { key: 'tbar', src: 'ig-tbar.webp', w: 1100, h: 1954, alt: 'Dani layering soil into a glass terrarium at the bar', pos: '50% 48%' },
  pbar: { key: 'pbar', src: 'stakes-tall.webp', w: 1086, h: 1357, alt: 'Wooden plant markers with sayings like Little sprout and Way to grow, beside stacks of pastel pots', pos: '50% 100%' },
};

splitPage({ file: 'index.html', body: 'home', title: 'Snip & Sprout Co. · Plants, pottery and workshops in Springdale, AR',
  desc: 'An indoor plant boutique at 413 E. Emma Ave. in downtown Springdale. Plants, pottery, a walk-in Plant Bar, a Terrarium Bar, take-home kits and workshops.',
  pics: [P.dani, P.plan, P.kits, P.tbar, P.pbar], stake: 'Hi, I’m Dani!' }, `
      <section class="hero" data-stage-for="hero" data-stake="Hi, I’m Dani!">
        <h1 class="h1" data-in>Plants that make a house feel like home</h1>
        <p class="hero__lede" data-in>Come in, take your time, and let us help you find something that will be happy in your window — and easy for you to keep.</p>
        <div class="hero__acts" data-in>
          <a class="btn" href="#plan">Plan your visit ${I.arrow}</a>
          <a class="link" href="shop.html">Go to the Shop</a>
        </div>
        <p class="hero__now" data-in><b data-open-long>Open every day in downtown Springdale.</b><span>413 E. Emma Ave. The Plant Bar is walk-in whenever we're open.</span></p>
      </section>

      <section class="plan" id="plan" data-stage-for="plan" data-stake="At the Plant Bar" aria-labelledby="plan-title">
        <div class="plan__head">
          <h2 class="h1" id="plan-title" data-in>What sounds good?</h2>
          <p data-in>Three quick taps and we'll point you to the right thing to make.</p>
        </div>
        <form data-plan>
          <fieldset data-in>
            <legend>Who's it for?</legend>
            <div class="chips">
              <label class="chip"><input type="radio" name="who" value="me" checked><span>Just me</span></label>
              <label class="chip"><input type="radio" name="who" value="date"><span>A date</span></label>
              <label class="chip"><input type="radio" name="who" value="friends"><span>Friends</span></label>
              <label class="chip"><input type="radio" name="who" value="group"><span>A group</span></label>
              <label class="chip"><input type="radio" name="who" value="gift"><span>It's a gift</span></label>
            </div>
          </fieldset>
          <fieldset data-in>
            <legend>Where?</legend>
            <div class="chips">
              <label class="chip"><input type="radio" name="where" value="shop" checked><span>At the shop</span></label>
              <label class="chip"><input type="radio" name="where" value="home"><span>At my kitchen table</span></label>
            </div>
          </fieldset>
          <fieldset data-in>
            <legend>When?</legend>
            <div class="chips">
              <label class="chip"><input type="radio" name="when" value="now" checked><span>Today</span></label>
              <label class="chip"><input type="radio" name="when" value="later"><span>Another day</span></label>
              <label class="chip"><input type="radio" name="when" value="nov22"><span>Sunday, Nov 22</span></label>
            </div>
          </fieldset>
        </form>
        <div class="plan__out" data-plan-out aria-live="polite">
          <h3>The Plant Bar</h3>
          <p>Stop by and get your hands a little dirty. Pick out a plant and a pot, then put it together at our planting station.</p>
          <div class="plan__facts"><span>$22</span><span>In the shop</span><span>No notice needed</span></div>
          <p class="plan__live" data-plan-live>Walk in any time we're open.</p>
          <div class="plan__acts"><a class="btn btn--paper" href="shop.html#pbar">See the Plant Bar ${I.arrow}</a><a class="link" href="visit.html">Hours and directions</a></div>
        </div>
      </section>

      <section class="ways" id="ways" aria-labelledby="ways-title">
        <div class="ways__head">
          <h2 class="h1" id="ways-title" data-in>Three ways to make something green</h2>
          <p data-in>One goes home with you in a bag. Two happen right here at the bar. Checkout for all three is through Square.</p>
        </div>

        <article class="row" data-stage-for="kits" data-stake="Made at your kitchen table">
          <img class="inpic" src="img/${P.kits.src}" width="1200" height="1500" alt="${P.kits.alt}" loading="lazy">
          <div class="row__head" data-in><h3 class="h3">DIY Terrarium Kits</h3><span class="row__price">$55</span></div>
          <p class="row__where" data-in>${I.home} Take-home kit, made at home</p>
          <ul class="row__list" data-in>
            <li>Prepared to order and ready for pickup at the shop</li>
            <li>Four styles: Closed, Open, Skull or Teardrop</li>
            <li>A relaxing creative afternoon, an at-home date night, or a gift for your favorite plant lover</li>
          </ul>
          <a class="btn btn--tone" href="shop.html#kits" data-in>Choose a kit ${I.arrow}</a>
        </article>

        <article class="row" data-stage-for="tbar" data-stake="Built at the Terrarium Bar">
          <img class="inpic" src="img/${P.tbar.src}" width="1200" height="1500" alt="${P.tbar.alt}" loading="lazy">
          <div class="row__head" data-in><h3 class="h3">Terrarium Bar</h3><span class="row__price">from $45</span></div>
          <p class="row__where" data-in>${I.pin} In the shop, with one day's notice</p>
          <ul class="row__list" data-in>
            <li>Choose your terrarium style, then come in and build it</li>
            <li>Personalize it with plants and decorative details</li>
            <li>At least one day's advance notice, so we can prepare your vessel</li>
          </ul>
          <a class="btn btn--tone" href="shop.html#tbar" data-in>Book the Terrarium Bar ${I.arrow}</a>
        </article>

        <article class="row" data-stage-for="pbar" data-stake="Little sprout" data-stake-live>
          <img class="inpic" src="img/${P.pbar.src}" width="1086" height="1357" alt="${P.pbar.alt}" loading="lazy" style="object-position:50% 78%">
          <span class="stake stake--inline" data-stake-inline><span class="stake__label">Little sprout</span></span>
          <div class="row__head" data-in><h3 class="h3">Plant Bar</h3><span class="row__price">$22</span></div>
          <p class="row__where" data-in>${I.pin} In the shop, no notice needed. Just walk in.</p>
          <ul class="row__list" data-in>
            <li><b>Pick your pot.</b> Choose the one that speaks to you.</li>
            <li><b>Pick your plant.</b> Find the perfect little plant to call it home.</li>
            <li><b>Pot it up.</b> Add soil and settle your new plant in.</li>
            <li><b>Make it yours.</b> Add in moss, a fun plant marker, or mini decor.</li>
          </ul>
          <p data-in>Which marker is yours? Tap one to plant it.</p>
          <div class="stakes" data-stakes role="group" aria-label="Plant markers from the Plant Bar" data-in>
            ${['Little sprout', 'Way to grow!', 'You grow girl!', 'Emotional support plant', 'Happy new home!', 'Crazy plant lady', 'Stayin’ alive', 'Pretty fly for a cacti', 'Happy birthday!', 'Congratulations!'].map((s, i) => `<button type="button" aria-pressed="${i === 0}">${s}</button>`).join('')}
          </div>
          <div class="faq" data-in>
            <h4 class="h3">Questions we get all the time</h4>
            <details><summary>Do I need a reservation?</summary><p>Nope. Just stop by any time we're open.</p></details>
            <details><summary>Is there an age limit?</summary><p>Not at all. The Plant Bar is fun for all ages.</p></details>
            <details><summary>How many decor pieces can I use?</summary><p>Up to five per pot.</p></details>
            <details><summary>Is the decor always the same?</summary><p>No. We switch it out with the seasons.</p></details>
            <details><summary>Can I bring my own pot?</summary><p>Sure thing. There's a $12 potting fee.</p></details>
          </div>
          <a class="btn btn--tone" href="shop.html#pbar" data-in>See the Plant Bar ${I.arrow}</a>
        </article>
      </section>`, `
<section class="band" id="workshop" aria-labelledby="ws-title"><div class="wrap band__grid">
  <div class="band__text">
    <h2 class="display" id="ws-title" data-in>November Terrarium Workshop</h2>
    <p data-in>Gather. Create. Grow. Pull up a chair at the table in the back on Sunday, November 22 at 1 PM. Seating is limited.</p>
    <div data-in>${countdown}</div>
    <div data-in>${workshopActsHome}</div>
  </div>
  ${slip}
</div></section>

<section class="match" id="match" aria-labelledby="match-title"><div class="match__grid">
  <div class="match__plate">
    <figure data-in>
      <img src="img/ig-pothos.webp" width="1200" height="1200" alt="A golden pothos glowing in the afternoon sun" loading="lazy" data-match-img>
      <span class="stake" data-match-stake hidden><span class="stake__label">Your spot</span></span>
    </figure>
  </div>
  <div class="match__body">
    <div class="match__top">
      <h2 class="display" id="match-title" data-in>Tell us about the spot</h2>
      <p class="statement" data-in>Show us a photo of the spot you have in mind and we'll find the plant that will be happy there.</p>
    </div>
    <form data-match action="mailto:${C.email}">
      <div class="tabs" role="tablist" aria-label="Three questions">
        <button type="button" role="tab" id="mt-light" aria-controls="mp-light" aria-selected="true">Light</button>
        <button type="button" role="tab" id="mt-water" aria-controls="mp-water" aria-selected="false" tabindex="-1">Water</button>
        <button type="button" role="tab" id="mt-home" aria-controls="mp-home" aria-selected="false" tabindex="-1">Home</button>
      </div>
      <div class="tabpanel" role="tabpanel" id="mp-light" aria-labelledby="mt-light" style="margin-top:22px">
        <h3 class="h3">How much light does it get?</h3>
        <div class="chips">
          <label class="chip"><input type="radio" name="light" value="Direct sun for a few hours"><span>Direct sun</span></label>
          <label class="chip"><input type="radio" name="light" value="Bright, but no direct sun"><span>Bright, no direct sun</span></label>
          <label class="chip"><input type="radio" name="light" value="A few feet from a window"><span>A few feet from a window</span></label>
          <label class="chip"><input type="radio" name="light" value="Low light"><span>Low light</span></label>
        </div>
      </div>
      <div class="tabpanel" role="tabpanel" id="mp-water" aria-labelledby="mt-water" style="margin-top:22px" hidden>
        <h3 class="h3">How often will you water?</h3>
        <div class="chips">
          <label class="chip"><input type="radio" name="water" value="I'll forget, so it needs to be forgiving"><span>I'll forget</span></label>
          <label class="chip"><input type="radio" name="water" value="About once a week"><span>About once a week</span></label>
          <label class="chip"><input type="radio" name="water" value="I love to fuss over my plants"><span>I love to fuss</span></label>
        </div>
      </div>
      <div class="tabpanel" role="tabpanel" id="mp-home" aria-labelledby="mt-home" style="margin-top:22px" hidden>
        <h3 class="h3">Anyone curious at home?</h3>
        <div class="chips">
          <label class="chip"><input type="radio" name="pets" value="Pets who nibble"><span>Pets who nibble</span></label>
          <label class="chip"><input type="radio" name="pets" value="Little kids"><span>Little kids</span></label>
          <label class="chip"><input type="radio" name="pets" value="Nobody, just me"><span>Just me</span></label>
        </div>
      </div>
    </form>
    <div>
      <p class="match__sum" data-match-sum style="margin-bottom:16px">Dani will tell you honestly how much attention it'll ask of you.</p>
      <div class="match__cells">
        <label class="cell cell--tone">${I.cam}<span data-match-photo-label>Add a photo of the spot</span><input type="file" accept="image/*" data-match-file aria-label="Add a photo of the spot"></label>
        <a class="cell cell--ink" href="mailto:${C.email}?subject=Plant%20match" data-match-send>${I.send}<span>Send it to Dani</span></a>
      </div>
    </div>
  </div>
</div></section>

<section class="slips" aria-labelledby="rev-title"><div class="wrap">
  <div class="slips__head">
    <h2 class="display" id="rev-title" data-in>Kind words</h2>
    <p data-in>Left for the shop on Google.</p>
  </div>
  <div class="slips__fan">
    <figure class="slipq"><blockquote>Love, love, love the event I attended for Snip &amp; Sprout!</blockquote><figcaption><b>Christee Sellers</b>Google review</figcaption></figure>
    <figure class="slipq"><blockquote>I've bought several plants from here, and every single one is thriving!</blockquote><figcaption><b>Sydne Valentine</b>Google review</figcaption></figure>
    <figure class="slipq"><blockquote>What a fun experience! … Dani was great to help as needed.</blockquote><figcaption><b>Betsy Mulherin</b>Google review</figcaption></figure>
  </div>
</div></section>

<section class="reel" aria-labelledby="reel-title"><div class="wrap reel__grid">
  <div data-in>
    <button class="frame" type="button" data-frame aria-label="Next photograph">
      <img class="is-on" src="img/ig-globe.webp" width="1200" height="1500" alt="A glass terrarium with succulents, moss and tiny pumpkins" data-cap="A spooky-season terrarium" loading="lazy">
      <img src="img/finished-lantern.webp" width="1254" height="1254" alt="A finished Closed terrarium with ferns, moss and a tiny deer" data-cap="A finished Closed terrarium" loading="lazy">
      <img src="img/ig-skull.webp" width="1200" height="1499" alt="A stone skull planter holding an alocasia, among pumpkins and autumn leaves" data-cap="The skull planter" loading="lazy">
      <img src="img/ig-merry.webp" width="1200" height="1500" alt="A gold-framed terrarium and a glass ornament with a tiny Santa" data-cap="Merry terrariums, from the holiday workshop" loading="lazy">
      <img src="img/ig-pumpkin.webp" width="1100" height="1375" alt="An alocasia potted in a pumpkin-shaped pot" data-cap="Fall at the Plant Bar" loading="lazy">
      <img src="img/ig-props.webp" width="1152" height="1440" alt="Plant cuttings rooting in glass jars of water" data-cap="Cuttings, rooting in water" loading="lazy">
    </button>
    <p class="frame__cap" data-frame-cap aria-live="polite">A spooky-season terrarium</p>
  </div>
  <div class="reel__text">
    <h2 class="display" id="reel-title" data-in>Made at Snip &amp; Sprout</h2>
    <p data-in>Every one leaves a little different, because the person who made it is. Tap the picture to see the next.</p>
    <p data-in>No time to build your own? Dani makes custom terrariums to order. <a class="link" href="mailto:${C.email}?subject=Custom%20terrarium">Ask about a custom terrarium</a></p>
    <a class="btn" href="${C.ig}" target="_blank" rel="noopener" data-in>Follow @snipandsprout.co ${I.out}</a>
  </div>
</div></section>

<section class="visit" id="visit" aria-labelledby="visit-title">
  <img src="img/bar-wide.webp" width="1448" height="1086" alt="The Plant Bar inside the shop: the sign, a tray of plant markers, pots and a monstera" loading="lazy">
  <div class="visit__card" data-in>
    <div class="visit__pad">
      <h2 class="h1" id="visit-title">Come see us</h2>
      <address>413 E. Emma Ave.<br>Springdale, AR 72764<br><button class="textbtn small" type="button" data-copy="413 E. Emma Ave., Springdale, AR 72764">Copy the address</button></address>
      <p class="open" data-open><span class="open__dot" aria-hidden="true"></span><span data-open-text>Open every day</span></p>
      ${HOURS3}
      <p class="small">Street parking out front, and a bench. Inside you'll also find our neighbors: In Bloom Floral Company, Two Friends Community Books and KaGie's.</p>
    </div>
    <a class="btn btn--wide" href="${C.maps}" target="_blank" rel="noopener">Get directions ${I.out}</a>
  </div>
</section>
`);

/* ---------------- Shop ---------------- */
// The Shop section was first built for her Squarespace page, where scripts were not allowed, so its tabs
// and style picker are plain radio buttons and CSS. It lives in src/shop-section.html and .css.
page({ file: 'shop.html', body: 'shop-page', shop: true, css: ['shop-section.css', 'shop.css'], title: 'Shop · DIY Terrarium Kits, Terrarium Bar and Plant Bar · Snip & Sprout Co.',
  desc: 'Take-home DIY terrarium kits, the in-shop Terrarium Bar and the walk-in Plant Bar at Snip & Sprout Co. in Springdale. Secure checkout through Square.' },
  `<div class="navbar">${nav('shop.html')}</div>\n<main id="main">\n${read('src/shop-section.html')}</main>\n`);

/* ---------------- Workshops ---------------- */
splitPage({ file: 'workshops.html', shop: true, css: ['shop.css'], title: 'Workshops · Snip & Sprout Co., Springdale',
  desc: 'Hands-on terrarium workshops at 413 E. Emma Ave. in Springdale. All supplies included, take home what you make. Private events too.',
  pics: [
    { key: 'hero', src: 'ig-table.webp', w: 934, h: 1658, alt: 'A workshop table from above, full of glass terrariums, plants and hands at work', pos: '50% 40%' },
    { key: 'next', src: 'apron-dodeca.webp', w: 1200, h: 1500, alt: 'An open geometric glass terrarium held in front of a Snip &amp; Sprout apron' },
    { key: 'incl', src: 'ig-trio.webp', w: 1024, h: 1024, alt: 'Three workshop guests holding the terrariums they made' },
    { key: 'private', src: 'ig-group.webp', w: 1100, h: 1952, alt: 'A private workshop group around the table, holding their terrariums', pos: '50% 46%' },
    { key: 'bar', src: 'ig-tbar.webp', w: 1100, h: 1954, alt: 'Dani layering soil into a glass terrarium at the bar', pos: '50% 48%' },
  ], stake: 'Gather. Create. Grow.' }, `
      <section class="hero" data-stage-for="hero" data-stake="Gather. Create. Grow.">
        <h1 class="h1" data-in>Workshops that bring people together</h1>
        <p class="hero__lede" data-in>Pull up a chair at the table in the back. It's always set for company. We bring the plants, the vessels and the know-how, and you go home with something you made.</p>
        <div class="hero__acts" data-in>
          <a class="btn" href="#next">The next workshop ${I.arrow}</a>
          <a class="link" href="#private">Private events</a>
        </div>
        <p class="hero__now" data-in><b>Next: Sunday, November 22 at 1 PM.</b><span>Seats from $40, with all supplies included.</span></p>
      </section>

      <section id="next" data-stage-for="next" data-stake="Sunday, Nov 22" aria-labelledby="next-title">
        <div class="stack stack--l">
          <h2 class="h1" id="next-title" data-in>November Terrarium Workshop</h2>
          <div data-in>${countdown}</div>
          ${slip}
          <div data-in>${workshopActs}</div>
        </div>
      </section>

      <section data-stage-for="incl" data-stake="Take home what you make" aria-labelledby="incl-title">
        <div class="stack">
          <h2 class="h1" id="incl-title" data-in>What every workshop includes</h2>
          <ul class="facts" data-in>
            <li><b>Hands-on learning.</b> You make it yourself, with help whenever you want it.</li>
            <li><b>All supplies included.</b> Everything you need is waiting on the table.</li>
            <li><b>Take home your creation.</b> It leaves with you the same day.</li>
            <li><b>Community.</b> Come with friends, or come alone and meet a few.</li>
          </ul>
        </div>
      </section>

      <section aria-labelledby="past-title">
        <div class="stack">
          <h2 class="h1" id="past-title" data-in>Earlier this fall</h2>
          <ul class="past" data-in>
            <li><span>Witchy Terrarium Night</span><span>Oct 9</span></li>
            <li><span>Fall at the Shop, with In Bloom and KaGie's</span><span>Oct 16 – 18</span></li>
            <li><span>Emma After Dark</span><span>Oct 30</span></li>
          </ul>
          <p data-in>For new dates, follow along on <a class="link" href="${C.ig}" target="_blank" rel="noopener">Instagram</a>.</p>
        </div>
      </section>

      <section id="private" data-stage-for="private" data-stake="A private workshop night" aria-labelledby="priv-title">
        <div class="stack">
          <h2 class="h1" id="priv-title" data-in>Bring your people to the table</h2>
          <p data-in>Birthdays, bridal showers, team nights and just-because plans. You gather your favorite people. We provide the plants, supplies and instructions, and everyone takes home something that grows.</p>
          <div class="panel" data-in>
            <form class="form" data-inquiry action="mailto:${C.email}">
              <label>Your name<input name="name" autocomplete="name" required></label>
              <label>Email<input name="email" type="email" autocomplete="email" required></label>
              <label>What's the occasion?<select name="occasion"><option>Birthday</option><option>Bridal shower</option><option>Team building</option><option>Client gathering</option><option>Something else</option></select></label>
              <label>How many guests?<span class="stepper" data-stepper><button type="button" aria-label="One fewer guest">−</button><input name="guests" type="number" min="1" value="8" inputmode="numeric"><button type="button" aria-label="One more guest">+</button></span></label>
              <label class="full">Dates you have in mind<input name="dates" placeholder="A Saturday in December, for example"></label>
              <label class="full">Anything else we should know?<textarea name="notes"></textarea></label>
              <button class="btn" type="submit">Send the inquiry ${I.arrow}</button>
            </form>
            <p class="small">Opens an email to Dani with your details filled in. We reply within one business day.</p>
          </div>
        </div>
      </section>

      <section data-stage-for="bar" data-stake="Built at the Terrarium Bar" aria-labelledby="bar-title">
        <div class="panel panel--forest" data-in>
          <h2 class="h1" id="bar-title">Can't make the date?</h2>
          <p>The Terrarium Bar is open whenever the shop is. Book your style at least a day ahead and build it when it suits you.</p>
          <p><a class="btn btn--paper" href="shop.html#tbar">Book the Terrarium Bar ${I.arrow}</a></p>
        </div>
      </section>`);

/* ---------------- Visit ---------------- */
splitPage({ file: 'visit.html', title: 'Visit · 413 E. Emma Ave., Springdale · Snip & Sprout Co.',
  desc: 'Hours, parking and directions for Snip & Sprout Co. at 413 E. Emma Ave. in downtown Springdale, AR. Open every day.',
  pics: [
    { key: 'hero', src: 'ig-window.webp', w: 1080, h: 1350, alt: 'Dani outside the shop window, lettered Snip &amp; Sprout Co.', pos: '40% 50%' },
    { key: 'hours', src: 'bar-tall.webp', w: 868, h: 1086, alt: 'The Plant Bar inside the shop: the sign, a tray of plant markers and stacks of pots' },
    { key: 'find', src: 'stakes-tall.webp', w: 1086, h: 1357, alt: 'Wooden plant markers and pastel pots at the Plant Bar', pos: '50% 100%' },
  ], stake: 'Come on in' }, `
      <section class="hero" data-stage-for="hero" data-stake="Come on in">
        <h1 class="h1" data-in>Come in and take your time</h1>
        <p class="hero__lede" data-in>We're at 413 E. Emma Ave. in downtown Springdale, in a storefront we share with three neighbors.</p>
        <div class="hero__acts" data-in>
          <a class="btn" href="${C.maps}" target="_blank" rel="noopener">Get directions ${I.out}</a>
          <button class="textbtn" type="button" data-copy="413 E. Emma Ave., Springdale, AR 72764">Copy the address</button>
        </div>
        <p class="hero__now" data-in><b data-open-long>Open every day.</b><span>The Plant Bar is walk-in whenever we're open.</span></p>
      </section>

      <section id="hours" data-stage-for="hours" data-stake="Walk-ins welcome" aria-labelledby="hours-title">
        <div class="stack">
          <h2 class="h1" id="hours-title" data-in>This week's hours</h2>
          ${week()}
          <p class="small muted" data-in>Terrarium Bar visits need at least one day's notice so your vessel is ready.</p>
        </div>
      </section>

      <section data-stage-for="find" data-stake="Make it yours" aria-labelledby="find-title">
        <div class="stack">
          <h2 class="h1" id="find-title" data-in>What you'll find inside</h2>
          <ul class="facts" data-in>
            <li><b>Plants and pottery.</b> A curated selection, with pots to match.</li>
            <li><b>Honest plant advice.</b> About light and water, and whether a plant will be happy in your spot.</li>
            <li><b>The Plant Bar and Terrarium Bar.</b> Make something while you're here.</li>
            <li><b>Workshops and seasonal arrivals.</b> At the table in the back.</li>
          </ul>
        </div>
      </section>

      <section aria-labelledby="nb-title">
        <div class="stack">
          <h2 class="h1" id="nb-title" data-in>Under the same roof</h2>
          <p data-in>Four locally owned, women-owned shops share one space: plants, fresh flowers, books and stationery. Make an afternoon of it.</p>
          <figure data-in><img class="inphoto" src="img/ig-storefront.webp" width="860" height="627" alt="The white storefront at 413 E. Emma Ave. in downtown Springdale" loading="lazy"><figcaption class="small muted" style="margin-top:8px">The white building at 413 E. Emma Ave.</figcaption></figure>
          <div data-in>${NEIGHBORS}</div>
          <p data-in>Street parking on Emma Avenue, and a bench out front.</p>
        </div>
      </section>

      <section aria-labelledby="hello-title">
        <div class="panel" data-in>
          <h2 class="h1" id="hello-title">Say hello</h2>
          <p>Questions about a plant, a workshop or a private event? Email Dani and you'll hear back within one business day.</p>
          <p><a class="btn" href="mailto:${C.email}">Email Dani ${I.arrow}</a></p>
        </div>
      </section>`);

/* ---------------- About ---------------- */
splitPage({ file: 'about.html', title: 'About Dani · Snip & Sprout Co.',
  desc: 'Snip & Sprout Co. is an indoor plant boutique in Northwest Arkansas, started by Dani to make plant care approachable and to give people a place to gather.',
  pics: [
    { key: 'hero', src: 'ig-hi-dani.webp', w: 1080, h: 1350, alt: 'Dani holding a tray of plants in the shop, with the words Hi, I’m Dani', pos: '50% 0%' },
    { key: 'story', src: 'dani-bar-2.webp', w: 1200, h: 1500, alt: 'Dani scooping soil at the Plant Bar' },
    { key: 'vals', src: 'ig-chair.webp', w: 1100, h: 1956, alt: 'Dani writing in a notebook in a wicker peacock chair, plants behind her', pos: '50% 30%' },
  ], stake: 'Downtown Springdale' }, `
      <section class="hero" data-stage-for="hero" data-stake="Downtown Springdale">
        <h1 class="h1" data-in>Rooted in a love of plants and community</h1>
        <p class="hero__lede" data-in>An indoor plant boutique in Northwest Arkansas, for first pothos and big collections alike.</p>
        <div class="hero__acts" data-in>
          <a class="btn" href="index.html#plan">Plan your visit ${I.arrow}</a>
          <a class="link" href="workshops.html">See workshops</a>
        </div>
        <p class="hero__now" data-in><b>In downtown Springdale since August 2026.</b><span>413 E. Emma Ave., under one roof with three neighbors.</span></p>
      </section>

      <section data-stage-for="story" data-stake="Get your hands dirty" aria-labelledby="story-title">
        <div class="stack">
          <h2 class="h1" id="story-title" data-in>Plants were never just decoration</h2>
          <p data-in>For Dani they are a way to slow down, make something beautiful and bring a little life into everyday rooms. She started Snip &amp; Sprout Co. to make indoor plant care approachable, inspiring and fun, whether you're buying your first pothos or adding to a jungle.</p>
          <p data-in>So the shop carries carefully chosen plants and handmade pottery, with guidance at every step. And it was always meant to be more than a place to buy plants: somewhere to slow down, learn something new, get your hands dirty and leave feeling a little more connected.</p>
          <p class="statement" data-in>“You are SO welcome here!”</p>
          <p data-in>That's Dani, to anyone who has kept a fiddle leaf fig alive for years, and anyone who has loved one a little too hard.</p>
          <figure class="pair" data-in>
            <img src="img/ig-shop-window.webp" width="720" height="900" alt="Dani laughing in the shop, plants on the shelves and in the big front window" loading="lazy">
            <img src="img/ig-ferns.webp" width="640" height="800" alt="Young ferns, just arrived at the shop" loading="lazy">
            <figcaption class="small muted">Inside the shop on Emma Avenue.</figcaption>
          </figure>
        </div>
      </section>

      <section data-stage-for="vals" data-stake="Beginner questions welcome" aria-labelledby="val-title">
        <div class="stack stack--l">
          <h2 class="h1" id="val-title" data-in>What we care about</h2>
          <div class="vals">
            <div data-in><h3>Approachable</h3><p>Plant care shouldn't feel intimidating. Beginner questions are our favorite kind.</p></div>
            <div data-in><h3>Gathering</h3><p>Workshops and community nights are the heart of the shop. The table in the back is always set for company.</p></div>
            <div data-in><h3>Genuine guidance</h3><p>Honest advice about light and water, and whether a plant will really be happy in the spot you have in mind.</p></div>
          </div>
        </div>
      </section>

      <section aria-labelledby="go-title">
        <div class="panel panel--forest" data-in>
          <h2 class="h1" id="go-title">Come make something</h2>
          <p>Walk in for the Plant Bar, book the Terrarium Bar, or join us at the next workshop.</p>
          <p class="hero__acts"><a class="btn btn--paper" href="index.html#plan">Plan your visit ${I.arrow}</a><a class="link" href="workshops.html" style="color:inherit">See workshops</a></p>
        </div>
      </section>`);

/* ---------------- Not found ---------------- */
// Cloudflare Pages serves 404.html for any address that doesn't exist, at any depth, hence the base tag.
splitPage({ file: '404.html', base: '/', title: 'Page not found · Snip & Sprout Co.', desc: 'That page isn’t here. Find the shop, the workshops and our hours from the home page.',
  pics: [{ key: 'hero', src: 'stakes-tall.webp', w: 1086, h: 1357, alt: 'Wooden plant markers and pastel pots at the Plant Bar', pos: '50% 100%' }], stake: 'Stayin’ alive' }, `
      <section class="hero" data-stage-for="hero">
        <h1 class="h1" data-in>This page didn't take root</h1>
        <p class="hero__lede" data-in>The link may be old, or the page may have moved. Everything else is right where you left it.</p>
        <div class="hero__acts" data-in>
          <a class="btn" href="index.html">Back to the home page ${I.arrow}</a>
          <a class="link" href="visit.html">Hours and directions</a>
        </div>
      </section>`);

/* ---------------- Client Portal ---------------- */
// Dani's private page for sending Stray Wolf changes and photos (src/portal.html, served at /portal/).
// It is Stray Wolf's standard portal page with her details filled in.
// "On your site now" on its Photos page is read from the pages just written, so it can't fall behind.
const PAGE_NAMES = { 'index.html': 'Homepage', 'shop.html': 'Shop page', 'workshops.html': 'Workshops page', 'visit.html': 'Visit page', 'about.html': 'About page' };
const sitePhotos = new Map();   // photo -> { alt, pages }
for (const [file, name] of Object.entries(PAGE_NAMES)) {
  for (const [tag] of written.get(file).matchAll(/<img\b[^>]*>/g)) {
    const src = /\ssrc="(img\/[^"]+)"/.exec(tag)?.[1], alt = /\salt="([^"]*)"/.exec(tag)?.[1];
    if (!src || !alt) continue;   // decorative pictures (empty alt) are left out
    const photo = sitePhotos.get(src) ?? sitePhotos.set(src, { alt, pages: [] }).get(src);
    if (!photo.pages.includes(name)) photo.pages.push(name);
  }
}
const photoList = [...sitePhotos].map(([src, { alt, pages }]) =>
  `    <img src="../${src}" data-big="../${src}" alt="${alt}" data-on="${pages.join('|')}">`).join('\n');
writeFileSync(dist + 'portal/index.html', secure(read('src/portal.html')
  .replaceAll('{{site}}', C.site)
  .replaceAll('{{api}}', PREVIEW ? 'demo' : C.api)
  .replaceAll('{{home}}', PORTAL_HOME)
  .replace('{{photos}}', photoList)));

/* ---------------- static files ---------------- */
writeFileSync(dist + 'workshop.ics', ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Snip & Sprout Co.//Workshops//EN', 'BEGIN:VEVENT',
  'UID:nov-2026-terrarium-workshop@snipandsproutco.com', 'DTSTAMP:20261115T000000Z', 'DTSTART:20261122T190000Z', 'DTEND:20261122T200000Z',
  'SUMMARY:November Terrarium Workshop at Snip & Sprout Co.', 'LOCATION:413 E. Emma Ave.\\, Springdale\\, AR 72764',
  'DESCRIPTION:Starts at 1 PM. Seating is limited.', 'END:VEVENT', 'END:VCALENDAR', ''].join('\r\n'));
for (const f of ['site.css', 'site.js', 'shop-section.css', 'favicon.svg', 'robots.txt', '_headers']) cpSync(here + 'src/' + f, dist + f);
cpSync(here + 'version.json', dist + 'version.json');   // the Stray Wolf admin reads the site's version from here
console.log(`built 6 pages, the 404 page and the Client Portal${PREVIEW ? ' (preview)' : ''}`);
