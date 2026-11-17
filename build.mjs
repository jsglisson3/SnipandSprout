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
for (const f of ['site-notes.js', 'shop-manager.js', 'shop-manager.css', 'html2canvas.min.js', 'shop.js', 'shop.css']) cpSync(here + 'vendor/' + f, dist + f);

const C = {
  url: 'https://snipandsprout.pages.dev/',           // the site's address: her own domain at launch (see README, Launch)
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
  pics: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="4" width="14" height="12" rx="2"/><circle cx="7.5" cy="8.5" r="1.4"/><path d="m3.5 14.5 4.2-4 3 2.8 2.2-2 3.6 3.2"/></svg>',
  // the photo viewer's buttons
  prev: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12.5 4.5 7 10l5.5 5.5"/></svg>',
  next: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M7.5 4.5 13 10l-5.5 5.5"/></svg>',
  close: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15"/></svg>',
  // the footer links: email and the portal in the same 20 px line style
  // Instagram's and Etsy's own marks (from Simple Icons, CC0), shown white on each brand's colour tile (.ic-ig, .ic-etsy)
  ig: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"/></svg>',
  etsy: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8.559 2.445c0-.325.033-.52.59-.52h7.465c1.3 0 2.02 1.11 2.54 3.193l.42 1.666h1.27c.23-4.728.43-6.784.43-6.784s-3.196.36-5.09.36H6.635L1.521.196v1.37l1.725.326c1.21.24 1.5.496 1.6 1.606 0 0 .11 3.27.11 8.64 0 5.385-.09 8.61-.09 8.61 0 .973-.39 1.333-1.59 1.573l-1.722.33V24l5.13-.165h8.55c1.935 0 6.39.165 6.39.165.105-1.17.75-6.48.855-7.064h-1.2l-1.284 2.91c-1.005 2.28-2.476 2.445-4.11 2.445h-4.906c-1.63 0-2.415-.64-2.415-2.05V12.8s3.62 0 4.79.096c.912.064 1.463.325 1.76 1.598l.39 1.695h1.41l-.09-4.278.192-4.305h-1.391l-.45 1.89c-.283 1.244-.48 1.47-1.754 1.6-1.666.17-4.815.14-4.815.14V2.45h-.05z"/></svg>',
  mail: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="2.8" y="4.8" width="14.4" height="10.4" rx="2.2"/><path d="m3.6 6.2 6.4 4.8 6.4-4.8"/></svg>',
  lock: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="4.2" y="8.8" width="11.6" height="8" rx="2"/><path d="M7 8.8V6.6a3 3 0 0 1 6 0v2.2"/></svg>',
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

const NAV = [['shop.html', 'Shop'], ['workshops.html', 'Workshops'], ['gallery.html', 'Gallery'], ['visit.html', 'Visit Us'], ['about.html', 'About']];
const nav = (file) => {
  const link = ([h, t]) => `<a${h === 'shop.html' ? ' class="nav__shop"' : ''} href="${h}"${h === file ? ' aria-current="page"' : ''}>${t}</a>`;
  return `<header class="nav"><nav class="nav__in" aria-label="Main">
  <div class="nav__links">${NAV.slice(0, 3).map(link).join('')}</div>
  <a class="brand" href="index.html" aria-label="Snip &amp; Sprout Co. home"><img src="logo-tag.svg" alt="" width="177" height="144"></a>
  <div class="nav__links nav__links--end">${NAV.slice(3).map(link).join('')}<span class="open" data-open><span class="open__dot" aria-hidden="true"></span><span data-open-text>Open every day</span></span></div>
</nav></header>`;
};

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

// A page's own address: Cloudflare Pages serves shop.html at /shop.
const url = (file) => C.url + (file === 'index.html' ? '' : file.replace(/\.html$/, ''));


const head = (p) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">${p.base ? `\n<base href="${p.base}">` : ''}
<title>${p.title}</title>
<meta name="description" content="${p.desc}">${p.file === '404.html' ? '' : `
<link rel="canonical" href="${url(p.file)}">
<meta property="og:url" content="${url(p.file)}">`}
<meta property="og:site_name" content="Snip &amp; Sprout Co.">
<meta property="og:title" content="${p.title}">
<meta property="og:description" content="${p.desc}">
<meta property="og:image" content="${C.url}img/share.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="The Plant Bar at Snip &amp; Sprout Co.: her Plant Bar sign, a tray of plant markers and stacks of pots">
<meta property="og:type" content="website">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#dde2d3">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="preload" href="fonts/figtree.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/lora.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="site.css">${(p.css || []).map((f) => `\n<link rel="stylesheet" href="${f}">`).join('')}
<script>${JS_FLAG}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Store","name":"Snip & Sprout Co.","url":"${C.url}","image":"${C.url}img/share.jpg","logo":"${C.url}logo.svg","hasMap":"${C.maps}","description":"Indoor plant boutique with pottery, a Plant Bar, a Terrarium Bar and workshops.","address":{"@type":"PostalAddress","streetAddress":"413 E. Emma Ave.","addressLocality":"Springdale","addressRegion":"AR","postalCode":"72764","addressCountry":"US"},"email":"${C.email}","sameAs":["${C.ig}","${C.etsy}"],"openingHoursSpecification":[{"@type":"OpeningHoursSpecification","dayOfWeek":["Monday","Tuesday"],"opens":"10:00","closes":"15:00"},{"@type":"OpeningHoursSpecification","dayOfWeek":["Wednesday","Thursday","Friday"],"opens":"09:00","closes":"18:00"},{"@type":"OpeningHoursSpecification","dayOfWeek":["Saturday","Sunday"],"opens":"09:00","closes":"14:00"}]}</script>
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
<div class="shop-scene" data-shop-scene><img src="shop-scene.svg" alt="" width="2400" height="214" loading="lazy" decoding="async"></div>
<div class="wrap foot__grid">
  <div class="foot__brand">
    <a class="foot__logo" href="index.html" aria-label="Snip &amp; Sprout Co. home"><img src="logo-tag.svg" alt="" width="177" height="144"></a>
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
      <li><a href="${C.ig}" target="_blank" rel="noopener"><span class="foot__ic ic-ig">${I.ig}</span>Instagram<span class="sr"> (opens in a new tab)</span></a></li>
      <li><a href="${C.etsy}" target="_blank" rel="noopener"><span class="foot__ic ic-etsy">${I.etsy}</span>Etsy shop<span class="sr"> (opens in a new tab)</span></a></li>
      <li><a href="mailto:${C.email}"><span class="foot__ic">${I.mail}</span>Email Dani</a></li>
      <li><a href="${PORTAL}"><span class="foot__ic">${I.lock}</span>Owner portal</a></li>
    </ul>
  </div>
</div>
<div class="wrap foot__base">
  <span>© <span data-year>2026</span> Snip &amp; Sprout Co. · Payments by Square</span>
  ${read('src/stray-badge.html').replace(/^<!--[\s\S]*?-->\n/, '').trim()}
</div>
</footer>
<nav class="tabbar" aria-label="Quick links">
  ${[['index.html', 'Home', I.home], ['shop.html', 'Shop', I.bag], ['workshops.html', 'Workshops', I.cal], ['gallery.html', 'Gallery', I.pics], ['visit.html', 'Visit', I.pin], ['about.html', 'About', I.leaf]].map(([h, t, ic]) => `<a href="${h}"${h === p.file ? ' aria-current="page"' : ''}>${ic}<span>${t}</span></a>`).join('\n  ')}
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

// A course: one section of an inner page, its heading (and photo) beside the text.
const course = (c, body) => `<section class="course${c.cls ? ' ' + c.cls : ''}"${c.id ? ` id="${c.id}"` : ''} aria-labelledby="${c.key}-title"><div class="course__in">
  <div class="course__head">
    <h2 class="h1" id="${c.key}-title" data-in>${c.title}</h2>${c.head ? `
    ${c.head}` : ''}${c.pic ? `\n    <img class="course__pic${c.pic.wide ? ' course__pic--wide' : ''}" src="img/${c.pic.src}" width="${c.pic.w}" height="${c.pic.h}" alt="${c.pic.alt}" loading="lazy"${c.pic.pos ? ` style="object-position:${c.pic.pos}"` : ''}>` : ''}
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


/* ---------------- Home ---------------- */
page({ file: 'index.html', body: 'home', title: 'Snip & Sprout Co. · Plants, pottery and workshops in Springdale, AR',
  desc: 'An indoor plant boutique at 413 E. Emma Ave. in downtown Springdale. Plants, pottery, a walk-in Plant Bar, a Terrarium Bar, take-home kits and workshops.' }, `<main id="main">
<section class="hero hero--home" aria-labelledby="top-title">
  <div class="hero__text">
    <!-- Her words, as on her current home page (snipandsproutco.com) -->
    <h1 class="hero__title" id="top-title" data-in>Plants that make a house feel like home</h1>
    <p class="hero__lede" data-in>We’re Snip &amp; Sprout Co., an indoor plant boutique in Northwest Arkansas. Come in, take your time, and let us help you find something that will be happy in your window – and easy for you to keep.</p>
    <div class="acts" data-in><a class="btn" href="#visit">Plan your visit ${I.arrow}</a>
      <a class="link" href="workshops.html">Book a workshop</a></div>
  </div>
  <img class="hero__pic" src="img/dani-overalls.webp" width="1280" height="1920" alt="Dani in overalls holding up a potted plant, surrounded by plants" fetchpriority="high">
</section>

<section class="pbar" id="plant-bar" aria-labelledby="pbar-title"><div class="wrap pbar__grid">
  <img class="pbar__pic" src="img/pbar-scoop.webp" width="1536" height="2304" alt="Hands scooping soil around a new ivy at the Plant Bar, the Plant Bar sign behind" loading="lazy" data-in>
  <div class="pbar__text">
    <p class="kicker" data-in>The Plant Bar</p>
    <h2 class="display" id="pbar-title" data-in>Pick out a plant and pot, and make it your own</h2>
    <p data-in>Our Plant Bar is one of my favorite things ever! Stop by anytime we’re open. Trust me, you can’t really mess it up.</p>
    <ol class="steps">
      <li data-in><b>Pick your pot</b><span>Choose the one that speaks to you</span></li>
      <li data-in><b>Pick your plant</b><span>Find the perfect little plant to call it home</span></li>
      <li data-in><b>Pot it up</b><span>Add soil and settle your new plant in</span></li>
      <li data-in><b>Make it yours</b><span>Add in moss, a fun plant marker, or mini decor</span></li>
    </ol>
    <div class="pbar__foot" data-in><p><b class="price">$22</b>No advance notice required. Walk in during shop hours!</p><a class="btn btn--tone" href="shop.html#pbar">See the Plant Bar ${I.arrow}</a></div>
  </div>
</div></section>

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
    <div class="acts" data-in><a class="btn btn--ig" href="${C.ig}" target="_blank" rel="noopener"><span class="ic-ig">${I.ig}</span>Follow @snipandsprout.co<span class="sr"> on Instagram (opens in a new tab)</span></a>
      <a class="link" href="gallery.html">See the gallery</a></div>
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
<section class="hero hero--center" aria-labelledby="top-title">
  <h1 class="hero__title" id="top-title" data-in>The Shop</h1>
  <p class="hero__lede" data-in>Bring the Snip &amp; Sprout experience to your kitchen table with a DIY kit, or come create with us at the Terrarium Bar or the Plant Bar!</p>
  <ul class="jump" role="list" data-in>
    <li><a href="#kits">DIY Terrarium Kits<span>$55</span></a></li>
    <li><a href="#tbar">Terrarium Bar<span>from $45</span></a></li>
    <li><a href="#pbar">Plant Bar<span>$22</span></a></li>
  </ul>
  <p class="hero__note" data-in>Secure checkout through Square. Kits are ready for pickup at 413 E. Emma Ave.</p>
</section>
${shopSection}</main>
`);

/* ---------------- Workshops ---------------- */
page({ file: 'workshops.html', shop: true, css: ['shop.css'], title: 'Workshops · Snip & Sprout Co., Springdale',
  desc: 'Hands-on terrarium workshops at 413 E. Emma Ave. in Springdale. All supplies included, take home what you make. Private events too.' }, `<main id="main">
<section class="hero hero--ws" aria-labelledby="top-title">
  <div class="hero__text">
    <p class="kicker" data-in>Workshops at Snip &amp; Sprout Co.</p>
    <h1 class="hero__title" id="top-title" data-in>Gather. Create. Grow.</h1>
    <p class="hero__lede" data-in>Slow down, get your hands dirty, and create something beautiful. Bring a friend or come solo and enjoy a little creative time surrounded by plants.</p>
    <a class="next" href="#next" data-in>
      <span class="next__when"><b>Sunday, November 22</b>1 PM at 413 E. Emma Ave.</span>
      <span class="next__price">from $40</span>
      <span class="next__go">The next workshop ${I.arrow}</span>
    </a>
    <p data-in><a class="link" href="#private">Private events</a></p>
  </div>
  <div class="duo">
    <img src="img/gal/workshop-table.webp" width="720" height="900" alt="Guests building terrariums around the workshop table" fetchpriority="high">
    <img src="img/apron-dodeca.webp" width="1440" height="1800" alt="An open geometric glass terrarium held in front of a Snip &amp; Sprout apron">
  </div>
</section>
<div class="courses">
${course({ key: 'next', id: 'next', title: 'November Terrarium Workshop',
  pic: { src: 'ig-teardrop.webp', w: 1100, h: 1375, alt: 'A glass teardrop terrarium with an air plant, white sand and tiny decor', pos: '50% 75%' } }, `    ${slip}
    <div data-in>${workshopActs}</div>`)}
${course({ key: 'incl', title: 'What every workshop includes',
  pic: { src: 'ig-trio.webp', w: 1024, h: 1024, alt: 'Three workshop guests holding the terrariums they made' } }, `    <ul class="facts" data-in>
      <li><b>Hands-on learning.</b> Every workshop includes step-by-step instruction in a relaxed, welcoming environment.</li>
      <li><b>All supplies included.</b> We will provide everything you need, just bring yourself and enjoy creating.</li>
      <li><b>Take home your creation.</b> Leave with a finished project you’ll be proud to display at home.</li>
      <li><b>Community.</b> Meet fellow plant lovers while enjoying a fun, creative evening.</li>
    </ul>`)}
${course({ key: 'past', title: 'Earlier this fall' }, `    <ul class="past" data-in>
      <li><span>Witchy Terrarium Night</span><span>Oct 9</span></li>
      <li><span>Fall at the Shop, with In Bloom and KaGie's</span><span>Oct 16 – 18</span></li>
      <li><span>Emma After Dark</span><span>Oct 30</span></li>
    </ul>
    <p data-in>Missed one? Keep an eye on our <a class="link" href="${C.ig}" target="_blank" rel="noopener">Instagram</a> for the next dates!</p>`)}
${course({ key: 'priv', id: 'private', title: 'Gather your favorite people',
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
<section class="hero hero--visit" aria-labelledby="top-title"><div class="hero--visit__in">
  <div class="place" data-in>
    <p class="open" data-open><span class="open__dot" aria-hidden="true"></span><span data-open-text>Open every day</span></p>
    <h1 class="hero__title" id="top-title">Come see us!</h1>
    <address>413 E. Emma Ave.<br>Springdale, AR 72764</address>
    <div id="hours">${HOURS3}</div>
    <div class="acts"><a class="btn" href="${C.maps}" target="_blank" rel="noopener">Get directions ${I.out}</a>
      <button class="textbtn" type="button" data-copy="413 E. Emma Ave., Springdale, AR 72764">Copy the address</button></div>
  </div>
  <div class="hero--visit__side">
    <img class="hero__pic" src="img/dani-market.webp" width="1440" height="1527" alt="Dani at the Snip &amp; Sprout Co. booth at the Fifth Market, smiling beside a table of plants and plant care jars" fetchpriority="high">
    <p class="hero__lede" data-in>Come wander the shelves, smell the soil, and ask us the things you’ve been googling at midnight. No appointment needed!</p>
    <p class="hero__note" data-in>Planning a Terrarium Bar visit? At least one day’s advance notice is required so we can prepare your vessel.</p>
  </div>
</div></section>
<div class="courses">
${course({ key: 'find', title: 'What you\'ll find in the shop',
  pic: { src: 'shop-shelves.webp', w: 1200, h: 1800, alt: 'Shelves of plants, pots and baskets inside the shop' } }, `    <ul class="facts" data-in>
      <li><b>Plants and pottery.</b> A thoughtfully curated selection of healthy plants and timeless pottery.</li>
      <li><b>Plant care help.</b> Helpful plant care resources to support you long after you bring a plant home.</li>
      <li><b>The Plant Bar and Terrarium Bar.</b> Get your hands a little dirty while you're here!</li>
      <li><b>Workshops and seasonal arrivals.</b> Fresh workshops, seasonal arrivals, and new finds throughout the year.</li>
    </ul>`)}
${course({ key: 'nb', title: 'Under the same roof',
  pic: { src: 'ig-storefront.webp', w: 860, h: 627, alt: 'The white storefront at 413 E. Emma Ave. in downtown Springdale', wide: true } }, `    <p data-in>Four locally female-owned businesses, one beautiful shared space, and a whole lot of creativity! Flowers, cards, books, candles, and more, all under one roof.</p>
    <div data-in>${NEIGHBORS}</div>
    <p data-in>Street parking out front, and a bench for waiting friends.</p>`)}
${course({ key: 'hello', title: 'Say hello' }, `    <p data-in>Plant questions welcome, always. Email Dani about a plant, a workshop or a private event.</p>
    <p data-in><a class="btn" href="mailto:${C.email}">Email Dani ${I.arrow}</a></p>`)}
</div>
</main>
`);

/* ---------------- About ---------------- */
page({ file: 'about.html', title: 'About Dani · Snip & Sprout Co.',
  desc: 'Snip & Sprout Co. is an indoor plant boutique in Northwest Arkansas, started by Dani to make plant care approachable and to give people a place to gather.' }, `<main id="main">
<section class="hero hero--about" aria-labelledby="top-title">
  <img class="hero__pic" src="img/dani-monstera.webp" width="1179" height="2096" alt="Dani in her Snip &amp; Sprout Co. tee, smiling, holding a tall monstera in a stone pot" fetchpriority="high">
  <div class="hero__text">
    <p class="kicker" data-in>About Snip &amp; Sprout Co.</p>
    <h1 class="hero__title" id="top-title" data-in>Hi everyone, I’m Dani!</h1>
    <p class="hero__lede" data-in>A little shop rooted in the love of plants and community. In downtown Springdale since August 2026.</p>
    <ul class="trio" role="list" data-in><li>Slow down.</li><li>Learn something new.</li><li>Get your hands dirty.</li></ul>
    <div class="acts" data-in><a class="btn" href="#visit">Plan your visit ${I.arrow}</a>
      <a class="link" href="workshops.html">See workshops</a></div>
  </div>
</section>
<div class="courses">
${course({ key: 'story', title: 'Plants have always been more than decor to me',
  pic: { src: 'dani-pothos.webp', w: 1200, h: 1800, alt: 'Dani holding a satin pothos', pos: '50% 45%' } }, `    <p data-in>They’ve been a way to slow down, create something beautiful, and bring life into everyday spaces. I created Snip &amp; Sprout Co. to make indoor plant care feel approachable, inspiring, and fun for EVERYONE.</p>
    <p data-in>Snip &amp; Sprout Co. has been a dream in the making, and I still can’t quite believe this space and love of mine is so real! It was created to be more than just a place to buy plants and attend workshops; it’s a space to slow down, learn something new, get your hands dirty, and leave feeling a little more connected.</p>
    <p class="statement" data-in>“Whether you’ve kept a fiddle leaf fig alive for years or accidentally loved one too hard (we’ve all been there), you are SO welcome here!”</p>
    <p data-in>Dani</p>
    <figure class="pair" data-in>
      <img src="img/shop-wall.webp" width="1086" height="1448" alt="Shelves in the shop with plants, pots and candles" loading="lazy">
      <img src="img/markers-gold.webp" width="1100" height="1650" alt="Plant markers in a gold pot: I will survive, You grow girl, I am rooting for you" loading="lazy">
      <figcaption class="small muted">Inside the shop on Emma Avenue.</figcaption>
    </figure>`)}
${course({ key: 'val', title: 'What we’re about in three words', cls: 'course--row' }, `    <div class="vals">
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

/* ---------------- Gallery ---------------- */
// Her photos in four groups. Each tile is a 4:5 crop (img/gal/, made by photo-tools/gallery-photos.py) that links
// to the whole photo; site.js opens it in the photo viewer below, with her caption. Without script the link opens
// the photo itself. Every caption is a line from her own posts, her Plant Bar sign or her Shop text.
const GALLERY = [
  { key: 'terrariums', cover: 'spooky', title: 'Terrariums', line: 'Each one tells its own little story: plants, moss, crystals &amp; all!',
    link: ['shop.html#kits', 'Shop terrarium kits'], photos: [
    ['spooky', 'ig-globe.webp', 'A round glass terrarium with succulents, moss, white stones and tiny pumpkins', 'Just a few of our favorite spooky terrariums from this season'],
    ['winter', 'ig-teardrop.webp', 'A glass teardrop terrarium with an air plant and tiny holiday decor, hanging among Christmas decorations', 'A tiny winter wonderland you make with your own hands'],
    ['christmas', 'gal/christmas-full.webp', 'Christmas terrariums with ferns, white stones, a tiny red house and a little Santa', 'Fresh ferns, wintery decor, tiny houses, snow-kissed trees'],
    ['made-to-order', 'gal/made-to-order-full.webp', 'Dani building a custom terrarium in a geometric glass vessel at the shop counter', 'A tiny forest, made to order'],
    ['dino-kit', 'gal/dino-kit-full.webp', 'A mini terrarium kit: a glass jar, bags of soil and stones, a little plant and a toy dinosaur', 'Our newest mini terrarium kit! Dino lovers… get ready.'],
    ['kit', 'kit-flatlay.webp', 'A DIY terrarium kit laid out in labelled bags: drainage layer, soil, moss and the how-to card', 'Make it at your kitchen table with a DIY kit'],
  ] },
  { key: 'plant-bar', cover: 'ivy', title: 'The Plant Bar', line: 'Stop by anytime we’re open, pick out a plant and pot, and make it your own.',
    link: ['shop.html#pbar', 'See the Plant Bar'], photos: [
    ['plant-bar', 'plant-bar-dani.webp', 'Dani potting a plant at the Plant Bar, her Plant Bar sign behind her', 'Our Plant Bar is one of my favorite things ever!'],
    ['ivy', 'pbar-ivy.webp', 'A little ivy potted at the Plant Bar, with moss and a tiny mushroom, in front of the Plant Bar sign', 'Add soil and settle your new plant in'],
    ['pumpkin', 'ig-pumpkin.webp', 'An alocasia potted in a pumpkin-shaped pot', 'Fall looks better at the plant bar'],
    ['spooky-succulents', 'gal/spooky-succulents-full.webp', 'Stacks of little terracotta pots beside a Spooky Succulents sign and a painted jack-o’-lantern pot', 'Paint a mini pot and plant your own spooky succulent'],
    ['markers', 'stakes-tall.webp', 'Wooden plant markers with sayings like Little sprout and Way to grow, beside stacks of pastel pots', 'Choose the one that speaks to you'],
    ['markers-gold', 'markers-gold.webp', 'Plant markers in a gold pot: I will survive, You grow girl, I am rooting for you', 'Add in moss, a fun plant marker, or mini decor'],
  ] },
  { key: 'workshops', cover: 'group', title: 'Workshops', line: 'A fun night out with the girls, a date night activity, or just an excuse to make something green and happy!',
    link: ['workshops.html', 'Book a workshop'], photos: [
    ['group', 'ig-group.webp', 'A group around a workshop table in the shop, smiling, with their finished terrariums', 'Gather your favorite people and make something that grows'],
    ['trio', 'ig-trio.webp', 'Three friends holding up the terrariums they made at the Merry Terrarium Workshop', 'A season full of creativity, community, and growing together'],
    ['workshop-table', 'gal/workshop-table-full.webp', 'A long workshop table set with glass vessels, trays of soil and stones, and plants, as guests build', 'Consider this your invitation to get a little creative'],
    ['workshop-one', 'gal/workshop-one-full.webp', 'Dani helping guests build their terrariums at the first Terrarium Workshop', 'Terrarium Workshop #1 was such a success!'],
    ['apron', 'apron-dodeca.webp', 'Dani in her Snip &amp; Sprout Co. apron holding a geometric glass terrarium', 'We’ll guide you every step of the way'],
    ['lantern', 'tbar-lantern.webp', 'Dani holding an empty glass lantern terrarium, ready to fill', 'Choose your terrarium style, then come build it with us'],
  ] },
  { key: 'plants', cover: 'mama-pothos', title: 'Plants', line: 'Here’s to the roots that keep us all growing together.',
    link: ['visit.html', 'Plan your visit'], photos: [
    ['mama-pothos', 'gal/mama-pothos-full.webp', 'A full golden pothos glowing in the afternoon sun', 'One of our sweet mama plants, glowing in the afternoon sun'],
    ['monstera-leaf', 'gal/monstera-leaf-full.webp', 'A new monstera leaf unfurling by a sunny window', 'This baby Monstera leaf is just starting to unfurl'],
    ['echeveria', 'gal/echeveria-full.webp', 'A lipstick echeveria held up in its nursery pot', 'Our new lipstick echeverias just landed'],
    ['cuttings', 'ig-props.webp', 'Plant cuttings rooting in glass jars of water', 'Rooting for these little beauties, literally!'],
    ['propagation', 'ig-spider.webp', 'A spider plant cutting with new roots, in a glass bulb on a gold stand', 'Our latest propagation is finally ready for its new home!'],
    ['skull', 'ig-skull.webp', 'A stone skull planter holding an alocasia, among pumpkins and autumn leaves', 'Skull planters for spooky season'],
  ] },
];
let galCount = 0;
const galTotal = GALLERY.reduce((n, g) => n + g.photos.length, 0);
page({ file: 'gallery.html', title: 'Gallery · Terrariums, the Plant Bar and workshops · Snip & Sprout Co.',
  desc: 'Photos from Snip & Sprout Co. in downtown Springdale: terrariums, the Plant Bar, workshops and plants.' }, `<main id="main">
<section class="hero hero--center hero--gal" aria-labelledby="top-title">
  <h1 class="hero__title" id="top-title" data-in>Gallery</h1>
  <p class="hero__lede" data-in>Watching this space fill with laughter and new faces has been the best part.</p>
  <ul class="groups" role="list">
    ${GALLERY.map((g) => `<li data-in><a href="#${g.key}"><img src="img/gal/${g.cover}.webp" width="720" height="900" alt=""><span>${g.title}</span></a></li>`).join('\n    ')}
  </ul>
  <div class="acts" data-in><a class="btn btn--ig" href="${C.ig}" target="_blank" rel="noopener"><span class="ic-ig">${I.ig}</span>Follow @snipandsprout.co<span class="sr"> on Instagram (opens in a new tab)</span></a></div>
</section>
<div class="courses">
${GALLERY.map((g) => course({ key: g.key, id: g.key, title: g.title, cls: 'course--gal',
  head: `<p class="course__line" data-in>${g.line}</p>\n    <a class="link" href="${g.link[0]}" data-in>${g.link[1]}</a>` },
`    <ul class="gal" role="list">
${g.photos.map(([tile, full, alt, cap]) => `      <li data-in><a class="gal__item" href="img/${full}" data-cap="${cap}" data-n="${++galCount}"><img src="img/gal/${tile}.webp" width="720" height="900" alt="${alt}" loading="lazy" decoding="async"></a></li>`).join('\n')}
    </ul>`)).join('\n')}
</div>
<dialog class="lb" data-lb aria-label="Photo viewer">
  <figure class="lb__fig">
    <img class="lb__img" src="data:," alt="" data-lb-img>
    <figcaption class="lb__cap"><span data-lb-cap></span><span class="lb__n" data-lb-n></span></figcaption>
  </figure>
  <button class="lb__btn lb__btn--prev" type="button" data-lb-step="-1" aria-label="Previous photo">${I.prev}</button>
  <button class="lb__btn lb__btn--next" type="button" data-lb-step="1" aria-label="Next photo">${I.next}</button>
  <button class="lb__btn lb__btn--close" type="button" data-lb-close aria-label="Close the photo" autofocus>${I.close}</button>
</dialog>
</main>
`);
if (galCount !== galTotal) throw new Error('gallery numbering');

/* ---------------- Not found ---------------- */
// Cloudflare Pages serves 404.html for any address that doesn't exist, at any depth, hence the base tag.
page({ file: '404.html', base: '/', title: 'Page not found · Snip & Sprout Co.', desc: 'That page isn’t here. Find the shop, the workshops and our hours from the home page.' }, `<main id="main">
<section class="hero hero--center" aria-labelledby="top-title">
  <h1 class="hero__title" id="top-title" data-in>Oops! This page didn’t take root</h1>
  <p class="hero__lede" data-in>It may have moved. Try one of these instead!</p>
  <ul class="jump" role="list" data-in>
    <li><a href="index.html">The home page</a></li>
    <li><a href="shop.html">The Shop</a></li>
    <li><a href="workshops.html">Workshops</a></li>
    <li><a href="visit.html">Hours and directions</a></li>
  </ul>
</section>
</main>
`);

/* ---------------- Client Portal ---------------- */
// Dani's private page for sending Stray Wolf changes and photos (src/portal.html, served at /portal/).
// It is Stray Wolf's standard portal page with her details filled in.
// "On your site now" on its Photos page is read from the pages just written, so it can't fall behind.
const PAGE_NAMES = { 'index.html': 'Homepage', 'shop.html': 'Shop page', 'workshops.html': 'Workshops page', 'visit.html': 'Visit page', 'about.html': 'About page', 'gallery.html': 'Gallery page' };
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
for (const f of ['site.css', 'site.js', 'shop-section.css', 'favicon.svg', 'logo.svg', 'logo-tag.svg', 'shop-scene.svg', 'leaves.svg', '_headers']) cpSync(here + 'src/' + f, dist + f);
// The list of pages for search engines (not the 404 page or the portal), named at the end of robots.txt.
writeFileSync(dist + 'sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${
  [...written.keys()].filter((f) => f !== '404.html').map((f) => `  <url><loc>${url(f)}</loc></url>`).join('\n')}\n</urlset>\n`);
writeFileSync(dist + 'robots.txt', read('src/robots.txt') + `Sitemap: ${C.url}sitemap.xml\n`);
cpSync(here + 'version.json', dist + 'version.json');   // the Stray Wolf admin reads the site's version from here
console.log(`built ${written.size} pages (the 404 page among them) and the Client Portal${PREVIEW ? ' (preview)' : ''}`);
