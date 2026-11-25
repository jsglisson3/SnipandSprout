/*!
 * site-notes.js  ·  Stray Wolf Technology  ·  v2
 *
 * Lets a client mark up their own site for Stray Wolf: tap "Add a note", tap the
 * part of the page they mean, say what they want, add photos, send.
 * Normal visitors never see any of it. The site itself never changes.
 *
 * On every page of the client's site:
 *   <script src="/js/site-notes.js" data-site="cedar-street"
 *           data-api="https://YOUR-SERVICE.workers.dev" defer></script>
 *
 * On the client's own page (/portal/index.html: login + their boxes + the
 * Edit mode button) the same tag plus:
 *           data-hub
 * That page is the only way in. Its Edit mode button (any element with
 * data-edit-mode="/") opens the live site with Edit mode on. "Exit edit mode"
 * brings them back to their page.
 *
 * Options:
 *   data-site       the client's short name (must match the admin page)
 *   data-api        the service address, or "demo" to try it with no service
 *                   (demo password: wolf)
 *   data-to         who the notes go to (default: Stray Wolf)
 *   data-hub        this page is the client's own page (and the password page)
 *   data-login-url  where that page lives (default: /portal/)
 *   data-door       the hidden way in (default: the "Powered by Stray Wolf" badge).
 *                   Press and hold it for a little over a second (a press just beside
 *                   it counts, and a finger may drift a little): a soft moonlight grows from it
 *                   (the wolf's eyes glow), washes over the screen, and the client's
 *                   page comes up out of it. A normal tap works as usual. Any CSS
 *                   selector works, several too (".swt-badge, .moon-door"); inside
 *                   it, an element marked data-door-center is where the light starts.
 *                   data-door="none" turns it off.
 *   data-door-logo  the site's own logo as one more door (".hdr-logo, .ftr-logo"). The same
 *                   hold opens the client's page and a normal tap still goes home. A logo is
 *                   big, so the press must be on it (no near miss), and a swipe that starts
 *                   on it still scrolls the page.
 *   data-name       the business name ("Welcome, TVIS Construction")
 *   data-logo       their logo picture, shown big on the login box
 *   data-caption-example  a photo caption that fits this client ("the new shed pad"), shown as
 *                   the example under the first photo of a note. Empty = no example.
 * On the client's page:
 *   data-edit-mode="/"      on a button or card: opens the site in Edit mode
 *   data-edit-mode="soon"   the mockup isn't ready yet (says so when tapped)
 *   data-note-box           a box that opens a note with one tap: a small box over the dimmed page, with Cancel
 *                   left of the one main button
 *     data-area / data-note-ask / data-note-hint   its name, question, example
 *     data-note-title="Send a new logo"             the box's heading, when the name alone isn't one
 *     data-note-fields="Facebook|Instagram"         one line to fill in for each
 *     data-note-now="Phone=423-555-0100|Email=..."  what's on the site now: those lines show the
 *                   current value with a Change button, so they only type what's new
 *     A fields list naming social sites (Instagram, Etsy, Google...) shows each with its own logo.
 *   data-brand="instagram"  on any element (a row of "On your site now"): puts that site's logo before
 *                   its words (Facebook, Instagram, LinkedIn, Google, Etsy, TikTok, YouTube, Pinterest, X;
 *                   any other name gets a plain link logo)
 * "Show me on the site": a page opened with #sw-find={...} (the admin builds it from a note's
 *   sel/path/fx/fy/snip) scrolls to that spot and rings it. Each note sends url, sel, path,
 *   fx, fy, py (how far down the page, 0 to 1), snip (its words) and vw (screen width), plus
 *   shot: a small picture of the spot (uploaded like a photo; needs html2canvas.min.js next
 *   to this file, or data-shot-lib="its address"; data-shot-lib="none" = no pictures).
 *   data-booking-url  on any element of their page: a booking page (like a Google Calendar appointment
 *                   schedule). Set = a Let's talk button in the header opens that page; empty = no button.
 *   data-alert-key  optional Web3Forms key: emails a heads-up when notes arrive
 * The pages of their portal (their own page only): each <section id="shop" data-page="Shop"> on their page is one
 *   page of the portal, and the first is Home. One shows at a time and the address says which (/portal/#shop), so
 *   Back, Forward and a saved link work; a link to something on a page (#hours) opens the page holding it. This
 *   script draws the links in <nav data-portal-nav> (then "Need changes?" and Edit my website, from their page's
 *   data-edit-mode link), the same pages as a bar along the bottom of a phone, and a link back to Home on every
 *   other page. A page shows for a client who has what it holds: Messages needs [data-form-portal] and Shop needs
 *   [data-shop-portal]; the rest are always there.
 *     data-page-short="Info"                         its name in the phone's bar, when the full one is too long
 *     data-page-about="Items, prices and photos"     its line in Home's list
 *     data-page-wide                                 a wider page, for the shop's table
 *   Home's two lists are filled in here: <ul data-needs> with <span data-needs-n hidden> (what needs them: a
 *   question from Stray Wolf, new messages, notes not sent yet) and <ul data-glance> (each other page with where
 *   it stands). A page with no [data-page] gets none of this.
 * Your requests (their own page only): <section data-requests hidden> holding <ul data-requests-list>
 *   and <button data-requests-all hidden>. After login it lists what they've asked for and where each
 *   one stands: Received, Working on it, Stray Wolf has a question, Done, Not doing this one. It is the
 *   same status Stray Wolf picks in the admin (POST /api/my-requests). A question gets an Answer button
 *   (POST /api/my-request/answer {batch, n, text}). Nothing sent yet = one line saying so.
 * Your shop (their own page only): <section data-shop-portal hidden> holding <div data-shop-list>. For a client
 *   whose website sells things (kit/shop), it holds the shop manager, the same screen as Stray Wolf's admin:
 *   shop-manager.js and shop-manager.css, copied next to this file and fetched only when they have a shop
 *   (POST /api/my-shop and its calls; SW Core 2.2 or newer). Stray Wolf starts the shop and sets its kind of
 *   checkout. No shop = no Shop page.
 * Business info (their own page only): a box with data-info="hours", "contact" or "social" opens the business info
 *   editor as a page over the portal (kit/info: info.js, info-editor.js and info-editor.css, copied next to this
 *   file). What they save there goes live on their website (POST /api/my-info and its calls; SW Core 2.5 or newer),
 *   and the box's "On your site now" list follows it. On an older service the box stays a note box.
 *   The box says what the website has today, so the editor starts from it:
 *     data-info-typed="09:00-14:00,10:00-15:00,...,closed"   the hours box: the week typed into the website, Sunday first
 *     data-note-fields / data-note-now (as for a note)       the contact lines and the social pages the site has a spot for
 * Messages from your website (their own page only): for a client whose website form sends to the notes service.
 *   Their page places an empty <section data-form-portal hidden> where it wants the list (and, anywhere, a
 *   [data-form-count] line for how many there are). It's a
 *   short inbox: one row per message (who, what they want, when, a dot while it's new) with Reply, Call, Mark
 *   replied and Delete (one tap, with Undo); a row opens to every answer and file; ticked rows (or Select all)
 *   are marked or deleted together (POST /api/my-form, /api/my-form/lead {id, status}, /lead/delete {id}).
 *   "Emails go to" lets the client change where the emails go (POST /api/my-form/to {to}; a new address gets a
 *   short email at once). Form off in the admin, or an older service: no Messages page.
 * Let's talk: one button, which this script adds in the header beside Help when their page carries a
 *   data-booking-url. It opens that booking page in a new tab (so does any element with data-talk).
 * The Photos page (their own page only): a box with data-photos-page opens a full page instead of
 *   a small note (also at <portal>#photos). Adding photos (drag and drop, a few words each) and sending them
 *   from that page, which stays open for more, then
 *   "Photos you sent", each marked Received, Approved, On your site or Not used (Stray Wolf picks
 *   that in the admin; POST /api/my-photos and /api/my-photo {key}), then
 *   "On your site now" from <template data-site-photos> on their page:
 *     <img src="small.jpg" data-big="big.jpg" alt="what it shows" data-on="Homepage|About page">
 *   data-more="Your project pages have more photos." data-more-url="/projects" on the template adds a link.
 *   When the photos are on two or more pages, a row of page buttons (All, then each page with its count)
 *   shows one page at a time; Download all and the big view follow the page picked.
 */
(function () {
  "use strict";
  var S = document.currentScript; if (!S) return;
  var SITE = (S.getAttribute("data-site") || "site").toLowerCase();
  var API = (S.getAttribute("data-api") || "demo").replace(/\/+$/, "");
  var DEMO = API === "demo";
  var TO = S.getAttribute("data-to") || "Stray Wolf";
  var IS_HUB = S.hasAttribute("data-hub") || S.hasAttribute("data-login");
  var MODE = IS_HUB ? "hub" : "edit";   // hub = their own page; edit = Edit mode on the site
  var LOGIN_URL = S.getAttribute("data-login-url") || "/portal/";
  var DOOR = S.getAttribute("data-door") || ".swt-badge";   // the hidden way in: hold this for a little over a second
  var DOOR_LOGO = DOOR !== "none" && S.getAttribute("data-door-logo") || "";   // the site's own logo: one more door
  if (DOOR_LOGO) DOOR += ", " + DOOR_LOGO;
  var NAME = S.getAttribute("data-name") || "";   // the business name, for "Welcome, ..." on the login box
  var LOGO = S.getAttribute("data-logo") || "";   // their logo, shown on the login box
  var CAPTION_EXAMPLE = S.getAttribute("data-caption-example") || "";   // "the new shed pad": the example caption under a note's first photo
  var ALERT_KEY = S.getAttribute("data-alert-key") || "";
  // html2canvas, for a small picture of the spot each note is about. Lives next to this file;
  // data-shot-lib="none" turns the pictures off.
  var SHOT_LIB = S.getAttribute("data-shot-lib") || (S.src || "").replace(/[^\/?#]*([?#].*)?$/, "html2canvas.min.js");
  var K = "swn:" + SITE + ":";
  var MAX_PICS = 20, MAX_SIDE = 2000;

  /* =========================================================== storage */

  function lsGet(k) { try { return localStorage.getItem(K + k); } catch (e) { return null; } }
  function lsSet(k, v) { try { v == null ? localStorage.removeItem(K + k) : localStorage.setItem(K + k, v); } catch (e) {} }

  /* =========================================================== session */
  // The login is kept as {t: token, at: when they logged in, seen: last time they did something}.
  // It ends after IDLE_MS with nothing done, or MAX_MS after logging in, whichever comes first,
  // and the service enforces the same limits on its side. A bare token saved by an older version
  // has no times on it, so it counts as ended and they log in once more.
  var IDLE_MS = 2 * 36e5, MAX_MS = 24 * 36e5;
  function sessRead() {
    var raw = lsGet("token"), s = null;
    try { s = JSON.parse(raw || "null"); } catch (e) {}
    return s && typeof s.t === "string" && s.at > 0 && s.seen > 0 ? s : null;
  }
  function sessLive(s, now) { now = now || Date.now(); return !!s && now - s.seen < IDLE_MS && now - s.at < MAX_MS && s.at <= now + 6e4; }
  function getToken() {
    var s = sessRead();
    if (!sessLive(s)) { if (lsGet("token") != null) lsSet("token", null); return null; }
    return s.t;
  }
  function setToken(t) { var now = Date.now(); lsSet("token", t ? JSON.stringify({ t: t, at: now, seen: now }) : null); }
  var lastTouch = 0;
  function touch() {   // something was done: push the idle limit back (at most once every 30 s)
    var now = Date.now(); if (now - lastTouch < 3e4) return; lastTouch = now;
    var s = sessRead(); if (!sessLive(s, now)) return;
    s.seen = now; lsSet("token", JSON.stringify(s));
  }
  // Log out: the service forgets the login too, then this browser does.
  function endSession() {
    var t = getToken() || (sessRead() || {}).t;
    if (t && !DEMO) { try { fetch(API + "/api/logout", { method: "POST", headers: { authorization: "Bearer " + t }, body: "{}", keepalive: true }).catch(function () {}); } catch (e) {} }
    setToken(null); lsSet("on", null);
  }

  var st = { notes: [], sent: false, intro: false, sentNotes: 0, sentPics: 0 };
  try { var saved = JSON.parse(lsGet("state") || "null"); if (saved && Array.isArray(saved.notes)) { for (var key in saved) st[key] = saved[key]; } } catch (e) {}
  function save() { lsSet("state", JSON.stringify(st)); }

  // Photos wait in the browser's own database until they're sent.
  var mem = {}, dbp = null, urls = {};
  function db() {
    if (!dbp) dbp = new Promise(function (res) {
      try {
        var r = indexedDB.open("swn-" + SITE, 1);
        r.onupgradeneeded = function () { r.result.createObjectStore("pics"); };
        r.onsuccess = function () { res(r.result); };
        r.onerror = r.onblocked = function () { res(null); };
      } catch (e) { res(null); }
    });
    return dbp;
  }
  function picOp(mode, fn) {
    return db().then(function (d) {
      if (!d) return null;
      return new Promise(function (res) {
        try { var tx = d.transaction("pics", mode), rq = fn(tx.objectStore("pics")); tx.oncomplete = function () { res(rq && rq.result); }; tx.onerror = tx.onabort = function () { res(null); }; }
        catch (e) { res(null); }
      });
    });
  }
  function picPut(id, rec) { mem[id] = rec; return picOp("readwrite", function (s) { return s.put(rec, id); }); }
  function picGet(id) { return mem[id] ? Promise.resolve(mem[id]) : picOp("readonly", function (s) { return s.get(id); }).then(function (r) { if (r) mem[id] = r; return r || null; }); }
  function picDel(id) { delete mem[id]; if (urls[id]) { URL.revokeObjectURL(urls[id]); delete urls[id]; } return picOp("readwrite", function (s) { return s.delete(id); }); }
  function picUrl(id) { return picGet(id).then(function (r) { if (!r) return ""; if (!urls[id]) urls[id] = URL.createObjectURL(r.blob); return urls[id]; }); }

  /* =========================================================== helpers */

  function h(tag, props, kids) {
    var e = document.createElement(tag), k;
    for (k in props || {}) {
      if (k === "class") e.className = props[k];
      else if (k === "text") e.textContent = props[k];
      else if (k === "style") e.style.cssText = props[k];            // via the style object, so strict security rules (CSP) allow it
      else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), props[k]);
      else if (props[k] !== false && props[k] != null) e.setAttribute(k, props[k] === true ? "" : props[k]);
    }
    (kids || []).forEach(function (c) { if (c != null) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }
  var ICONS = {
    note: ["M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 21l1.9-5.2A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z", "M12 8.5v6", "M9 11.5h6"],
    photo: ["M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z", "M3 16l5-5 4 4 3-3 6 6", "M15.5 9.5h.01"],
    send: ["M22 2L11 13", "M22 2l-7 20-4-9-9-4z"],
    help: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3", "M12 17h.01"],
    x: ["M18 6L6 18", "M6 6l12 12"],
    trash: ["M3 6h18", "M8 6V4h8v2", "M19 6l-1 14H6L5 6", "M10 11v6", "M14 11v6"],
    pencil: ["M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"],
    check: ["M20 6L9 17l-5-5"],
    lock: ["M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z", "M8 11V7a4 4 0 0 1 8 0v4"],
    eye: ["M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"],
    tap: ["M9 11V5.5a1.5 1.5 0 0 1 3 0V11", "M12 10.5V9a1.5 1.5 0 0 1 3 0v2", "M15 10.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-2.7L3.6 15a1.5 1.5 0 0 1 2.5-1.7L9 16"],
    power: ["M12 2v10", "M18.4 6.6a9 9 0 1 1-12.8 0"],
    arrow: ["M5 12h14", "M13 6l6 6-6 6"],
    plus: ["M12 5v14", "M5 12h14"],
    download: ["M12 4v11", "M7 10.5l5 5 5-5", "M5 20h14"],
    phone: ["M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"],
    reply: ["M9 14L4 9l5-5", "M4 9h10.5a5.5 5.5 0 0 1 0 11H11"],
    mail: ["M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z", "M3 7l9 6 9-6"],
    clip: ["M21 11.5l-8.6 8.6a5 5 0 0 1-7.1-7.1l8.6-8.6a3.3 3.3 0 0 1 4.7 4.7l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4l7.9-7.9"],
    calendar: ["M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z", "M16 3v4", "M8 3v4", "M3 10h18"],
    search: ["M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z", "M20 20l-4.1-4.1"],
    person: ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M4 21a8 8 0 0 1 16 0"],
    home: ["M3 11.5L12 4l9 7.5", "M5.5 10v9.5h13V10"],
    bag: ["M5 8h14l-1 12H6z", "M9 8V6.5a3 3 0 0 1 6 0V8"],
    globe: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M3 12h18", "M12 3c3 3.2 3 14.8 0 18", "M12 3c-3 3.2-3 14.8 0 18"],
    list: ["M8 6h12", "M8 12h12", "M8 18h12", "M4 6h.01", "M4 12h.01", "M4 18h.01"],
    chev: ["M9 5l7 7-7 7"],
    back: ["M15 5l-7 7 7 7"],
    upload: ["M12 15V4", "M7 9l5-5 5 5", "M5 20h14"]
  };
  // Social sites the portal knows by name: the site's own logo (drawn in a 24 by 24 box), the name it goes by when
  // that isn't the field's own ("Google" = Google business), and an example of the address to paste. A social page
  // it doesn't know gets LINK_LOGO. Logo shapes: Simple Icons (CC0), the Google "G" from Google's own mark.
  var BRANDS = {
    facebook: { ph: "facebook.com/yourpage",
      svg: '<circle cx="12" cy="12" r="11" fill="#fff"/><path fill="#0866FF" d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/>' },
    instagram: { ph: "instagram.com/yourname",
      svg: '<radialGradient id="swn-ig" cx=".3" cy="1.07" r="1.5"><stop offset=".05" stop-color="#fdf497"/><stop offset=".45" stop-color="#fd5949"/><stop offset=".6" stop-color="#d6249f"/><stop offset=".9" stop-color="#285aeb"/></radialGradient><rect width="24" height="24" rx="6" fill="url(#swn-ig)"/><path fill="#fff" transform="translate(4.5 4.5) scale(.625)" d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"/>' },
    linkedin: { ph: "linkedin.com/company/yourname",
      svg: '<rect x="2" y="2" width="20" height="20" fill="#fff"/><path fill="#0A66C2" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>' },
    google: { name: "Google business", ph: "Your Google Maps or business link",
      svg: '<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>' },
    etsy: { ph: "etsy.com/shop/yourshop",
      svg: '<rect width="24" height="24" rx="6" fill="#F1641E"/><path fill="#fff" transform="translate(6 6) scale(.5)" d="M8.559 2.445c0-.325.033-.52.59-.52h7.465c1.3 0 2.02 1.11 2.54 3.193l.42 1.666h1.27c.23-4.728.43-6.784.43-6.784s-3.196.36-5.09.36H6.635L1.521.196v1.37l1.725.326c1.21.24 1.5.496 1.6 1.606 0 0 .11 3.27.11 8.64 0 5.385-.09 8.61-.09 8.61 0 .973-.39 1.333-1.59 1.573l-1.722.33V24l5.13-.165h8.55c1.935 0 6.39.165 6.39.165.105-1.17.75-6.48.855-7.064h-1.2l-1.284 2.91c-1.005 2.28-2.476 2.445-4.11 2.445h-4.906c-1.63 0-2.415-.64-2.415-2.05V12.8s3.62 0 4.79.096c.912.064 1.463.325 1.76 1.598l.39 1.695h1.41l-.09-4.278.192-4.305h-1.391l-.45 1.89c-.283 1.244-.48 1.47-1.754 1.6-1.666.17-4.815.14-4.815.14V2.45h-.05z"/>' },
    tiktok: { name: "TikTok", ph: "tiktok.com/@yourname",
      svg: '<rect width="24" height="24" rx="6" fill="#000"/><g transform="translate(5.5 5) scale(.58)"><path id="swn-tt" fill="#25F4EE" transform="translate(-.9 -.9)" d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/><use href="#swn-tt" fill="#FE2C55" transform="translate(1.8 1.8)"/><use href="#swn-tt" fill="#fff" transform="translate(.9 .9)"/></g>' },
    youtube: { name: "YouTube", ph: "youtube.com/@yourname",
      svg: '<path fill="#fff" d="M9 8l7 4-7 4z"/><path fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>' },
    pinterest: { ph: "pinterest.com/yourname",
      svg: '<circle cx="12" cy="12" r="11" fill="#fff"/><path fill="#E60023" d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/>' },
    x: { name: "X", ph: "x.com/yourname",
      svg: '<rect width="24" height="24" rx="6" fill="#000"/><path fill="#fff" transform="translate(6 6) scale(.5)" d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>' }
  };
  var LINK_LOGO = '<rect width="24" height="24" rx="6" fill="#ece7df"/><g fill="none" stroke="#5f5a53" stroke-width="2.6" stroke-linecap="round" transform="translate(4 4) scale(.667)">' +
    '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/></g>';
  // The site a name means: "Instagram", "Google business", "Twitter" (now X). Null = not one this list knows.
  function brandOf(name) { var k = String(name || "").toLowerCase().replace(/\s+business$/, "").trim(); return BRANDS[k === "twitter" ? "x" : k] || null; }
  // A site's logo (or the plain link logo), in a <span> of the class given.
  function brandLogo(b, cls) {
    var t = document.createElement("span"); t.className = cls;
    t.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (b ? b.svg : LINK_LOGO) + "</svg>";
    return t;
  }
  // Other boxes a "fields" list often asks for: the keyboard a phone should show, and an example.
  // Any other name without its own example ("Label=example") gets a plain text box.
  var FIELD_KINDS = {
    phone: { mode: "tel", ph: "For example: 423-555-0142" },
    email: { mode: "email", ph: "For example: info@yourbusiness.com" },
    address: { mode: "text", ph: "For example: 120 Main St, Cleveland, TN 37311" },
    area: { mode: "text", ph: "For example: Cleveland and Chattanooga" },
    website: { mode: "url", ph: "For example: yourbusiness.com" }
  };
  function icon(name, size) {
    var ns = "http://www.w3.org/2000/svg", s = document.createElementNS(ns, "svg");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true"); s.setAttribute("class", "ic");
    if (size) { s.setAttribute("width", size); s.setAttribute("height", size); }
    (ICONS[name] || []).forEach(function (d) { var p = document.createElementNS(ns, "path"); p.setAttribute("d", d); s.appendChild(p); });
    return s;
  }
  function short(s, n) { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1) + "…" : s; }
  function plural(n, w) { return n + " " + w + (n === 1 ? "" : "s"); }
  function isPhone() { return window.innerWidth < 720; }
  function hasFiles(e) { var t = e.dataTransfer && e.dataTransfer.types; return !!t && Array.prototype.indexOf.call(t, "Files") >= 0; }
  var reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canHover = window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* =========================================================== look */

  var CSS = [
    ":host{all:initial;position:absolute;top:0;left:0;width:0;height:0;z-index:2147483000}",
    "*{box-sizing:border-box}",
    "[hidden]{display:none!important}",
    ".r{--ink:#1f1d1b;--muted:#5f5a53;--line:#e4dfd7;--soft:#f7f4ef;--paper:#fff;--accent:#c2541b;--accent-dk:#a3441a;--accent-soft:#fbeee6;--edge:#8f877b;--go:#2f7a4b;--go-dk:#26633d;--bad:#b3261e;",
    "  font:17px/1.5 system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:var(--ink);-webkit-text-size-adjust:100%;letter-spacing:0}",
    "button{font:inherit;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}",
    "button:focus-visible,textarea:focus-visible,input:focus-visible,a:focus-visible{outline:3px solid #2563c9;outline-offset:2px}",
    ".ic{width:24px;height:24px;flex:none;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}",

    /* the frame and the strip on top of the dock: always say 'notes are on' */
    ".frame{position:fixed;inset:0;pointer-events:none;box-shadow:inset 0 0 0 4px var(--accent);transition:box-shadow .2s}",
    ".frame.picking{box-shadow:inset 0 0 0 6px var(--accent),inset 0 0 0 9999px rgba(194,84,27,.05)}",
    ".strip{background:var(--accent);color:#fff;padding:6px max(12px,env(safe-area-inset-right,0px)) 6px max(16px,env(safe-area-inset-left,0px))}",
    ".strip-in{max-width:1100px;margin:0 auto;display:flex;align-items:center;gap:8px;font-size:15px;line-height:1.2}",
    ".strip .lbl{display:flex;align-items:center;gap:8px;transform-origin:left center;font-weight:700;letter-spacing:.01em;min-width:0;white-space:nowrap}",
    ".strip .lbl .ic{width:20px;height:20px}",
    ".strip .dot{width:9px;height:9px;border-radius:50%;background:#fff;flex:none;box-shadow:0 0 0 0 rgba(255,255,255,.7);animation:beat 2s infinite}",
    "@keyframes beat{70%{box-shadow:0 0 0 7px rgba(255,255,255,0)}100%{box-shadow:0 0 0 0 rgba(255,255,255,0)}}",
    ".strip .sub{opacity:.95;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}",
    ".strip .gap{flex:1}",
    ".strip button{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.18);border:0;color:#fff;border-radius:999px;padding:6px 13px;font-size:15px;font-weight:600;min-height:38px;white-space:nowrap}",
    ".strip button:hover{background:rgba(255,255,255,.3)}",
    ".strip.hub{background:#3a3631}",
    ".strip button .ic{width:19px;height:19px}",
    ".strip .sm{display:none}",
    "@media (max-width:719px){.strip .lg{display:none}.strip .sm{display:inline}.strip .sub{display:none}.strip{padding-top:4px;padding-bottom:4px}.strip button{padding:5px 11px;font-size:14px;min-height:36px}}",

    /* the dock at the bottom */
    ".dock{position:fixed;left:0;right:0;bottom:0;background:var(--ink);color:#fff;box-shadow:0 -6px 24px rgba(0,0,0,.22)}",
    ".dock.quiet .dock-main{display:none}",
    ".dock.bare .strip{display:none}.dock.bare.quiet{display:none}",
    ".dock-main{padding:12px max(16px,env(safe-area-inset-right,0px)) calc(12px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px))}",
    ".dock-in{max-width:1100px;margin:0 auto;display:flex;align-items:center;gap:12px 16px}",
    ".dock .say{flex:1 1 auto;min-width:0;font-size:17px;line-height:1.35}",
    ".dock .say b{display:block;font-size:18px}",
    ".dock .say span{opacity:.82;font-size:15px}",
    ".dock .btns{display:flex;gap:10px;flex:none}",
    ".db{display:flex;align-items:center;justify-content:center;gap:9px;min-height:54px;padding:0 20px;border-radius:12px;border:2px solid transparent;font-size:18px;font-weight:600;white-space:nowrap;transition:background .15s,transform .1s}",
    ".db:active{transform:scale(.97)}",
    ".db.main{background:var(--accent);color:#fff}.db.main:hover{background:var(--accent-dk)}",
    ".db.second{background:transparent;color:#fff;border-color:rgba(255,255,255,.45)}.db.second:hover{background:rgba(255,255,255,.1)}",
    ".db.go{background:var(--go);color:#fff}.db.go:hover{background:var(--go-dk)}",
    ".db.go[disabled],.db.off{background:rgba(255,255,255,.12);color:rgba(255,255,255,.6);cursor:default}",
    ".badge{display:inline-grid;place-items:center;min-width:26px;height:26px;border-radius:999px;background:#fff;color:var(--go-dk);font-size:15px;font-weight:700;padding:0 7px}",
    "@media (max-width:719px){",
    "  .dock-main{padding-top:10px}.dock-in{flex-direction:column;align-items:stretch;gap:8px}",
    "  .dock .say{text-align:center;font-size:15px}.dock .say b{font-size:17px}.dock .say span{display:none}",
    "  .dock .btns{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}",
    "  .db{flex-direction:column;gap:4px;min-height:64px;padding:6px 4px;font-size:15px;border-radius:12px;white-space:normal;text-align:center;line-height:1.15}",
    "  .db .badge{position:absolute;margin:-30px 0 0 34px;min-width:22px;height:22px;font-size:13px}",
    "  .db{position:relative}",
    "  .dock .btns.n2{grid-template-columns:repeat(2,minmax(0,1fr))}",
    "  .dock .btns.n1{grid-template-columns:1fr}.dock .btns.n1 .db{flex-direction:row;gap:10px;min-height:58px;font-size:17px}",
    "  .dock .btns.n1 .db .badge{position:static;margin:0}",
    "}",

    /* pins on the page */
    ".pin{position:absolute;width:36px;height:36px;margin:-38px 0 0 -6px;border-radius:50% 50% 50% 6px;border:3px solid #fff;background:var(--accent);color:#fff;font-weight:700;font-size:16px;",
    "  display:grid;place-items:center;padding:0;box-shadow:0 3px 10px rgba(0,0,0,.35);font-variant-numeric:tabular-nums;transform-origin:6px 36px}",
    ".pin.on{transform:scale(1.15);box-shadow:0 0 0 5px rgba(194,84,27,.35),0 3px 10px rgba(0,0,0,.35)}",
    ".pin.drop{animation:drop .18s ease-out}",
    "@keyframes drop{from{transform:translateY(-8px);opacity:0}}",
    // while placing a note with a mouse: the pin rides on the pointer, its tip exactly where it will land
    ".ghost{position:fixed;left:0;top:0;width:0;height:0;pointer-events:none}",
    ".ghost .pin{opacity:.9;font-size:22px;font-weight:600}",
    ".ghost .tip{position:absolute;left:40px;top:-40px;display:grid;gap:1px;padding:7px 11px;background:var(--ink);color:#fff;font-size:14px;font-weight:600;line-height:1.3;white-space:nowrap;border-radius:9px;box-shadow:0 4px 14px rgba(0,0,0,.25)}",
    ".ghost .tip small{font-size:12.5px;font-weight:500;color:rgba(255,255,255,.78)}",
    ".ghost.left .tip{left:auto;right:16px}",

    /* cards: the note box, the review list, help, login */
    ".card{position:fixed;background:var(--paper);border-radius:14px;box-shadow:0 18px 48px rgba(0,0,0,.3),0 0 0 1px rgba(0,0,0,.05);display:flex;flex-direction:column;overflow:hidden}",
    ".veil,.r>.note{animation:fade .14s ease-out}",   // a box over the page, a note beside its pin, the Photos page
    "@keyframes fade{from{opacity:0}}",
    ".card .hd{display:flex;align-items:flex-start;gap:12px;padding:18px 20px 10px}",
    ".card .hd h2{margin:0;font-size:20px;line-height:1.25;font-weight:600}",
    ".card .hd p{margin:3px 0 0;color:var(--muted);font-size:15px;overflow-wrap:anywhere}",
    ".card .hd .grow{flex:1;min-width:0}",
    ".xbtn{flex:none;display:grid;place-items:center;width:44px;height:44px;margin:-6px -8px 0 0;border:0;background:none;border-radius:999px;color:var(--muted)}",
    ".xbtn:hover{background:var(--soft)}",
    ".card .bd{padding:6px 20px 16px;overflow:auto;display:grid;gap:14px;align-content:start}",
    ".card .ft{padding:14px 20px calc(16px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--line);display:flex;gap:10px;align-items:center;background:var(--paper)}",
    ".num{display:inline-grid;place-items:center;flex:none;width:34px;height:34px;border-radius:50% 50% 50% 6px;background:var(--accent);color:#fff;font-weight:700;font-size:16px;font-variant-numeric:tabular-nums}",
    "label.q{font-weight:600;font-size:17px}",
    /* lines to fill in (a box on their page that asks for a few named things): each name above its box, the box
       starting with what the site says today */
    ".fields{display:grid;gap:14px}",
    ".field{display:grid;gap:6px;min-width:0}",
    ".field .lb{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;font-weight:600;font-size:15.5px;line-height:1.3}",
    ".field .lb em{font-style:normal;font-weight:400;font-size:14.5px;color:var(--muted)}",
    ".field input{font:inherit;font-size:16.5px;color:var(--ink);width:100%;min-width:0;min-height:46px;border:1px solid var(--edge);border-radius:10px;padding:8px 12px;background:#fff}",
    ".field input:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px rgba(194,84,27,.18)}",
    ".field input::placeholder{color:#8d877e}",
    ".field .logo{flex:none;width:22px;height:22px}.field .logo svg{display:block;width:100%;height:100%}",
    ".tip{display:flex;gap:10px;align-items:flex-start;margin:-4px 0 0;color:var(--muted);font-size:15px;line-height:1.45}.tip .ic{flex:none;width:20px;height:20px;margin-top:1px;color:var(--accent-dk,#a3441a)}",
    ".note.wide{width:480px}",
    /* photos: a big tap/drop area, big pictures with their words under them, idea chips */
    ".note.photos{width:600px}",
    ".note.sheet.wide,.note.sheet.photos{width:auto}",
    ".add-ph.big{flex-direction:column;justify-content:center;text-align:center;gap:8px;min-height:150px;padding:22px 18px;border-width:2.5px;border-radius:16px;background:#fff}",
    ".add-ph.big .ic{width:44px;height:44px;stroke-width:1.6}.add-ph.big b{font-size:19px}.add-ph.big span{font-size:15px}",
    ".add-ph.busy{border-style:solid;border-color:var(--accent);background:var(--accent-soft)}.add-ph.busy .ic{animation:swn-pulse 1s ease-in-out infinite}",
    "@keyframes swn-pulse{50%{transform:scale(.85);opacity:.6}}",
    ".note.photos .add-ph.big:has(~ .thumbs:not([hidden])){min-height:88px;flex-direction:row;text-align:left;padding:14px 18px}",
    ".note.photos .add-ph.big:has(~ .thumbs:not([hidden])) .ic{width:32px;height:32px}",
    ".note.photos .thumbs.capt{grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}",
    ".note.photos .thumbs .cap{min-height:0;height:auto;field-sizing:content;font-size:14.5px;line-height:1.35;padding:7px 9px;resize:none;border-radius:9px}",
    ".note.photos .thumbs.capt .t{grid-template-columns:1fr;gap:8px;background:#fff;border:1px solid var(--line);border-radius:14px;padding:8px}",
    ".note.photos .thumbs.capt .ph{width:100%;height:auto;aspect-ratio:4/3}.note.photos .thumbs.capt img{width:100%;height:100%;border-radius:9px}",
    ".note.photos .thumbs.capt .rm{width:32px;height:32px;top:6px;right:6px}",
    ".note.photos .thumbs:not(.capt){display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}",
    ".note.photos .thumbs:not(.capt) .t,.note.photos .thumbs:not(.capt) .ph{width:100%;height:auto;aspect-ratio:1}.note.photos .thumbs:not(.capt) img{width:100%;height:100%}",
    ".note.photos .thumbs .capts{grid-column:1/-1}",
    ".thumbs .cap.flash{border-color:var(--accent);background:#fff;box-shadow:0 0 0 4px rgba(194,84,27,.15)}",
    ".ideas p{margin:0 0 8px;font-size:15px;color:var(--muted)}.ideas p b{color:var(--ink)}",
    ".ideas .chips{display:flex;flex-wrap:wrap;gap:8px}",
    ".chip{border:1px solid #f0d3c2;background:var(--accent-soft);color:#8a3a12;border-radius:999px;padding:9px 14px;font-size:15px;font-weight:600;min-height:42px;text-align:left}",
    ".chip:hover{border-color:var(--accent);background:#fff}",
    "@media (max-width:719px){.note.photos .thumbs.capt{grid-template-columns:1fr 1fr;gap:10px}.note.photos .thumbs:not(.capt){grid-template-columns:repeat(3,minmax(0,1fr))}.add-ph.big{min-height:130px}}",
    /* files dragged over any note: the whole card says "Drop your photos here" */
    ".note .dropcover{display:none}",
    ".note.dropping .dropcover{position:absolute;inset:8px;z-index:3;display:grid;place-content:center;justify-items:center;gap:10px;border:3px dashed var(--accent);border-radius:16px;background:rgba(251,238,230,.94);color:var(--accent-dk,#a3441a);pointer-events:none}",
    ".note .dropcover .ic{width:54px;height:54px}.note .dropcover b{font-size:21px}",
    "textarea{font:inherit;font-size:18px;color:var(--ink);width:100%;min-height:120px;border:2px solid var(--line);border-radius:12px;padding:12px 14px;background:var(--soft);resize:vertical}",
    "textarea:focus{border-color:var(--accent);background:#fff;outline:none}",
    "textarea::placeholder{color:#8d877e}",
    ".add-ph{display:flex;align-items:center;gap:14px;width:100%;text-align:left;border:2px dashed #cfc7bb;background:var(--soft);border-radius:12px;padding:14px 16px;min-height:64px}",
    ".add-ph:hover,.add-ph.over{border-color:var(--accent);background:var(--accent-soft)}",
    ".add-ph .ic{width:30px;height:30px;color:var(--accent-dk,#a3441a)}",
    ".add-ph b{display:block;font-size:17px}",
    ".add-ph span{color:var(--muted);font-size:14px}",
    ".thumbs{display:flex;flex-wrap:wrap;gap:10px}",
    ".thumbs .t{position:relative;width:76px;height:76px}.thumbs .ph{position:relative;display:block}",
    ".thumbs img{width:76px;height:76px;object-fit:cover;border-radius:10px;display:block;background:var(--soft);border:1px solid var(--line)}",
    ".thumbs .rm{position:absolute;top:-8px;right:-8px;width:30px;height:30px;border-radius:50%;border:2px solid #fff;background:var(--ink);color:#fff;display:grid;place-items:center;padding:0;box-shadow:0 2px 6px rgba(0,0,0,.25)}",
    ".thumbs .rm .ic{width:16px;height:16px;stroke-width:3}",
    ".thumbs.small .t,.thumbs.small img{width:56px;height:56px}",
    /* a few photos: a short "What is this?" line beside each one (optional) */
    ".thumbs.capt{display:grid;gap:10px}",
    ".thumbs.capt .t{display:grid;grid-template-columns:64px minmax(0,1fr);gap:12px;align-items:center;width:auto;height:auto}",
    ".thumbs.capt .ph{position:relative;width:64px;height:64px}.thumbs.capt img{width:64px;height:64px}",
    ".thumbs.capt .rm{width:26px;height:26px;top:-7px;right:-7px}",
    ".thumbs .cap{font:inherit;font-size:16px;color:var(--ink);width:100%;min-width:0;min-height:46px;border:2px solid var(--line);border-radius:10px;padding:8px 11px;background:var(--soft)}",
    ".thumbs .cap:focus{outline:none;border-color:var(--accent);background:#fff}.thumbs .cap::placeholder{color:#8d877e}",
    ".capts{justify-self:start;border:0;background:none;padding:6px 0;color:var(--accent-dk,#a3441a);font-weight:600;font-size:15px;text-decoration:underline;text-underline-offset:3px}",
    ".b{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:46px;padding:0 18px;border-radius:10px;border:1px solid transparent;font-size:16px;font-weight:600;white-space:nowrap}",
    ".b.main{background:var(--accent);color:#fff}.b.main:hover{background:var(--accent-dk)}",
    ".b.go{background:var(--go);color:#fff}.b.go:hover{background:var(--go-dk)}",
    ".b.plain{background:#fff;border-color:#cfc7bb;color:var(--ink)}.b.plain:hover{border-color:var(--edge)}",
    "a.b{text-decoration:none}",
    ".b.quiet{background:none;color:var(--muted);padding:0 10px;font-weight:600}.b.quiet:hover{color:var(--ink)}",
    ".b.danger{background:none;color:var(--bad);padding:0 10px;font-weight:600}",
    ".b[disabled]{opacity:.55;cursor:default}",
    ".b.wide{width:100%}",
    ".push{margin-left:auto}",
    "@media (max-width:719px){.card .ft{flex-wrap:wrap}.card .ft .b.main,.card .ft .b.go{flex:1 1 100%;order:-1}.card .ft .b.plain{flex:1 1 100%}}",

    /* note box: popover on big screens, sheet on phones */
    ".note{width:400px;max-width:calc(100vw - 24px)}",
    ".note .where{display:flex;gap:8px;align-items:baseline;background:var(--soft);border-radius:10px;padding:9px 12px;font-size:15px;color:var(--muted)}",
    ".note .where b{color:var(--ink);font-weight:600;overflow-wrap:anywhere}",
    ".sheet{left:0;right:0;bottom:0;width:auto;max-width:none;max-height:88vh;border-radius:20px 20px 0 0}",
    ".sheet::before{content:'';display:block;width:44px;height:5px;border-radius:9px;background:#d6cfc4;margin:10px auto 0}",

    /* centered panels */
    ".veil{position:fixed;inset:0;background:rgba(24,22,20,.55);display:grid;place-items:center;padding:16px}",
    ".veil > .card{position:relative;width:min(560px,100%);max-height:calc(100vh - 32px)}",
    "@media (max-width:719px){.veil{place-items:end stretch;padding:0}.veil > .card{width:100%;max-height:92vh;border-radius:20px 20px 0 0}}",
    /* their own page: one calm box for what goes to Stray Wolf (a new logo). A plain title, each label above its
       box, one row of buttons */
    ".ask .hd{padding:20px 22px 16px;border-bottom:1px solid var(--line)}",
    ".ask .hd p{font-size:15.5px;line-height:1.45;margin-top:4px}",
    ".ask .bd{padding:18px 22px 20px;gap:16px}",
    ".ask textarea,.pg .field textarea{min-height:92px;font-size:16.5px;border:1px solid var(--edge);border-radius:10px;padding:10px 12px;background:#fff}",
    ".ask textarea:focus,.pg .field textarea:focus{box-shadow:0 0 0 3px rgba(194,84,27,.18)}",
    ".ask .add-ph.big,.ask.photos .add-ph.big:has(~ .thumbs:not([hidden])){flex-direction:row;justify-content:flex-start;text-align:left;gap:14px;min-height:0;padding:16px;border:1.5px dashed var(--edge);border-radius:12px;background:#fff}",
    ".ask .add-ph.big .ic,.ask.photos .add-ph.big:has(~ .thumbs:not([hidden])) .ic{width:44px;height:44px;padding:11px;border-radius:11px;background:var(--accent-soft);stroke-width:2}",
    ".ask .add-ph.big div{flex:1;min-width:0}.ask .add-ph.big b{font-size:16.5px;font-weight:600}.ask .add-ph.big span{font-size:14.5px;line-height:1.4}",
    ".ask .add-ph .pick{flex:none;display:inline-flex;align-items:center;min-height:40px;padding:0 16px;border:1px solid #cfc7bb;border-radius:10px;background:#fff;color:var(--ink);font-size:15.5px;font-weight:600}",
    ".ask .ft{flex-wrap:wrap;padding:14px 22px calc(16px + env(safe-area-inset-bottom,0px))}",
    ".ask .ft .say{margin-right:auto;color:var(--muted);font-size:14.5px}",
    ".ask .ft .bar,.ask .ft .err{flex:1 1 100%}",
    "@media (max-width:719px){.ask .ft .say{flex:1 1 100%;order:-2}.ask .add-ph .pick{display:none}}",
    ".steps{list-style:none;margin:0;padding:0;display:grid;gap:10px}",
    ".steps li{display:grid;grid-template-columns:52px minmax(0,1fr);gap:16px;align-items:center;background:#fff;border:1px solid var(--line);border-radius:16px;padding:14px 18px 14px 14px}",
    ".steps .circ{width:52px;height:52px;border-radius:15px;background:var(--accent-soft);color:var(--accent-dk,#a3441a);display:grid;place-items:center;position:relative}",
    ".steps .circ .ic{width:26px;height:26px}",
    ".steps .circ i{position:absolute;right:-7px;bottom:-7px;width:24px;height:24px;border-radius:50%;border:2px solid #fff;box-sizing:content-box;background:var(--accent);color:#fff;font:700 12.5px/24px system-ui,sans-serif;text-align:center;font-style:normal}",
    ".steps b{display:block;font-size:17.5px;line-height:1.3}",
    ".steps span{display:block;color:var(--muted);font-size:15px;line-height:1.45;margin-top:2px}",
    ".calm{display:flex;gap:12px;align-items:flex-start;background:#eef6f0;border:1px solid #d5e8db;color:#24563a;border-radius:14px;padding:14px 16px;font-size:15px;line-height:1.45;font-weight:500;margin-top:4px}",
    ".calm .ic{flex:none;width:20px;height:20px;margin-top:1px;color:var(--go)}",
    ".card.photo{width:min(960px,100%)}.card.photo .bd{padding:0 18px 4px;gap:10px}",
    ".card.photo .shot{position:relative;display:grid;place-items:center;background:#1e1c19;border-radius:12px;overflow:hidden}",
    ".card.photo .shot img{display:block;max-width:100%;max-height:calc(100vh - 230px);width:auto;height:auto}",
    ".card.photo .nav{position:absolute;top:50%;transform:translateY(-50%);width:48px;height:48px;border-radius:50%;border:0;background:rgba(255,255,255,.92);color:var(--ink);display:grid;place-items:center;box-shadow:0 4px 14px rgba(0,0,0,.3)}",
    ".card.photo .nav.l{left:10px}.card.photo .nav.r{right:10px}.card.photo .nav.l .ic{transform:scaleX(-1)}",
    ".card.photo .cap{margin:0;color:var(--muted);font-size:15px}",
    /* the Photos page: a whole page over their portal, with a Back button */
    ".pg{position:fixed;inset:0;overflow:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;background:#f4f2ee}",
    ".pg.note.photos{width:auto;max-width:none}",
    ".pg .dropcover{position:fixed!important;inset:10px!important}",
    ".pg-top,.pg-in{max-width:1040px;margin:0 auto;padding-left:max(20px,env(safe-area-inset-left,0px));padding-right:max(20px,env(safe-area-inset-right,0px))}",
    ".pg-top{padding-top:22px}",
    ".pg-back{display:inline-flex;align-items:center;gap:4px;min-height:44px;margin-left:-8px;padding:0 10px 0 4px;border:0;border-radius:10px;background:none;color:var(--muted);font-size:15px}",
    ".pg-back:hover{color:var(--ink);background:#ece7df}.pg-back .ic{width:18px;height:18px}",
    ".pg-top h1{margin:4px 0;font:700 30px/1.15 'SW Zilla','Zilla Slab',Georgia,serif;letter-spacing:-.005em}",
    ".pg-top p{margin:0;color:var(--muted);font-size:16px}",
    ".pg-in{padding-top:18px;padding-bottom:64px;display:grid;gap:18px}",
    ".pg-sec{background:#fff;border:1px solid var(--line);border-radius:18px;padding:20px 22px 22px;display:grid;gap:14px;min-width:0}",
    ".pg-hd{display:flex;align-items:baseline;justify-content:space-between;gap:4px 14px;flex-wrap:wrap}",
    ".pg-sec h2{margin:0;font:700 22px/1.2 'SW Zilla','Zilla Slab',Georgia,serif}",
    ".pg-sub{margin:0;color:var(--muted);font-size:15px}",
    ".pg-hd .grow{flex:1;min-width:0;display:flex;align-items:baseline;gap:4px 14px;flex-wrap:wrap}",
    ".pg-dl{display:inline-flex;align-items:center;gap:7px;min-height:40px;padding:0 14px;border:1px solid var(--line);border-radius:999px;background:#fff;color:var(--ink);font-size:15px;font-weight:600;align-self:center}",
    ".pg-dl:hover{border-color:#bdb5a9}.pg-dl .ic{width:18px;height:18px}.pg-dl[disabled]{opacity:.6;cursor:progress}",
    ".pg-act{display:flex;justify-content:flex-end}",
    ".pg-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px 12px}",
    ".pg-ph{display:grid;gap:6px;align-content:start;text-align:left;padding:0;border:0;background:none;min-width:0;color:inherit}",
    ".pg-ph .im{position:relative;display:block;aspect-ratio:4/3;border-radius:12px;overflow:hidden;background:var(--soft);border:1px solid var(--line)}",
    ".pg-ph img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .2s}",
    ".pg-ph:hover img{transform:scale(1.04)}",
    ".pg-ph .im.gone::after{content:'Photo not found';position:absolute;inset:0;display:grid;place-items:center;color:var(--muted);font-size:13px}",
    ".pg-ph .cp{font-size:15px;line-height:1.3;font-weight:600;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}",
    ".pg-ph .dt{font-size:13.5px;color:var(--muted);line-height:1.3}",
    ".tag{white-space:nowrap;justify-self:start;display:inline-flex;align-items:center;gap:5px;font-size:13.5px;font-weight:600;line-height:1.1;padding:6px 10px 6px 9px;border-radius:999px}",
    ".tag .ic{width:15px;height:15px;stroke-width:3}",
    ".tag.on{background:#e3efe6;color:#22603a}.tag.off{background:#f0ebe4;color:#5f5a53;padding-left:10px}.tag.yes{background:#fbeee6;color:#9a4315;padding-left:10px}",
    ".pg-none{margin:0;padding:18px;border:2px dashed var(--line);border-radius:14px;color:var(--muted);text-align:center;font-size:15.5px}",
    ".pg-more{margin:0;font-size:15.5px;color:var(--muted)}.pg-more a{display:inline-block;line-height:24px;color:var(--accent-dk,#a3441a);font-weight:600}",
    /* "On your site now": one button per page of their site, the picked one dark */
    ".pg-pages{display:flex;flex-wrap:wrap;gap:8px}",
    ".pg-page{display:inline-flex;align-items:center;gap:7px;min-height:38px;padding:0 14px;border:1px solid var(--line);border-radius:999px;background:#fff;color:var(--ink);font-size:15px;font-weight:500}",
    ".pg-page:hover{border-color:#bdb5a9}.pg-page .n{color:var(--muted);font-size:13.5px}",
    ".pg-page[aria-pressed=true]{background:var(--ink);border-color:var(--ink);color:#fff}.pg-page[aria-pressed=true] .n{color:#d9d4cc}",
    "@media (max-width:719px){.pg-grid{grid-template-columns:1fr 1fr;gap:14px 10px}.pg-sec{padding:16px;border-radius:16px}.pg-top{padding-top:12px}.pg-top h1{font-size:25px}.pg-in{padding-top:14px;gap:14px}.pg-act .b{width:100%}.pg-pages{gap:6px}.pg-page{min-height:36px;padding:0 11px;gap:6px;font-size:14px}.tag{font-size:12.5px;padding:5px 8px}.tag.off,.tag.yes{padding-left:8px}.card.photo .hd h2{font-size:17px}}",
    ".card.help .hd{padding:26px 26px 6px}.card.help .hd h2{font-size:23px}.card.help .hd p{font-size:16px;margin-top:5px}",
    ".card.help .bd{padding:14px 26px 22px;gap:12px}.card.help .ft{padding:16px 26px calc(20px + env(safe-area-inset-bottom,0px))}",
    "@media (max-width:719px){.card.help .hd{padding:22px 20px 4px}.card.help .bd{padding:12px 20px 18px}.card.help .ft{padding:14px 20px calc(16px + env(safe-area-inset-bottom,0px))}}",

    /* review list */
    ".list{list-style:none;margin:0;padding:0;display:grid;gap:12px}",
    ".item{display:grid;grid-template-columns:auto minmax(0,1fr);gap:6px 14px;border:1px solid var(--line);border-radius:14px;padding:14px}",
    ".item .w{font-size:14px;color:var(--muted);overflow-wrap:anywhere}",
    ".item .s{font-size:17px;overflow-wrap:anywhere;white-space:pre-line}",
    ".item .s.empty{color:var(--muted);font-style:italic}",
    ".item .acts{display:flex;flex-wrap:wrap;gap:4px 8px;margin:4px 0 0 -10px}",
    ".item .acts .b{min-height:44px;font-size:15px}",
    ".bar{height:10px;border-radius:9px;background:var(--soft);overflow:hidden}",
    ".bar i{display:block;height:100%;width:0;background:var(--go);transition:width .3s}",
    ".err{color:var(--bad);font-weight:600;font-size:15px;margin:0}",
    ".err a{color:inherit}",

    /* sent */
    ".done-ic{width:84px;height:84px;border-radius:50%;background:var(--go);color:#fff;display:grid;place-items:center;margin:10px auto 4px}",
    ".done-ic .ic{width:44px;height:44px;stroke-width:3}",
    ".center{text-align:center}",
    ".center h2{font-size:26px;margin:4px 0 6px}",
    ".center p{margin:0 auto;max-width:36ch;color:var(--muted);font-size:17px}",

    /* login */
    ".lock{width:64px;height:64px;border-radius:50%;background:var(--accent-soft);color:var(--accent-dk,#a3441a);display:grid;place-items:center;margin:6px auto 0}",
    ".lock .ic{width:30px;height:30px}",
    ".veil.solid{background:transparent;top:70px;bottom:auto;min-height:calc(100vh - 70px);padding:40px 16px}@media (max-width:719px){.veil.solid{top:58px;min-height:calc(100vh - 58px);place-items:center stretch;padding:16px}.veil.solid > .card{border-radius:20px}}",
    ".veil.solid > .card{width:min(460px,100%);border-radius:18px;box-shadow:0 0 0 1px #e2dcd2,0 30px 60px -28px rgba(36,34,31,.45)}",
    ".veil.solid .b{min-height:52px;border-radius:12px;font-size:17px}",
    ".veil.solid h2{font-family:'SW Zilla','Zilla Slab',Georgia,serif;font-size:30px;line-height:1.1;letter-spacing:-.005em}",
    ".kick{display:inline-flex;align-items:center;gap:6px}.kick .ic{width:14px;height:14px}",
    ".veil.solid .kick{color:#5F7152}",
    // their logo on a white tile, rounded and lifted, sized to the logo: square for a square one, wider for a wide one
    ".login-logo{justify-self:center;display:grid;place-items:center;height:128px;min-width:128px;max-width:100%;padding:18px;margin:2px 0 4px;background:#fff;border-radius:22px;box-shadow:0 0 0 1px #e6e0d6,0 18px 34px -20px rgba(36,34,31,.42)}",
    ".login-logo img{display:block;height:92px;width:auto;max-width:min(240px,100%);object-fit:contain}",
    ".card.has-logo .bd{background:linear-gradient(#f4f1eb 0 90px,transparent 90px)}",   // a soft band the tile sits across
    ".kick{margin:0 0 2px;font-size:13px!important;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);font-weight:600}",
    ".pw{display:flex;align-items:stretch;border:2px solid var(--line);border-radius:12px;background:var(--soft);overflow:hidden}",
    ".pw:focus-within{border-color:var(--accent);background:#fff}",
    ".pw input{flex:1;min-width:0;font:inherit;font-size:20px;border:0;background:none;padding:12px 14px;color:var(--ink);outline:none;letter-spacing:.02em}",
    ".pw button{border:0;background:none;padding:0 14px;color:var(--muted);font-size:15px;font-weight:600;display:flex;align-items:center;gap:6px}",

    ".toast{position:fixed;left:50%;transform:translateX(-50%);top:calc(18px + env(safe-area-inset-top,0px));background:var(--ink);color:#fff;padding:12px 18px;border-radius:14px;font-size:16px;font-weight:600;",
    "  width:max-content;max-width:calc(100vw - 28px);box-sizing:border-box;text-align:left;box-shadow:0 8px 24px rgba(0,0,0,.3);display:flex;align-items:center;gap:10px}",
    ".toast .ic{color:#7fd39b}",
    ".toast{z-index:10}.toast .undo-t{flex:none;margin:-4px -6px -4px 4px;border:0;border-radius:10px;min-height:38px;padding:0 14px;background:rgba(255,255,255,.16);color:#fff;font-size:15px;font-weight:600}.toast .undo-t:hover{background:rgba(255,255,255,.28)}",
    ".sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}",
    ".card:focus,.pg:focus{outline:none}",
    ".card .hd:has(+ .ft){padding-bottom:18px}",
    ".toast{animation:tin .25s ease-out}@keyframes tin{from{opacity:0;transform:translate(-50%,-10px)}}",
    "@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}"
  ].join("\n");

  // What this script builds on their own page (the shop card) uses the page's own colors and type
  // (--card, --line, --accent, --sage, --slab, ...), so it fits every client's portal. It goes in once, after login.
  var PAGE_CSS = [
    // Messages from your website: a short inbox
    ".fp{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden}.fp > :first-child{border-top:0}",
    ".fp .vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}",
    ".fp .ic{width:16px;height:16px;flex:none;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}",
    ".fp-test{margin:16px 22px 14px;padding:10px 14px;border-radius:12px;background:var(--stone);font-size:14.5px;line-height:1.45}",
    // Select all, and what to do with the ticked rows
    ".fp-bar{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;min-height:44px;padding:4px 22px 4px 18px;border-top:1px solid var(--line);background:#faf8f4}",
    ".fp-bar.on{background:var(--accent-soft)}",
    ".fp-sel{display:inline-flex;align-items:center;gap:10px;font-size:13.5px;color:var(--muted);cursor:pointer;margin-right:auto}.fp-bar.on .fp-sel{color:var(--ink);font-weight:600}",
    ".fp input[type=checkbox]{width:20px;height:20px;margin:0;accent-color:var(--accent);cursor:pointer}",
    ".fp-list{list-style:none;margin:0;padding:0}",
    // one row: tick, who and what (opens it), the actions
    ".fp-row{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;column-gap:12px;padding:0 22px 0 18px;border-top:1px solid var(--line);transition:background .12s}",
    ".fp-row:hover{background:#fbfaf7}.fp-row.picked{background:#fdf6f1}.fp-row.open{background:#fbfaf7}",
    ".fp-main{display:grid;gap:3px;min-width:0;padding:13px 0;background:none;border:0;text-align:left;font:inherit;color:inherit;cursor:pointer}",
    ".fp-l1{display:flex;align-items:center;gap:10px;min-width:0}",
    ".fp-dot{flex:none;width:8px;height:8px;border-radius:50%;background:transparent}.fp-row.fresh .fp-dot{background:var(--accent)}",
    ".fp-l1 b{font-size:15.5px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fp-row.fresh .fp-l1 b{font-weight:650}",
    ".fp-kind{font-size:12.5px;color:var(--muted);white-space:nowrap}",
    ".fp-clip{display:inline-flex;align-items:center;gap:3px;font-size:12.5px;color:var(--muted)}.fp-clip .ic{width:14px;height:14px}",
    ".fp-bad{font-size:12.5px;font-weight:600;color:#b4361c;white-space:nowrap}",
    ".fp-l1 time{margin-left:auto;padding-left:8px;font-size:13px;color:var(--muted);white-space:nowrap}.fp-row.fresh .fp-l1 time{color:var(--ink);font-weight:600}",
    ".fp-l2{display:block;padding-left:18px;font-size:14px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".fp-want{color:var(--ink);font-weight:500}",
    ".fp-acts{display:flex;align-items:center;gap:4px;padding-left:6px}",
    ".fp-b{min-height:36px;padding:0 13px;display:inline-flex;align-items:center;gap:7px;font:600 13.5px/1 system-ui,-apple-system,\"Segoe UI\",Roboto,sans-serif;color:var(--ink);background:var(--card);border:1px solid var(--line);border-radius:9px;cursor:pointer;text-decoration:none;white-space:nowrap}",
    ".fp-b:hover{border-color:var(--accent)}.fp-b.main{justify-content:center;min-width:6.6em;color:#fff;background:var(--accent);border-color:var(--accent);margin-right:4px}.fp-b.main:hover{background:#a94816}",
    ".fp-b.del{color:#b4361c}.fp-b.del:hover{border-color:#b4361c}.fp-b[disabled]{opacity:.6;cursor:default}",
    ".fp-i{width:36px;height:36px;display:inline-grid;place-items:center;border:0;border-radius:9px;background:none;color:var(--soft);cursor:pointer}",
    "span.fp-i{cursor:default}a.fp-i:hover,button.fp-i:hover{background:var(--stone);color:var(--ink)}.fp-i.done{color:var(--sage)}.fp-i.done:hover{color:var(--sage)}.fp-i.del:hover{color:#b4361c;background:#fbeae5}",
    ".fp-i .ic{width:18px;height:18px}",
    ".fp-link{background:none;border:0;padding:6px 4px;font:600 13.5px/1.2 system-ui,-apple-system,\"Segoe UI\",Roboto,sans-serif;color:var(--accent-dk,#a3441a);cursor:pointer;text-decoration:underline;text-underline-offset:3px}",
    // an opened row: how to reach them, every answer, the files
    ".fp-body{grid-column:2/-1;display:grid;gap:12px;padding:0 0 18px 18px;max-width:760px}",
    ".fp-reach{display:flex;flex-wrap:wrap;gap:6px 18px;margin:0;font-size:14px}",
    ".fp-reach a{display:inline-flex;align-items:center;gap:6px;color:var(--ink);text-decoration:underline;text-decoration-color:var(--line);text-underline-offset:3px}.fp-reach a:hover{text-decoration-color:var(--accent)}.fp-reach .ic{color:var(--soft)}",
    ".fp-ans{margin:0;display:grid;grid-template-columns:minmax(110px,max-content) minmax(0,1fr);gap:6px 16px;font-size:14.5px;line-height:1.5;padding:12px 14px;border-radius:12px;background:var(--card);box-shadow:0 0 0 1px var(--line)}",
    ".fp-ans dt{color:var(--muted)}.fp-ans dd{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}",
    ".fp-files{display:flex;flex-wrap:wrap;gap:8px}",
    ".fp-files a{display:inline-flex;align-items:center;gap:8px;min-height:40px;padding:4px 12px 4px 4px;border:1px solid var(--line);border-radius:10px;font-size:13.5px;color:var(--ink);text-decoration:none;background:var(--card)}",
    ".fp-files a:hover{border-color:var(--accent)}",
    ".fp-files img{width:52px;height:38px;object-fit:cover;border-radius:7px;background:var(--stone)}",
    ".fp-files .doc{display:inline-grid;place-items:center;width:52px;height:38px;border-radius:7px;background:var(--stone);font:500 12.5px/1 var(--mono)}",
    ".fp-when{margin:0;font-size:12.5px;color:var(--soft)}",
    ".fp-none{margin:0;padding:14px 22px 18px;border-top:1px solid var(--line);color:var(--muted);font-size:14.5px}",
    ".fp-more{margin:0;padding:8px 22px 10px;border-top:1px solid var(--line)}",
    ".fp-more button{font:600 13.5px/1.2 system-ui,-apple-system,\"Segoe UI\",Roboto,sans-serif;background:none;border:0;padding:4px 0;cursor:pointer;color:var(--accent-dk,#a3441a);text-decoration:underline;text-underline-offset:3px}",
    // where the emails go: one line, or the box to change it
    ".fp-to{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;padding:12px 22px;border-top:1px solid var(--line);background:#faf8f4;font-size:13.5px;color:var(--muted)}",
    ".fp-to > .ic{color:var(--soft)}.fp-to b{font-weight:600;color:var(--ink);overflow-wrap:anywhere}",
    ".fp-to.edit{display:grid;gap:8px;padding:14px 22px 16px}",
    ".fp-to label{font-weight:600;font-size:14.5px;color:var(--ink)}",
    ".fp-to .row{display:flex;flex-wrap:wrap;gap:8px 10px;align-items:center}",
    ".fp-to input{flex:1 1 280px;min-width:0;min-height:40px;font:inherit;font-size:15px;color:var(--ink);background:var(--card);border:1px solid var(--line);border-radius:9px;padding:8px 12px}",
    ".fp-to input:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px rgba(194,84,27,.2)}",
    ".fp-to small{font-size:13px;line-height:1.45}",
    ".fp-to .err{margin:0;color:#b4361c;font-size:14px}",
    ".fp button:focus-visible,.fp a:focus-visible,.fp input:focus-visible{outline:3px solid var(--accent-hi);outline-offset:2px}",
    "@media (min-width:1800px){.fp-l1 b{font-size:16.5px}.fp-l2{font-size:15px}}",
    "@media (min-width:2400px){.fp-ans,.fp-test,.fp-l2{font-size:16px}.fp-l1 b{font-size:18px}.fp-kind,.fp-l1 time,.fp-to,.fp-sel{font-size:14.5px}.fp-b{font-size:15px;min-height:42px}.fp-i{width:42px;height:42px}}",
    "@media (max-width:560px){.fp-test{margin-inline:16px}.fp-bar{padding-inline:14px 16px}",
    "  .fp-row{grid-template-columns:auto minmax(0,1fr);padding:0 16px 0 14px}.fp-main{padding-bottom:4px}.fp-kind{display:none}",
    "  .fp-acts{grid-column:2;padding:0 0 10px 12px;margin-left:-2px}span.fp-i{display:none}.fp-b{min-height:40px}.fp-i{width:40px;height:40px}",
    "  .fp-body{grid-column:1/-1;padding-left:0}.fp-ans{grid-template-columns:minmax(0,1fr);gap:0}.fp-ans dd{margin-bottom:8px}.fp-to,.fp-none,.fp-more{padding-left:16px;padding-right:16px}}",
    // (Let's talk is one button, in the header beside Help and Log out: their page styles those three)
    // Your shop: the card around the shop manager (shop-manager.css styles the manager itself)
    ".sp{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:clip}",
    ".sp .swm{border:0;border-radius:0}",
    ".sp .ic{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}",
    ".sp-none{margin:0;padding:16px 22px 18px;color:var(--muted);font-size:15px}",

    /* ---- The pages of their portal ([data-page]) ---- */
    "html.pp-on{scroll-padding-top:124px}",   // room for the header when the browser scrolls to something
    "[data-page][hidden]{display:none}",
    "[data-page] h1:focus{outline:none}",     // a new page's heading takes the focus so a screen reader says it; no ring
    "html.pp-wide main.wrap{max-width:1180px}",
    // the header's links: the page on screen is underlined. Then "Need changes?" and Edit my website
    ".sw-nav .nav-in{display:flex;align-items:center;gap:2px;min-height:58px}",
    ".sw-nav .pp-l{position:relative;display:inline-flex;align-items:center;gap:8px;height:58px;padding:0 14px;border-radius:8px;font:500 15.5px/1 system-ui,-apple-system,\"Segoe UI\",Roboto,sans-serif;color:var(--muted);text-decoration:none;white-space:nowrap}",
    ".sw-nav .pp-l:hover,.sw-nav .pp-l[aria-current]{color:var(--ink)}",
    ".sw-nav .pp-l[aria-current]::after{content:\"\";position:absolute;left:14px;right:14px;bottom:0;height:3px;border-radius:3px 3px 0 0;background:var(--accent)}",
    // a count beside a page's name; orange when it is waiting on them
    ".pp-n{display:inline-grid;place-items:center;min-width:22px;height:22px;padding:0 7px;border-radius:999px;background:var(--stone);color:var(--ink);font:500 12.5px/1 system-ui,-apple-system,\"Segoe UI\",Roboto,sans-serif;font-variant-numeric:tabular-nums}",
    ".pp-n.hot{background:var(--accent);color:#fff}.pp-n[hidden]{display:none}",
    ".pp-vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}",   // words for a screen reader only
    ".sw-nav .nav-fill{flex:1}",
    ".sw-nav .nav-ask{margin-right:12px;font-size:14.5px;color:var(--muted);white-space:nowrap}",
    ".sw-nav .nav-edit{display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 16px 0 14px;border-radius:10px;font:600 15px/1 system-ui,-apple-system,\"Segoe UI\",Roboto,sans-serif;text-decoration:none;white-space:nowrap;cursor:pointer}",
    ".sw-nav .nav-edit{background:var(--accent);border:1px solid var(--accent);color:#fff}.sw-nav .nav-edit:hover{background:#a94816}",
    ".sw-nav .ic,.pp-tabs .ic,.pp-back .ic,.pp-rows .ic{flex:none;width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}",
    ".sw-nav a:focus-visible,.sw-nav button:focus-visible,.pp-tabs a:focus-visible,.pp-back:focus-visible,.pp-rows a:focus-visible,.pp-btn:focus-visible,.pp-link:focus-visible{outline:3px solid var(--accent-hi);outline-offset:2px}",
    // a page: the link back to Home, its heading with one line under it, then its parts
    ".pp-back{display:inline-flex;align-items:center;gap:4px;min-height:36px;margin:22px 0 6px -6px;padding:0 10px 0 4px;border-radius:8px;color:var(--muted);font-size:15px;text-decoration:none}",
    ".pp-back:hover{color:var(--ink);background:var(--stone)}",
    ".pp-h{display:flex;align-items:flex-end;gap:16px;margin:0 0 16px}.pp-h > div{flex:1;min-width:0}",
    ".pp-h h1,.pp-h h2{margin:0;font-family:var(--slab);font-weight:700;letter-spacing:-.005em;text-wrap:balance}",
    ".pp-h h1{font-size:30px;line-height:1.15}",
    ".pp-h h2{display:flex;align-items:center;gap:10px;font-size:23px;line-height:1.2}",
    ".pp-h p{margin:4px 0 0;color:var(--muted);font-size:15.5px}",
    ".pp-sec{margin:40px 0 0}",
    ".pp-link{padding:6px 0;border:0;background:none;font:inherit;font-size:15px;color:var(--accent-text);text-decoration:underline;text-underline-offset:3px;white-space:nowrap;cursor:pointer}.pp-link[hidden]{display:none}",
    ".pp-wait{margin:0;color:var(--muted);font-size:15.5px}",
    // Home's lists: what needs them, and each page with where it stands
    ".pp-card{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden}",
    ".pp-rows{list-style:none;margin:0;padding:0}.pp-rows > li + li{border-top:1px solid var(--line)}",
    ".pp-row{display:flex;align-items:center;gap:14px;min-height:68px;padding:14px 18px;color:inherit;text-decoration:none}",
    "a.pp-row:hover{background:#faf8f5}a.pp-row > .ic{color:#8a8377}",
    ".pp-ic{flex:none;display:grid;place-items:center;width:40px;height:40px;border-radius:11px;background:var(--accent-soft);color:var(--accent-text)}",
    ".pp-ic.sage{background:var(--sage-soft);color:#44563a}.pp-ic.stone{background:var(--stone);color:var(--ink)}",
    ".pp-t{flex:1;min-width:0}.pp-t b{display:block;font-size:16px;font-weight:600}.pp-t span{display:block;color:var(--muted);font-size:15px;overflow-wrap:anywhere}",
    ".pp-v{color:var(--muted);font-size:15px;white-space:nowrap}",
    ".pp-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:42px;padding:0 18px;border:1px solid var(--accent);border-radius:10px;background:var(--accent);color:#fff;font:600 15px/1 system-ui,-apple-system,\"Segoe UI\",Roboto,sans-serif;white-space:nowrap;text-decoration:none;cursor:pointer}",
    ".pp-btn:hover{background:#a94816}",
    ".pp-btn.plain{background:var(--card);border-color:#cfc8bd;color:var(--ink);font-weight:500}.pp-btn.plain:hover{background:var(--card);border-color:var(--ink)}",
    // a phone or a small tablet: the pages become a bar along the bottom, like an app
    ".pp-tabs{display:none}",
    ".sw-nav.no-ask .nav-ask{display:none}",
    "@media (max-width:1100px){.sw-nav .pp-l{padding:0 10px}.sw-nav .pp-l[aria-current]::after{left:10px;right:10px}}",
    "@media (max-width:860px){.sw-nav .pp-l,.sw-nav .nav-ask{display:none}",
    "  html.pp-on body{padding-bottom:calc(65px + env(safe-area-inset-bottom,0px))}",
    "  .pp-tabs{position:fixed;left:0;right:0;bottom:0;z-index:20;display:flex;padding:4px 4px calc(4px + env(safe-area-inset-bottom,0px));background:var(--card);border-top:1px solid var(--line);box-shadow:0 -8px 20px -16px rgb(36 34 31 / .5)}",
    "  .pp-tabs a{position:relative;flex:1 1 0;min-width:0;display:grid;justify-items:center;align-content:center;gap:3px;min-height:56px;padding:6px 2px;border-radius:10px;color:var(--muted);font:500 12.5px/1.1 system-ui,-apple-system,\"Segoe UI\",Roboto,sans-serif;text-decoration:none}",
    "  .pp-tabs a[aria-current]{color:var(--accent-text)}.pp-tabs .ic{width:22px;height:22px}",
    "  .pp-tabs .pp-n{position:absolute;top:3px;left:calc(50% + 6px);min-width:18px;height:18px;padding:0 5px}",
    "  .sp{--swm-bottom:calc(65px + env(safe-area-inset-bottom,0px))}}",   // the shop's Save bar stays above the pages' bar
    "@media (max-width:640px){.sw-nav .nav-edit{padding:0 12px 0 10px;font-size:14.5px}}",
    "@media (max-width:560px){.pp-back{margin-top:14px}.pp-h h1{font-size:25px}.pp-h h2{font-size:21px}.pp-sec{margin-top:32px}",
    "  .pp-row{gap:12px;padding:13px 14px}li.pp-row{flex-wrap:wrap}li.pp-row .pp-t{flex:1 1 calc(100% - 60px)}li.pp-row .pp-btn{margin-left:52px}",
    "  a.pp-row{display:grid;grid-template-columns:40px minmax(0,1fr) 18px;grid-template-areas:\"ic t ch\" \"ic v ch\";gap:0 12px}",
    "  a.pp-row .pp-ic{grid-area:ic}a.pp-row .pp-t{grid-area:t}a.pp-row .pp-v{grid-area:v;white-space:normal}a.pp-row > .ic{grid-area:ch}a.pp-row:has(.pp-v) .pp-t span{display:none}}",
    "@media (min-width:1800px){html.pp-wide main.wrap{max-width:1320px}.sw-nav .pp-l{font-size:16.5px}.pp-h h1{font-size:33px}.pp-h h2{font-size:25px}.pp-h p,.pp-t span,.pp-v{font-size:16px}.pp-t b{font-size:17px}}",
    "@media (min-width:2400px){html.pp-wide main.wrap{max-width:1480px}.sw-nav .pp-l{font-size:17.5px}.sw-nav .nav-ask{font-size:16px}.sw-nav .nav-edit{height:44px;font-size:16.5px}.pp-n{font-size:13.5px}",
    "  .pp-h h1{font-size:37px}.pp-h h2{font-size:28px}.pp-h p,.pp-t span,.pp-v,.pp-back,.pp-link,.pp-wait{font-size:17.5px}.pp-t b{font-size:18.5px}.pp-row{min-height:76px;padding:16px 22px}.pp-btn{min-height:46px;font-size:16.5px}}",
    // Website visitors, the card on Home: the numbers, the change from the 4 weeks before, each number's four weeks
    ".wv{background:var(--card);border:1px solid var(--line);border-radius:16px}",
    ".wv-say{margin:0;padding:18px 22px 14px;font-size:17px;line-height:1.4;color:var(--muted)}",
    ".wv-say b{color:var(--ink);font-weight:700;white-space:nowrap}.wv-say b.out{color:var(--accent-text)}",
    ".wv-nums{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-top:1px solid var(--line)}",
    ".wv-nums > li{display:grid;grid-template-rows:1fr auto;min-width:0;padding:16px 22px 18px}.wv-nums > li + li{border-left:1px solid var(--line)}",
    ".wv-hd{display:grid;align-content:start;justify-items:start}",
    ".wv-n{font:700 30px/1 system-ui,-apple-system,\"Segoe UI\",Roboto,sans-serif;color:var(--ink);font-variant-numeric:tabular-nums}",
    ".wv-l{margin-top:7px;font-size:14px;font-weight:650;line-height:1.25;color:var(--ink)}",
    ".wv-s{margin-top:1px;font-size:13px;line-height:1.35;color:var(--soft)}",
    // the change tag: green and an arrow up for more, red and an arrow down for fewer (the arrow is drawn, not typed)
    ".wv-tag{display:inline-flex;align-items:baseline;gap:5px;margin-top:8px;border-radius:7px;font-size:13px;font-weight:600;line-height:1.35;color:var(--muted)}",
    ".wv-tag.up{padding:2px 8px;color:#276a40;background:#e8f1e3}.wv-tag.down{padding:2px 8px;color:#a8321c;background:#fbebe5}",
    ".wv-tag.up::before,.wv-tag.down::before{content:\"\";flex:none;border-style:solid;transform:translateY(-1px)}",
    ".wv-tag.up::before{border-width:0 4px 6px;border-color:transparent transparent currentColor}.wv-tag.down::before{border-width:6px 4px 0;border-color:currentColor transparent transparent}",
    // a column per week with its number on top; the quiet gray is 3:1 on white, and a column shows its dates on hover
    ".wv-cols{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:2px;margin-top:6px}",
    ".wv-col{position:relative;display:grid;justify-items:center;gap:6px;min-width:0}",
    ".wv-col-in{width:100%;height:86px;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:5px;border-bottom:1px solid var(--line)}",
    ".wv-bar{flex:none;width:min(24px,62%);border-radius:4px 4px 0 0;background:#99938a}",
    ".wv-col-v{font-size:13px;line-height:14px;color:var(--muted);font-variant-numeric:tabular-nums}.wv-col-k{font-size:12.5px;line-height:1.2;color:var(--muted);white-space:nowrap}",
    ".wv-col.hot .wv-bar{background:var(--accent)}.wv-col.hot .wv-col-v{color:var(--ink);font-weight:600}.wv-col.hot .wv-col-k{color:var(--ink)}",
    ".wv-col:hover::after{content:attr(data-tip);position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);z-index:3;padding:6px 10px;border-radius:8px;background:var(--ink);color:#fff;font-size:12.5px;line-height:1.3;white-space:nowrap}",
    ".wv-col:first-child:hover::after{left:0;transform:none}.wv-col:last-child:hover::after{left:auto;right:0;transform:none}",
    ".wv-key{display:flex;flex-wrap:wrap;gap:4px 16px;margin:0;padding:0 22px 14px;font-size:12.5px;line-height:1.4;color:var(--muted)}",
    ".wv-key span{display:inline-flex;align-items:center;gap:6px}.wv-key i{width:10px;height:10px;border-radius:3px 3px 0 0;background:#99938a}.wv-key .hot i{background:var(--accent)}",
    // worth knowing: one plain sentence with a small picture beside it
    ".wv-know{list-style:none;margin:0;padding:14px 22px;border-top:1px solid var(--line);display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px 24px}",
    ".wv-know li{display:flex;align-items:center;gap:10px;min-width:0;font-size:14px;line-height:1.4;color:var(--muted)}.wv-know b{color:var(--ink);font-weight:650}",
    ".wv-ic{flex:none;width:30px;height:30px;display:grid;place-items:center;border-radius:9px;background:var(--stone);color:var(--ink)}",
    ".wv-ic .ic{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}",
    ".wv-f{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:0 22px;padding:9px 0 11px;border-top:1px dashed var(--line);font-size:12.5px;line-height:1.4;color:var(--soft)}",
    ".wv-f .ga{display:inline-flex;align-items:center;gap:7px}.wv-f svg{flex:none;width:13px;height:13px}",
    ".wv-f .sample{flex:none;font:400 12.5px/1 system-ui,-apple-system,\"Segoe UI\",Roboto,sans-serif;color:var(--accent-text);border:1px solid var(--accent-soft);border-radius:999px;padding:4px 9px}",
    // a phone: one number per row, the number on the left, its weeks on the right and its change tag under both
    "@media (max-width:760px){.wv-say{padding:16px 16px 14px}.wv-nums{grid-template-columns:minmax(0,1fr)}.wv-nums > li{padding:14px 16px}.wv-nums > li + li{border-left:0;border-top:1px solid var(--line)}",
    "  .wv-nums.cols > li{grid-template-columns:minmax(0,.6fr) minmax(0,1fr);grid-template-rows:auto 1fr auto;column-gap:16px}.wv-nums.cols .wv-hd{display:contents}",
    "  .wv-nums.cols .wv-n{grid-area:1/1}.wv-nums.cols .wv-l{grid-area:2/1}.wv-nums.cols .wv-tag{grid-area:3/1/auto/-1;justify-self:start}.wv-nums.cols .wv-cols{grid-area:1/2/span 2;align-self:end;margin-top:0}",
    "  .wv-s{display:none}.wv-col-in{height:74px}.wv-key{padding:0 16px 12px}.wv-know{grid-template-columns:minmax(0,1fr);padding:12px 16px}.wv-f{margin:0 16px}}",
    // a wide screen: the words grow with the rest of the page (a column's number keeps its 14px line, which its height counts on)
    "@media (min-width:1800px){.wv-say{font-size:19px}.wv-n{font-size:34px}.wv-l,.wv-know li{font-size:15.5px}.wv-s,.wv-tag,.wv-col-v{font-size:14.5px}.wv-col-k,.wv-key,.wv-f,.wv-f .sample{font-size:13.5px}.wv-col-in{height:100px}}",
    "@media (min-width:2400px){.wv-say{font-size:20.5px}.wv-n{font-size:38px}.wv-l,.wv-know li{font-size:17px}.wv-s,.wv-tag{font-size:16px}.wv-col-v{font-size:15.5px}.wv-col-k,.wv-key,.wv-f,.wv-f .sample{font-size:14.5px}.wv-col-in{height:112px}}",
    // a social site's logo before its name ([data-brand])
    "[data-brand]{display:inline-flex;align-items:center;gap:8px}",
    ".sw-logo{flex:none;width:18px;height:18px}.sw-logo svg{display:block;width:100%;height:100%}"
  ].join("\n");

  // On their page, each element marked data-brand="instagram" (like a row of "On your site now") gets that site's logo.
  function paintBrands() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-brand]"), function (el) {
      if (!el.querySelector(".sw-logo")) el.insertBefore(brandLogo(brandOf(el.getAttribute("data-brand")), "sw-logo"), el.firstChild);
    });
  }

  var host, root, layer;
  // Styles go in as constructed sheets where possible, because sites with strict
  // security rules (a Content-Security-Policy) block <style> tags added by scripts.
  function addCss(target, css) {
    try {
      var sheet = new CSSStyleSheet(); sheet.replaceSync(css);
      target.adoptedStyleSheets = Array.prototype.slice.call(target.adoptedStyleSheets || []).concat([sheet]);
    } catch (e) {
      (target === document ? document.head : target).appendChild(h("style", { text: css }));
    }
  }
  function mount() {
    host = document.createElement("div");
    host.setAttribute("data-site-notes", "");
    root = host.attachShadow({ mode: "open" });
    addCss(root, CSS);
    layer = h("div", { class: "r" });
    els.live = h("div", { class: "sr", role: "status", "aria-live": "polite" });
    layer.appendChild(els.live);
    root.appendChild(layer);
    document.body.appendChild(host);
  }
  // A short message at the top. Screen readers hear it through one quiet message area that stays put.
  // Longer messages stay up longer. opts.undo adds an Undo button; opts.after runs once it's gone.
  var toastTimer, toastEl = null, toastUndo = null, toastAfter = null;
  function toast(text, opts) {
    clearToast(); opts = opts || {};
    toastUndo = opts.undo || null; toastAfter = opts.after || null;
    toastEl = h("div", { class: "toast" }, [icon("check"), h("span", { text: text }),
      toastUndo ? h("button", { class: "undo-t", type: "button", title: "Put it back the way it was", text: "Undo", onclick: function () { var u = toastUndo; toastUndo = toastAfter = null; clearToast(); if (u) u(); } }) : null]);
    layer.appendChild(toastEl);
    if (els.live) { els.live.textContent = ""; setTimeout(function () { els.live.textContent = text; }, 40); }
    toastTimer = setTimeout(clearToast, toastUndo ? 7000 : Math.min(8000, Math.max(3800, text.length * 65)));
  }
  function clearToast() {
    clearTimeout(toastTimer);
    if (toastEl) { toastEl.remove(); toastEl = null; }
    var after = toastAfter; toastAfter = toastUndo = null; if (after) after();
  }

  /* =========================================================== service */

  function api(path, opts) {
    opts = opts || {};
    var headers = {};
    if (opts.token) { headers.authorization = "Bearer " + opts.token; touch(); }
    if (opts.type) headers["content-type"] = opts.type;
    return fetch(API + path, { method: "POST", headers: headers, body: opts.raw || JSON.stringify(opts.body || {}) })
      .then(function (r) { return r.json().then(function (d) { d.status = r.status; return d; }, function () { return { ok: false, status: r.status, error: "Something went wrong on our end." }; }); },
            function () { return { ok: false, status: 0, error: "Your internet seems to be off." }; })
      .then(function (d) { if (d.status === 401 && opts.token) setToken(null); return d; });
  }

  /* =========================================================== login */

  // Their page stays hidden until they log in.
  function lock() { addCss(document, "html.swn-locked body>*:not([data-site-notes]):not([data-keep]){visibility:hidden!important}"); document.documentElement.classList.add("swn-locked"); }
  function unlock() { document.documentElement.classList.remove("swn-locked"); }
  function showLogin() {
    var pw = h("input", { type: "password", title: "Your Client Portal password", id: "swn-pw", autocapitalize: "off", autocomplete: "current-password", "aria-label": "Password" });
    var showBtn = h("button", { type: "button", title: "Show or hide what you typed", onclick: function () {
      var on = pw.type === "password"; pw.type = on ? "text" : "password";
      showBtn.lastChild.textContent = on ? "Hide" : "Show"; pw.focus();
    } }, [icon("eye"), h("span", { text: "Show" })]);
    var err = h("p", { class: "err", hidden: true, role: "alert" });
    var btn = h("button", { class: "b main wide", type: "submit", title: "Open your Client Portal", text: "Log in" });
    var form = h("form", { class: "card" + (LOGO ? " has-logo" : ""), onsubmit: function (e) {
      e.preventDefault(); err.hidden = true;
      if (!pw.value.trim()) { err.textContent = "Type your password first."; err.hidden = false; pw.focus(); return; }
      btn.disabled = true; btn.textContent = "Checking…";
      var done = function (d) {
        btn.disabled = false; btn.textContent = "Log in";
        if (!d.ok) { err.textContent = d.status === 0 ? "Your internet seems to be off. Check it and try again." : (d.error || "That password isn't right. Check it and try again."); err.hidden = false; pw.select(); return; }
        setToken(d.token); watchSession();
        veil.remove(); unlock(); start();
      };
      if (DEMO) setTimeout(function () { done(pw.value.trim().toLowerCase() === "wolf" ? { ok: true, token: "demo" } : { ok: false, status: 401, error: "That password isn't right. (In this demo it's: wolf)" }); }, 350);
      else api("/api/login", { body: { site: SITE, password: pw.value.trim() } }).then(done);
    } }, [
      h("div", { class: "bd", style: "padding-top:22px;gap:14px" }, [
        LOGO ? h("div", { class: "login-logo" }, [h("img", { src: LOGO, alt: NAME ? NAME + " logo" : "Logo" })]) : h("div", { class: "lock" }, [icon("lock")]),
        h("div", { class: "center" }, [NAME ? h("p", { class: "kick" }, [icon("lock"), h("span", { text: IS_HUB ? "Client Portal" : "Owner login" })]) : null, h("h2", { text: NAME ? "Welcome, " + NAME : "Owner login", role: IS_HUB ? "heading" : null, "aria-level": IS_HUB ? "1" : null }), h("p", { text: "Type the password " + TO + " gave you." })]),
        h("label", { class: "q", for: "swn-pw", text: "Password" }),
        h("div", { class: "pw" }, [pw, showBtn]),
        err, btn,
        h("p", { class: "center", style: "font-size:15px;color:var(--muted);margin:0", text: DEMO ? "Demo password: wolf" : "Forgot it? Just ask " + TO + "." })
      ])
    ]);
    var veil = h("div", { class: "veil" + (IS_HUB ? " solid" : ""), role: IS_HUB ? "main" : null }, [form]);   // the portal's login is the page: its main area and heading
    layer.appendChild(veil); pw.focus();
  }

  /* =========================================================== where on the page */

  function pathOf(node) { var p = []; while (node && node !== document.body && node.parentNode) { p.unshift(Array.prototype.indexOf.call(node.parentNode.children, node)); node = node.parentNode; } return p; }
  function nodeAt(path) { var n = document.body; for (var i = 0; n && i < path.length; i++) n = n.children[path[i]]; return n && n !== host ? n : null; }
  // A CSS selector for the spot: an id where there is one, otherwise tag:nth-of-type steps from <body>.
  // Holds up better than child counts when something is added to the page later.
  function selOf(el) {
    var parts = [];
    while (el && el.nodeType === 1 && el !== document.body && el !== document.documentElement) {
      if (el.id && /^[A-Za-z][\w-]*$/.test(el.id) && document.querySelectorAll("#" + el.id).length === 1) { parts.unshift("#" + el.id); return parts.join(" > "); }
      var tag = el.tagName.toLowerCase(), same = 0, at = 0;
      for (var s = el.parentNode.firstElementChild; s; s = s.nextElementSibling) if (s.tagName === el.tagName) { same++; if (s === el) at = same; }
      parts.unshift(same > 1 ? tag + ":nth-of-type(" + at + ")" : tag);
      el = el.parentNode;
    }
    return "body > " + parts.join(" > ");
  }
  // What the spot says (or a picture's name), one tidy line, so it can be found again by its words.
  function snipOf(el) {
    var img = el.tagName === "IMG" ? el : (!tidy(el.innerText) && el.querySelector("img"));
    if (img) return short(img.alt || decodeURIComponent((img.currentSrc || img.src || "").split(/[?#]/)[0].split("/").pop() || ""), 160);
    // a whole card is too much: its headline, or else its first line
    var all = tidy(textOf(el), true); if (all.length <= 90) return all;
    var head = el.querySelector("h1,h2,h3,h4,h5,strong,b");
    var first = head ? tidy(textOf(head), true) : tidy(textOf(el).split(/\n+/).filter(function (l) { return l.trim(); })[0] || "", true);
    return short(first || all, 90);
  }
  function pageName() {
    if (/^\/(index\.html?)?$/.test(location.pathname)) return "Home";
    return short((document.title || "").split(/\s*[|–—:·]\s*|\s-\s/)[0], 40) || location.pathname;
  }
  function tidy(text, oneLine) {
    text = String(text || "").replace(/\s*\n+\s*/g, oneLine ? " " : " · ").replace(/(\s*·\s*)+/g, " · ").replace(/\s+/g, " ").replace(/^[\s·]+|[\s·]+$/g, "");
    if (/[A-Z]/.test(text) && text === text.toUpperCase()) text = text.replace(/[A-Z][A-Z']{2,}/g, function (w) { return w.charAt(0) + w.slice(1).toLowerCase(); });
    return text;
  }
  // The words someone would read in an element, leaving out small print inside it
  // (like a little label sitting above a big headline).
  function textOf(el) {
    var size = parseFloat(getComputedStyle(el).fontSize) || 16, out = "";
    (function walk(n) {
      for (var c = n.firstChild; c; c = c.nextSibling) {
        if (c.nodeType === 3) out += c.nodeValue;
        else if (c.nodeType === 1) {
          if (c.tagName === "BR") { out += "\n"; continue; }
          var cs = getComputedStyle(c);
          if (cs.display === "none" || cs.visibility === "hidden") continue;
          if ((parseFloat(cs.fontSize) || size) < size * 0.6) continue;
          if (/^(block|flex|grid|list-item)$/.test(cs.display)) { out += "\n"; walk(c); out += "\n"; } else walk(c);
        }
      }
    })(el);
    return out;
  }
  function describe(t) {
    var area = t.closest("[data-area],section,article,header,footer,nav,aside,main"), where = "";
    if (area) {
      var head = area.getAttribute("data-area") ? null : area.querySelector("h1,h2,h3");
      where = area.getAttribute("data-area") || (head && area.tagName !== "MAIN" && !head.contains(t) && !t.contains(head) ? short(tidy(textOf(head), true).replace(/[.!?:,;]+$/, ""), 40) : "") ||
        ({ HEADER: "Top of the page", FOOTER: "Bottom of the page", NAV: "Menu" })[area.tagName] || "";
    }
    var what, inner = t.matches("h1,h2,h3,h4") ? null : t.querySelector("h1,h2,h3");
    var img = t.tagName === "IMG" ? t : (!tidy(t.innerText) && t.querySelector("img"));
    if (img) {   // a picture: name it by its alt text or caption, and call a logo a logo
      var fig = img.closest("figure"), cap = fig && fig.querySelector("figcaption");
      var file = decodeURIComponent((img.currentSrc || img.src || "").split(/[?#]/)[0].split("/").pop() || "");
      var name = tidy(img.alt || (cap && cap.innerText) || "");
      what = /logo/i.test(file + " " + img.className + " " + name) ? "Logo" + (name && !/^logo$/i.test(name) ? " (" + name + ")" : "")
        : name ? "Picture: " + name : "A picture";
    }
    else if (inner && (t.innerText || "").length > (inner.innerText || "").length + 20) what = tidy(textOf(inner), true);   // a block with a headline: name it by the headline
    else {
      var row = t.closest("li,tr,figure,dl > div,button,a,p,h1,h2,h3,h4,blockquote");
      var src = row && (row.innerText || "").length < 160 ? row : t;
      what = (src.innerText || "").length < 400 ? tidy(textOf(src), src.matches("h1,h2,h3,h4,h5")) : "";
    }
    what = short(what, 70);
    return where && what && what.indexOf(where) !== 0 ? where + ": " + what : (what || where || "This page");
  }
  // What a note is tied to, so its pin stays put when the page moves: a sensible chunk, not a stray span.
  // The pin itself sits exactly where they tapped inside it (fx, fy).
  function targetOf(t) {
    if (!t || t.nodeType !== 1 || t === document.documentElement || t === document.body) return null;
    var good = t.closest("img,picture,figure,a,button,li,h1,h2,h3,h4,h5,p,blockquote,td,dt,dd,label,svg");
    if (good && good.tagName === "svg") good = good.parentElement || good;
    var c = good || t, r = c.getBoundingClientRect();
    if (r.width * r.height > window.innerWidth * window.innerHeight * 0.8) return null;   // a whole-page wrapper is no help
    return c;
  }

  /* =========================================================== notes mode */

  var picking = false, active = -1, busy = false, els = {}, panel = null, lastPin = null;

  function picCount() { return st.notes.reduce(function (n, x) { return n + x.pics.length; }, 0); }

  function render() {
    var n = st.notes.length, left = waiting().length;
    els.frame.className = "frame" + (picking ? " picking" : "");
    // Their own page keeps the bar away: what still has to be sent is listed under "Needs you" ([data-needs]).
    // A page without that list gets the bar for it.
    var quiet = MODE === "hub" && (!left || !!document.querySelector("[data-needs]"));
    els.dock.className = "dock " + MODE + (picking ? " picking" : "") + (quiet ? " quiet" : "") + (els.bare ? " bare" : "");
    if (els.spacer) els.spacer.style.height = quiet && els.bare ? "0px" : "150px";
    els.btns.textContent = "";
    els.say.textContent = "";
    if (st.sent) {
      els.say.append(h("b", { text: "Sent to " + TO + ". Thank you!" }), h("span", { text: "Nothing on your site changes until " + TO + " makes the update." }));
      els.btns.append(dockBtn("plus", "Start new notes", "Start a fresh list of changes for your website", "main", function () { newList(); }));
    } else if (picking) {
      els.say.append(h("b", { text: canHover ? "Click exactly where the note should go." : "Now tap exactly where the note should go." }),
        h("span", { text: canHover ? "On a word, a picture, a price, anything. You can scroll first. Esc cancels." : "On a word, a picture, a price, anything. You can scroll first." }));
      els.btns.append(
        dockBtn("pencil", "Write it without tapping", "Type a note that isn't about one spot on the page", "second", function () { stopPicking(); addNote(null, "Something else"); }),
        dockBtn("x", "Cancel", "Stop without adding a note", "second", function () { stopPicking(); }));
    } else if (MODE === "hub") {
      els.say.append(h("b", { text: plural(left, "note") + " not sent yet" }), h("span", { text: "Check " + (left === 1 ? "it" : "them") + " over, then send to " + TO + "." }));
      els.btns.append(dockBtn("send", "Send to " + TO, "Look over your notes, then send them", "go", function () { openReview(); }, left));
    } else if (els.note && st.notes[active]) {
      // one thing at a time: while a note is open, the bar only points at it
      els.say.append(h("b", { text: "You're writing note " + (active + 1) + "." }), h("span", { text: "Type what you'd like, then tap Save note." }));
      els.btns.append(dockBtn("check", "Save note", "Keep this note and go back to the page", "main", saveNote));
    } else {
      els.say.append(
        h("b", { text: n ? plural(n, "note") + " ready" : "Want something changed?" }),
        h("span", { text: n ? "Add more, or send them to " + TO + " when you're done." : "Tap Add a note, then tap the part of the page." }));
      els.btns.append(
        dockBtn("note", "Add a note", "Click this, then point at the part of the page to change", "main", startPicking),
        dockBtn("photo", "Add photos", "Send photos to use on your website", "second", function () { addNote(null, "Photos for the site", null, true); }),
        dockBtn("send", "Send to " + TO, "Look over your notes, then send them", n ? "go" : "go off", function () { if (st.notes.length) openReview(); else toast("Add a note first. Then you can send it."); }, n));
    }
    els.btns.className = "btns n" + els.btns.children.length;
    placePins();
    if (MODE === "hub") drawHome();
  }
  // Notes still to send that aren't open right now: written in Edit mode, or photos left on the Photos page.
  function waiting() { return st.notes.filter(function (x, i) { return i !== active && (x.text || x.pics.length); }); }
  // Notes that are done with (sent, cancelled, or cleared for a new list): off the list, their photos off this device.
  function dropNotes(list) {
    list.forEach(function (x) { x.pics.forEach(picDel); if (x.shot) picDel(x.shot); });
    st.notes = st.notes.filter(function (x) { return list.indexOf(x) < 0; }); save();
  }
  function dockBtn(ic, text, tip, kind, fn, count) {
    var b = h("button", { class: "db " + kind, type: "button", title: tip, onclick: fn }, [icon(ic), h("span", { text: text })]);
    if (count) b.appendChild(h("span", { class: "badge", text: String(count), "aria-label": plural(count, "note") }));
    return b;
  }

  function placePins() {
    if (!els.pins) return;
    els.pins.textContent = "";
    if (st.sent) return;
    var base = host.getBoundingClientRect();
    st.notes.forEach(function (n, i) {
      if (MODE === "hub" || !n.path || n.page !== location.pathname) return;   // pins are for Edit mode on the website; their own page has none
      var node = nodeAt(n.path); if (!node) return;
      var r = node.getBoundingClientRect(); if (!r.width && !r.height) return;
      var pin = h("button", { class: "pin" + (i === active ? " on" : "") + (n.id === lastPin ? " drop" : ""), type: "button", title: "Open note " + (i + 1), "aria-label": "Note " + (i + 1) + ". Tap to open it.", text: String(i + 1),
        style: "left:" + (r.left - base.left + r.width * n.fx) + "px;top:" + (r.top - base.top + r.height * n.fy) + "px",
        onclick: function (e) { e.stopPropagation(); if (!picking) openNote(i); } });
      els.pins.appendChild(pin);
    });
    lastPin = null;
    if (panel === "note") placeNoteCard();
  }

  /* ----- picking a spot ----- */
  function startPicking() { closePanels(); picking = true; render(); }
  function stopPicking() { picking = false; hideGhost(); render(); }
  // Nothing on the page is outlined or grabbed: the note goes exactly where they click.
  function showGhost(x, y) {
    els.ghost.hidden = false;
    els.ghost.className = "ghost" + (x > window.innerWidth - 280 ? " left" : "");
    els.ghost.style.transform = "translate(" + x + "px," + y + "px)";
  }
  function hideGhost() { if (els.ghost) els.ghost.hidden = true; }

  /* ----- one note ----- */
  function addNote(target, label, ev, wantPhotos) {
    closePanels();
    st.notes.push(makeNote(target, label, ev)); save();
    openNote(st.notes.length - 1, wantPhotos);
  }
  function makeNote(target, label, ev) {
    var note = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), page: location.pathname, title: MODE === "hub" ? "Client Portal" : pageName(), hub: MODE === "hub", path: null, fx: .5, fy: .5, on: label || "", text: "", pics: [] };
    if (target) {
      var r = target.getBoundingClientRect();
      note.path = pathOf(target); note.on = label && target.hasAttribute("data-note-box") ? label : describe(target);
      if (target.hasAttribute("data-note-ask")) note.ask = target.getAttribute("data-note-ask");
      if (target.hasAttribute("data-note-hint")) note.hint = target.getAttribute("data-note-hint");
      if (target.hasAttribute("data-note-title")) note.name = target.getAttribute("data-note-title");
      if (target.hasAttribute("data-note-fields")) { note.fields = target.getAttribute("data-note-fields").split("|"); note.typed = {}; note.extra = ""; }
      if (target.hasAttribute("data-note-now")) {
        note.now = {};
        target.getAttribute("data-note-now").split("|").forEach(function (p) { var k = p.indexOf("="); if (k > 0) note.now[p.slice(0, k)] = p.slice(k + 1); });
      }
      if (target.hasAttribute("data-note-photos")) { note.photos = true; note.ideas = (target.getAttribute("data-note-photos") || "").split("|").filter(Boolean); }
      if (ev && r.width) note.fx = Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width));
      if (ev && r.height) note.fy = Math.min(1, Math.max(0, (ev.clientY - r.top) / r.height));
      // so Stray Wolf can find the exact spot later ("Show me on the site")
      try {
        note.url = location.origin + location.pathname;
        note.snip = snipOf(target); note.vw = window.innerWidth;
        note.py = Math.round(Math.min(1, Math.max(0, (r.top + window.scrollY) / Math.max(1, document.documentElement.scrollHeight))) * 1000) / 1000;
        if (MODE !== "hub") note.sel = selOf(target).slice(0, 300);
      } catch (e) {}
      if (MODE !== "hub") snapSpot(note, target);
      lastPin = note.id;
    }
    return note;
  }

  // A note, open. In Edit mode on the website it sits beside its numbered pin (a sheet on a phone) and is saved to
  // the list. On their own page there is nothing to point at, so it is one calm box in the middle, named for what it
  // sends ("Send a new logo"), with Cancel and "Send to Stray Wolf": it goes straight away, no list and no second step.
  function openNote(i, wantPhotos) {
    if (st.notes[i] && st.notes[i].pg && photosBox()) return openPhotos();   // the Photos box's note lives on the Photos page
    remember(); closePanels();
    var note = st.notes[i], phone = isPhone(), hub = MODE === "hub", typed = note.typed || {};
    var text = h("textarea", { id: "swn-text", title: "Type it in your own words", placeholder: hub ? !note.fields && note.hint || null
      : note.photos ? "Anything else about these photos? (optional)" : note.fields ? "Anything else? (You can leave this empty.)" : note.hint || "For example: Change the price to $32." });
    text.value = note.fields ? note.extra || "" : note.text;
    if (!hub) { text.addEventListener("keydown", function (e) { if (e.key === "Escape") saveNote(); }); if (note.fields || note.photos) text.style.minHeight = "70px"; }
    text.addEventListener("paste", function (e) { var f = e.clipboardData && e.clipboardData.files; if (f && f.length) { e.preventDefault(); addPictures(f); } });
    // A box can ask for a few named things, one line each ("Label" or "Label=example text"): its name above a box that
    // starts with what the site says today (data-note-now), so they fix it instead of typing it all again.
    // A list of social pages (any line named for a site, like Instagram) shows each with its logo.
    var social = (note.fields || []).some(function (raw) { return raw.indexOf("=") < 0 && brandOf(raw); });
    var fieldEls = (note.fields || []).map(function (raw, k) {
      var f = raw.split("=")[0], ex = raw.split("=")[1], now = (note.now && note.now[f]) || "";
      var b = !ex && brandOf(f), kind = !ex && !social && FIELD_KINDS[f.toLowerCase()];
      var inp = h("input", { type: "text", title: "Change it here, or leave it as it is", id: "swn-f" + k, inputmode: social ? "url" : kind ? kind.mode : "text", autocapitalize: social || (kind && kind.mode !== "text") ? "off" : null, autocomplete: "off",
        placeholder: ex || (social ? (b ? b.ph : "Paste the link") : kind ? kind.ph : "Type it here") });
      inp.value = f in typed ? typed[f] : now;
      return { name: f, input: inp, now: now, row: h("div", { class: "field" }, [
        h("label", { class: "lb", for: "swn-f" + k }, [social ? brandLogo(b, "logo") : null, (social && b && b.name) || f, note.now && !now ? h("em", { text: "Not on your website yet" }) : null]), inp]) };
    });
    var fields = note.fields ? h("div", { class: "fields" }, fieldEls.map(function (f) { return f.row; })) : null;
    var tip = social ? h("p", { class: "tip" }, [icon("help"), h("span", { text: "Not sure where to find it? Open your page, then copy the address from the top of the screen." })]) : null;
    var thumbs = h("div", { class: "thumbs" });
    var drop = h("button", { class: "add-ph" + (note.photos ? " big" : ""), type: "button", title: "Choose photos from this device", onclick: function () { els.file.click(); } }, [
      icon(hub ? "upload" : "photo"), h("div", {}, [h("b", { text: dropTitle(note, phone) }),
        h("span", { text: phone ? "From your photos, or take a new one" : hub ? "or drag it here from your computer" : "Click to choose, or drag them here from your computer" })]),
      hub ? h("span", { class: "pick", text: "Choose" }) : null]);
    // Ideas for what to send ("A shed on a finished gravel pad"): one tap puts the words on a photo.
    var ideas = note.photos && note.ideas && note.ideas.length ? h("div", { class: "ideas" }, [
      h("p", {}, [h("b", { text: "Need ideas?" }), " These would help most. Tap one to label a photo with it."]),
      h("div", { class: "chips" }, note.ideas.map(function (idea) {
        return h("button", { class: "chip", type: "button", title: "Use these words for your photos", text: idea, onclick: function () { useIdea(note, idea); } });
      }))]) : null;
    // the same parts either way: the lines, the photos (first for a box that is about photos), the words
    var body = function (words) { return [tip, fields, note.photos ? drop : null, note.photos ? thumbs : null, ideas, words, note.photos ? null : thumbs, note.photos || note.fields ? null : drop]; };
    var card;
    if (hub) {
      var title = note.name || note.on, optional = h("em", { text: "You can leave this empty" });
      var progress = h("div", { class: "bar", hidden: true }, [h("i")]), err = h("p", { class: "err", hidden: true, role: "alert" });
      var sendBtn = h("button", { class: "b main", type: "button", title: "Send this to " + TO + " now", onclick: function () { sendNote(sendBtn, progress, err); } }, [h("span", { text: "Send to " + TO })]);
      card = h("div", { class: "card note ask" + (note.photos ? " photos" : ""), role: "dialog", "aria-label": title }, [
        h("div", { class: "dropcover", "aria-hidden": "true" }, [icon("upload"), h("b", { text: "Drop it here" })]),
        h("div", { class: "hd" }, [
          h("div", { class: "grow" }, [h("h2", { text: title }), note.ask ? h("p", { text: note.ask }) : null]),
          h("button", { class: "xbtn", type: "button", title: "Close without sending", "aria-label": "Close", onclick: function () { cancelNote(); } }, [icon("x")])]),
        h("div", { class: "bd" }, body(h("div", { class: "field" }, [
          h("label", { class: "lb", for: "swn-text" }, note.fields ? ["Anything else?", optional] : note.photos ? ["Anything " + TO + " should know?", optional] : ["What would you like?"]), text]))),
        h("div", { class: "ft" }, [progress, err,
          document.querySelector("[data-requests]") ? h("span", { class: "say", text: "Track it under Requests." }) : null,
          h("button", { class: "b plain", type: "button", title: "Close without sending", text: "Cancel", onclick: function () { cancelNote(); } }), sendBtn])
      ]);
    } else {
      card = h("div", { class: "card note" + (social || note.now || note.photos ? " wide" : "") + (note.photos ? " photos" : "") + (phone ? " sheet" : ""), role: "dialog", tabindex: "-1", "aria-label": "Note " + (i + 1) + ", about " + short(note.on, 60) }, [
        h("div", { class: "dropcover", "aria-hidden": "true" }, [icon("photo"), h("b", { text: "Drop your photos here" })]),
        h("div", { class: "hd" }, [
          h("span", { class: "num", text: String(i + 1) }),
          h("div", { class: "grow" }, [h("h2", { text: note.text || note.pics.length ? "Your note" : "New note" })]),
          h("button", { class: "xbtn", type: "button", title: "Close and keep this note", "aria-label": "Close and keep this note", onclick: saveNote }, [icon("x")])]),
        h("div", { class: "bd" }, [
          h("div", { class: "where" }, [h("span", { text: "About:" }), h("b", { text: note.on })]),
          h("label", { class: "q", for: note.fields ? "swn-f0" : "swn-text", text: note.ask || "What would you like changed?" })].concat(body(text))),
        h("div", { class: "ft" }, [
          h("button", { class: "b danger", type: "button", title: "Delete this note (you can undo)", onclick: function () { removeNote(active); } }, [icon("trash"), h("span", { text: "Delete" })]),
          h("button", { class: "b main push", type: "button", title: "Keep this and go back to the page", onclick: saveNote }, [icon("check"), h("span", { text: note.photos ? "Save photos" : "Save note" })])])
      ]);
    }
    // Files dragged anywhere over the note: the whole card lights up and takes them.
    var depth = 0;
    card.addEventListener("dragenter", function (e) { if (!hasFiles(e)) return; e.preventDefault(); depth++; card.classList.add("dropping"); });
    card.addEventListener("dragover", function (e) { if (!hasFiles(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = "copy"; });
    card.addEventListener("dragleave", function () { if (--depth <= 0) { depth = 0; card.classList.remove("dropping"); } });
    card.addEventListener("drop", function (e) { if (!hasFiles(e)) return; e.preventDefault(); e.stopPropagation(); depth = 0; card.classList.remove("dropping"); addPictures(e.dataTransfer.files); });
    var first = fieldEls.length ? fieldEls[0].input : hub && note.photos ? drop : text;
    panel = "note";
    if (hub) veil(card, { close: cancelNote, focus: phone ? card : first });   // phones: no keyboard popping up yet, but focus is in the box
    else layer.appendChild(card);
    active = i;
    els.note = { card: card, text: text, thumbs: thumbs, drop: drop, fields: fieldEls };
    drawThumbs(note, thumbs, true);
    render();
    if (hub) return;
    els.dock.hidden = phone;
    if (phone && note.path) {               // keep the spot in view above the sheet
      var node = nodeAt(note.path);
      if (node) { var r = node.getBoundingClientRect(); window.scrollBy({ top: r.top - window.innerHeight * 0.18, behavior: reduceMotion ? "auto" : "smooth" }); }
    }
    placeNoteCard();
    if (wantPhotos) els.file.click();
    else if (!phone) { try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); } }
    else { try { card.focus({ preventScroll: true }); } catch (e) {} }   // phones: no keyboard popping up yet, but focus is in the note
  }
  // Big screens: the note box sits next to its pin. Phones: it's a sheet at the bottom.
  function placeNoteCard() {
    if (!els.note || panel !== "note" || els.veil) return;   // on their own page the box sits in the middle
    var card = els.note.card, note = st.notes[active];
    if (isPhone()) { card.classList.add("sheet"); card.style.cssText = ""; return; }
    card.classList.remove("sheet");
    var vw = window.innerWidth, vh = window.innerHeight, dockH = els.dock.offsetHeight || 80, w = card.offsetWidth || 400, hh = card.offsetHeight || 420;
    var x = vw - w - 24, y = vh - dockH - hh - 16;                      // default: bottom right, above the dock
    var node = note && note.path && note.page === location.pathname ? nodeAt(note.path) : null;
    if (node) {
      var r = node.getBoundingClientRect(), px = r.left + r.width * note.fx, py = r.top + r.height * note.fy;
      if (py > -40 && py < vh) {
        x = px + 34 + w < vw - 16 ? px + 34 : px - w - 34;
        y = py - 60;
      }
    }
    x = Math.max(16, Math.min(x, vw - w - 16));
    y = Math.max(16, Math.min(y, vh - dockH - hh - 16));
    card.style.cssText = "left:" + Math.round(x) + "px;top:" + Math.round(y) + "px;max-height:" + (vh - dockH - 32) + "px";
  }
  // Up to CAPS_AT photos: a "What is this?" line beside each one. A bigger batch keeps it to one tap
  // ("Say what these are") so nobody has to label 15 photos. Words are optional either way.
  var CAPS_AT = 6;
  function drawThumbs(note, box, editable) {
    box.textContent = "";
    box.hidden = !note.pics.length;
    note.caps = note.caps || {};
    var withCaps = editable && note.pics.length && (note.pics.length <= CAPS_AT || note.showCaps || Object.keys(note.caps).length > 0);   // never hide words already typed
    box.className = box.className.replace(/\s*capt\b/, "") + (withCaps ? " capt" : "");
    note.pics.forEach(function (id, k) {
      var img = h("img", { alt: note.caps[id] || "Photo " + (k + 1), title: note.caps[id] || "" });
      picUrl(id).then(function (u) { if (u) img.src = u; });
      var ph = h("span", { class: "ph" }, [img, editable ? h("button", { class: "rm", type: "button", title: "Take this photo out", "aria-label": "Take out photo " + (k + 1), onclick: function () {
        note.pics.splice(note.pics.indexOf(id), 1); delete note.caps[id]; picDel(id); save(); drawThumbs(note, box, true); refreshDrop(note);
      } }, [icon("x")]) : null]);
      var cap = withCaps ? h(note.photos ? "textarea" : "input", { class: "cap", rows: note.photos ? "2" : null, type: note.photos ? null : "text", maxlength: "140", autocomplete: "off", "aria-label": "What is photo " + (k + 1) + "? (optional)",
        placeholder: k === 0 && !note.photos && CAPTION_EXAMPLE ? "What is this? For example: " + CAPTION_EXAMPLE : "What is this? (optional)",
        oninput: function () { var v = this.value.trim(); if (v) note.caps[id] = v; else delete note.caps[id]; img.alt = v || "Photo " + (k + 1); save(); } }) : null;
      if (cap) cap.value = note.caps[id] || "";
      box.appendChild(h("span", { class: "t", "data-id": id }, [ph, cap]));
    });
    if (editable && note.pics.length > CAPS_AT && !note.showCaps)
      box.appendChild(h("button", { class: "capts", type: "button", title: "Add a few words under each photo", text: "Say what these are (optional)",
        onclick: function () { note.showCaps = true; save(); drawThumbs(note, box, true); var f = box.querySelector(".cap"); if (f) f.focus(); } }));
  }
  function dropTitle(note, phone) {
    if (MODE === "hub" && !note.pg) return note.pics.length ? "Add another" : phone ? "Tap to choose a file" : "Choose a file";   // a box on their page (their logo)
    if (note.pics.length) return "Add more photos";
    return note.photos ? (phone ? "Tap to choose photos" : "Choose photos, or drop them here") : "Add photos";
  }
  function refreshDrop(note) { if (els.note) { els.note.drop.classList.remove("busy"); els.note.drop.querySelector("b").textContent = dropTitle(note, isPhone()); } }
  // An idea chip: label the first photo with no words yet; with no photos yet, open the picker and label the first one added.
  function useIdea(note, idea) {
    note.caps = note.caps || {};
    var free = note.pics.filter(function (id) { return !note.caps[id]; })[0];
    if (!free) { note.pendingIdea = idea; save(); els.file.click(); return; }
    note.caps[free] = idea; note.showCaps = true; save();
    if (els.note) { drawThumbs(note, els.note.thumbs, true); var f = els.note.thumbs.querySelector('[data-id="' + free + '"] .cap'); if (f) { f.focus(); f.classList.add("flash"); } }
  }
  // What they typed, into the note: every changed line ("Email: new@x.com (was old@x.com)"), then anything else.
  function readNote(note) {
    if (!els.note) return;
    if (!note.fields) { note.text = els.note.text.value.trim(); return; }
    note.extra = els.note.text.value.trim(); note.typed = {};
    var lines = [];
    els.note.fields.forEach(function (f) {
      var v = f.input.value.trim();
      if (v === f.now) return;   // left as it is
      note.typed[f.name] = v;
      lines.push(f.name.replace(/[?:.]+$/, "") + ": " + (v || "take this off") + (f.now ? " (was " + f.now + ")" : ""));
    });
    note.text = lines.concat(note.extra ? [note.extra] : []).join("\n");
  }
  function saveNote() {
    var note = st.notes[active];
    if (note) readNote(note);
    var kept = note && (note.text || note.pics.length);
    if (note && !kept) st.notes.splice(active, 1);                    // an empty note is dropped
    closePanels(); save(); render();
    if (kept) toast(st.notes.length === 1 ? "Note saved. Add another, or tap Send to " + TO + "." : "Note saved.");
  }
  // On their own page: Cancel, the X or Esc closes the box and nothing is kept. A slip outside the box (outside =
  // true) only closes it while it is still empty, so what they typed is never thrown away by accident.
  function cancelNote(outside) {
    var note = st.notes[active]; if (!note || busy) return;
    readNote(note);
    if (outside && (note.text || note.pics.length)) return;
    dropNotes([note]); closePanels(); render();
  }
  // "Send to Stray Wolf" in that box: this one note goes now.
  function sendNote(btn, progress, err) {
    var note = st.notes[active]; if (!note || busy) return;
    readNote(note); save();
    if (!note.text && !note.pics.length) {
      err.textContent = note.photos ? "Choose a file first." : note.fields ? "Change a line first, or tap Cancel." : "Type it first.";
      err.hidden = false; return;
    }
    send(btn, progress, err, [note]);
  }
  // Delete is one tap, with Undo for a few seconds. Its photos are only thrown away once Undo is gone.
  function removeNote(i, inReview) {
    var note = st.notes[i]; if (!note) return;
    st.notes.splice(i, 1); closePanels(); save(); render();
    if (inReview && st.notes.length) openReview();
    var gone = true;
    toast(inReview && !st.notes.length ? "Note deleted. Nothing left to send." : "Note deleted.", {
      undo: function () { gone = false; st.notes.splice(Math.min(i, st.notes.length), 0, note); save(); closePanels(); render(); if (inReview) openReview(); toast("Your note is back."); },
      after: function () { if (gone) { note.pics.forEach(picDel); if (note.shot) picDel(note.shot); } }
    });
  }
  function closePanels() {
    closeLb();
    if (panel === "photos") leavePhotos();
    if (els.note) { els.note.card.remove(); els.note = null; }
    if (els.veil) { els.veil.remove(); els.veil = null; els.veilClose = null; }
    active = -1; panel = null; if (els.dock) els.dock.hidden = false;
    still(); giveBack();
  }
  // Pop-ups that need attention: the page behind stays still, Tab stays inside, and when the last
  // one closes, focus goes back to what opened it (or a button with the same words, if it was redrawn).
  var backTo = null, backText = "";
  function remember() {
    if (backTo) return;
    var a = root.activeElement || document.activeElement;
    if (!a || a === document.body || a === document.documentElement) return;
    backTo = a; backText = (a.textContent || "").trim();
  }
  function giveBack() {
    setTimeout(function () {
      if (panel || els.lb || els.veil || els.note || !backTo) return;
      var b = backTo; backTo = null;
      if (!b.isConnected && backText) b = Array.prototype.filter.call(root.querySelectorAll("button"), function (x) { return x.getClientRects().length && (x.textContent || "").trim() === backText; })[0];
      if (b && b.isConnected) try { b.focus({ preventScroll: true }); } catch (x) {}
    }, 0);
  }
  // While a box, a bigger photo or the Photos page is over the page, the page behind doesn't scroll, and is out of
  // reach for the keyboard and a screen reader too. Only what this put out of reach comes back.
  var behind = [];
  function still() {
    var over = !!(els.veil || els.lb || panel === "photos");
    document.documentElement.classList.toggle("swn-still", over);
    if (over === behind.length > 0) return;
    if (over) behind = [].filter.call(document.body.children, function (el) { return el !== host && !el.inert; });
    behind.forEach(function (el) { el.inert = over; });
    if (!over) behind = [];
  }
  function topModal() { return els.lb ? els.lb.firstChild : els.veil ? els.veil.firstChild : panel === "photos" && els.note ? els.note.card : null; }
  function trapTab(e) {
    var box = topModal(); if (e.key !== "Tab" || !box) return;
    var f = Array.prototype.filter.call(box.querySelectorAll('button:not([disabled]),a[href],input:not([type="hidden"]):not([disabled]),textarea,[tabindex]:not([tabindex="-1"])'), function (x) { return x.getClientRects().length; });
    if (!f.length) return;
    var a = root.activeElement, first = f[0], last = f[f.length - 1];
    if (!a || !box.contains(a)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
    else if (e.shiftKey && a === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
  }

  /* ----- photos: shrunk in the browser, kept until sent ----- */
  function shrink(file) {
    return new Promise(function (res) {
      if (!file || !/^image\//.test(file.type)) return res(null);
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var s = Math.min(1, MAX_SIDE / Math.max(im.width, im.height));
        var c = document.createElement("canvas"); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
        var png = file.type === "image/png" && file.size < 1500000;          // keep small PNGs (logos) crisp and see-through
        var ctx = c.getContext("2d");
        if (!png) { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); }
        ctx.drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        c.toBlob(function (b) { res(b ? { blob: b, type: b.type, name: file.name || "photo" } : null); }, png ? "image/png" : "image/jpeg", .86);
      };
      im.onerror = function () { URL.revokeObjectURL(url); res(null); };
      im.src = url;
    });
  }
  function addPictures(files) {
    var note = st.notes[active]; if (!note) return;
    var list = Array.prototype.slice.call(files || []), bad = 0, full = false, added = 0, k = 0;
    var dropB = els.note && els.note.drop && els.note.drop.querySelector("b");
    if (dropB && list.length) els.note.drop.classList.add("busy");
    return list.reduce(function (p, f) {
      return p.then(function () {
        k++; if (dropB) dropB.textContent = list.length > 1 ? "Adding photo " + k + " of " + list.length + "…" : "Adding your photo…";
        if (picCount() >= MAX_PICS) { full = true; return; }
        return shrink(f).then(function (rec) {
          if (!rec) { bad++; return; }
          var id = "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
          return picPut(id, rec).then(function () {
            note.pics.push(id); added++;
            if (note.pendingIdea) { note.caps = note.caps || {}; note.caps[id] = note.pendingIdea; note.showCaps = true; delete note.pendingIdea; }
            if (els.note && st.notes[active] === note) drawThumbs(note, els.note.thumbs, true);   // each photo shows as soon as it's ready
          });
        });
      });
    }, Promise.resolve()).then(function () {
      save();
      if (els.note && st.notes[active] === note) { drawThumbs(note, els.note.thumbs, true); refreshDrop(note); placeNoteCard(); }
      else if (els.note) refreshDrop(note);
      if (full) toast("That's " + MAX_PICS + " photos, the most for one send. Send these first, then add more.");
      else if (bad) toast(bad === 1 ? "One file wasn't a photo, so it was left out." : bad + " files weren't photos, so they were left out.");
      else if (added) toast(added === 1 ? "Photo added." : added + " photos added.");
    });
  }

  /* ----- a small picture of the spot, so Stray Wolf sees exactly what they mean ----- */
  var shotLib = null;
  function loadShotLib() {
    if (window.html2canvas) return Promise.resolve(window.html2canvas);
    if (!SHOT_LIB || SHOT_LIB === "none") return Promise.reject(new Error("off"));
    return shotLib || (shotLib = new Promise(function (res, rej) {
      var s = document.createElement("script"); s.src = SHOT_LIB; s.async = true;
      s.onload = function () { window.html2canvas ? res(window.html2canvas) : rej(new Error("no lib")); };
      s.onerror = function () { shotLib = null; rej(new Error("lib failed")); };
      document.head.appendChild(s);
    }));
  }
  // About 640px wide: the element with some of the page around it, ringed, with a pin where they tapped.
  // Best effort and quiet: if anything goes wrong the note simply has no picture.
  function snapSpot(note, el) {
    var r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
    var docW = document.documentElement.clientWidth, docH = document.documentElement.scrollHeight;
    var ex = r.left + window.scrollX, ey = r.top + window.scrollY;
    // always landscape (8:5), so the pictures line up in the admin
    var w = Math.min(docW, Math.max(r.width + 120, Math.min(docW, 900), (r.height + 120) * 1.6)), hgt = w / 1.6;
    var x = Math.max(0, Math.min(docW - w, ex + r.width / 2 - w / 2)), y = Math.max(0, Math.min(docH - hgt, ey + r.height / 2 - hgt / 2));
    var px = ex + r.width * (note.fx == null ? .5 : note.fx), py = ey + r.height * (note.fy == null ? .5 : note.fy);
    var keep = { left: ex - x, top: ey - y, w: r.width, h: r.height, px: px - x, py: py - y };
    var late = new Promise(function (res, rej) { setTimeout(function () { rej(new Error("slow")); }, 6000); });   // too slow = no picture
    Promise.race([late, loadShotLib().then(function (h2c) {
      return h2c(document.body, { x: x, y: y, width: w, height: hgt, scale: 1, useCORS: true, logging: false, backgroundColor: "#ffffff",
        windowWidth: docW, ignoreElements: function (n) { return n === host || n.hasAttribute && (n.hasAttribute("data-site-notes-spacer") || n.hasAttribute("data-site-notes-light")); } });
    })]).then(function (c) {
      var s = Math.min(1, 640 / c.width), out = document.createElement("canvas");
      out.width = Math.round(c.width * s); out.height = Math.round(c.height * s);
      var g = out.getContext("2d"); g.drawImage(c, 0, 0, out.width, out.height); g.scale(s, s);
      g.strokeStyle = "#c2541b"; g.lineWidth = 4 / s; g.strokeRect(keep.left - 4, keep.top - 4, keep.w + 8, keep.h + 8);
      g.beginPath(); g.arc(keep.px, keep.py, 12 / s, 0, Math.PI * 2); g.fillStyle = "rgba(194,84,27,.28)"; g.fill(); g.lineWidth = 3 / s; g.strokeStyle = "#c2541b"; g.stroke();   // see-through, so the words still show
      return new Promise(function (res) { out.toBlob(res, "image/jpeg", .72); });
    }).then(function (b) {
      if (!b || st.notes.indexOf(note) < 0) return;
      var id = "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      return picPut(id, { blob: b, type: b.type, name: "spot.jpg" }).then(function () {
        if (st.notes.indexOf(note) < 0) return picDel(id);
        if (note.shot) picDel(note.shot);
        note.shot = id; save();
      });
    }).catch(function () {});
  }

  /* ----- the review list and sending ----- */
  // A centered box over a dimmed page (a sheet from the bottom on phones). opts.focus: what to put focus
  // on first (default: the box itself, so it reads its name). opts.close: what Esc or a tap outside does (it is
  // handed true for a tap outside).
  function veil(card, opts) {
    opts = opts || {};
    remember();
    var keep = panel; closePanels(); panel = keep;      // closing the last box mustn't forget which box this is
    if (!toastUndo) clearToast();                        // a big message replaces a small one (but keeps an Undo)
    card.setAttribute("aria-modal", "true"); card.setAttribute("tabindex", "-1");
    els.veilClose = opts.close || function () { closePanels(); render(); };
    els.veil = h("div", { class: "veil", onclick: function (e) { if (e.target === els.veil && !busy) els.veilClose(true); } }, [card]);
    layer.appendChild(els.veil);
    still();
    try { (opts.focus || card).focus({ preventScroll: true }); } catch (x) {}
    return card;
  }
  function openReview(errText) {
    panel = "review";
    var n = st.notes.length, pics = picCount();
    var list = h("ul", { class: "list" });
    st.notes.forEach(function (note, i) {
      var here = note.page === location.pathname || !note.path;
      var th = h("div", { class: "thumbs small" }); drawThumbs(note, th, false);
      list.appendChild(h("li", { class: "item" }, [
        h("span", { class: "num", text: String(i + 1) }),
        h("div", { style: "min-width:0;display:grid;gap:4px" }, [
          // a short, plain "where": the box on their portal, or just the page on the website (the exact spot still goes to Stray Wolf)
          h("div", { class: "w", text: note.hub ? note.on : (note.title || "Home") + " page" }),
          h("div", { class: "s" + (note.text ? "" : " empty"), text: note.text || "(photos only)" }),
          note.pics.length ? th : null,
          h("div", { class: "acts" }, [
            !here ? h("button", { class: "b quiet", type: "button", title: note.hub ? "Open your Client Portal" : "Open the page this note is about", onclick: function () { if (!note.hub) lsSet("on", "1"); location.href = note.page; } }, [icon("arrow"), h("span", { text: note.hub ? "Go to your portal" : "Go to that page" })])
              : MODE === "hub" ? null   // on their own page a box sends or cancels, so a note left over is only sent or deleted
              : h("button", { class: "b quiet", type: "button", title: "Change what this note says", onclick: function () { openNote(i); } }, [icon("pencil"), h("span", { text: "Change" })]),
            h("button", { class: "b danger", type: "button", title: "Delete this note (you can undo)", onclick: function () { removeNote(i, true); } }, [icon("trash"), h("span", { text: "Delete" })])
          ])
        ])
      ]));
    });
    var progress = h("div", { class: "bar", hidden: true }, [h("i")]);
    var err = h("p", { class: "err", hidden: !errText, role: "alert" });
    if (errText) err.append.apply(err, [].concat(errText));
    var sendBtn = h("button", { class: "b go", type: "button", title: "Send everything in this list to " + TO, onclick: function () { send(sendBtn, progress, err); } }, [icon("send"), h("span", { text: "Send to " + TO })]);
    veil(h("div", { class: "card", role: "dialog", "aria-label": "Ready to send" }, [
      h("div", { class: "hd" }, [
        h("div", { class: "grow" }, [h("h2", { text: "Ready to send?" }), h("p", { text: plural(n, "note") + (pics ? " and " + plural(pics, "photo") : "") + ". Check them over, then tap Send." })]),
        h("button", { class: "xbtn", type: "button", title: "Close. Your notes are kept.", "aria-label": "Close", onclick: function () { if (!busy) els.veilClose(); } }, [icon("x")])
      ]),
      h("div", { class: "bd" }, [list, h("div", { class: "calm" }, [icon("check"), h("span", { text: "Your website stays exactly as it is until " + TO + " makes the change." })])]),
      h("div", { class: "ft", style: "flex-direction:column;align-items:stretch" }, [progress, err,
        h("div", { style: "display:flex;gap:10px;flex-wrap:wrap" }, [
          h("button", { class: "b plain", type: "button", title: "Close. Your notes are kept.", text: MODE === "hub" ? "Not now" : "Keep adding notes", onclick: function () { if (!busy) els.veilClose(); } }),
          h("span", { class: "push" }), sendBtn])])
    ]));
    els.dock.hidden = isPhone();
  }

  function send(btn, progress, err, list) {
    list = list || st.notes.slice();
    if (busy || !list.length) return;
    busy = true; btn.disabled = true; err.hidden = true;
    var token = getToken(), total = list.reduce(function (n, x) { return n + x.pics.length; }, 0), doneN = 0, label = btn.lastChild;
    var safe = MODE === "hub" ? "Nothing is lost. " : "Your notes are safe on this device. ";
    var bar = progress.firstChild;
    var step = function (t, frac) { label.textContent = t; if (total) { progress.hidden = false; bar.style.width = Math.round(frac * 100) + "%"; } };
    var failWith = function (d) {
      busy = false; btn.disabled = false; label.textContent = "Try again"; progress.hidden = true;
      err.textContent = "";
      if (d.status === 401) {
        setToken(null);
        err.append("Your login timed out. " + safe, h("a", { title: "Open the login page", href: LOGIN_URL, text: "Log in again" }), " and then tap Send.");
      } else err.textContent = (d.status === 0 ? "Your internet seems to be off. " : "That didn't go through. ") + safe + "Tap Try again in a minute.";
      err.hidden = false;
    };
    if (!token && !DEMO) { failWith({ status: 401 }); return; }
    step(total ? "Sending photo 1 of " + total + "…" : "Sending…", 0.02);
    var ids = []; list.forEach(function (n) { n.pics.forEach(function (id) { ids.push(id); }); });
    var keys = {};
    ids.reduce(function (p, id) {
      return p.then(function (stop) {
        if (stop) return stop;
        return picGet(id).then(function (rec) {
          if (!rec) return null;                                   // photo lost from this device: skip it
          var next = function () { doneN++; step(doneN < total ? "Sending photo " + (doneN + 1) + " of " + total + "…" : "Sending notes…", doneN / (total + 1)); };
          if (rec.key) { keys[id] = rec.key; next(); return null; }
          var up = DEMO ? new Promise(function (r) { setTimeout(function () { r({ ok: true, key: "pic:demo:" + id }); }, 350); })
                        : api("/api/pic", { token: token, raw: rec.blob, type: rec.type });
          return up.then(function (d) {
            if (!d.ok) return d;
            rec.key = d.key; keys[id] = d.key; next();
            return picPut(id, rec).then(function () { return null; });
          });
        });
      });
    }, Promise.resolve(null)).then(function (stop) {
      if (stop) return failWith(stop);
      step("Sending notes…", total / (total + 1));
      // the pictures of the spots: best effort, a failed one just leaves that note without a picture
      return list.reduce(function (p, n) {
        return p.then(function () {
          if (!n.shot) return;
          return picGet(n.shot).then(function (rec) {
            if (!rec) return;
            if (rec.key) { keys[n.shot] = rec.key; return; }
            var up = DEMO ? Promise.resolve({ ok: true, key: "pic:demo:" + n.shot }) : api("/api/pic", { token: token, raw: rec.blob, type: rec.type });
            return up.then(function (d) { if (d && d.ok) { rec.key = d.key; keys[n.shot] = d.key; return picPut(n.shot, rec); } });
          }).catch(function () {});
        });
      }, Promise.resolve()).then(function () { return null; });
    }).then(function (stop) {
      if (stop) return failWith(stop);
      var body = { notes: list.map(function (n) {
        var sent = n.pics.filter(function (id) { return keys[id]; }), caps = n.caps || {};
        var said = sent.map(function (id) { return caps[id] || ""; });
        var lines = said.map(function (c, k) { return c ? "Photo " + (k + 1) + ": " + c : ""; }).filter(Boolean);
        return { page: n.page, title: n.title, on: n.on,
                 text: n.text + (lines.length ? (n.text ? "\n\n" : "") + lines.join("\n") : ""),
                 pics: sent.map(function (id) { return keys[id]; }),
                 picNotes: lines.length ? said : undefined,         // same order as pics; "" = no words
                 // where it was left, for "Show me on the site" in the admin
                 url: n.url || location.origin + n.page, path: n.hub || !n.path ? undefined : n.path.slice(0, 40),
                 sel: n.hub ? undefined : n.sel, fx: n.fx, fy: n.fy, py: n.py, snip: n.snip, vw: n.vw,
                 shot: n.shot && keys[n.shot] || undefined };      // a small picture of the spot (a pic key, like pics)
      }) };
      var go = DEMO ? new Promise(function (r) { setTimeout(function () { r({ ok: true }); }, 600); }) : api("/api/notes", { token: token, body: body });
      return go.then(function (d) {
        if (!d.ok) return failWith(d);
        busy = false;
        heads_up(body.notes.length, total);
        if (MODE === "hub") return sentHub(list);
        st.sent = true; st.sentNotes = body.notes.length; st.sentPics = total; save();
        showSent();
      });
    });
  }
  // Edit mode: a box in the middle says it went, and the bar keeps saying so until they start new notes.
  function showSent() {
    panel = "sent";
    var done = function () { closePanels(); render(); };
    var doneBtn = h("button", { class: "b main wide", type: "button", title: "Close this", text: "Done", onclick: done });
    veil(h("div", { class: "card", role: "dialog", "aria-label": "Sent" }, [
      h("div", { class: "bd center", style: "padding-top:26px;gap:8px" }, [
        h("div", { class: "done-ic" }, [icon("check")]),
        h("h2", { text: "Sent!" }),
        h("p", { text: TO + " has your " + (st.sentNotes === 1 ? "note" : plural(st.sentNotes, "note")) + (st.sentPics ? " and " + plural(st.sentPics, "photo") : "") + "." }),
        h("p", { text: "You'll hear back soon. Nothing on your website changes until " + TO + " makes the update." })
      ]),
      h("div", { class: "ft" }, [doneBtn])
    ]), { focus: doneBtn, close: done });
    render();
  }
  // Their own page: what was sent leaves this device's list and joins Your requests, and one line says so. The
  // Photos page stays open, ready for more.
  function sentHub(list) {
    var photos = panel === "photos";
    dropNotes(list);
    if (photos) els.note.fresh(); else { closePanels(); render(); }
    toast("Sent to " + TO + "." + (document.querySelector("[data-requests]") ? " Track it under Requests." : ""));
    loadRequests();
  }
  function newList(quietly) {
    dropNotes(st.notes.slice()); st.sent = false; st.sentNotes = st.sentPics = 0; save(); closePanels(); render();
    if (!quietly) toast("Ready for new notes.");
  }
  // A plain email saying "new notes came in". Best effort; the notes are already safely stored.
  function heads_up(notes, pictures) {
    if (!ALERT_KEY || DEMO) return;
    try {
      fetch("https://api.web3forms.com/submit", { method: "POST", headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ access_key: ALERT_KEY, subject: "New site notes: " + SITE, from_name: "Site Notes",
          message: plural(notes, "note") + " and " + plural(pictures, "photo") + " just came in from " + SITE + " (" + location.hostname + "). Open your admin page to see them." }) }).catch(function () {});
    } catch (e) {}
  }

  /* ----- help, and turning notes off ----- */
  function showHelp(first) {
    panel = "help";
    var gotIt = h("button", { class: "b main wide", type: "button", title: "Close the help", text: first ? "Got it. Let's start." : "Got it", onclick: function () { els.veilClose(); } });
    var step = function (n, ic, title, text) { return h("li", {}, [h("div", { class: "circ" }, [icon(ic), n ? h("i", { text: String(n) }) : null]), h("div", {}, [h("b", { text: title }), h("span", { text: text })])]); };
    veil(h("div", { class: "card help", role: "dialog", "aria-label": "How this works" }, [
      h("div", { class: "hd" }, [
        h("div", { class: "grow" }, [h("h2", { text: first ? (MODE === "edit" ? "You're in Edit mode. Here's how it works." : "Welcome! Here's how your portal works.") : "How this works" }), h("p", { text: MODE === "edit" ? "Leave notes for " + TO + " right on your own website." : "Everything for your website, in one place." })]),
        h("button", { class: "xbtn", type: "button", title: "Close the help", "aria-label": "Close", onclick: function () { els.veilClose(); } }, [icon("x")])
      ]),
      h("div", { class: "bd", tabindex: "0" }, [
        MODE === "edit" ? h("ol", { class: "steps" }, [
          step(1, "note", "Tap “Add a note”", "It's the orange button at the bottom of the screen."),
          step(2, "tap", "Tap right where you want the note", "On a price, a sentence, a picture. Anything. The note goes exactly there."),
          step(3, "pencil", "Say what you'd like", "Type it in your own words. Add photos if you have them."),
          step(4, "send", "Tap “Send to " + TO + "”", "Do this once you've added all your notes.")
        ]) : h("ul", { class: "steps" }, [
          step(0, "home", "Home shows what needs you", "A question from " + TO + ", or new messages from your website."),
          step(0, "list", "Each part of your website has its own page", "Pick one in the row at the top. On a phone it's the bar at the bottom."),
          step(0, "check", "Some things you change yourself", "Where a box says Edit, change it and tap Save. Your website shows it within a minute."),
          step(0, "pencil", "Want something else changed?", "Tap Edit my website, then tap the part you mean. " + TO + " makes the change.")
        ]),
        h("div", { class: "calm" }, [icon("check"), h("span", { text: MODE === "edit" ? "You can't break anything. Your website stays exactly as it is until " + TO + " makes the change."
          : "Made a mistake? Every change you save yourself can be undone from that page's list of changes." })])
      ]),
      h("div", { class: "ft" }, [gotIt])
    ]), { focus: gotIt });
    els.dock.hidden = isPhone();
  }
  /* ----- downloads: a photo, all the photos of a part (one .zip), the shop list (.csv) ----- */
  // A file is named from its words ("Homepage, top photo" -> homepage-top-photo.jpg). Several photos come as
  // one .zip, stored as they are (photos are already compressed). Photos are read from this site or from the
  // copies already loaded from the notes service; nothing is fetched from anywhere else.
  function fileName(words, ext) {
    var b = String(words || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (b.length > 60) b = b.slice(0, 61).replace(/-[^-]*$/, "");   // long words end at a whole word
    return (b || "photo") + "." + ext;
  }
  function extFor(type, src) { var m = /(jpe?g|png|webp|gif|svg)/i.exec(type || "") || /\.(jpe?g|png|webp|gif|svg)(?:[?#]|$)/i.exec(src || ""); return m ? m[1].toLowerCase().replace("jpeg", "jpg") : "jpg"; }
  function saveFile(blob, name) {
    var u = URL.createObjectURL(blob), a = h("a", { href: u, download: name, hidden: true });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(u); }, 60000);
  }
  // The file behind a photo's address. A blob: address is one this page made (the page's policy doesn't let it read
  // those back), so the file is kept beside it in blobs.
  var blobs = {};
  function keepBlob(b) { var u = URL.createObjectURL(b); blobs[u] = b; return u; }
  function blobOf(src) {
    if (!src) return Promise.resolve(null);
    if (blobs[src]) return Promise.resolve(blobs[src]);
    var d = /^data:([^;,]*)(;base64)?,(.*)$/.exec(src);
    if (d) { var raw = d[2] ? atob(d[3]) : decodeURIComponent(d[3]), a = new Uint8Array(raw.length); for (var i = 0; i < raw.length; i++) a[i] = raw.charCodeAt(i); return Promise.resolve(new Blob([a], { type: d[1] })); }
    return fetch(src).then(function (r) { return r.ok ? r.blob() : null; }, function () { return null; });
  }
  var crcT = null;
  function crc32(b) {
    if (!crcT) { crcT = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c >>> 0; } }
    var x = -1; for (var i = 0; i < b.length; i++) x = crcT[(x ^ b[i]) & 255] ^ (x >>> 8);
    return (x ^ -1) >>> 0;
  }
  // [{name, data: Uint8Array}] -> a .zip (the classic format every computer and phone opens), dated now
  function zipOf(files) {
    var now = new Date(), time = now.getHours() << 11 | now.getMinutes() << 5 | now.getSeconds() >> 1;
    var date = (now.getFullYear() - 1980) << 9 | (now.getMonth() + 1) << 5 | now.getDate();
    var enc = new TextEncoder(), parts = [], dir = [], at = 0;
    files.forEach(function (f) {
      var nm = enc.encode(f.name), crc = crc32(f.data), n = f.data.length;
      var lh = new DataView(new ArrayBuffer(30)), ch = new DataView(new ArrayBuffer(46));
      [[0, 0x04034b50, 4], [4, 20, 2], [6, 0x0800, 2], [10, time, 2], [12, date, 2], [14, crc, 4], [18, n, 4], [22, n, 4], [26, nm.length, 2]].forEach(function (v) { v[2] === 4 ? lh.setUint32(v[0], v[1], true) : lh.setUint16(v[0], v[1], true); });
      [[0, 0x02014b50, 4], [4, 20, 2], [6, 20, 2], [8, 0x0800, 2], [12, time, 2], [14, date, 2], [16, crc, 4], [20, n, 4], [24, n, 4], [28, nm.length, 2], [42, at, 4]].forEach(function (v) { v[2] === 4 ? ch.setUint32(v[0], v[1], true) : ch.setUint16(v[0], v[1], true); });
      parts.push(lh, nm, f.data); dir.push(ch, nm);
      at += 30 + nm.length + n;
    });
    var size = dir.reduce(function (s, p) { return s + p.byteLength; }, 0), end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, size, true); end.setUint32(16, at, true);
    return new Blob(parts.concat(dir, [end]), { type: "application/zip" });
  }
  // A "Download all" button: items [{title, src}] where src is an address or a promise of one.
  function downloadAll(items, zipName, btn) {
    var say = btn.lastChild, was = say.textContent;
    btn.disabled = true; say.textContent = "Getting them ready…";
    Promise.all(items.map(function (it) {
      return Promise.resolve(it.src).then(function (src) { return blobOf(src).then(function (b) { return b && b.size ? b.arrayBuffer().then(function (ab) { return { name: fileName(it.title, extFor(b.type, src)), data: new Uint8Array(ab) }; }) : null; }); });
    })).then(function (got) {
      btn.disabled = false; say.textContent = was;
      var used = {}, files = got.filter(Boolean).map(function (f) { var nm = f.name, k = 1; while (used[nm]) nm = f.name.replace(/(\.\w+)$/, "-" + (++k) + "$1"); used[nm] = 1; f.name = nm; return f; });
      if (!files.length) return toast("Those photos can't be downloaded right now. Try again in a minute.");
      saveFile(zipOf(files), zipName);
      toast("Downloading " + plural(files.length, "photo") + " in one .zip file." + (files.length < items.length ? " " + (items.length - files.length) + " couldn't be read." : ""));
    });
  }
  function dlButton(text, fn, cls, tip) { return h("button", { class: cls == null ? "pg-dl" : cls, type: "button", title: tip || null, onclick: function () { fn(this); } }, [icon("download"), h("span", { text: text })]); }

  // A photo, big. Close with the button, Esc or a tap outside; arrows step through.
  // items: [{ src, title, cap }]. swap (optional): "Swap this one", given the photo shown.
  function lightbox(items, at, swap) {
    var from = els.lb ? els.lbFrom : root.activeElement || document.activeElement;
    if (!panel && !els.veil) remember();
    closeLb(true); els.lbFrom = from;
    if (!items.length) return;
    var pic = h("img", { alt: "" }), cap = h("p", { class: "cap" }), title = h("h2", {});
    var dl = h("a", { class: "b plain", title: "Save this photo to your device", href: "" }, [icon("download"), h("span", { text: "Download" })]);
    var show = function (i) {
      at = (i + items.length) % items.length; var it = items[at];
      pic.src = it.src; pic.alt = it.title || "";
      dl.href = it.src; dl.download = fileName(it.title, extFor(blobs[it.src] && blobs[it.src].type, it.src));
      dl.setAttribute("aria-label", "Download " + (it.title || "this photo"));
      title.textContent = it.title || "Photo";
      cap.textContent = (items.length > 1 ? "Photo " + (at + 1) + " of " + items.length + (it.cap ? " · " : "") : "") + (it.cap || "");
    };
    var nav = items.length > 1 ? [h("button", { class: "nav l", type: "button", title: "Previous photo", "aria-label": "Previous photo", onclick: function () { show(at - 1); } }, [icon("arrow")]),
                                  h("button", { class: "nav r", type: "button", title: "Next photo", "aria-label": "Next photo", onclick: function () { show(at + 1); } }, [icon("arrow")])] : [];
    var card = h("div", { class: "card photo", role: "dialog", "aria-modal": "true", "aria-label": "Photo" }, [
      h("div", { class: "hd" }, [h("div", { class: "grow" }, [title]), h("button", { class: "xbtn", type: "button", "aria-label": "Close", onclick: closeLb }, [icon("x")])]),
      h("div", { class: "bd" }, [h("div", { class: "shot" }, [pic].concat(nav)), cap]),
      h("div", { class: "ft" }, [
        swap ? h("button", { class: "b plain", type: "button", title: "Send a new photo to take this one's place", onclick: function () { var it = items[at]; closeLb(); swap(it); } }, [icon("photo"), h("span", { text: "Swap this one" })]) : null,
        dl,
        h("button", { class: "b main push", type: "button", title: "Back to your photos", text: "Close", onclick: closeLb })
      ])
    ]);
    card.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") show(at - 1); if (e.key === "ArrowRight") show(at + 1); });
    els.lb = h("div", { class: "veil lb", onclick: function (e) { if (e.target === els.lb) closeLb(); } }, [card]);
    layer.appendChild(els.lb); still();
    show(at);
    try { card.querySelector(".b.main").focus({ preventScroll: true }); } catch (x) {}
  }
  // Over the Photos page, closing the photo puts focus back on the photo they tapped.
  function closeLb(quiet) {
    if (!els.lb) return;
    els.lb.remove(); els.lb = null; still();
    var from = els.lbFrom; els.lbFrom = null;
    if (quiet) return;
    if (panel && from && from.isConnected) { try { from.focus({ preventScroll: true }); } catch (x) {} }
    else giveBack();
  }

  // One of their site's photos on a box (data-big), big.
  function showPhoto(img) {
    var all = Array.prototype.slice.call(document.querySelectorAll("[data-big]"));
    var box = img.closest("[data-note-box]");
    lightbox(all.map(function (it) { return { src: it.getAttribute("data-big"), title: it.alt || "On your site now", cap: "on your website now" }; }), Math.max(0, all.indexOf(img)),
      box ? function (it) {
        if (box === photosBox()) { openPhotos(); askSwap(it.title); return; }
        addNote(box, box.getAttribute("data-area") || null);
        var t = els.note && els.note.text; if (t) { t.value = "Please swap this photo: " + it.title + ". "; try { t.focus(); t.setSelectionRange(t.value.length, t.value.length); } catch (x) {} }
      } : null);
  }

  /* ----- the Photos page ----- */
  // Opened by the Photos box (data-photos-page) or <portal>#photos. Three parts: add new photos (sent from here, and
  // the page stays open for more), every photo they've sent with its status: "On your site" / "Approved" /
  // "Received" / "Not used", and the photos on their site now. Back (or the browser's Back) returns to the portal;
  // photos they added stay saved on this device until they send them.
  function photosBox() { return MODE === "hub" ? document.querySelector("[data-photos-page]") : null; }
  // Let's talk: the booking page set on their page (data-booking-url, on any element) opens in a new tab.
  function bookingUrl() { var el = MODE === "hub" && document.querySelector("[data-booking-url]"); return el ? (el.getAttribute("data-booking-url") || "").trim() : ""; }
  function letsTalk() { if (bookingUrl()) window.open(bookingUrl(), "_blank", "noopener"); }
  // "Builders page" on a page button reads "Builders"; "Homepage" stays as it is.
  function shortPage(pg) { return pg.replace(/\s+page$/i, "") || pg; }
  function sitePhotos() {
    var tpl = document.querySelector("template[data-site-photos]");
    var imgs = tpl && tpl.content ? tpl.content.querySelectorAll("img") : [];
    var list = Array.prototype.map.call(imgs, function (im) {
      return { thumb: im.getAttribute("src"), src: im.getAttribute("data-big") || im.getAttribute("src"), title: im.getAttribute("alt") || "",
               on: (im.getAttribute("data-on") || "").split("|").filter(Boolean) };
    });
    if (!list.length) list = Array.prototype.map.call(document.querySelectorAll("[data-photos-page] [data-big]"), function (im) {   // no list: the ones on the box
      return { thumb: im.getAttribute("src"), src: im.getAttribute("data-big"), title: im.alt || "", on: [] };
    });
    return { list: list, more: tpl && tpl.getAttribute("data-more"), moreUrl: tpl && tpl.getAttribute("data-more-url") };
  }
  function openPhotos(fromHistory) {
    var box = photosBox(); if (!box || busy) return;
    remember(); closePanels();
    panel = "photos";
    var phone = isPhone(), note;   // note: the photos being added, set by fresh() below
    if (!fromHistory && location.hash !== "#photos") { try { history.pushState({ swnPhotos: 1 }, "", "#photos"); } catch (x) {} }

    // 1. new photos
    var thumbs = h("div", { class: "thumbs" });
    var drop = h("button", { class: "add-ph big", type: "button", title: "Choose photos from this device", onclick: function () { els.file.click(); } }, [
      icon("photo"), h("div", {}, [h("b"), h("span", { text: phone ? "From your photos, or take a new one" : "Click to choose, or drag them here from your computer" })])]);
    var text = h("textarea", { id: "swn-text", title: "Add a few words about these photos", placeholder: box.getAttribute("data-note-hint") || "", oninput: function () { note.text = this.value.trim(); save(); } });
    text.addEventListener("paste", function (e) { var f = e.clipboardData && e.clipboardData.files; if (f && f.length) { e.preventDefault(); addPictures(f); } });
    var progress = h("div", { class: "bar", hidden: true }, [h("i")]), err = h("p", { class: "err", hidden: true, role: "alert" });
    var sendBtn = h("button", { class: "b main", type: "button", title: "Send these to " + TO, onclick: function () {
      note.text = text.value.trim(); save();
      if (!note.pics.length && !note.text) { toast("Add a photo first. Then you can send it."); return; }
      send(sendBtn, progress, err, [note]);
    } }, [icon("send"), h("span", { text: "Send to " + TO })]);
    var addSec = h("section", { class: "pg-sec add", "aria-label": "Send new photos" }, [
      h("div", { class: "pg-hd" }, [h("h2", { text: "Send new photos" })]),
      drop, thumbs, h("div", { class: "field" }, [h("label", { class: "lb", for: "swn-text" }, ["Anything " + TO + " should know about them?", h("em", { text: "You can leave this empty" })]), text]),
      progress, err, h("div", { class: "pg-act" }, [sendBtn])]);
    // The photos being added: the ones already on this device, or a new empty batch (at the start, and after each send).
    var fresh = function () {
      var i = -1; st.notes.forEach(function (x, k) { if (x.pg) i = k; });
      if (i < 0) { var made = makeNote(box, box.getAttribute("data-area") || "Photos"); made.pg = true; made.photos = true; st.notes.push(made); save(); i = st.notes.length - 1; }
      active = i; note = st.notes[i];
      text.value = note.text || ""; sendBtn.disabled = false; sendBtn.lastChild.textContent = "Send to " + TO; progress.hidden = true; err.hidden = true;
      drawThumbs(note, thumbs, true); refreshDrop(note);
      loadSent(sentGrid, sentSum, sentNone, sentDl);
    };

    // 2. what they've sent, and which of those are on the site
    var sentSum = h("p", { class: "pg-sub", text: "Loading…" }), sentGrid = h("div", { class: "pg-grid", hidden: true }), sentNone = h("p", { class: "pg-none", hidden: true });
    var sentDl = dlButton("Download all", function () {}, null, "Every photo you've sent, in one .zip file.");
    sentDl.hidden = true;
    var sentSec = h("section", { class: "pg-sec sent", "aria-label": "Photos you sent" }, [h("div", { class: "pg-hd" }, [h("div", { class: "grow" }, [h("h2", { text: "Photos you sent" }), sentSum]), sentDl]), sentGrid, sentNone]);

    // 3. on the site now
    var site = sitePhotos(), siteSec = null;
    if (site.list.length) {
      // The pages their photos are on, in the order they first appear, each with how many photos it has.
      var pages = [], counts = {};
      site.list.forEach(function (p) { p.on.forEach(function (pg) { if (!counts[pg]) { counts[pg] = 0; pages.push(pg); } counts[pg]++; }); });
      var unpaged = site.list.filter(function (p) { return !p.on.length; }).length;
      if (unpaged && pages.length) { pages.push(""); counts[""] = unpaged; }   // "" = photos with no page named
      var pick = null, shown = site.list;   // pick: null = All
      var siteSub = h("p", { class: "pg-sub" }), siteGrid = h("div", { class: "pg-grid" });
      var siteDl = dlButton("Download all", function (b) {
        downloadAll(siteItems(), fileName((NAME || "website") + " photos " + (pick == null ? "on the website" : pick ? "on " + shortPage(pick) : "on other pages"), "zip"), b);
      }, null, "The photos shown here, in one .zip file, each named for what it shows.");
      var siteItems = function () { return shown.map(function (p) { return { src: p.src, title: p.title || "On your site", cap: p.on.length ? p.on.join(", ") : "on your website now" }; }); };
      var pageBtns = pages.length > 1 ? [null].concat(pages).map(function (pg) {
        return h("button", { class: "pg-page", type: "button", "aria-pressed": pg === pick ? "true" : "false", title: pg == null ? "Every photo on your website" : pg ? "Only the photos on your " + pg : "Photos not tied to one page",
          onclick: function () { showPage(pg); } }, [h("span", { text: pg == null ? "All" : pg ? shortPage(pg) : "Other" }), h("span", { class: "n", text: String(pg == null ? site.list.length : counts[pg]) })]);
      }) : [];
      var showPage = function (pg) {
        pick = pg;
        shown = pg == null ? site.list : site.list.filter(function (p) { return pg ? p.on.indexOf(pg) >= 0 : !p.on.length; });
        pageBtns.forEach(function (b, k) { b.setAttribute("aria-pressed", (k ? pages[k - 1] : null) === pg ? "true" : "false"); });
        siteSub.textContent = plural(shown.length, "photo") + (pg ? " on your " + pg : "") + ". Tap one to see it bigger.";
        siteDl.lastChild.textContent = pg == null ? "Download all" : "Download these";
        var items = siteItems();
        siteGrid.textContent = "";
        shown.forEach(function (p, k) {
          siteGrid.appendChild(
            h("button", { class: "pg-ph", type: "button", "aria-label": (p.title || "Photo " + (k + 1)) + ". See it bigger.", onclick: function () { lightbox(items, k, function (it) { askSwap(it.title); }); } }, [
            h("span", { class: "im" }, [h("img", { src: p.thumb, alt: "", loading: "lazy", decoding: "async" })]),
            h("span", { class: "tag on" }, [icon("check"), h("span", { text: "On your site" })]),
            p.on.length ? h("span", { class: "dt", text: p.on.join(", ") }) : null]));
        });
      };
      showPage(null);
      siteSec = h("section", { class: "pg-sec site", "aria-label": "On your site now" }, [
        h("div", { class: "pg-hd" }, [h("div", { class: "grow" }, [h("h2", { text: "On your site now" }), siteSub]), siteDl]),
        pageBtns.length ? h("div", { class: "pg-pages", role: "group", "aria-label": "Show the photos on one page" }, pageBtns) : null,
        siteGrid,
        site.more ? h("p", { class: "pg-more" }, [site.more + " ", site.moreUrl ? h("a", { title: "Opens in a new tab", href: site.moreUrl, target: "_blank", rel: "noopener", text: "See them" }) : null]) : null]);
    }

    var page = h("div", { class: "pg note photos", role: "dialog", "aria-modal": "true", "aria-label": "Your photos" }, [
      h("div", { class: "dropcover", "aria-hidden": "true" }, [icon("photo"), h("b", { text: "Drop your photos here" })]),
      h("div", { class: "pg-top" }, [
        h("button", { class: "pg-back", type: "button", title: "Go back", onclick: backFromPhotos }, [icon("back"), h("span", { text: pageOn ? pageName(pageOn) : "Back" })]),
        h("h1", { text: "Your photos" }), h("p", { text: "Send " + TO + " new photos, and see the ones on your website." })]),
      h("div", { class: "pg-in" }, [addSec, sentSec, siteSec])
    ]);
    var depth = 0;
    page.addEventListener("dragenter", function (e) { if (!hasFiles(e)) return; e.preventDefault(); depth++; page.classList.add("dropping"); });
    page.addEventListener("dragover", function (e) { if (!hasFiles(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = "copy"; });
    page.addEventListener("dragleave", function () { if (--depth <= 0) { depth = 0; page.classList.remove("dropping"); } });
    page.addEventListener("drop", function (e) { if (!hasFiles(e)) return; e.preventDefault(); e.stopPropagation(); depth = 0; page.classList.remove("dropping"); addPictures(e.dataTransfer.files); });

    els.note = { card: page, text: text, thumbs: thumbs, drop: drop, fields: [], page: true, fresh: fresh };
    layer.appendChild(page);
    els.dock.hidden = true;
    els.scrollWas = document.documentElement.style.overflow; document.documentElement.style.overflow = "hidden";
    fresh();
    render(); still();
    try { page.querySelector(".pg-back").focus({ preventScroll: true }); } catch (x) {}
  }
  // Leaving the page (Back, Esc, or Send): an empty photos note is dropped, the rest stays saved.
  function leavePhotos() {
    var note = st.notes[active];
    if (note && els.note && els.note.page) note.text = els.note.text.value.trim();
    if (note && note.pg && !note.text && !note.pics.length) { st.notes.splice(active, 1); }
    save();
    document.documentElement.style.overflow = els.scrollWas || "";
    if (location.hash === "#photos") { try { history.replaceState(null, "", location.pathname + location.search + pageHash()); } catch (x) {} }
  }
  function backFromPhotos() {
    var note = st.notes[active];
    if (note && note.pics.length) closedToast = "Your photos are saved on this device. Open Photos again to send them.";
    if (history.state && history.state.swnPhotos && location.hash === "#photos") { history.back(); return; }   // the browser's Back closes it
    photosClosed();
  }
  var closedToast = "";
  function photosClosed() { closePanels(); render(); if (closedToast) toast(closedToast); closedToast = ""; }
  // "Swap this one" on a photo of their site: the words go in the new photos' box, ready to add a photo.
  function askSwap(which) {
    var t = els.note && els.note.page && els.note.text; if (!t) return;
    var line = "Please swap this photo: " + which + ".";
    t.value = (t.value.trim() ? t.value.trim() + "\n" : "") + line + " ";
    var note = st.notes[active]; if (note) { note.text = t.value.trim(); save(); }
    try { t.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" }); t.focus({ preventScroll: true }); t.setSelectionRange(t.value.length, t.value.length); } catch (x) {}
    toast("Now add the new photo, then tap Send.");
  }

  // Their sent photos come from the notes service, newest first, with "used" set by Stray Wolf.
  // A photo's status, in the client's words. Stray Wolf picks it in the admin; nothing goes on the site by itself.
  var PIC_WORDS = { received: "Received", approved: "Approved", "on-site": "On your site", "not-used": "Not used" };
  function picStatus(p) { return PIC_WORDS[p.status] ? p.status : p.used ? "on-site" : "received"; }   // an older service only says used or not
  var sentUrls = {}, imgQ = [], imgBusy = 0;
  function loadSent(grid, sum, none, dl) {
    var got = DEMO ? new Promise(function (r) { setTimeout(function () { r(demoSent()); }, 350); }) : api("/api/my-photos", { token: getToken() });
    got.then(function (d) {
      if (!grid.isConnected) return;
      var list = d && d.ok && Array.isArray(d.photos) ? d.photos : null;
      if (!list) {
        sum.textContent = "";
        none.hidden = false; none.textContent = d && d.status === 401 ? "Your login timed out. Log in again to see them." : "They can't be shown right now. Try again later.";
        return;
      }
      if (!list.length) { sum.textContent = ""; none.hidden = false; none.textContent = "Nothing yet. Photos you send show up here."; return; }
      var on = list.filter(function (p) { return picStatus(p) === "on-site"; }).length;
      sum.textContent = plural(list.length, "photo") + ". " + (on ? on + " on your site." : "None on your site yet.");
      var items = list.map(function (p) { return { key: p.key, src: "", title: p.caption || "A photo you sent", cap: (p.at ? "Sent " + dayWord(p.at) + " · " : "") + PIC_WORDS[picStatus(p)] + (p.why ? ": " + p.why : "") }; });
      dl.hidden = false;
      dl.onclick = function () { downloadAll(items.map(function (it) { return { title: it.title, src: sentImg(it.key) }; }), fileName((NAME || "your") + " photos you sent", "zip"), dl); };
      grid.hidden = false; grid.textContent = "";
      list.forEach(function (p, k) {
        var img = h("img", { alt: "", decoding: "async" }), im = h("span", { class: "im" }, [img]), s = picStatus(p);
        grid.appendChild(h("button", { class: "pg-ph", type: "button", title: "See it bigger", "aria-label": (p.caption || "Photo " + (k + 1)) + ". " + items[k].cap + ". See it bigger.", onclick: function () {
          sentImg(items[k].key).then(function (u) {
            items[k].src = u;
            var shown = items.filter(function (it) { return it.src; });
            if (u) lightbox(shown, Math.max(0, shown.indexOf(items[k])));
          });
        } }, [
          im,
          s === "on-site" ? h("span", { class: "tag on" }, [icon("check"), h("span", { text: PIC_WORDS[s] })]) : h("span", { class: "tag " + (s === "approved" ? "yes" : "off"), text: PIC_WORDS[s] }),
          p.caption ? h("span", { class: "cp", text: p.caption }) : null,
          p.why ? h("span", { class: "dt", text: p.why }) : null,
          p.at ? h("span", { class: "dt", text: "Sent " + dayWord(p.at) }) : null]));
        imgQ.push([p.key, img, im, items[k]]);
      });
      pumpImgs();
    });
  }
  function pumpImgs() {
    while (imgBusy < 4 && imgQ.length) {
      var j = imgQ.shift(); imgBusy++;
      (function (img, im, it) {
        sentImg(j[0]).then(function (u) { imgBusy--; it.src = u; if (u) img.src = u; else im.classList.add("gone"); pumpImgs(); });
      })(j[1], j[2], j[3]);
    }
  }
  function sentImg(key) {
    if (!key) return Promise.resolve("");
    if (sentUrls[key]) return sentUrls[key];
    var p = DEMO ? Promise.resolve(demoPic(key))
      : fetch(API + "/api/my-photo", { method: "POST", headers: { authorization: "Bearer " + getToken() }, body: JSON.stringify({ key: key }) })
          .then(function (r) { return r.ok ? r.blob() : null; })
          .then(function (b) { return b && b.size && !/json|text/.test(b.type || "") ? keepBlob(b) : ""; }, function () { return ""; });
    sentUrls[key] = p;
    p.then(function (u) { if (!u) delete sentUrls[key]; });
    return p;
  }
  function dayWord(at) {
    var d = new Date(typeof at === "number" ? at : Date.parse(at)); if (isNaN(d)) return "";
    var o = { month: "short", day: "numeric" }; if (d.getFullYear() !== new Date().getFullYear()) o.year = "numeric";
    try { return d.toLocaleDateString(undefined, o); } catch (x) { return d.toDateString(); }
  }
  // Demo only: a few made-up photos so the page can be tried without the notes service.
  function demoSent() {
    var day = 864e5, now = Date.now();
    return { ok: true, photos: [
      { key: "demo1", at: now - day, caption: "The new sign out front", status: "received" },
      { key: "demo2", at: now - 3 * day, caption: "", status: "approved" },
      { key: "demo3", at: now - 9 * day, caption: "Our crew this spring", status: "on-site" },
      { key: "demo4", at: now - 9 * day, caption: "Before and after", status: "on-site" },
      { key: "demo5", at: now - 20 * day, caption: "", status: "not-used", why: "Too blurry to use" } ] };
  }
  function demoPic(key) {
    var c = document.createElement("canvas"); c.width = 640; c.height = 480;
    var g = c.getContext("2d"), hue = (key.charCodeAt(key.length - 1) * 67) % 360;
    var gr = g.createLinearGradient(0, 0, 640, 480); gr.addColorStop(0, "hsl(" + hue + ",35%,62%)"); gr.addColorStop(1, "hsl(" + (hue + 40) + ",30%,38%)");
    g.fillStyle = gr; g.fillRect(0, 0, 640, 480);
    g.fillStyle = "rgba(255,255,255,.85)"; g.font = "bold 34px system-ui,sans-serif"; g.textAlign = "center"; g.fillText("Sample photo", 320, 250);
    return c.toDataURL("image/jpeg", .8);
  }

  // The Website visitors card on Home ([data-stats]): a few numbers from Google Analytics, in the same words as the
  // admin's Analytics page so the client and Stray Wolf read the same thing. SW Core asks Google and sends the
  // numbers back; with none (or an older service) the card stays hidden. The whole card is drawn here, so every
  // site shows the same one: a page holds only the heading, the [data-stat="range"] line and an empty box.
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  function shortDate(d) { return MON[d.getUTCMonth()] + " " + d.getUTCDate(); }
  function gaLogo() {
    var ns = "http://www.w3.org/2000/svg", s = document.createElementNS(ns, "svg");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true");
    [["rect", { x: 16, y: 2, width: 6, height: 20, rx: 3, fill: "#F9AB00" }], ["rect", { x: 9, y: 9, width: 6, height: 13, rx: 3, fill: "#E37400" }], ["circle", { cx: 4.5, cy: 18.5, r: 3.5, fill: "#E37400" }]]
      .forEach(function (part) { var e = document.createElementNS(ns, part[0]), k; for (k in part[1]) e.setAttribute(k, part[1][k]); s.appendChild(e); });
    return s;
  }
  function loadStats() {
    // .stats: a page from before the card was drawn here; what it holds is replaced
    var sec = document.querySelector("[data-stats]"), box = sec && sec.querySelector(".wv, .stats"); if (!box) return;
    var got = DEMO ? Promise.resolve({ ok: true, sample: true, days: 28, visitors: 109, visitorsPrev: 91, visitorsChange: 20, calls: 8, callsPrev: 4, callsChange: 100,
                                       leads: 3, leadsPrev: 0, leadsChange: 0, source: "Google", daily: { start: new Date(Date.now() - 28 * 864e5).toISOString().slice(0, 10),
                                         visitors: [3, 3, 3, 3, 5, 2, 3, 3, 4, 4, 3, 5, 2, 4, 4, 4, 4, 4, 6, 2, 4, 5, 5, 5, 4, 7, 3, 5],
                                         calls: [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0],
                                         leads: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0] } })
                   : api("/api/stats", { token: getToken(), body: { site: SITE } });
    got.then(function (d) {
      if (!d || !d.ok || d.visitors == null) return;
      var n = function (v) { return (Number(v) || 0).toLocaleString("en-US"); };
      // say the period in plain words: 28 days = "4 weeks"
      var days = d.days || 28, span = days % 7 === 0 ? (days / 7) + " weeks" : days + " days";
      // no-break spaces keep "the 4 weeks before" together when the line wraps
      var before = ("the " + span + " before").replace(/ /g, " ");
      // the days themselves, when the service sends them and they make whole weeks: they draw the columns and name the busiest day
      var start = d.daily && d.daily.start ? new Date(d.daily.start + "T00:00:00Z") : null;
      if (start && isNaN(start)) start = null;
      var daily = start && days % 7 === 0 && Array.isArray(d.daily.visitors) && d.daily.visitors.length === days ? d.daily : null;
      var dayAt = function (i) { return new Date(start.getTime() + i * 864e5); };
      // The change from the weeks before, as a small tag: "4 more than the 4 weeks before", "3 fewer than the 4 weeks
      // before", "Same as the 4 weeks before" or "None in the 4 weeks before". The styles add a small arrow and the
      // green or red; the words alone say it.
      var tag = function (now, prev, pct) {
        var dir = 0, words;
        if (typeof prev === "number") {
          dir = prev ? now - prev : 0;
          words = !prev ? (now ? "None in " : "Same as ") + before : dir ? n(Math.abs(dir)) + (dir > 0 ? " more than " : " fewer than ") + before : "Same as " + before;
        } else if (typeof pct === "number" && pct !== 0) { dir = pct; words = Math.abs(pct) + "% " + (pct > 0 ? "more than " : "fewer than ") + before; }
        else return null;
        return h("span", { class: "wv-tag" + (dir > 0 ? " up" : dir < 0 ? " down" : ""), text: words });
      };
      // nothing at all from the weeks before (tracking is new): say it once at the foot, not under every number
      var fresh = [d.visitorsPrev, d.callsPrev, d.leadsPrev].every(function (x) { return x === 0; });
      // One number's days as a column per week: its total on top, its first day under it, the last 7 days in orange.
      // A column shows its dates on hover, and the label says the whole chart in words for a screen reader.
      var weeks = function (vals, word, label) {
        var list = [], most = 1, i;
        for (i = 0; i < days; i += 7) list.push({ from: dayAt(i), to: dayAt(i + 6), v: (vals || []).slice(i, i + 7).reduce(function (a, b) { return a + (Number(b) || 0); }, 0) });
        list.forEach(function (w) { most = Math.max(most, w.v); });
        return h("div", { class: "wv-cols", role: "img", "aria-label": label + ", week by week: " + list.map(function (w, k) { return n(w.v) + (k === list.length - 1 ? " in the last 7 days" : " in the week of " + shortDate(w.from)); }).join(", ") + "." },
          list.map(function (w, k) {
            return h("div", { class: "wv-col" + (k === list.length - 1 ? " hot" : ""), "data-tip": shortDate(w.from) + " – " + shortDate(w.to) + ": " + plural(w.v, word) }, [
              h("span", { class: "wv-col-in" }, [h("span", { class: "wv-col-v", text: n(w.v) }), h("span", { class: "wv-bar", style: "height:calc((100% - 19px) * " + (w.v ? Math.max(.05, w.v / most) : 0).toFixed(3) + ")" })]),
              h("span", { class: "wv-col-k", text: shortDate(w.from) })]);
          }));
      };
      var one = function (k, label, about, word) {
        var now = Number(d[k]) || 0;
        return h("li", {}, [h("div", { class: "wv-hd" }, [h("b", { class: "wv-n", text: n(now) }), h("span", { class: "wv-l", text: label }), h("span", { class: "wv-s", text: about }), fresh ? null : tag(now, d[k + "Prev"], d[k + "Change"])]),
          daily ? weeks(daily[k], word, label) : null]);
      };
      // one short line above the numbers: "109 people visited your website. 11 reached out."
      var v = Number(d.visitors) || 0, out = (Number(d.calls) || 0) + (Number(d.leads) || 0);
      var say = h("p", { class: "wv-say" }, [h("b", { text: n(v) + (v === 1 ? " person" : " people") }), " visited your website. ", out ? h("b", { class: "out", text: n(out) + " reached out." }) : "Nobody reached out yet."]);
      // Worth knowing, in plain sentences: the busiest day of the week (two when they tie, none when more do), where
      // most visits started, and how many visitors reached out. A line is [picture, parts]; [words] stand out.
      var lines = [];
      if (daily && v) {
        var byDay = [0, 0, 0, 0, 0, 0, 0]; daily.visitors.forEach(function (x, i) { byDay[(dayAt(i).getUTCDay() + 6) % 7] += Number(x) || 0; });
        var top = Math.max.apply(null, byDay), names = WEEKDAYS.filter(function (w, i) { return byDay[i] === top; }).map(function (w) { return w + "s"; });
        if (names.length < 3) lines.push(["calendar", [[names.join(" and ")], names.length > 1 ? " were your busiest days." : " were your busiest day."]]);
      }
      if (d.source) lines.push(["search", d.source === "Typed it in" ? ["Most people ", ["typed your address in"], " or used a bookmark."] : ["Most people found you on ", [d.source], "."]]);
      if (out && Math.round(v / out) > 1) lines.push(["person", ["About ", ["1 in " + Math.round(v / out)], " visitors reached out."]]);
      var know = lines.length ? h("ul", { class: "wv-know", "aria-label": "Worth knowing" }, lines.map(function (l) {
        return h("li", {}, [h("span", { class: "wv-ic" }, [icon(l[0])]), h("span", {}, l[1].map(function (part) { return typeof part === "string" ? part : h("b", { text: part[0] }); }))]);
      })) : null;
      var key = daily ? h("p", { class: "wv-key" }, [h("span", {}, [h("i"), "One week, from the date under it"]), h("span", { class: "hot" }, [h("i"), "The last 7 days"])]) : null;
      var foot = h("p", { class: "wv-f" }, [h("span", { class: "ga" }, [gaLogo(), "From Google Analytics" + (fresh ? " · Nothing earlier to compare yet" : "")]), d.sample ? h("span", { class: "sample", text: "Sample" }) : null]);
      // the period, with real dates when the service sends the days
      var range = sec.querySelector('[data-stat="range"]');
      if (range) range.textContent = "Last " + span + (start ? " · " + shortDate(start) + " – " + shortDate(dayAt(days - 1)) : "");
      box.className = "wv";
      box.replaceChildren.apply(box, [say, h("ul", { class: "wv-nums" + (daily ? " cols" : "") }, [one("visitors", "Visitors", "Different people who opened your website", "visitor"),
        one("calls", "Phone calls", "Tapped your number on the website", "phone call"), one("leads", "Form requests", "Filled in and sent your form", "form request")]), key, know, foot].filter(Boolean));
      sec.hidden = false;
    });
  }

  // The pages of their portal. Their page is cut into pages: each <section id="shop" data-page="Shop"> is one, and
  // the first is Home. One shows at a time. The header ([data-portal-nav]) gets a link to each, a phone gets the same
  // links as a bar along the bottom, and every page but Home starts with a link back to it. The address says which
  // page is open (/portal/#shop), so Back, Forward, Reload and a saved link all work; an address naming something
  // inside a page (#hours) opens that page there. The Shop and Messages pages are left out for a client with no
  // shop, or with the website's form off. After the links the header asks "Need changes?" beside "Edit my website"
  // (the page's own [data-edit-mode] card, again).
  //   On a page:  data-page-short="Info"   its name in the phone's bar, when the full one is too long
  //               data-page-about="Items, prices and photos"   its line in Home's list
  //               data-page-wide   a wider page, for the shop's table
  //   On Home:    [data-needs], a list: what is waiting on them (a question from Stray Wolf, new messages, notes and
  //               photos not sent yet), with how many in [data-needs-n]
  //               [data-glance], a list: the other pages, each with where it stands ("5 showing · 1 sold out")
  var PAGE_ICON = { home: "home", messages: "mail", shop: "bag", info: "globe", requests: "list" };
  var pageAll = [], pageOn = null, pageTitle = "", pageTabs = null, navSig = "", homeSig = "";
  var asked = {};   // messages, shop, requests: 1 once the service has answered, -1 when it couldn't be reached
  function pageName(p) { return p.getAttribute("data-page"); }
  // What a page holds decides its icon, its count and its line on Home. The first page is Home.
  function pageKind(p) {
    return p === pageAll[0] ? "home" : p.querySelector("[data-form-portal]") ? "messages" : p.querySelector("[data-shop-portal]") ? "shop"
      : p.querySelector("[data-requests]") ? "requests" : p.querySelector("[data-info], [data-note-box]") ? "info" : "";
  }
  function pageOfKind(kind) { return pageAll.filter(function (p) { return pageKind(p) === kind; })[0] || null; }
  // Is this page theirs? The shop and the website's form answer a moment after login. Until then a page is offered
  // if it was last time (remembered on this device), so the links don't jump around as the answers come in.
  function pageHas(p) {
    var part = p.querySelector("[data-form-portal], [data-shop-portal]"), kind = pageKind(p);
    return !part || (asked[kind] > 0 ? !part.hidden : (lsGet("pages") || "").split(",").indexOf(kind) >= 0);
  }
  // The page an address names: "#shop" is that page, "#hours" the page holding it (and that spot on it), "#photos"
  // the page with the Photos box. null: it names nothing of theirs.
  function pageAt(hash) {
    var el = null;
    try { el = hash === "#photos" ? photosBox() : hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null; } catch (x) {}
    var page = el && el.closest("[data-page]");
    return page && pageHas(page) ? { page: page, spot: el !== page && hash !== "#photos" ? el : null } : null;
  }
  // Put a page on screen. moved: they asked for it just now, so it starts at its top and its heading takes the
  // focus (a screen reader says where they are). The browser's Back and Forward keep their own place.
  function showPage(page, moved) {
    var change = page !== pageOn;
    pageOn = page;
    pageAll.forEach(function (x) { x.hidden = x !== page; });
    document.title = (page === pageAll[0] ? "" : pageName(page) + " · ") + pageTitle;
    document.documentElement.classList.toggle("pp-wide", page.hasAttribute("data-page-wide"));
    drawNav();
    if (!moved || !change) return;
    window.scrollTo(0, 0);
    var hd = page.querySelector("h1"); if (hd) { hd.setAttribute("tabindex", "-1"); hd.focus({ preventScroll: true }); }
  }
  function goPage(page, spot) {
    var hash = "#" + (spot || page).id;
    if (location.hash !== hash) { try { history.pushState(null, "", hash); } catch (x) {} }
    showPage(page, true);
    if (spot) spot.scrollIntoView({ block: "start" });
  }
  // The address decides which page shows: at the start, and after the browser's Back or Forward.
  function route() {
    var at = pageAt(location.hash) || { page: pageAll[0] };
    if (at.page === pageOn) return;
    showPage(at.page);
    if (at.spot) at.spot.scrollIntoView({ block: "start" });
  }
  // The address after a page of ours (the Photos page) closes: the page under it.
  function pageHash() { return pageOn && pageOn !== pageAll[0] ? "#" + pageOn.id : ""; }
  function pagesStart() {
    pageAll = [].slice.call(document.querySelectorAll("[data-page]"));
    if (!pageAll.length) return;
    pageTitle = document.title;
    document.documentElement.classList.add("pp-on");
    pageAll.slice(1).forEach(function (page) {
      page.insertBefore(h("a", { class: "pp-back", title: "Back to " + pageName(pageAll[0]), href: "#" + pageAll[0].id }, [icon("back"), h("span", { text: pageName(pageAll[0]) })]), page.firstChild);
    });
    document.body.appendChild(pageTabs = h("nav", { class: "pp-tabs", "aria-label": "Portal pages" }));
    // Any link on their page to one of the pages, or to something on one, goes there without loading anything.
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var at = pageAt(a.getAttribute("href")); if (!at) return;
      e.preventDefault(); goPage(at.page, at.spot);
    });
    window.addEventListener("popstate", route);
    window.addEventListener("resize", fitNav);
    route();
  }
  // The small count beside a page's name: new messages, items in the shop, requests still open (orange when
  // Stray Wolf asked them something). Spelled out for a screen reader ("Messages, 2 new messages") and on hover.
  function pageCount(page) {
    var kind = pageKind(page), n = 0, words = "", hot = false;
    if (kind === "messages") { n = fpNew(); words = n === 1 ? " new message" : " new messages"; }
    else if (kind === "shop" && spShop) { n = spShop.items.length; words = (n === 1 ? " item" : " items") + " in your shop"; }
    else if (kind === "requests") {
      var asks = reqs.filter(function (r) { return r.status === "question"; }).length;
      hot = asks > 0; n = asks || reqs.filter(function (r) { return !reqClosed(r); }).length;
      words = asks ? (asks === 1 ? " question" : " questions") + " for you" : (n === 1 ? " request" : " requests") + " still open";
    }
    return n ? h("span", { class: "pp-n" + (hot ? " hot" : ""), title: n + words }, [h("span", { class: "pp-vh", text: ", " }), String(n), h("span", { class: "pp-vh", text: words })]) : null;
  }
  function pageLink(page, cls, name, withIcon) {
    var a = h("a", { class: cls, title: "Open " + name, href: "#" + page.id }, [withIcon ? icon(PAGE_ICON[pageKind(page)] || "list") : null, h("span", { text: name }), pageCount(page)]);
    if (page === pageOn) a.setAttribute("aria-current", "page");
    return a;
  }
  // The header's links and the phone's bar, drawn again whenever a page comes or goes, the page on screen changes,
  // or a count does. Every part that loads or changes calls this, so Home's lists follow from here too.
  function drawNav() {
    if (!pageAll.length) return;
    var want = (pageAt(location.hash) || { page: pageAll[0] }).page;
    if (want !== pageOn) { showPage(want); return; }   // the part the address was waiting for has arrived (or theirs is gone)
    var has = pageAll.filter(pageHas), edit = document.querySelector("[data-edit-mode]:not(.nav-edit)");
    var sig = has.map(function (page) { var n = pageCount(page); return page.id + (page === pageOn ? "*" : "") + (n ? n.className + n.textContent : ""); }).join("|");
    if (sig !== navSig) {
      navSig = sig;
      lsSet("pages", has.map(pageKind).join(","));
      var nav = document.querySelector("[data-portal-nav]");
      if (nav) {
        var row = h("div", { class: "nav-in" }, has.map(function (page) { return pageLink(page, "pp-l", pageName(page)); }));
        row.appendChild(h("span", { class: "nav-fill" }));
        if (edit) row.append(h("span", { class: "nav-ask", text: "Need changes?" }),
          h("a", { class: "nav-edit", href: edit.getAttribute("href") || "/", "data-edit-mode": edit.getAttribute("data-edit-mode") || "", title: "Open your website to point at what you'd like changed" }, [icon("pencil"), h("span", { text: "Edit my website" })]));
        nav.replaceChildren(row); nav.hidden = false; fitNav();
      }
      pageTabs.replaceChildren.apply(pageTabs, has.map(function (page) { return pageLink(page, "", page.getAttribute("data-page-short") || pageName(page), true); }));
    }
    pageWait();
    drawHome();
  }
  // The white row lets go of what it can do without when it runs short of room: "Need changes?" first, then their
  // name beside their logo (their page hides the name while the links are .snug).
  function fitNav() {
    var nav = document.querySelector("[data-portal-nav]");
    if (!nav || nav.hidden) return;
    nav.classList.remove("no-ask", "snug");
    if (nav.scrollWidth > nav.clientWidth) nav.classList.add("no-ask");
    if (nav.scrollWidth > nav.clientWidth) nav.classList.add("snug");
  }
  // The page on screen says so while its part is still on its way, or didn't come.
  function pageWait() {
    var part = pageOn.querySelector("[data-form-portal], [data-shop-portal], [data-requests]"), line = pageOn.querySelector(".pp-wait");
    if (!part || !part.hidden) { if (line) line.remove(); return; }
    if (!line) pageOn.appendChild(line = h("p", { class: "pp-wait", role: "status" }));
    line.textContent = asked[pageKind(pageOn)] < 0 ? "This didn't load. Check your internet, then reload this page." : "Loading…";
  }
  // Where a page stands, in a few words, for Home's list.
  function pageStands(page) {
    var kind = pageKind(page), count = function (list, test) { return list.filter(test).length; };
    if (kind === "messages" && asked.messages > 0) { var fresh = fpNew(), all = fpList().length; return fresh ? fresh + " new" : all ? plural(all, "message") : "No messages yet"; }
    if (kind === "shop" && spShop) {
      var sold = count(spShop.items, function (x) { return x.show === "sold"; });
      return count(spShop.items, function (x) { return x.show === "live"; }) + " showing" + (sold ? " · " + sold + " sold out" : "");
    }
    if (kind === "requests" && asked.requests > 0) {
      var asks = count(reqs, function (r) { return r.status === "question"; }), open = count(reqs, function (r) { return !reqClosed(r); });
      return asks ? plural(asks, "question") + " for you" : open ? open + " open" : reqs.length ? "Nothing open" : "Nothing sent yet";
    }
    if (kind === "info" && infoNow && infoNow.hours && window.SWInfo) {
      var day = SWInfo.hoursOn(infoNow, SWInfo.now(infoNow.tz).date);
      return day.closed ? "Closed today" : "Open today, " + SWInfo.span(day);
    }
    return "";
  }
  // What is waiting on them, most pressing first: each question from Stray Wolf, new messages from their website,
  // and anything written or added but not sent yet.
  function needRows() {
    var rows = [], inbox = pageOfKind("messages");
    reqs.filter(function (r) { return r.status === "question"; }).forEach(function (r) {
      var q = r.msgs && r.msgs.length ? r.msgs[r.msgs.length - 1] : null;
      rows.push({ ic: "help", b: TO + " has a question", t: short(q && q.by === "sw" ? q.text : r.text, 140), go: "Answer", tip: "Write back to " + TO, main: true, fn: function () { answerRequest(r); } });
    });
    var fresh = fpForm && fpForm.state === "on" ? fpList().filter(function (l) { return l.status !== "replied"; }) : [];
    if (fresh.length && inbox && pageHas(inbox)) {
      var who = fresh.slice(0, 2).map(fpWho), rest = fresh.length - who.length;
      rows.push({ ic: "mail", tone: "sage", b: plural(fresh.length, "new message") + " from your website",
        t: rest ? who.join(", ") + " and " + rest + " more" : who.join(" and "), go: "Read", tip: "Open your messages", fn: function () { goPage(inbox); } });
    }
    var left = waiting();
    if (left.length) {
      var pics = left.reduce(function (n, x) { return n + x.pics.length; }, 0), onlyPics = left.every(function (x) { return !x.text; }), one = (onlyPics ? pics : left.length) === 1;
      rows.push({ ic: "send", tone: "stone", b: (onlyPics ? plural(pics, "photo") : plural(left.length, "note")) + " not sent yet",
        t: "Saved on this device. Check " + (one ? "it" : "them") + " over, then send " + (one ? "it" : "them") + " to " + TO + ".", go: "Review", tip: "Look them over before sending", fn: function () { openReview(); } });
    }
    return rows;
  }
  // Home's two lists: "Needs you", and every other page with where it stands. Drawn again only when something in
  // them changed, so a button being pressed keeps the focus.
  function drawHome() {
    var needs = document.querySelector("[data-needs]"), glance = document.querySelector("[data-glance]");
    if (!pageAll.length || (!needs && !glance)) return;
    var rows = needRows(), others = pageAll.slice(1).filter(pageHas);
    // until the service has said what's new, an empty list doesn't claim that nothing is; nor when it couldn't be reached
    var due = function (kind, part) { return !!asked[kind] || !document.querySelector(part); }, known = due("requests", "[data-requests-list]") && due("messages", "[data-form-portal]");
    var down = asked.requests < 0 || asked.messages < 0;
    var sig = [known, down].concat(rows.map(function (r) { return r.b + r.t; }), others.map(function (page) { return page.id + pageStands(page); })).join("|");
    if (sig === homeSig) return;
    homeSig = sig;
    var row = function (ic, tone, b, t, end) { return [h("span", { class: "pp-ic" + (tone ? " " + tone : "") }, [icon(ic)]), h("span", { class: "pp-t" }, [h("b", { text: b }), t ? h("span", { text: t }) : null])].concat(end); };
    if (needs) {
      needs.replaceChildren.apply(needs, rows.length ? rows.map(function (r) {
        return h("li", { class: "pp-row" }, row(r.ic, r.tone, r.b, r.t, [h("button", { class: "pp-btn" + (r.main ? "" : " plain"), type: "button", title: r.tip, text: r.go, onclick: r.fn })]));
      }) : [h("li", { class: "pp-row" }, down ? row("help", "stone", "This didn't load.", "Check your internet, then reload this page.", [])
        : known ? row("check", "sage", "Nothing needs you right now.", "", []) : row("check", "stone", "Checking what's new…", "", []))]);
      var n = document.querySelector("[data-needs-n]");
      if (n) { n.hidden = !rows.length; n.replaceChildren(String(rows.length), h("span", { class: "pp-vh", text: rows.length === 1 ? " thing" : " things" })); }
    }
    if (glance) glance.replaceChildren.apply(glance, others.map(function (page) {
      var kind = pageKind(page), stands = pageStands(page);
      return h("li", {}, [h("a", { class: "pp-row", title: "Open " + pageName(page), href: "#" + page.id }, row(PAGE_ICON[kind] || "list", kind === "messages" ? "sage" : "stone", pageName(page), page.getAttribute("data-page-about"),
        [stands ? h("span", { class: "pp-v", text: stands }) : null, icon("chev")]))]);
    }));
  }
  // "Answer" on Home: the Requests page, with that question's answer box open and ready to type in.
  function answerRequest(r) {
    var page = pageOfKind("requests"); if (!page) return;
    reqOpen = r.batch + ":" + r.n; reqDraft = "";
    goPage(page); drawRequests();
    var field = page.querySelector("[data-requests-list] textarea");
    if (field) { field.scrollIntoView({ block: "center" }); field.focus({ preventScroll: true }); }
  }

  // "Your requests" on their page ([data-requests]): what they've asked for and where each one stands.
  // The status is the one Stray Wolf picks in the admin, in the client's words. Only Stray Wolf changes
  // it, with one exception: answering a question hands the request back ("Working on it").
  // With nothing sent yet the list says so. "See all" ([data-requests-all]) can sit anywhere on the page.
  var REQ_WORDS = { "new": "Received", working: "Working on it", question: TO + " has a question", done: "Done", declined: "Not doing this one" };
  var REQ_SHOWN = 3;
  var reqs = [], reqAll = false, reqOpen = null, reqDraft = "";   // their requests; whether all are listed; the one being answered, and the answer so far
  function loadRequests() {
    if (!document.querySelector("[data-requests-list]")) return;
    var got = DEMO ? Promise.resolve(demoRequests()) : api("/api/my-requests", { token: getToken() });
    got.then(function (d) {
      asked.requests = d && d.status === 0 ? -1 : 1;
      if (d && d.ok && Array.isArray(d.requests)) reqs = d.requests;
      if (asked.requests > 0) drawRequests(); else drawNav();
    });
  }
  function reqClosed(r) { return r.status === "done" || r.status === "declined"; }
  // "Home page", "About page", or the portal box it came from ("Contact info")
  function reqWhere(r) { return /portal/i.test(r.title || "") ? r.on || "Your portal" : !r.title || r.title === "Home" ? "Home page" : /\bpage$/i.test(r.title) ? r.title : r.title + " page"; }
  function drawRequests() {
    var box = document.querySelector("[data-requests]"), list = box && box.querySelector("[data-requests-list]"); if (!list) return;
    // questions first (they are waiting on the client), then open ones, then finished ones; newest first in each
    var rank = function (r) { return r.status === "question" ? 0 : reqClosed(r) ? 2 : 1; }, when = function (r) { return String((reqClosed(r) && r.statusAt) || r.at || ""); };
    var sorted = reqs.slice().sort(function (a, b) { return rank(a) - rank(b) || (when(a) < when(b) ? 1 : when(a) > when(b) ? -1 : 0); });
    var few = Math.max(REQ_SHOWN, sorted.filter(function (r) { return r.status === "question"; }).length);
    var more = document.querySelector("[data-requests-all]");
    if (more) {
      more.hidden = sorted.length <= few; more.textContent = reqAll ? "Show fewer" : "See all " + sorted.length; more.setAttribute("data-tip", reqAll ? "Show only the newest requests" : "Show every request");
      more.onclick = function () { reqAll = !reqAll; drawRequests(); };
    }
    list.textContent = "";
    if (!reqs.length) list.appendChild(h("li", { class: "rq-none", text: "Nothing yet. What you send " + TO + " shows up here, with where it stands." }));
    (reqAll ? sorted : sorted.slice(0, few)).forEach(function (r) {
      var last = r.msgs && r.msgs.length ? r.msgs[r.msgs.length - 1] : null;
      var words = (REQ_WORDS[r.status] || REQ_WORDS["new"]) + (r.status === "done" && r.statusAt ? " " + dayWord(r.statusAt) : "");
      var row = h("li", { class: "rq-row" }, [
        h("b", { text: short(r.text, 110) || (r.photos ? plural(r.photos, "photo") : "A note") }),
        h("span", { class: "rq-tag " + (REQ_WORDS[r.status] ? r.status : "new"), text: words }),
        h("span", { class: "rq-m", text: reqWhere(r) + (r.photos && r.text ? " · " + plural(r.photos, "photo") : "") + (r.at ? " · Sent " + dayWord(r.at) : "") })]);
      if (last) row.appendChild(r.status === "question" && last.by === "sw" ? questionBox(r, last)
        : h("p", { class: "rq-said" }, [h("b", { text: last.by === "sw" ? TO + ": " : "You answered: " }), last.text]));
      list.appendChild(row);
    });
    box.hidden = false;
    drawNav();
  }
  // Stray Wolf's question, with Answer. Answering opens a small box right there.
  function questionBox(r, q) {
    var key = r.batch + ":" + r.n, box = h("div", { class: "rq-q" }, [h("p", {}, [h("b", { text: TO + " asked: " }), q.text])]);
    if (reqOpen !== key) {
      box.appendChild(h("button", { class: "rq-go", type: "button", title: "Write back to " + TO, text: "Answer", onclick: function () {
        reqOpen = key; reqDraft = ""; drawRequests();
        var f = document.querySelector("[data-requests-list] textarea"); if (f) f.focus();
      } }));
      return box;
    }
    var field = h("textarea", { title: "Type your answer", rows: "2", maxlength: "600", "aria-label": "Your answer", placeholder: "Type your answer", oninput: function () { reqDraft = field.value; } });
    field.value = reqDraft;
    var err = h("p", { class: "rq-err", role: "alert", hidden: true });
    var send = h("button", { class: "rq-go", type: "button", title: "Send your answer to " + TO, text: "Send answer", onclick: function () {
      var text = field.value.trim(); if (!text) { field.focus(); return; }
      send.disabled = true; err.hidden = true;
      (DEMO ? Promise.resolve({ ok: true }) : api("/api/my-request/answer", { token: getToken(), body: { batch: r.batch, n: r.n, text: text } })).then(function (d) {
        if (!d.ok) {
          send.disabled = false; err.hidden = false;
          err.textContent = d.status === 401 ? "Your login timed out. Log in again to answer." : d.status === 0 ? d.error : "That didn't send. Try again in a minute.";
          return;
        }
        // show it right away; the next load brings the saved copy
        reqOpen = null; reqDraft = ""; r.status = "working"; r.msgs = (r.msgs || []).concat([{ by: "client", text: text, at: new Date().toISOString() }]);
        drawRequests(); toast("Sent. " + TO + " has your answer.");
        if (!DEMO) loadRequests();
      });
    } });
    box.classList.add("open");
    box.append(field, err, send, h("button", { class: "rq-no", type: "button", title: "Close without answering", text: "Cancel", onclick: function () { reqOpen = null; reqDraft = ""; drawRequests(); } }));
    return box;
  }
  // Demo only: a few made-up requests, one of them waiting on an answer.
  function demoRequests() {
    var now = Date.now(), ago = function (days) { return new Date(now - days * 864e5).toISOString(); };
    return { ok: true, requests: [
      { batch: "demo3", n: 1, at: ago(1), title: "Events", on: "", text: "Add the dates for the spring sale", photos: 0, status: "working", statusAt: ago(1), msgs: [] },
      { batch: "demo2", n: 1, at: ago(3), title: "Home", on: "", text: "Swap the photo at the top for the new group picture", photos: 0, status: "question", statusAt: ago(2),
        msgs: [{ by: "sw", text: "Which group photo, the one outside or the one at the desk?", at: ago(2) }] },
      { batch: "demo2", n: 2, at: ago(3), title: "Client Portal", on: "Photos", text: "", photos: 3, status: "new", statusAt: ago(3), msgs: [] },
      { batch: "demo1", n: 1, at: ago(6), title: "Client Portal", on: "Contact info", text: "New email address for the office", photos: 0, status: "done", statusAt: ago(5),
        msgs: [{ by: "sw", text: "Updated. It shows on your Contact page now.", at: ago(5) }] },
      { batch: "demo1", n: 2, at: ago(6), title: "About", on: "", text: "Add a map of every job this year", photos: 0, status: "declined", statusAt: ago(5),
        msgs: [{ by: "sw", text: "That needs its own page. Pick a time under Let's talk to go over it.", at: ago(5) }] } ] };
  }

  // "Messages from your website" on their page ([data-form-portal]): everything people send with the form on their
  // website, when its form sends to the notes service, as a short inbox. Each row is one message: who, what they
  // want and when, with a dot while it's new. Reply opens their email; the small buttons call, mark it replied, or
  // delete it (one tap, with Undo). A tap on the row opens every answer and file. Tick rows (or Select all) to mark
  // or delete several at once. Each message was also emailed to them, so this is the copy they can come back to
  // (kept a year), and "Emails go to" is where those emails go, theirs to change. Stray Wolf switches the form on
  // in the admin and never reads these. Its page has the heading; the line under it
  // ([data-form-count]) says how many. Form off: no Messages page.
  var FP_SHOWN = 6;
  // the form and its messages; all shown; rows opened; rows ticked; rows deleted but still undoable; "Emails go to" being changed (and what's typed)
  var fpForm = null, fpLeads = [], fpAll = false, fpOpen = {}, fpPick = {}, fpGone = {}, fpEditTo = false, fpTyped = null;
  function fpList() { return fpLeads.filter(function (l) { return !fpGone[l.id]; }); }
  function fpNew() { return fpForm && fpForm.state === "on" ? fpList().filter(function (l) { return l.status !== "replied"; }).length : 0; }
  function formCall(path, body) { return DEMO ? Promise.resolve(demoFormCall(path, body || {})) : api("/api/my-form" + path, { token: getToken(), body: body || {} }); }
  function loadForm() {
    if (!document.querySelector("[data-form-portal]")) return;
    formCall("").then(function (d) {
      asked.messages = d && d.status === 0 ? -1 : 1;
      if (d && d.ok && d.form) { fpForm = d.form; fpLeads = Array.isArray(d.leads) ? d.leads : []; }
      drawForm();
    });
  }
  function fpWho(l) { return l.name || l.email || l.phone || "Someone"; }
  function fpTrouble(d, what) { return d.status === 401 ? "Your login timed out. Log in again to " + what + "." : d.status === 0 ? d.error : d.error || "That didn't " + what + ". Try again in a minute."; }
  // Their answers, less the name, email and phone (shown on their own). What they want is picked the same way
  // as in the email's subject: a "type of project" or "service" answer.
  function fpDetails(l) {
    var used = [l.name, l.email, l.phone].filter(Boolean).map(function (v) { return String(v).toLowerCase(); });
    return (Array.isArray(l.fields) ? l.fields : []).filter(function (f) { return used.indexOf(String(f[1]).toLowerCase()) < 0; });
  }
  function fpWant(details) { var w = details.filter(function (f) { return /type|service|interest|looking for|what/i.test(f[0]); })[0]; return w ? w[1] : ""; }

  function drawForm() {
    var box = document.querySelector("[data-form-portal]"); if (!box) return;
    if (!fpForm || fpForm.state === "off") { box.hidden = true; drawNav(); return; }
    box.className = "fp"; box.textContent = "";
    var all = fpList(), n = fpNew();
    Object.keys(fpPick).forEach(function (id) { if (!all.some(function (l) { return l.id === id; })) delete fpPick[id]; });
    var count = document.querySelector("[data-form-count]");
    if (count) count.textContent = all.length ? (n ? n + " new · " : "") + plural(all.length, "message") + ". Each one was also emailed to you." : "What people send with the form on your website. Each one is also emailed to you.";
    if (fpForm.state === "test") box.appendChild(h("p", { class: "fp-test", text: TO + " is testing your website's form, so messages aren't coming to you yet. Once it's switched on, they'll be emailed to you and listed here." }));
    if (!all.length) box.appendChild(h("p", { class: "fp-none", text: fpForm.state === "on" ? "No messages yet. When someone fills in the form on your website, it shows up here and in your email." : "Nothing here yet." }));
    else {
      box.appendChild(fpBar(all));
      var list = h("ul", { class: "fp-list", "aria-label": "Messages, newest first" });
      (fpAll ? all : all.slice(0, FP_SHOWN)).forEach(function (l) { list.appendChild(fpRow(l)); });
      box.appendChild(list);
      if (all.length > FP_SHOWN) box.appendChild(h("p", { class: "fp-more" }, [h("button", { type: "button", title: fpAll ? "Show only the newest messages" : "Show every message", text: fpAll ? "Show fewer" : "See all " + all.length + " messages", onclick: function () { fpAll = !fpAll; drawForm(); } })]));
    }
    box.appendChild(fpToBox());
    box.hidden = false;
    drawNav();
  }
  // Above the list: Select all, and once rows are ticked, what to do with them.
  function fpBar(all) {
    var ids = Object.keys(fpPick), every = ids.length === all.length;
    var tick = h("input", { type: "checkbox", title: "Select every message", id: "fp-all", onchange: function () { fpPick = {}; if (tick.checked) all.forEach(function (l) { fpPick[l.id] = true; }); drawForm(); } });
    tick.checked = every; tick.indeterminate = ids.length > 0 && !every;
    var bar = h("div", { class: "fp-bar" + (ids.length ? " on" : "") }, [h("label", { class: "fp-sel", for: "fp-all" }, [tick, h("span", { text: ids.length ? ids.length + " selected" : "Select all" })])]);
    if (ids.length) {
      var picked = all.filter(function (l) { return fpPick[l.id]; }), fresh = picked.some(function (l) { return l.status !== "replied"; });
      bar.append(h("button", { class: "fp-b", type: "button", title: fresh ? "Mark the selected messages as replied" : "Mark the selected messages as new again", onclick: function () { fpMark(picked, fresh ? "replied" : "new"); } }, [icon(fresh ? "check" : "mail"), h("span", { text: fresh ? "Mark replied" : "Mark as new" })]),
        h("button", { class: "fp-b del", type: "button", title: "Delete the selected messages (you can undo)", onclick: function () { fpDelete(ids); } }, [icon("trash"), h("span", { text: every && all.length > 1 ? "Delete all " + all.length : "Delete" })]),
        h("button", { class: "fp-link", type: "button", title: "Clear the selection", text: "Cancel", onclick: function () { fpPick = {}; drawForm(); } }));
    }
    return bar;
  }
  function fpRow(l) {
    var open = !!fpOpen[l.id], fresh = l.status !== "replied", files = Array.isArray(l.files) ? l.files : [];
    var details = fpDetails(l), want = fpWant(details), rest = details.filter(function (f) { return f[1] !== want; }).map(function (f) { return f[1]; }).join(" · ");
    var kind = l.title ? l.title.charAt(0).toUpperCase() + l.title.slice(1) : "Message", tel = l.phone ? String(l.phone).replace(/[^\d+]/g, "") : "";
    var pick = h("input", { type: "checkbox", title: "Select this message", class: "fp-pick", "aria-label": "Select the message from " + fpWho(l), onchange: function () { if (pick.checked) fpPick[l.id] = true; else delete fpPick[l.id]; drawForm(); } });
    pick.checked = !!fpPick[l.id];
    var main = h("button", { class: "fp-main", type: "button", "aria-expanded": open ? "true" : "false", title: open ? "Close this message" : "Open this message to see every answer and file", onclick: function () { fpOpen[l.id] = !open; drawForm(); } }, [
      h("span", { class: "fp-l1" }, [
        h("span", { class: "fp-dot", title: fresh ? "New: not replied to yet" : null }, [fresh ? h("span", { class: "vh", text: "New: " }) : null]),
        h("b", { text: fpWho(l) }),
        h("span", { class: "fp-kind", text: kind }),
        files.length ? h("span", { class: "fp-clip", title: plural(files.length, "file") + " attached" }, [icon("clip"), String(files.length)]) : null,
        l.mail && l.mail.ok === false && l.mail.why !== "off" ? h("span", { class: "fp-bad", text: "Not emailed", title: "This one couldn't be emailed to you, so it's only here." }) : null,
        h("time", { datetime: l.at || "", text: l.at ? dayWord(l.at) : "" })]),
      h("span", { class: "fp-l2" }, [want ? h("span", { class: "fp-want", text: want }) : null, rest ? h("span", { text: (want ? " · " : "") + rest }) : null])]);
    var acts = h("div", { class: "fp-acts" }, [
      l.email ? h("a", { class: "fp-b main", href: "mailto:" + l.email + "?subject=" + encodeURIComponent("Re: your " + (l.title || "message")), title: "Write back to " + l.email }, [icon("reply"), h("span", { text: "Reply" })])
        : tel ? h("a", { class: "fp-b main", href: "tel:" + tel, title: "Call " + l.phone }, [icon("phone"), h("span", { text: "Call" })]) : null,
      l.email && tel ? h("a", { class: "fp-i", href: "tel:" + tel, title: "Call " + l.phone, "aria-label": "Call " + l.phone }, [icon("phone")]) : h("span", { class: "fp-i", "aria-hidden": "true" }),   // keeps the buttons lined up row to row
      h("button", { class: "fp-i" + (fresh ? "" : " done"), type: "button", title: fresh ? "Mark as replied" : "Replied. Tap to mark it new again", "aria-label": fresh ? "Mark as replied" : "Mark as new again", onclick: function () { fpMark([l], fresh ? "replied" : "new"); } }, [icon("check")]),
      h("button", { class: "fp-i del", type: "button", title: "Delete this message (you can undo)", "aria-label": "Delete the message from " + fpWho(l), onclick: function () { fpDelete([l.id]); } }, [icon("trash")])]);
    var row = h("li", { class: "fp-row" + (fresh ? " fresh" : "") + (open ? " open" : "") + (fpPick[l.id] ? " picked" : "") }, [pick, main, acts]);
    if (open) {
      var body = h("div", { class: "fp-body" });
      var reach = [l.email ? h("a", { title: "Write to " + l.email, href: "mailto:" + l.email }, [icon("mail"), l.email]) : null, tel ? h("a", { title: "Call " + l.phone, href: "tel:" + tel }, [icon("phone"), l.phone]) : null].filter(Boolean);
      if (reach.length) body.appendChild(h("p", { class: "fp-reach" }, reach));
      var dl = h("dl", { class: "fp-ans" });
      details.forEach(function (f) { dl.append(h("dt", { text: f[0] }), h("dd", { text: f[1] })); });
      if (details.length) body.appendChild(dl);
      if (files.length) body.appendChild(h("div", { class: "fp-files" }, files.map(function (f) {
        var pic = /^image\/(jpeg|png|webp)$/.test(f.type || "");
        return h("a", { href: f.url, target: "_blank", rel: "noopener", title: "Open " + f.name }, [pic ? h("img", { src: f.url, alt: "", loading: "lazy" }) : h("span", { class: "doc", text: /pdf/.test(f.type || "") ? "PDF" : "FILE" }), short(f.name, 28)]);
      })));
      body.appendChild(h("p", { class: "fp-when", text: "Sent " + (l.at ? new Date(l.at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "") + " from your website's " + (l.title || "form") + "." }));
      row.appendChild(body);
    }
    return row;
  }
  // Replied or new, for one row or every ticked one. It shows at once and goes back if the service says no.
  function fpMark(leads, status) {
    var change = leads.filter(function (l) { return l.status !== status; }), was = change.map(function (l) { return l.status; });
    change.forEach(function (l) { l.status = status; }); fpPick = {}; drawForm();
    Promise.all(change.map(function (l) { return formCall("/lead", { id: l.id, status: status }); })).then(function (rs) {
      var bad = rs.filter(function (d) { return !d.ok; }); if (!bad.length) return;
      rs.forEach(function (d, i) { if (!d.ok) change[i].status = was[i]; }); drawForm(); toast(fpTrouble(bad[0], "save"));
    });
  }
  // Delete takes one tap: the rows go at once, and Undo in the message at the top brings them back. They're
  // deleted for good (with their files) once that message is gone.
  function fpDelete(ids) {
    ids.forEach(function (id) { fpGone[id] = true; delete fpPick[id]; delete fpOpen[id]; });
    drawForm();
    toast(ids.length === 1 ? "Message deleted." : plural(ids.length, "message") + " deleted.", {
      undo: function () { ids.forEach(function (id) { delete fpGone[id]; }); drawForm(); },
      after: function () {
        Promise.all(ids.map(function (id) { return formCall("/lead/delete", { id: id }); })).then(function (rs) {
          var bad = rs.filter(function (d) { return !d.ok; });
          ids.forEach(function (id, i) { delete fpGone[id]; if (rs[i].ok) fpLeads = fpLeads.filter(function (l) { return l.id !== id; }); });
          drawForm(); if (bad.length) toast(fpTrouble(bad[0], "delete"));
        });
      } });
  }
  // Where the emails go: the client's own choice, one line until they change it. A new address gets a short email at once.
  function fpToBox() {
    var to = (fpForm.to || []).join(", ");
    if (!fpEditTo && to) return h("div", { class: "fp-to" }, [icon("mail"), h("span", { class: "fp-to-k", text: "Emails go to" }), h("b", { text: to }),
      h("button", { class: "fp-link", type: "button", text: "Change", title: "Change where your website's form emails go", onclick: function () { fpEditTo = true; drawForm(); var i = document.getElementById("fp-to"); if (i) i.focus(); } })]);
    var input = h("input", { id: "fp-to", title: "The email address your website's form sends to", type: "text", autocomplete: "off", spellcheck: "false", "aria-describedby": "fp-to-help", placeholder: "you@yourbusiness.com",
      oninput: function () { fpTyped = input.value; } });
    input.value = fpTyped != null ? fpTyped : to;
    var err = h("p", { class: "err", role: "alert", hidden: true });
    var save = h("button", { class: "fp-b main", type: "button", title: "Save this email address", text: "Save", onclick: function () {
      save.disabled = true; err.hidden = true;
      formCall("/to", { to: input.value }).then(function (d) {
        save.disabled = false;
        if (!d.ok) { err.textContent = fpTrouble(d, "save"); err.hidden = false; return; }
        fpForm = d.form; fpTyped = null; fpEditTo = false; drawForm();
        toast(d.added && d.added.length ? (d.mail && d.mail.ok === false ? "Saved, but the hello email to " + d.added.join(", ") + " didn't go. Check the address." : "Saved. " + d.added.join(", ") + " just got a short email from your website.") : "Saved.");
      });
    } });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") save.click(); });
    return h("div", { class: "fp-to edit" }, [h("label", { for: "fp-to", text: "Form emails go to" }),
      h("div", { class: "row" }, [input, save, to ? h("button", { class: "fp-link", type: "button", title: "Keep the address as it was", text: "Cancel", onclick: function () { fpEditTo = false; fpTyped = null; drawForm(); } }) : null]), err,
      h("small", { id: "fp-to-help", text: "One or more addresses, separated by commas, for example you@yourbusiness.com, office@yourbusiness.com. A newly added address gets a short email right away, so you'll know it works." })]);
  }
  // Demo only: a form that is on, with three made-up messages.
  function demoFormCall(path, b) {
    var at = function (hours) { return new Date(Date.now() - hours * 36e5).toISOString(); };
    var D = demoFormCall.d || (demoFormCall.d = { form: { state: "on", to: ["owner@example.com"] }, leads: [
      { id: "demo-3", at: at(3), title: "estimate request", name: "Sarah Mills", email: "sarah@example.com", phone: "423-555-0101", status: "new",
        fields: [["Name", "Sarah Mills"], ["Phone", "423-555-0101"], ["Email", "sarah@example.com"], ["Project type", "Drainage"], ["Project details", "Water pools by the garage after every rain.\nAbout 30 feet of the yard slopes toward it."]],
        files: [{ name: "garage-side.jpg", type: "image/jpeg", url: demoPic("demo-3a") }, { name: "back-yard.jpg", type: "image/jpeg", url: demoPic("demo-3b") }] },
      { id: "demo-2", at: at(27), title: "estimate request", name: "Dale Turner", email: "dale@example.com", phone: "", status: "new",
        fields: [["Name", "Dale Turner"], ["Email", "dale@example.com"], ["Project type", "Shed pad"], ["Project details", "12 by 16 shed going in next month. Yard is mostly flat."]], files: [] },
      { id: "demo-1", at: at(50), title: "estimate request", name: "Ray Fox", email: "", phone: "423-555-0177", status: "replied",
        fields: [["Name", "Ray Fox"], ["Phone", "423-555-0177"], ["Project type", "Gravel driveway"], ["Project details", "About 120 feet, mostly washed out."]], files: [] }] });
    if (path === "") return { ok: true, form: D.form, leads: D.leads };
    if (path === "/to") { var to = String(b.to || "").toLowerCase().split(/[\s,;]+/).filter(Boolean), added = to.filter(function (x) { return D.form.to.indexOf(x) < 0; });
      if (!to.length) return { ok: false, status: 400, error: "The form is on, so it needs at least one address to send to." };
      D.form.to = to; return { ok: true, form: D.form, added: added, mail: { ok: true } }; }
    if (path === "/lead") return { ok: true };
    if (path === "/lead/delete") { D.leads = D.leads.filter(function (x) { return x.id !== b.id; }); return { ok: true }; }
    return { ok: false, status: 404, error: "Not found." };
  }

  // Business info on their page: the boxes marked data-info ("hours", "contact", "social") open the business info
  // editor (kit/info/editor.js, the same screen as Stray Wolf's admin) as a page over the portal. What is saved there
  // is what their website shows, within a minute; nothing goes to Stray Wolf as a request. info.js (the hours logic
  // the website itself uses), info-editor.js and info-editor.css sit next to this file. Until they have loaded, and
  // on SW Core before 2.5, the boxes stay note boxes.
  var INFO_FILES = "1";   // bump with every change to info.js, info-editor.js or info-editor.css
  var infoNow = null, infoDemo = null;
  function infoBox(part) { return MODE === "hub" ? document.querySelector('[data-info="' + part + '"]') : null; }
  // "Email=a@b.com|Phone=555" (data-note-now) or "Email|Phone=For example..." (data-note-fields) as {Email: "a@b.com"}.
  function infoPairs(box, name) {
    var out = {};
    ((box && box.getAttribute(name)) || "").split("|").forEach(function (p) { var k = p.indexOf("="); if (p) out[k < 0 ? p : p.slice(0, k)] = k < 0 ? "" : p.slice(k + 1); });
    return out;
  }
  // What is typed into the website today, read from the boxes: the editor shows it until something is saved in its place.
  function infoTyped() {
    var typed = { contact: {}, social: infoPairs(infoBox("social"), "data-note-now") }, was = infoPairs(infoBox("contact"), "data-note-now");
    Object.keys(was).forEach(function (k) { typed.contact[k.toLowerCase()] = was[k]; });
    var week = ((infoBox("hours") && infoBox("hours").getAttribute("data-info-typed")) || "").split(",");
    if (week.length === 7) typed.hours = week.map(function (d) { var m = /^(\d\d:\d\d)-(\d\d:\d\d)$/.exec(d.trim()); return m ? { open: m[1], close: m[2] } : null; });
    return typed;
  }
  function loadInfo() {
    if (!document.querySelector("[data-info]")) return;
    var typed = infoTyped();
    var got = DEMO ? Promise.resolve({ ok: true, info: { tz: "America/Chicago", hours: typed.hours || null, special: [], contact: {}, social: [], history: [] } }) : api("/api/my-info", { token: getToken() });
    got.then(function (d) {
      if (!d || !d.ok || !d.info) return;
      infoFiles().then(function (ok) {
        if (!ok) return;
        infoNow = d.info; if (DEMO) infoDemo = SWInfoEditor.demo(d.info);
        SWInfoEditor.fill(document, infoNow); drawNav();
      });
    });
  }
  // The editor's files, from the folder this file came from: info.js first, the editor needs it.
  function infoFiles() {
    if (window.SWInfoEditor) return Promise.resolve(true);
    var at = function (f) { return new URL(f + "?v=" + INFO_FILES, S.src).href; };
    var add = function (el) { return new Promise(function (done) { el.onload = function () { done(true); }; el.onerror = function () { done(false); }; document.head.appendChild(el); }); };
    return Promise.all([add(h("link", { rel: "stylesheet", href: at("info-editor.css") })), add(h("script", { src: at("info.js") }))])
      .then(function (r) { return r[0] && r[1] && add(h("script", { src: at("info-editor.js") })); })
      .then(function (ok) { return !!ok && !!window.SWInfoEditor; });
  }
  function openInfo(box) {
    var names = function (part) { return Object.keys(infoPairs(infoBox(part), "data-note-fields")); };
    SWInfoEditor.open(box.getAttribute("data-info"), { info: infoNow, mode: "portal", name: NAME, typed: infoTyped(), back: pageOn ? pageName(pageOn) : "",
      title: (infoBox("hours") && infoBox("hours").getAttribute("data-area")) || "", socials: names("social"),
      fields: names("contact").map(function (k) { return k.toLowerCase(); }).filter(function (k) { return /^(phone|email|address|area)$/.test(k); }),
      call: function (path, body) { return infoDemo ? infoDemo.call(path, body) : api("/api/my-info" + path, { token: getToken(), body: body }); },
      onChange: function (info) { infoNow = info; SWInfoEditor.fill(document, info); drawNav(); } });
  }

  // "Your shop" on their page ([data-shop-portal]): what their website sells (kit/shop draws it there). It is the shop
  // manager, the same screen Stray Wolf uses in the admin; shop-manager.js and .css sit next to this file and are
  // fetched only for a client who has a shop. Search, prices typed in the row, up to 5 photos an item found on their
  // own website, sales, options, many items at once, and Changes with Undo. Every Buy button opens the item's own
  // checkout link, so no payment ever comes through here. Stray Wolf starts the shop, imports into it and picks its
  // kind of checkout in the admin. No shop: no Shop page.
  var SHOP_FILES = "7";   // bump with every change to shop-manager.js or .css, so browsers and phones fetch the new copy
  var spShop = null, spMgr = null, spDemo = null, spPics = {};
  function loadShop() {
    var box = document.querySelector("[data-shop-portal]"); if (!box || spMgr) return;
    (DEMO ? Promise.resolve({ ok: true, shop: demoShop(), today: new Date().toLocaleDateString("en-CA") }) : api("/api/my-shop", { token: getToken() })).then(function (d) {
      asked.shop = d && d.status === 0 ? -1 : 1;
      if (!d || !d.ok || !d.shop || !Array.isArray(d.shop.items)) { drawNav(); return; }
      spShop = d.shop; box.hidden = false; drawNav();
      // SW Core before 2.2 sends no date with the shop, and the manager needs its newer calls.
      if (!d.today) { shopNote(box, "Your shop is getting an update. Check back in a few minutes."); return; }
      shopFiles().then(function (ok) { if (ok) mountShop(box, d); else shopNote(box, "Your shop didn't load. Check your internet, then reload this page."); });
    });
  }
  function shopNote(box, text) { (box.querySelector("[data-shop-list]") || box).replaceChildren(h("p", { class: "sp-none", text: text })); }
  // The manager's two files, from the folder this file came from.
  function shopFiles() {
    if (window.SWShopManager) return Promise.resolve(true);
    var at = function (f) { return new URL(f + "?v=" + SHOP_FILES, S.src).href; };
    var add = function (el) { return new Promise(function (done) { el.onload = function () { done(true); }; el.onerror = function () { done(false); }; document.head.appendChild(el); }); };
    return Promise.all([add(h("link", { rel: "stylesheet", href: at("shop-manager.css") })), add(h("script", { src: at("shop-manager.js") }))])
      .then(function (r) { return r[0] && r[1] && !!window.SWShopManager; });
  }
  function mountShop(box, d) {
    if (DEMO) spDemo = SWShopManager.demo(JSON.parse(JSON.stringify(d.shop)), demoPic);   // its own copy, as the service's is
    var photos = h("button", { class: "swm-btn plain", type: "button", title: "Every item's photos in one .zip file, each named after its item", onclick: function () { shopPhotos(this); } },
      [icon("download", 15), h("span", { text: "Photos" })]);
    spMgr = SWShopManager.mount(box.querySelector("[data-shop-list]") || box, { mode: "portal", shop: d.shop, today: d.today, site: SITE, name: NAME,
      call: function (path, body) { return spDemo ? spDemo.call(path, body) : api("/api/my-shop" + path, { token: getToken(), body: body }); },
      upload: function (query, file) { return spDemo ? spDemo.upload(query, file) : api("/api/my-shop/photo" + query, { token: getToken(), raw: file, type: file.type }); },
      image: shopImage, extra: [photos], onChange: function (shop) { spShop = shop; drawNav(); } });
    // The open item's title stays under their page's sticky header.
    var head = document.querySelector(".sw-head"), fit = function () { box.style.setProperty("--swm-top", (head ? head.offsetHeight : 0) + "px"); };
    fit(); window.addEventListener("resize", fit);
  }
  // A photo for the manager ("/api/shop/pic?key=..." or a website photo through "/api/shop/peek?..."), read as a file
  // so their page's policy never needs SW Core's address for images, and kept for Photos below.
  function shopImage(path) {
    return spPics[path] = spPics[path] || (spDemo ? Promise.resolve(spDemo.image(path))
      : fetch(API + path).then(function (r) { return r.ok ? r.blob() : null; }).then(function (b) { return b ? keepBlob(b) : ""; }, function () { return ""; }));
  }
  // Photos: every item's photos in one .zip, each named after its item ("Plant Bar", "Plant Bar 2", ...).
  function shopPhotos(btn) {
    var all = [];
    spShop.items.forEach(function (x) { (x.photos || []).forEach(function (p, i) { all.push({ title: x.name + (i ? " " + (i + 1) : ""), src: shopImage("/api/shop/pic?key=" + encodeURIComponent(p.key)) }); }); });
    if (!all.length) { toast("No photos yet. Add them to your items first."); return; }
    downloadAll(all, fileName((NAME || "your") + " shop photos", "zip"), btn);
  }
  // Demo only: a made-up bakery with a Square shop, kept in this page and answered by the manager's own demo.
  function demoShop() {
    var two = function (n) { return (n < 10 ? "0" : "") + n; };
    var d = function (n, hr) { var t = new Date(Date.now() + n * 864e5); return t.getFullYear() + "-" + two(t.getMonth() + 1) + "-" + two(t.getDate()) + "T" + two(hr) + ":00"; };
    var pics = function (name, keys) { return keys.map(function (k, i) { return { key: k, alt: i ? name + ", another view" : name }; }); };
    return { checkout: "square", updated: new Date(Date.now() - 2 * 36e5).toISOString(), by: "sw", history: [], items: [
      { id: "s1", name: "Sourdough loaf", kind: "item", cat: "Bread", desc: "Baked Friday mornings.", price: 900, sqPrice: 900, show: "live", link: "https://square.link/u/demo1", photos: pics("Sourdough loaf", ["demo1", "demo2"]), tag: "featured" },
      { id: "s2", name: "Rye sandwich loaf", kind: "item", cat: "Bread", desc: "", price: 1000, show: "live", link: "https://square.link/u/demo2", photos: pics("Rye sandwich loaf", ["demo3"]) },
      { id: "s3", name: "Pecan pie", kind: "item", cat: "Holiday", desc: "Order by Nov 24.", price: 3600, sale: { price: 3200 }, sqPrice: 3000, show: "live", link: "https://square.link/u/demo3", photos: pics("Pecan pie", ["demo4"]),
        options: [{ name: "Size", choices: [{ name: "9 inch" }, { name: "Mini, box of 4", price: 2400 }] }] },
      { id: "s4", name: "Gift card, $25", kind: "item", cat: "Holiday", desc: "", price: 2500, show: "hidden", link: "", photos: [] },
      { id: "s5", name: "Bread baking class", kind: "class", cat: "Classes", desc: "", price: 6500, show: "live", when: d(12, 10), seats: "8 seats", link: "https://square.link/u/demo5", photos: pics("Bread baking class", ["demo5"]), tag: "new" },
      { id: "s6", name: "Holiday cookie class", kind: "class", cat: "Classes", desc: "", price: 4500, show: "sold", when: d(20, 14), seats: "Full", link: "https://square.link/u/demo6", photos: pics("Holiday cookie class", ["demo2"]) } ] };
  }

  // Photos dragged from the computer straight onto a box on their page: the box lights up
  // ("Drop photos here"), and letting go opens that box's note with the photos already in it.
  // A drop anywhere else never makes the browser leave the page.
  function dropOnBoxes() {
    var lit = null;
    var light = function (box) { if (lit === box) return; if (lit) lit.classList.remove("swn-drop"); lit = box; if (box) box.classList.add("swn-drop"); };
    var boxAt = function (e) { return !st.sent && !els.note && !els.veil && e.target.closest ? e.target.closest("[data-note-box]") : null; };
    document.addEventListener("dragover", function (e) { if (!hasFiles(e)) return; e.preventDefault(); var b = boxAt(e); e.dataTransfer.dropEffect = b || els.note ? "copy" : "none"; light(b); });
    document.addEventListener("dragleave", function (e) { if (!e.relatedTarget) light(null); });
    document.addEventListener("drop", function (e) {
      if (!hasFiles(e)) return; e.preventDefault();
      var b = boxAt(e), list = e.dataTransfer.files; light(null);
      if (b && b.hasAttribute("data-photos-page")) { openPhotos(); addPictures(list); }
      else if (b) { addNote(b, b.getAttribute("data-area") || null); addPictures(list); }
      else if (els.note) addPictures(list);
    });
  }

  function goEdit(url) {
    if (!url || url === "soon") { toast("Your mockup isn't ready yet. " + TO + " will let you know when it is."); return; }
    lsSet("on", "1"); location.href = url;
  }
  function exitEdit() {                       // back to their own page; notes stay saved
    lsSet("on", null); location.href = LOGIN_URL;
  }
  function askLogOut() {
    panel = "off";
    var n = st.sent ? 0 : st.notes.length;
    var stay = h("button", { class: "b plain", type: "button", title: "Close this and keep working", text: "Stay logged in", onclick: function () { closePanels(); render(); } });
    veil(h("div", { class: "card", role: "dialog", "aria-label": "Log out" }, [
      h("div", { class: "hd" }, [h("div", { class: "grow" }, [h("h2", { text: "Log out?" }),
        h("p", { text: (n ? "Your " + plural(n, "note") + " will stay saved on this device. " : "") + "To come back, open this page again and type your password." })])]),
      h("div", { class: "ft" }, [
        stay,
        h("button", { class: "b main push", type: "button", title: "Log out on this device", onclick: function () { endSession(); location.reload(); } }, [icon("power"), h("span", { text: "Log out" })])
      ])
    ]), { focus: stay });
  }

  /* =========================================================== start */

  function start() {
    els.file = h("input", { type: "file", accept: "image/*", multiple: true, hidden: true, onchange: function () { addPictures(els.file.files); els.file.value = ""; } });
    els.pins = h("div");
    els.ghost = h("div", { class: "ghost", hidden: true, "aria-hidden": "true" }, [h("span", { class: "pin", text: "+" }), h("span", { class: "tip" }, [h("span", { text: "Click to place your note" }), h("small", { text: "Esc cancels" })])]);
    els.frame = h("div", { class: "frame", "aria-hidden": "true", hidden: MODE !== "edit" });
    var helpBtn = h("button", { type: "button", title: "See how this works", onclick: function () { showHelp(false); } }, [icon("help"), h("span", { text: "Help" })]);
    var strip = MODE === "edit"
      ? h("div", { class: "strip" }, [h("div", { class: "strip-in" }, [
          h("span", { class: "lbl" }, [h("span", { class: "dot" }), h("span", { text: "Edit mode is on" })]),
          h("span", { class: "sub", text: "· Your website isn't changing" }),
          h("span", { class: "gap" }), helpBtn,
          h("button", { type: "button", title: "Leave Edit mode. Your notes are kept.", onclick: exitEdit }, [icon("power"), h("span", { class: "lg", text: "Exit edit mode" }), h("span", { class: "sm", text: "Exit" })])
        ])])
      : h("div", { class: "strip hub" }, [h("div", { class: "strip-in" }, [
          h("span", { class: "lbl" }, [icon("lock"), h("span", { class: "lg", text: "You're logged in" }), h("span", { class: "sm", text: "Logged in" })]),
          h("span", { class: "sub", text: "· Only you can see this page" }),
          h("span", { class: "gap" }), helpBtn,
          h("button", { type: "button", title: "Log out of your Client Portal", onclick: askLogOut }, [icon("power"), h("span", { text: "Log out" })])
        ])]);
    els.say = h("div", { class: "say", "aria-live": "polite" });
    els.btns = h("div", { class: "btns" });
    // Their own page can hold Help and Log out up in its header ([data-portal-actions]). Then there's no
    // bar at the bottom at all until they have a note to send.
    var slot = MODE === "hub" && document.querySelector("[data-portal-actions]");
    if (slot) {
      els.bare = true;
      slot.textContent = "";
      if (bookingUrl()) slot.appendChild(h("button", { class: "talk", type: "button", "data-talk": "", title: "Pick a time to talk with " + TO + " about your website" }, [icon("calendar"), h("span", { text: "Let's talk" })]));
      slot.append(h("button", { type: "button", title: "See how this works", onclick: function () { showHelp(false); } }, [icon("help"), h("span", { text: "Help" })]),
                  h("button", { type: "button", title: "Log out of your Client Portal", onclick: askLogOut }, [icon("power"), h("span", { text: "Log out" })]));
    }
    els.dock = h("div", { class: "dock " + MODE }, [strip, h("div", { class: "dock-main" }, [h("div", { class: "dock-in" }, [els.say, els.btns])])]);
    [els.pins, els.ghost, els.frame, els.dock, els.file].forEach(function (e) { layer.appendChild(e); });

    // room at the bottom of the page so the dock never hides the footer, and cross hairs while placing a note
    addCss(document, "html.swn-pick,html.swn-pick *{cursor:crosshair!important}html.swn-still{overflow:hidden!important}");
    document.body.appendChild(els.spacer = h("div", { "aria-hidden": "true", "data-site-notes-spacer": "", style: "height:150px" }));
    document.body.appendChild(host);

    // While picking, a tap marks that spot instead of doing what it normally does.
    var inUs = function (e) { var p = e.composedPath ? e.composedPath() : []; return p.indexOf(host) >= 0; };
    document.addEventListener("click", function (e) {
      if (inUs(e)) return;
      if (MODE === "hub" && e.target.closest && e.target.closest("[data-note-box] a[download]")) return;   // a box's Download link (their logo) just downloads
      var talk = MODE === "hub" && !els.veil && e.target.closest && e.target.closest("[data-talk]");
      if (talk) { e.preventDefault(); letsTalk(); return; }
      var em = MODE === "hub" && !els.veil && e.target.closest && e.target.closest("[data-edit-mode]");
      if (em) { e.preventDefault(); goEdit(em.getAttribute("data-edit-mode") || em.getAttribute("href") || "/"); return; }
      // A photo with data-big (the Photos box on their page) opens bigger instead of starting a note.
      var big = MODE === "hub" && !picking && !els.note && !els.veil && e.target.closest && e.target.closest("[data-big]");
      if (big) { e.preventDefault(); e.stopPropagation(); showPhoto(big); return; }
      // A business info box (hours, contact info, social pages) opens its editor, once that has loaded.
      var ib = MODE === "hub" && infoNow && !els.note && !els.veil && e.target.closest && e.target.closest("[data-info]");
      if (ib) { e.preventDefault(); openInfo(ib); return; }
      // Boxes made for notes (like on the welcome page) open a note with one tap, no "Add a note" first.
      var box = !picking && !st.sent && !els.note && !els.veil && e.target.closest && e.target.closest("[data-note-box]");
      // A box that carries the booking page (an older page's Let's talk box) opens that instead of a note.
      if (box && (box.getAttribute("data-booking-url") || "").trim()) { e.preventDefault(); letsTalk(); return; }
      if (box && box === photosBox()) { e.preventDefault(); openPhotos(); return; }   // the Photos box opens the Photos page
      if (box) { e.preventDefault(); addNote(box, box.getAttribute("data-area") || null, e); return; }
      if (!picking) return;
      e.preventDefault(); e.stopPropagation();
      var t = targetOf(e.target) || (e.target && e.target.nodeType === 1 ? e.target : null);
      stopPicking();
      if (!t || t === document.body || t === document.documentElement) addNote(null, "This page");
      else addNote(t, null, e);
    }, true);
    ["mousedown", "pointerdown", "submit"].forEach(function (n) { document.addEventListener(n, function (e) { if (picking && !inUs(e) && n === "submit") e.preventDefault(); }, true); });
    document.addEventListener("mousemove", function (e) { if (!picking || !canHover) return; if (inUs(e)) return hideGhost(); showGhost(e.clientX, e.clientY); }, true);
    document.addEventListener("mouseout", function (e) { if (!e.relatedTarget) hideGhost(); });   // the pointer left the window
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (els.lb) closeLb();
      else if (picking) stopPicking();
      else if (panel && !busy) { if (panel === "photos") backFromPhotos(); else if (els.veil && els.veilClose) els.veilClose(); else if (panel === "note") saveNote(); else { closePanels(); render(); } }
    });
    document.addEventListener("keydown", trapTab);
    window.addEventListener("pagehide", function () { if (toastAfter) clearToast(); });   // a deleted note's photos go, even if they leave before Undo runs out
    var tick = false, again = function () { if (tick) return; tick = true; requestAnimationFrame(function () { tick = false; placePins(); }); };
    window.addEventListener("resize", again); window.addEventListener("scroll", again, { passive: true }); window.addEventListener("load", again);
    if (window.ResizeObserver) new ResizeObserver(again).observe(document.body);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(again);
    var syncPickClass = function () { document.documentElement.classList.toggle("swn-pick", picking); };
    var oldRender = render; render = function () { oldRender(); syncPickClass(); };

    if (MODE === "hub" && st.sent) newList(true);   // sent last time: their page starts fresh, no leftover "Sent" bar
    render();
    if (MODE === "hub") { addCss(document, PAGE_CSS); paintBrands(); pagesStart(); loadStats(); loadRequests(); loadShop(); loadInfo(); loadForm(); dropOnBoxes(); }
    if (photosBox()) {
      window.addEventListener("popstate", function () {
        if (location.hash === "#photos") { if (panel !== "photos" && !els.veil && !busy) openPhotos(true); }
        else if (panel === "photos") photosClosed();
      });
      if (location.hash === "#photos") openPhotos(true);
    }
    var introKey = MODE === "edit" ? "intro" : "introHub";
    if (!st[introKey]) { st[introKey] = true; save(); showHelp(true); }   // only ever the first time; Help brings it back
    else if (st.sent) { /* the dock already says it was sent */ }
  }

  // The hidden door: press and hold the Stray Wolf badge (or data-door) for 0.9 seconds.
  // A press just beside it counts, and the pointer may drift a little while holding.
  // The site's own logo (data-door-logo) opens the same way, pressed on the logo itself.
  // A soft moonlight grows from it (the wolf's eyes glow orange too), then the light
  // washes over the whole screen and the client's page comes up out of it. Let go
  // early and the light fades away; a normal tap still follows the badge's link.
  var WASH = "#FFFDF8", WASH_KEY = "swn-moonlight";
  function door() {
    if (!DOOR || DOOR === "none" || IS_HUB) return;
    var doors = function () { return Array.prototype.slice.call(document.querySelectorAll(DOOR)); };
    var isLogo = function (el) { return !!DOOR_LOGO && el.matches(DOOR_LOGO); };
    // so a long press on a phone doesn't open the link menu or select text; a small door doesn't scroll
    // under the finger either, but a logo still does, because that is where a thumb starts a swipe
    var prep = function () { doors().forEach(function (el) { el.style.webkitTouchCallout = "none"; el.style.webkitUserSelect = "none"; el.style.userSelect = "none"; if (!isLogo(el)) el.style.touchAction = "none"; }); };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", prep); else prep();
    var HOLD = 900;    // how long to hold, in ms (was 1200 until Nov 17 2026: Jeremy asked for about a quarter shorter)
    var REACH = 24;    // a press this many px outside the door still counts
    var DRIFT = 40;    // the pointer may wander this many px during the hold
    var THEIRS = "a, button, input, select, textarea, label, summary, [role=\"button\"]";   // a press on one of these is its own, never a near miss
    var timer = 0, glow = null, glowAnim = null, eyes = [], opened = false, startX = 0, startY = 0;
    var calm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    function fixed(css) { var d = document.createElement("div"); d.setAttribute("aria-hidden", "true"); d.setAttribute("data-site-notes-light", ""); d.style.cssText = "position:fixed;pointer-events:none;z-index:2147483646;" + css; document.body.appendChild(d); return d; }
    function reset() {
      clearTimeout(timer); timer = 0;
      if (glow) {
        var g = glow; glow = null;
        if (glowAnim && g.animate) { var o = getComputedStyle(g).opacity, t = getComputedStyle(g).transform; glowAnim.cancel(); g.animate([{ opacity: o, transform: t }, { opacity: 0, transform: t }], { duration: 380, easing: "ease-out", fill: "forwards" }).onfinish = function () { g.remove(); }; }
        else g.remove();
      }
      eyes.forEach(function (e) { e.style.fill = ""; e.style.filter = ""; }); eyes = [];
    }
    function doorAt(e) {
      var on = e.target.closest && e.target.closest(DOOR);
      if (on || (e.target.closest && e.target.closest(THEIRS))) return on;
      var best = null, least = REACH;
      doors().forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (!r.width || isLogo(el)) return;   // a logo is big enough: only a press on it counts
        var off = Math.hypot(Math.max(r.left - e.clientX, 0, e.clientX - r.right), Math.max(r.top - e.clientY, 0, e.clientY - r.bottom));
        if (off <= least) { least = off; best = el; }
      });
      return best;
    }
    function start(e, el) {
      if (e.button > 0) return;
      reset(); opened = false; startX = e.clientX; startY = e.clientY;
      var at = el.querySelector("[data-door-center]") || (el.matches(".swt-badge") && el.querySelector("svg g")) || el, r = at.getBoundingClientRect();
      var span = isLogo(el) ? Math.min(r.width, r.height) : Math.max(r.width, r.height);   // a wide logo glows as big as it is tall
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2, size = Math.max(110, span * 3.4);
      eyes = Array.prototype.slice.call(el.querySelectorAll(".swt-e"));
      eyes.forEach(function (x) { x.style.transition = "fill 1.6s ease, filter 1.6s ease"; });
      // the moonlight: a soft round glow centred on the door that slowly brightens and swells
      glow = fixed("left:" + (cx - size / 2) + "px;top:" + (cy - size / 2) + "px;width:" + size + "px;height:" + size + "px;border-radius:50%;opacity:0;" +
        "mix-blend-mode:screen;background:radial-gradient(circle," + WASH + " 0," + WASH + " 9%,rgba(255,250,236,.85) 18%,rgba(255,240,214,.4) 38%,rgba(255,236,206,.12) 54%,rgba(255,236,206,0) 70%)");
      requestAnimationFrame(function () { eyes.forEach(function (x) { x.style.fill = "#EE6A35"; x.style.filter = "drop-shadow(0 0 3px #EE6A35)"; }); });
      if (glow.animate) glowAnim = glow.animate([{ opacity: 0, transform: "scale(.35)" }, { opacity: .7, transform: "scale(.8)", offset: .45 }, { opacity: 1, transform: "scale(1.3)" }], { duration: HOLD, easing: "cubic-bezier(.4,0,.7,1)", fill: "forwards" });
      else glow.style.opacity = "1";
      timer = setTimeout(function () {
        opened = true; timer = 0;
        try { sessionStorage.setItem(WASH_KEY, "1"); } catch (x) {}
        if (navigator.vibrate) try { navigator.vibrate(12); } catch (x) {}
        // then the light washes over everything, from the door outwards
        var far = Math.max(Math.hypot(cx, cy), Math.hypot(innerWidth - cx, cy), Math.hypot(cx, innerHeight - cy), Math.hypot(innerWidth - cx, innerHeight - cy));
        var d = far * 4 + 200, from = Math.min(1, size * .9 / d), wash = fixed("left:" + (cx - d / 2) + "px;top:" + (cy - d / 2) + "px;width:" + d + "px;height:" + d + "px;border-radius:50%;background:radial-gradient(circle," + WASH + " 0," + WASH + " 50%,rgba(255,253,248,.85) 66%,rgba(255,250,236,.35) 84%,rgba(255,250,236,0) 100%);transform:scale(" + from + ")");
        var go = function () { location.href = LOGIN_URL; };
        if (calm || !wash.animate) { wash.style.transform = "none"; setTimeout(go, 120); return; }
        wash.animate([{ transform: "scale(" + from + ")" }, { transform: "scale(1)" }], { duration: 800, easing: "cubic-bezier(.6,0,.8,.5)", fill: "forwards" }).onfinish = go;
        setTimeout(go, 1200);                  // in case the animation never reports back
      }, HOLD);
    }
    document.addEventListener("pointerdown", function (e) { var el = doorAt(e); if (el) start(e, el); }, true);
    document.addEventListener("pointermove", function (e) { if (timer && Math.hypot(e.clientX - startX, e.clientY - startY) > DRIFT) reset(); }, true);
    ["pointerup", "pointercancel"].forEach(function (n) { window.addEventListener(n, function () { if (timer && !opened) reset(); }, true); });
    // after a full hold, the badge's own link must not open as well
    document.addEventListener("click", function (e) { if (opened) { e.preventDefault(); e.stopPropagation(); } }, true);
    document.addEventListener("contextmenu", function (e) { if (timer || opened) e.preventDefault(); }, true);
    document.addEventListener("dragstart", function (e) { if (e.target.closest && e.target.closest(DOOR)) e.preventDefault(); }, true);
    // coming back with the browser's Back button: no leftover light
    window.addEventListener("pageshow", function (e) { if (e.persisted) { opened = false; Array.prototype.forEach.call(document.querySelectorAll("[data-site-notes-light]"), function (d) { d.remove(); }); } });
  }
  // The client's page, arrived at through the door: it comes up out of the moonlight
  function arrive() {
    var on = false; try { on = sessionStorage.getItem(WASH_KEY) === "1"; sessionStorage.removeItem(WASH_KEY); } catch (x) {}
    if (!on) return;
    var d = document.createElement("div"); d.setAttribute("aria-hidden", "true"); d.setAttribute("data-keep", "");
    d.style.cssText = "position:fixed;inset:0;z-index:2147483647;pointer-events:none;background:" + WASH;
    (document.body || document.documentElement).appendChild(d);
    var calm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!d.animate || calm) { setTimeout(function () { d.remove(); }, calm ? 60 : 400); return; }
    d.animate([{ opacity: 1 }, { opacity: 1, offset: .15 }, { opacity: 0 }], { duration: 900, easing: "ease-out", fill: "forwards" }).onfinish = function () { d.remove(); };
  }
  // Stray Wolf opening "Show me on the site" from the admin: the page comes up with
  // #sw-find={s: selector, p: child counts, x, y: where inside, t: its words, w: screen width}.
  // Scroll to that spot and ring it, with a pin where they tapped. No login needed: it only points.
  function findSpot() {
    var m = /^#sw-find=(.+)$/.exec(location.hash || ""); if (!m) return;
    var f; try { f = JSON.parse(decodeURIComponent(m[1])); } catch (e) { return; }
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
    var norm = function (s) { return String(s || "").replace(/\s+/g, " ").replace(/…$/, "").trim().toLowerCase(); };
    var t = norm(f.t), seen = function (el) { return el && el.getClientRects().length; };
    var fits = function (el) { return seen(el) && (!t || norm(snipOf(el)).indexOf(t.slice(0, 40)) >= 0 || norm(el.innerText).indexOf(t.slice(0, 40)) >= 0); };
    var el = null, moved = false;
    try { if (f.s) el = document.querySelector(f.s); } catch (e) {}
    if (!fits(el)) { var byPath = f.p && f.p.length ? nodeAt(f.p) : null; if (fits(byPath)) el = byPath; else if (!seen(el)) el = byPath; }
    if (t && !fits(el)) {   // the page changed: look for the same words
      var best = null;
      Array.prototype.forEach.call(document.body.querySelectorAll("h1,h2,h3,h4,h5,p,li,a,button,img,figure,td,dt,dd,blockquote,label,span"), function (c) {
        if (best || !seen(c)) return;
        if ((c.tagName === "IMG" ? norm(snipOf(c)) : norm(c.innerText)).indexOf(t.slice(0, 40)) >= 0) best = c;
      });
      if (best) { el = best; moved = true; }
    }
    if (!seen(el)) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    var ring = document.createElement("div"), pin = document.createElement("div"), tag = document.createElement("div");
    ring.setAttribute("aria-hidden", "true");
    ring.style.cssText = "position:absolute;z-index:2147483645;pointer-events:none;border:3px solid #c2541b;border-radius:8px;background:rgba(194,84,27,.08);box-shadow:0 0 0 9999px rgba(20,18,16,.28);transition:opacity .3s";
    pin.style.cssText = "position:absolute;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:#c2541b;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35)";
    tag.style.cssText = "position:absolute;left:-3px;bottom:100%;margin-bottom:6px;background:#c2541b;color:#fff;font:600 14px/1.25 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:6px 10px;border-radius:8px;width:max-content;max-width:min(420px,calc(100vw - 24px));box-shadow:0 2px 8px rgba(0,0,0,.25)";
    tag.textContent = moved ? "Note left here (the page has changed a little)" : "Note left here";
    ring.append(tag, pin);
    var place = function () {
      var r = el.getBoundingClientRect();
      ring.style.left = (r.left + window.scrollX - 5) + "px"; ring.style.top = (r.top + window.scrollY - 5) + "px";
      ring.style.width = (r.width + 10) + "px"; ring.style.height = (r.height + 10) + "px";
      pin.style.left = (5 + r.width * (f.x == null ? .5 : f.x)) + "px"; pin.style.top = (5 + r.height * (f.y == null ? .5 : f.y)) + "px";
      if (r.top < 44) { tag.style.bottom = "auto"; tag.style.top = "100%"; tag.style.marginTop = "6px"; }
      tag.style.left = "-3px";                         // keep the label on screen near either edge
      var tr = tag.getBoundingClientRect(), vw = document.documentElement.clientWidth;
      if (tr.right > vw - 8) tag.style.left = (-3 - (tr.right - vw + 8)) + "px";
      else if (tr.left < 8) tag.style.left = (-3 + 8 - tr.left) + "px";
    };
    document.body.appendChild(ring); place();
    var off = function () { ring.style.opacity = "0"; setTimeout(function () { ring.remove(); }, 300); window.removeEventListener("resize", place); document.removeEventListener("keydown", esc); document.removeEventListener("pointerdown", off, true); };
    var esc = function (e) { if (e.key === "Escape") off(); };
    window.addEventListener("resize", place); document.addEventListener("keydown", esc);
    setTimeout(function () { document.addEventListener("pointerdown", off, true); }, 400);
    setTimeout(place, 700); window.addEventListener("load", place);
  }
  // While logged in: taps and keys count as activity; once a minute, check the limits.
  // A login that ends (here or in another tab) takes them back to the login box; their notes stay saved.
  var watching = false;
  function watchSession() {
    if (watching) return; watching = true;
    ["pointerdown", "keydown", "scroll"].forEach(function (ev) { window.addEventListener(ev, touch, { passive: true, capture: true }); });
    // On their portal, or in Edit mode on the site: back to the portal's login box (their unsent notes come along).
    // Just browsing their own site: nothing to do, the site looks the same either way.
    var ended = function () { if (IS_HUB) location.reload(); else if (lsGet("on") === "1") { lsSet("on", null); location.href = LOGIN_URL; } };
    setInterval(function () { if (!getToken()) ended(); }, 6e4);
    window.addEventListener("storage", function (e) { if (e.key === K + "token" && !getToken()) ended(); });
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible" && !getToken()) ended(); });
  }
  function boot() {
    findSpot();
    door();
    var token = getToken(), on = lsGet("on") === "1";
    if (token && (IS_HUB || on)) watchSession();
    if (IS_HUB) {
      arrive();
      lsSet("on", null);                       // on their page, Edit mode is off until they tap it
      if (token) { unlock(); mount(); start(); }
      else { lock(); mount(); showLogin(); }
    } else if (token && on) { mount(); start(); }
  }

  /* Tooltips on the Client Portal page (not on the website itself). Hover (after a moment) or keyboard focus on
     anything with a title, or a button that is only an icon, shows a short dark label under it: the browser's own
     title box is slow and never shows for the keyboard. Esc or moving away closes it, and the pointer can rest on the
     label (WCAG 1.4.13). A tap on an (i) (.swm-i, the shop) shows its words on a phone. Like the admin's, and one
     thing more: after a press, hover waits for the pointer to move, so what a click just opened under a resting
     pointer shows no label (and Esc goes to the page, not to a label nobody asked for). */
  function tooltips() {
    if (window.__swTips) return; window.__swTips = 1;
    addCss(document, ".sw-tip{position:fixed;z-index:2147483000;max-width:260px;padding:6px 9px;border-radius:7px;background:#24221f;color:#f6f5f2;" +
      "font:400 12.5px/1.4 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;box-shadow:0 8px 22px -8px rgb(0 0 0 / .45);opacity:0;transition:opacity .12s;overflow-wrap:anywhere}" +
      ".sw-tip.on{opacity:1}@media (prefers-reduced-motion:reduce){.sw-tip{transition:none}}@media print{.sw-tip{display:none}}");
    var tip = null, at = null, wait = 0, gone = 0, seq = 0;
    function words(n) {
      if (n.hasAttribute("title")) { var t = n.getAttribute("title"); n.removeAttribute("title"); if (t) n.setAttribute("data-tip", t); }
      var s = n.getAttribute("data-tip") || (/^(BUTTON|A)$/.test(n.tagName) && !n.textContent.trim() ? n.getAttribute("aria-label") || "" : "");
      return s && s.trim() !== n.textContent.trim() ? s : "";
    }
    function find(e) {
      var path = e.composedPath ? e.composedPath() : [e.target];
      for (var i = 0; i < path.length; i++) { var n = path[i]; if (!n || n.nodeType !== 1) continue; if (n.classList.contains("sw-tip")) return null;
        if (n.hasAttribute("title") || n.hasAttribute("data-tip") || (/^(BUTTON|A)$/.test(n.tagName) && !n.textContent.trim() && n.getAttribute("aria-label"))) return n; }
      return null;
    }
    function hide(soft) { if (!soft) clearTimeout(wait); clearTimeout(gone); if (tip) { tip.remove(); tip = null; } if (at) { at.removeAttribute("aria-describedby"); at = null; } }
    function show(n) {
      var s = words(n); hide(); if (!s || !n.isConnected) return;
      at = n; tip = document.createElement("div"); tip.className = "sw-tip"; tip.setAttribute("role", "tooltip"); tip.id = "sw-tip-" + (++seq); tip.textContent = s;
      document.body.appendChild(tip);
      if (n.getAttribute("aria-label") !== s && n.getRootNode() === document) n.setAttribute("aria-describedby", tip.id);
      var r = n.getBoundingClientRect(), w = tip.offsetWidth, ht = tip.offsetHeight, top = r.bottom + 8;
      if (top + ht > innerHeight - 8) top = r.top - ht - 8;
      tip.style.top = Math.max(8, top) + "px"; tip.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + "px";
      tip.onpointerenter = function () { clearTimeout(gone); }; tip.onpointerleave = function () { gone = setTimeout(hide, 120, true); };
      requestAnimationFrame(function () { if (tip) tip.classList.add("on"); });
    }
    var moved = true;   // false from a press until the pointer moves again
    function over(e) { if (e.pointerType === "touch") return; var n = find(e); if (!n || n === at) { if (n) clearTimeout(gone); return; } clearTimeout(wait); wait = setTimeout(function () { show(n); }, 350); }
    document.addEventListener("pointerdown", function () { moved = false; clearTimeout(wait); }, true);
    document.addEventListener("pointermove", function (e) { if (!moved) { moved = true; over(e); } }, true);
    document.addEventListener("pointerover", function (e) { if (moved) over(e); });
    document.addEventListener("pointerout", function (e) { var n = find(e); if (!n) return; var to = e.relatedTarget; if (to && (n.contains(to) || (tip && tip.contains(to)))) return; clearTimeout(wait); gone = setTimeout(hide, 120, true); });
    document.addEventListener("focusin", function (e) { var n = find(e), t = (e.composedPath ? e.composedPath()[0] : e.target); if (n && n === t && t.matches(":focus-visible")) show(n); else if (at && at !== n) hide(); });
    document.addEventListener("focusout", function (e) { if ((e.composedPath ? e.composedPath()[0] : e.target) === at) hide(); });
    document.addEventListener("click", function (e) { var t = e.composedPath ? e.composedPath()[0] : e.target, i = t.closest && t.closest(".swm-i"); if (i) { if (at === i && tip) hide(); else show(i); return; } if (tip && !tip.contains(t)) hide(); }, true);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && tip) { e.stopPropagation(); hide(); } }, true);   // Esc closes only the label
    var drop = function () { hide(); }; addEventListener("scroll", drop, true); addEventListener("resize", drop);
  }
  /* The page's own buttons get a hover description too, the same on every site: each box's button says what a tap
     does, from what the box is for. A button the page already describes (title) keeps its own words. */
  function pageTips() {
    var EDIT = "Open your website to point at what you'd like changed";
    [].forEach.call(document.querySelectorAll("[data-note-box] button, a[data-edit-mode]"), function (b) {
      if (b.title || b.hasAttribute("data-tip")) return;
      var box = b.closest("[data-note-box]");
      b.title = !box ? EDIT : box.hasAttribute("data-photos-page") ? "See your photos and send new ones"
        : box.hasAttribute("data-note-photos") ? "Choose a file and send it to " + TO : "Change what your website says here";
    });
  }
  if (IS_HUB) { pageTips(); tooltips(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
