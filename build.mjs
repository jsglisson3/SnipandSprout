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
  mark: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#585f53"/><g fill="none" stroke="#f5f1ea" stroke-width="1.7" stroke-linecap="round"><path d="M16 25V12"/><path d="M16 17c-4 0-6.5-2.4-6.5-6 3.4 0 6.5 2.2 6.5 6ZM16 14c0-3.6 2.5-6 6.5-6 0 3.6-2.6 6-6.5 6Z" fill="#f5f1ea" fill-opacity=".2"/></g></svg>',
};

const HOURS3 = `<table class="hours3" data-hours3>
  <caption class="sr">Shop hours</caption>
  <tbody>
    <tr data-days="1,2"><th scope="row">Mon – Tue</th><td>10 AM – 3 PM</td></tr>
    <tr data-days="3,4,5"><th scope="row">Wed – Fri</th><td>9 AM – 6 PM</td></tr>
    <tr data-days="6,0"><th scope="row">Sat – Sun</th><td>9 AM – 2 PM</td></tr>
  </tbody>
</table>`;

const NEIGHBORS = `<div class="neighbors"><span>In Bloom Floral Company</span><span>Two Friends Community Books</span><span>KaGie's</span></div>`;

const nav = (file) => `<header class="nav"><div class="nav__in">
  <a class="brand" href="index.html" aria-label="Snip &amp; Sprout Co. home">${I.mark}<span>Snip &amp; Sprout Co.</span></a>
  <nav class="nav__links" aria-label="Main">
    ${[['workshops.html', 'Workshops'], ['visit.html', 'Visit Us'], ['about.html', 'About']].map(([h, t]) => `<a href="${h}"${h === file ? ' aria-current="page"' : ''}>${t}</a>`).join('\n    ')}
  </nav>
  <div class="nav__end">
    <span class="open" data-open><span class="open__dot" aria-hidden="true"></span><span data-open-text>Open every day</span></span>
    <a class="btn btn--sm" href="shop.html"${file === 'shop.html' ? ' aria-current="page"' : ''}>Shop</a>
  </div>
</div></header>`;

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
<meta name="theme-color" content="#dde2d3">
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
const siteNotes = `<script src="site-notes.js" data-site="${C.site}" data-api="${PREVIEW ? 'demo' : C.api}" data-login-url="${PORTAL}" data-door-logo=".brand" data-caption-example="the new terrariums" defer></script>`;
// The shop list (vendor/shop.js) fills every [data-shop] box from the items kept in Stray Wolf Admin.
const shopList = `<script src="shop.js" data-site="${C.site}" data-api="${C.api}" data-book="Reserve your spot" defer></script>`;

const foot = (p) => `<footer class="foot">
<div class="wrap foot__grid">
  <div class="foot__brand">
    <a class="foot__logo" href="index.html">${I.mark.replace('fill="#585f53"', 'fill="#f7f4ee"').replace(/#f5f1ea/g, '#2f342b')}<span>Snip &amp; Sprout Co.</span></a>
    <p>Snip &amp; Sprout Co. is an indoor plant boutique in Northwest Arkansas—offering thoughtfully curated houseplants, artisan pottery, plant care essentials, and hands-on workshops for anyone who wants to grow something.</p>
  </div>
  <div class="foot__col">
    <p class="kicker">Visit</p>
    <address>413 E. Emma Ave.<br>Springdale, AR 72764</address>
    <a href="${C.maps}" target="_blank" rel="noopener">Get directions</a>
  </div>
  <div class="foot__col">
    <p class="kicker">Hours</p>
    ${HOURS3}
  </div>
  <div class="foot__col">
    <p class="kicker">Elsewhere</p>
    <ul class="foot__list">
      <li><a href="${C.ig}" target="_blank" rel="noopener">Instagram</a></li>
      <li><a href="${C.etsy}" target="_blank" rel="noopener">Etsy</a></li>
      <li><a href="mailto:${C.email}">Email Dani</a></li>
      <li><a href="${PORTAL}">Owner portal</a></li>
    </ul>
  </div>
</div>
<div class="wrap foot__base">
  <span>© <span data-year>2026</span> Snip &amp; Sprout Co. · Payments by Square</span>
  ${read('src/stray-badge.html').replace(/^<!--[\s\S]*?-->\n/, '').trim()}
</div>
</footer>
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
  const html = secure(head(p) + nav(p.file) + body + foot(p));
  written.set(p.file, html);
  writeFileSync(dist + p.file, html);
};

/* ---------------- shared pieces ---------------- */
const slip = `<div class="slip" data-in>
      <h3>Sunday, November 22</h3>
      <div class="slip__row"><span>Starts</span><span>1 PM</span></div>
      <div class="slip__row"><span>Where</span><span>413 E. Emma Ave.</span></div>
      <h3>Choose your terrarium</h3>
      <p>Open, Closed, Skull, Teardrop Glass or Pumpkin</p>
      <h3>Your ticket includes</h3>
      <div class="slip__row"><span>Your vessel</span><span>included</span></div>
      <div class="slip__row"><span>Plants and all building materials</span><span>included</span></div>
      <div class="slip__row"><span>Hands-on guidance and care tips</span><span>included</span></div>
      <div class="slip__total"><span>Your spot</span><span>from $40</span></div>
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
        <a class="btn btn--paper" href="workshops.html#next">Reserve your spot ${I.arrow}</a>
        ${calendar}
      </div>`;
// On Workshops the seats come from Dani's shop list (classes kept in Stray Wolf Admin, each with its
// Square checkout link). Until that list has a class, the button inside the box is what shows.
const workshopActs = `<div class="band__acts">
        <div class="seats" data-shop data-kind="class" data-group="off">
          <a class="btn" href="${C.workshop}" target="_blank" rel="noopener">Reserve your spot ${I.out}</a>
        </div>
        ${calendar}
      </div>`;

// The top of every page, built like the sign at her Plant Bar: a short numbered list set big (the menu),
// beside one photograph with a ticket on it. The h1 is the small label above the menu.
//   items: [{ t: line, v: value on the right (a price or hours), href: makes the line a link, days: hours rows }]
const top = (t) => `<section class="top" aria-labelledby="top-title">
  <div class="top__text">
    <h1 class="kicker" id="top-title" data-in>${t.title}</h1>
    <ol class="menu${t.hours ? ' menu--hours' : ''}"${t.hours ? ' id="hours" data-hours3' : ''}>
      ${t.items.map((m) => `<li${m.days ? ` data-days="${m.days}"` : ''} data-in>${m.href ? `<a class="menu__item" href="${m.href}">${m.t}</a>` : `<span class="menu__item">${m.t}</span>`}${m.v ? `<span class="menu__value">${m.v}</span>` : ''}</li>`).join('\n      ')}
    </ol>
    <p class="top__lede" data-in>${t.lede}</p>${t.note ? `\n    <p class="top__note" data-in>${t.note}</p>` : ''}${t.acts ? `\n    <div class="acts" data-in>${t.acts}</div>` : ''}
  </div>
  <div class="plate">
    <img src="img/${t.pic.src}" width="${t.pic.w}" height="${t.pic.h}" alt="${t.pic.alt}" fetchpriority="high"${t.pic.pos ? ` style="object-position:${t.pic.pos}"` : ''}>
    <p class="ticket">${t.ticket}</p>
  </div>
</section>`;

// A course: one numbered section of an inner page, its heading (and photo) beside the text.
const course = (c, body) => `<section class="course"${c.id ? ` id="${c.id}"` : ''} aria-labelledby="${c.key}-title"><div class="course__in">
  <div class="course__head">
    ${c.n ? `<span class="course__n" aria-hidden="true">${c.n}</span>\n    ` : ''}<h2 class="h1" id="${c.key}-title" data-in>${c.title}</h2>${c.pic ? `\n    <img class="course__pic${c.pic.wide ? ' course__pic--wide' : ''}" src="img/${c.pic.src}" width="${c.pic.w}" height="${c.pic.h}" alt="${c.pic.alt}" loading="lazy"${c.pic.pos ? ` style="object-position:${c.pic.pos}"` : ''}>` : ''}
  </div>
  <div class="course__body">
${body}
  </div>
</div></section>`;

// The closing invitation on inner pages: her olive band, with a photograph.
const invite = (v) => `<section class="band" aria-labelledby="${v.key}-title"><div class="wrap band__grid">
  <div class="band__text">
    <h2 class="display" id="${v.key}-title" data-in>${v.title}</h2>
    <p data-in>${v.text}</p>
    <div class="band__acts" data-in>${v.acts}</div>
  </div>
  <img class="band__pic" src="img/${v.pic.src}" width="${v.pic.w}" height="${v.pic.h}" alt="${v.pic.alt}" loading="lazy"${v.pic.pos ? ` style="object-position:${v.pic.pos}"` : ''}>
</div></section>`;

// The sayings on her wooden plant markers. Written twice so the ribbon can loop without a seam; it is
// decoration, so screen readers skip it.
const SAYINGS = ['Stayin’ alive', 'Happy new home!', 'You grow girl!', 'Way to grow!', 'Little sprout', 'Love grows here'];
const ribbon = `<div class="ribbon" aria-hidden="true"><div class="ribbon__track">
  ${[...SAYINGS, ...SAYINGS].map((s) => `<span>${s}</span>`).join('')}
</div></div>`;

/* ---------------- Home ---------------- */
page({ file: 'index.html', body: 'home', title: 'Snip & Sprout Co. · Plants, pottery and workshops in Springdale, AR',
  desc: 'An indoor plant boutique at 413 E. Emma Ave. in downtown Springdale. Plants, pottery, a walk-in Plant Bar, a Terrarium Bar, take-home kits and workshops.' }, `<main id="main">
${top({ title: 'The Plant Bar at Snip &amp; Sprout Co.',
  items: [{ t: 'Pick your pot.' }, { t: 'Pick your plant.' }, { t: 'Pot it up.' }, { t: 'Make it yours.' }],
  lede: 'Our Plant Bar is one of my favorite things ever! Stop by anytime we’re open, pick out a plant and pot, and make it your own. Trust me, you can’t really mess it up.',
  acts: `<a class="btn" href="#visit">Plan your visit ${I.arrow}</a>\n      <a class="link" href="workshops.html">Book a workshop</a>`,
  pic: { src: 'plant-bar-dani.webp', w: 1536, h: 2304, alt: 'Dani potting a plant at the Plant Bar, her Plant Bar sign behind her', pos: '58% 50%' },
  ticket: `<span><b>No advance notice required</b><small>Walk in during shop hours!</small></span><span class="ticket__price">$22</span>` })}
${ribbon}

<section class="ways" id="ways" aria-labelledby="ways-title"><div class="wrap">
  <div class="ways__head">
    <div>
      <p class="kicker" data-in>The shop</p>
      <h2 class="display" id="ways-title" data-in>Get your hands a little dirty</h2>
    </div>
    <p data-in>Make it at your kitchen table with a DIY kit, or come make it with us in the shop!</p>
  </div>
  <div class="ways__grid">
    <article class="way" data-in>
      <img class="way__pic" src="img/kit-flatlay.webp" width="1536" height="1920" alt="A DIY terrarium kit laid out in labelled bags: drainage layer, soil, moss and the how-to card" loading="lazy">
      <div class="way__head"><h3 class="h3">DIY Terrarium Kits</h3><span class="way__price">$55</span></div>
      <p class="way__where">${I.home} Prepared for pickup, made at home</p>
      <ul class="way__list">
        <li>Kits are prepared to order and ready for pickup</li>
        <li>Choose your style: Closed, Open, Skull or Teardrop</li>
        <li>A relaxing creative afternoon, an at-home date night, or a gift for your favorite plant lover</li>
      </ul>
      <a class="btn btn--tone" href="shop.html#kits">Choose a kit ${I.arrow}</a>
    </article>
    <article class="way" data-in>
      <img class="way__pic" src="img/tbar-lantern.webp" width="1440" height="1800" alt="Dani holding an empty glass lantern terrarium, ready to fill" loading="lazy">
      <div class="way__head"><h3 class="h3">Terrarium Bar</h3><span class="way__price">from $45</span></div>
      <p class="way__where">${I.pin} In-shop experience, one day's notice</p>
      <ul class="way__list">
        <li>Choose your terrarium style, then come build it with us</li>
        <li>Personalize it with plants and decorative details</li>
        <li>At least one day's advance notice, so we can prepare your vessel</li>
      </ul>
      <a class="btn btn--tone" href="shop.html#tbar">Book the Terrarium Bar ${I.arrow}</a>
    </article>
    <article class="way" data-in>
      <img class="way__pic" src="img/stakes-tall.webp" width="1086" height="1357" alt="Wooden plant markers with sayings like Little sprout and Way to grow, beside stacks of pastel pots" loading="lazy">
      <div class="way__head"><h3 class="h3">Plant Bar</h3><span class="way__price">$22</span></div>
      <p class="way__where">${I.pin} In-shop experience, just walk in</p>
      <ul class="way__list">
        <li>Pick out a plant and pot, then put it all together at our planting station</li>
        <li>Add in moss, a fun plant marker, or mini decor</li>
        <li>Fun for all ages!</li>
      </ul>
      <a class="btn btn--tone" href="shop.html#pbar">See the Plant Bar ${I.arrow}</a>
    </article>
  </div>
</div></section>

${course({ key: 'faq', title: 'A few questions we get all the time…',
  pic: { src: 'pbar-ivy.webp', w: 1023, h: 1537, alt: 'A little ivy potted at the Plant Bar, with moss and a tiny mushroom, in front of the Plant Bar sign' } }, `    <div class="faq">
      <details><summary>Do I need a reservation?</summary><p>Nope! Just stop by anytime we're open!</p></details>
      <details><summary>Is there an age limit?</summary><p>Not at all! The Plant Bar is fun for all ages.</p></details>
      <details><summary>How many decor pieces can I use?</summary><p>Up to 5 per pot!</p></details>
      <details><summary>Is the decor always the same?</summary><p>No! We switch out our décor with the seasons!</p></details>
      <details><summary>Can I bring my own pot?</summary><p>Sure thing! You'll just need to pay a $12 “potting fee.”</p></details>
    </div>
    <p data-in><a class="btn" href="shop.html#pbar">See the Plant Bar ${I.arrow}</a></p>`)}

<section class="band" id="workshop" aria-labelledby="ws-title"><div class="wrap band__grid">
  <div class="band__text">
    <p class="kicker" data-in>The next workshop</p>
    <h2 class="display" id="ws-title" data-in>November Terrarium Workshop</h2>
    <p data-in>Join us for a relaxing afternoon of planting and creating! Sunday, November 22 at 1 PM. Seats are limited, reserve yours today!</p>
    <div data-in>${workshopActsHome}</div>
  </div>
  ${slip}
</div></section>

<section class="slips" aria-labelledby="rev-title"><div class="wrap">
  <div class="section-head">
    <p class="kicker" data-in>Google reviews</p>
    <h2 class="display" id="rev-title" data-in>Plant parent love</h2>
    <p data-in>From our Google reviews.</p>
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
      <img class="is-on" src="img/ig-globe.webp" width="1100" height="1375" alt="A glass terrarium with succulents, moss and tiny pumpkins" data-cap="A spooky-season terrarium" loading="lazy">
      <img src="img/ig-skull.webp" width="1100" height="1375" alt="A stone skull planter holding an alocasia, among pumpkins and autumn leaves" data-cap="The skull planter" loading="lazy">
      <img src="img/ig-pumpkin.webp" width="1100" height="1375" alt="An alocasia potted in a pumpkin-shaped pot" data-cap="Fall at the Plant Bar" loading="lazy">
      <img src="img/ig-props.webp" width="1100" height="1375" alt="Plant cuttings rooting in glass jars of water" data-cap="Cuttings, rooting in water" loading="lazy">
      <img src="img/ig-spider.webp" width="1100" height="1375" alt="A spider plant cutting with new roots, in a glass bulb on a gold stand" data-cap="A new propagation, ready for its pot" loading="lazy">
    </button>
    <p class="frame__cap" data-frame-cap aria-live="polite">A spooky-season terrarium</p>
  </div>
  <div class="reel__text">
    <p class="kicker" data-in>From the shop</p>
    <h2 class="display" id="reel-title" data-in>A few of our favorites</h2>
    <p data-in>Each one tells its own little story. Tap the picture to see the next.</p>
    <p data-in>Not everyone has time to build their own terrarium… and that’s okay! I’d be happy (literally overjoyed) to make you a custom one. <a class="link" href="mailto:${C.email}?subject=Custom%20terrarium">Ask about a custom terrarium</a></p>
    <a class="btn" href="${C.ig}" target="_blank" rel="noopener" data-in>Follow @snipandsprout.co ${I.out}</a>
  </div>
</div></section>

<section class="visit" id="visit" aria-labelledby="visit-title"><div class="visit__in">
  <img src="img/bar-wide.webp" width="1448" height="1086" alt="The Plant Bar inside the shop: the sign, a tray of plant markers, pots and a monstera" loading="lazy">
  <div class="visit__card" data-in>
    <div class="visit__pad">
      <h2 class="h1" id="visit-title">Come see us!</h2>
      <address>413 E. Emma Ave.<br>Springdale, AR 72764<br><button class="textbtn small" type="button" data-copy="413 E. Emma Ave., Springdale, AR 72764">Copy the address</button></address>
      <p class="open" data-open><span class="open__dot" aria-hidden="true"></span><span data-open-text>Open every day</span></p>
      ${HOURS3}
      <p class="small">Street parking out front, and a bench for waiting friends. Flowers, cards, books, candles, and more, all under one roof with In Bloom Floral Company, Two Friends Community Books and KaGie's.</p>
    </div>
    <a class="btn btn--wide" href="${C.maps}" target="_blank" rel="noopener">Get directions ${I.out}</a>
  </div>
</div>
</section>
</main>
`);

/* ---------------- Shop ---------------- */
// The Shop section was first built for her Squarespace page, where scripts were not allowed, so its tabs
// and style picker are plain radio buttons and CSS. It lives in src/shop-section.html and .css. Here the
// menu at the top takes the place of the section's own title and intro, and its lines open the tabs.
const shopSection = read('src/shop-section.html')
  .replace(/  <div class="sns-head">[\s\S]*?\n  <\/div>\n/, '')
  .replace('aria-labelledby="sns-shop-title"', 'aria-label="DIY Terrarium Kits, Terrarium Bar and Plant Bar"');
page({ file: 'shop.html', body: 'shop-page', shop: true, css: ['shop-section.css', 'shop.css'], title: 'Shop · DIY Terrarium Kits, Terrarium Bar and Plant Bar · Snip & Sprout Co.',
  desc: 'Take-home DIY terrarium kits, the in-shop Terrarium Bar and the walk-in Plant Bar at Snip & Sprout Co. in Springdale. Secure checkout through Square.' }, `<main id="main">
${top({ title: 'The Shop at Snip &amp; Sprout Co.',
  items: [{ t: 'DIY Terrarium Kits', v: '$55', href: '#kits' }, { t: 'Terrarium Bar', v: 'from $45', href: '#tbar' }, { t: 'Plant Bar', v: '$22', href: '#pbar' }],
  lede: 'Bring the Snip &amp; Sprout experience to your kitchen table with a DIY kit, or come create with us at the Terrarium Bar or the Plant Bar!',
  pic: { src: 'kit-flatlay.webp', w: 1536, h: 1920, alt: 'A DIY terrarium kit laid out in labelled bags: drainage layer, soil, moss and the how-to card' },
  ticket: `<span><b>Secure checkout through Square</b><small>Kits are ready for pickup at 413 E. Emma Ave.</small></span>` })}
${shopSection}</main>
`);

/* ---------------- Workshops ---------------- */
page({ file: 'workshops.html', shop: true, css: ['shop.css'], title: 'Workshops · Snip & Sprout Co., Springdale',
  desc: 'Hands-on terrarium workshops at 413 E. Emma Ave. in Springdale. All supplies included, take home what you make. Private events too.' }, `<main id="main">
${top({ title: 'Workshops at Snip &amp; Sprout Co.',
  items: [{ t: 'Gather.' }, { t: 'Create.' }, { t: 'Grow.' }],
  lede: 'Slow down, get your hands dirty, and create something beautiful. Bring a friend or come solo and enjoy a little creative time surrounded by plants.',
  acts: `<a class="btn" href="#next">The next workshop ${I.arrow}</a>\n      <a class="link" href="#private">Private events</a>`,
  pic: { src: 'apron-dodeca.webp', w: 1440, h: 1800, alt: 'An open geometric glass terrarium held in front of a Snip &amp; Sprout apron' },
  ticket: `<span><b>Next: Sunday, November 22</b><small>1 PM at 413 E. Emma Ave.</small></span><span class="ticket__price">from $40</span>` })}
<div class="courses">
${course({ key: 'next', id: 'next', n: '01', title: 'November Terrarium Workshop',
  pic: { src: 'ig-teardrop.webp', w: 1100, h: 1375, alt: 'A glass teardrop terrarium with an air plant, white sand and tiny decor', pos: '50% 75%' } }, `    ${slip}
    <div data-in>${workshopActs}</div>`)}
${course({ key: 'incl', n: '02', title: 'What every workshop includes',
  pic: { src: 'ig-trio.webp', w: 1024, h: 1024, alt: 'Three workshop guests holding the terrariums they made' } }, `    <ul class="facts" data-in>
      <li><b>Hands-on learning.</b> Every workshop includes step-by-step instruction in a relaxed, welcoming environment.</li>
      <li><b>All supplies included.</b> We will provide everything you need, just bring yourself and enjoy creating.</li>
      <li><b>Take home your creation.</b> Leave with a finished project you’ll be proud to display at home.</li>
      <li><b>Community.</b> Meet fellow plant lovers while enjoying a fun, creative evening.</li>
    </ul>`)}
${course({ key: 'past', n: '03', title: 'Earlier this fall' }, `    <ul class="past" data-in>
      <li><span>Witchy Terrarium Night</span><span>Oct 9</span></li>
      <li><span>Fall at the Shop, with In Bloom and KaGie's</span><span>Oct 16 – 18</span></li>
      <li><span>Emma After Dark</span><span>Oct 30</span></li>
    </ul>
    <p data-in>Missed one? Keep an eye on our <a class="link" href="${C.ig}" target="_blank" rel="noopener">Instagram</a> for the next dates!</p>`)}
${course({ key: 'priv', id: 'private', n: '04', title: 'Gather your favorite people',
  pic: { src: 'ig-group.webp', w: 1100, h: 1952, alt: 'A private workshop group around the table, holding their terrariums', pos: '50% 46%' } }, `    <p data-in>We host private workshops for birthdays, bridal showers, team building, client appreciation gatherings, and more. We’ll bring the plants, supplies, and instructions. You simply gather your guests!</p>
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
      <p class="small">Opens an email to Dani with your details filled in.</p>
    </div>`)}
</div>
${invite({ key: 'bar', title: 'Looking for an everyday creative experience?',
  text: 'Come create your own miniature world at our in-shop Terrarium Bar! At least one day’s advance notice is required so we can prepare your vessel.',
  acts: `<a class="btn btn--paper" href="shop.html#tbar">Book the Terrarium Bar ${I.arrow}</a>`,
  pic: { src: 'tbar-lantern.webp', w: 1440, h: 1800, alt: 'Dani holding an empty glass lantern terrarium, ready to fill', pos: '50% 55%' } })}
</main>
`);

/* ---------------- Visit ---------------- */
page({ file: 'visit.html', title: 'Visit · 413 E. Emma Ave., Springdale · Snip & Sprout Co.',
  desc: 'Hours, parking and directions for Snip & Sprout Co. at 413 E. Emma Ave. in downtown Springdale, AR. Open every day.' }, `<main id="main">
${top({ title: 'Visit us at 413 E. Emma Ave.', hours: true,
  items: [{ t: 'Mon – Tue', v: '10 AM – 3 PM', days: '1,2' }, { t: 'Wed – Fri', v: '9 AM – 6 PM', days: '3,4,5' }, { t: 'Sat – Sun', v: '9 AM – 2 PM', days: '6,0' }],
  lede: 'Come wander the shelves, smell the soil, and ask us the things you’ve been googling at midnight. No appointment needed!',
  note: 'Planning a Terrarium Bar visit? At least one day’s advance notice is required so we can prepare your vessel.',
  acts: `<a class="btn" href="${C.maps}" target="_blank" rel="noopener">Get directions ${I.out}</a>\n      <button class="textbtn" type="button" data-copy="413 E. Emma Ave., Springdale, AR 72764">Copy the address</button>`,
  pic: { src: 'ig-window.webp', w: 1080, h: 1350, alt: 'Dani outside the shop window, lettered Snip &amp; Sprout Co.', pos: '40% 50%' },
  ticket: `<span><b>413 E. Emma Ave.</b><small>Street parking out front, and a bench for waiting friends</small></span><span class="open" data-open><span class="open__dot" aria-hidden="true"></span><span data-open-text>Open every day</span></span>` })}
<div class="courses">
${course({ key: 'find', n: '01', title: 'What you\'ll find in the shop',
  pic: { src: 'shop-shelves.webp', w: 1200, h: 1800, alt: 'Shelves of plants, pots and baskets inside the shop' } }, `    <ul class="facts" data-in>
      <li><b>Plants and pottery.</b> A thoughtfully curated selection of healthy plants and timeless pottery.</li>
      <li><b>Plant care help.</b> Helpful plant care resources to support you long after you bring a plant home.</li>
      <li><b>The Plant Bar and Terrarium Bar.</b> Get your hands a little dirty while you're here!</li>
      <li><b>Workshops and seasonal arrivals.</b> Fresh workshops, seasonal arrivals, and new finds throughout the year.</li>
    </ul>`)}
${course({ key: 'nb', n: '02', title: 'Under the same roof',
  pic: { src: 'ig-storefront.webp', w: 860, h: 627, alt: 'The white storefront at 413 E. Emma Ave. in downtown Springdale', wide: true } }, `    <p data-in>Four locally female-owned businesses, one beautiful shared space, and a whole lot of creativity! Flowers, cards, books, candles, and more, all under one roof.</p>
    <div data-in>${NEIGHBORS}</div>
    <p data-in>Street parking out front, and a bench for waiting friends.</p>`)}
${course({ key: 'hello', n: '03', title: 'Say hello' }, `    <p data-in>Plant questions welcome, always. Email Dani about a plant, a workshop or a private event.</p>
    <p data-in><a class="btn" href="mailto:${C.email}">Email Dani ${I.arrow}</a></p>`)}
</div>
</main>
`);

/* ---------------- About ---------------- */
page({ file: 'about.html', title: 'About Dani · Snip & Sprout Co.',
  desc: 'Snip & Sprout Co. is an indoor plant boutique in Northwest Arkansas, started by Dani to make plant care approachable and to give people a place to gather.' }, `<main id="main">
${top({ title: 'About Snip &amp; Sprout Co.',
  items: [{ t: 'Slow down.' }, { t: 'Learn something new.' }, { t: 'Get your hands dirty.' }],
  lede: 'A little shop rooted in the love of plants and community.',
  acts: `<a class="btn" href="visit.html">Plan your visit ${I.arrow}</a>\n      <a class="link" href="workshops.html">See workshops</a>`,
  pic: { src: 'dani-overalls.webp', w: 1280, h: 1920, alt: 'Dani in overalls holding up a potted plant, surrounded by plants', pos: '50% 30%' },
  ticket: `<span><b>Hi everyone, I’m Dani!</b><small>In downtown Springdale since August 2026</small></span>` })}
<div class="courses">
${course({ key: 'story', n: '01', title: 'Plants have always been more than decor to me',
  pic: { src: 'pbar-scoop.webp', w: 1536, h: 2304, alt: 'Hands scooping soil around a new ivy at the Plant Bar', pos: '50% 62%' } }, `    <p data-in>They’ve been a way to slow down, create something beautiful, and bring life into everyday spaces. I created Snip &amp; Sprout Co. to make indoor plant care feel approachable, inspiring, and fun for EVERYONE.</p>
    <p data-in>Snip &amp; Sprout Co. has been a dream in the making, and I still can’t quite believe this space and love of mine is so real! It was created to be more than just a place to buy plants and attend workshops; it’s a space to slow down, learn something new, get your hands dirty, and leave feeling a little more connected.</p>
    <p class="statement" data-in>“Whether you’ve kept a fiddle leaf fig alive for years or accidentally loved one too hard (we’ve all been there), you are SO welcome here!”</p>
    <p data-in>Dani</p>
    <figure class="pair" data-in>
      <img src="img/shop-wall.webp" width="1086" height="1448" alt="Shelves in the shop with plants, pots and candles" loading="lazy">
      <img src="img/markers-gold.webp" width="1100" height="1650" alt="Plant markers in a gold pot: I will survive, You grow girl, I am rooting for you" loading="lazy">
      <figcaption class="small muted">Inside the shop on Emma Avenue.</figcaption>
    </figure>`)}
${course({ key: 'val', n: '02', title: 'What we’re about in three words',
  pic: { src: 'dani-pothos.webp', w: 1200, h: 1800, alt: 'Dani holding a satin pothos', pos: '50% 45%' } }, `    <div class="vals">
      <div data-in><h3>Approachable</h3><p>Plant care shouldn’t feel like a test.</p></div>
      <div data-in><h3>Gathering</h3><p>Workshops and community nights. More than just a plant shop, I wanted to create a place where people gather.</p></div>
      <div data-in><h3>Genuine guidance</h3><p>Honest answers about light, water, and what will actually be happy where you want to put it.</p></div>
    </div>`)}
</div>
${invite({ key: 'go', title: 'Let’s grow something together',
  text: 'I’m SO glad you’re here, and I can’t wait to help you grow something you’ll love.',
  acts: `<a class="btn btn--paper" href="visit.html">Come say hello ${I.arrow}</a><a class="link" href="workshops.html">See workshops</a>`,
  pic: { src: 'stakes-tall.webp', w: 1086, h: 1357, alt: 'Wooden plant markers and pastel pots at the Plant Bar', pos: '50% 100%' } })}
</main>
`);

/* ---------------- Not found ---------------- */
// Cloudflare Pages serves 404.html for any address that doesn't exist, at any depth, hence the base tag.
page({ file: '404.html', base: '/', title: 'Page not found · Snip & Sprout Co.', desc: 'That page isn’t here. Find the shop, the workshops and our hours from the home page.' }, `<main id="main">
${top({ title: 'Oops! This page didn’t take root',
  items: [{ t: 'The home page', href: 'index.html' }, { t: 'The Shop', href: 'shop.html' }, { t: 'Workshops', href: 'workshops.html' }, { t: 'Hours and directions', href: 'visit.html' }],
  lede: 'It may have moved. Try one of these instead!',
  pic: { src: 'stakes-tall.webp', w: 1086, h: 1357, alt: 'Wooden plant markers and pastel pots at the Plant Bar', pos: '50% 100%' },
  ticket: `<span><b>Stayin’ alive</b><small>One of the plant markers at the Plant Bar</small></span>` })}
</main>
`);

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
