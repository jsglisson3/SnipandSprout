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
 *   data-note-box           a box that opens a note with one tap
 *     data-area / data-note-ask / data-note-hint   its name, question, example
 *     data-note-fields="Facebook|Instagram"         one line to fill in for each
 *     data-note-now="Phone=423-555-0100|Email=..."  what's on the site now: those lines show the
 *                   current value with a Change button, so they only type what's new
 * "Show me on the site": a page opened with #sw-find={...} (the admin builds it from a note's
 *   sel/path/fx/fy/snip) scrolls to that spot and rings it. Each note sends url, sel, path,
 *   fx, fy, py (how far down the page, 0 to 1), snip (its words) and vw (screen width), plus
 *   shot: a small picture of the spot (uploaded like a photo; needs html2canvas.min.js next
 *   to this file, or data-shot-lib="its address"; data-shot-lib="none" = no pictures).
 *   data-booking-url  on the Let's talk box: a booking page (like a Google Calendar
 *                   appointment schedule). Set = tapping it opens that page; empty = a note.
 *   data-alert-key  optional Web3Forms key: emails a heads-up when notes arrive
 * Your requests (their own page only): <section data-requests hidden> holding <ul data-requests-list>
 *   and <button data-requests-all hidden>. After login it lists what they've asked for and where each
 *   one stands: Received, Working on it, Stray Wolf has a question, Done, Not doing this one. It is the
 *   same status Stray Wolf picks in the admin (POST /api/my-requests). A question gets an Answer button
 *   (POST /api/my-request/answer {batch, n, text}). Nothing sent yet = the card stays hidden.
 * Your shop (their own page only): <section data-shop-portal hidden> holding <p data-shop-count>,
 *   <button data-shop-add>, <div data-shop-form> and <div data-shop-list>. For a client whose website sells
 *   things (kit/shop): they add, change and delete items, type the shown price right in each row, and set
 *   each item's photo and checkout link (POST /api/my-shop, /api/my-shop/item, /item/delete, /prices,
 *   /pic?id=). Stray Wolf sets the shop's kind of checkout: Square (only Square links) or Generic (any https
 *   checkout link); the card's words follow it. No shop (Stray Wolf starts one) = the card stays hidden.
 * Messages from your website (their own page only): for a client whose website form sends to the notes service.
 *   Built by this script (a <section data-form-portal> is added under Your requests, or under the shop when
 *   there is one; a page can place its own empty <section data-form-portal hidden> instead). Each message is
 *   listed with the visitor's answers, files and Reply, Call, Mark replied and Delete (POST /api/my-form,
 *   /api/my-form/lead {id, status}, /lead/delete {id}), and "Form emails go to" lets the client change where the
 *   emails go (POST /api/my-form/to {to}; a new address gets a short email at once; /api/my-form/test sends a
 *   test). Form off in the admin, or an older service: no card.
 * The Photos page (their own page only): a box with data-photos-page opens a full page instead of
 *   a small note (also at <portal>#photos). Adding photos (drag and drop, a few words each), then
 *   "Photos you sent", each marked Received, Approved, On your site or Not used (Stray Wolf picks
 *   that in the admin; POST /api/my-photos and /api/my-photo {key}), then
 *   "On your site now" from <template data-site-photos> on their page:
 *     <img src="small.jpg" data-big="big.jpg" alt="what it shows" data-on="Homepage|About page">
 *   data-more="Your project pages have more photos." data-more-url="/projects" on the template adds a link.
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
    ext: ["M14 4h6v6", "M10 14L20 4", "M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"],
    tag: ["M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z", "M7.5 7.5h.01"]
  };
  // Social sites the portal knows by name: their own colors, logo and an example of the address to paste.
  var BRANDS = {
    facebook: { bg: "#1877F2", ph: "facebook.com/yourpage",
      svg: '<path fill="#fff" d="M13.6 21v-7.4h2.5l.4-2.9h-2.9V8.9c0-.8.2-1.4 1.4-1.4h1.6V4.9c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.1H8v2.9h2.5V21z"/>' },
    instagram: { bg: "radial-gradient(circle at 30% 107%,#fdf497 0%,#fdf497 5%,#fd5949 45%,#d6249f 60%,#285AEB 90%)", ph: "instagram.com/yourname",
      svg: '<g fill="none" stroke="#fff" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="12" cy="12" r="3.8"/></g><circle cx="16.8" cy="7.2" r="1.2" fill="#fff"/>' },
    linkedin: { bg: "#0A66C2", ph: "linkedin.com/company/yourname",
      svg: '<g fill="#fff"><circle cx="7" cy="6.8" r="1.8"/><rect x="5.5" y="9.6" width="3" height="9.4" rx=".4"/><path d="M10.8 9.6h2.9v1.3c.5-.9 1.6-1.6 3.1-1.6 2.5 0 3.4 1.6 3.4 4.2V19h-3v-4.9c0-1.3-.3-2.2-1.6-2.2s-1.8.9-1.8 2.2V19h-3z"/></g>' },
    google: { bg: "#fff", ph: "Your Google Maps or business link",
      svg: '<g fill="none" stroke-width="3.2"><path stroke="#EA4335" d="M16.95 7.05A7 7 0 0 0 5.94 8.5"/><path stroke="#FBBC05" d="M5.94 8.5A7 7 0 0 0 5.94 15.5"/><path stroke="#34A853" d="M5.94 15.5A7 7 0 0 0 16.95 16.95"/><path stroke="#4285F4" d="M16.95 16.95A7 7 0 0 0 19 12H12"/></g>' }
  };
  // Other boxes a "fields" list often asks for: the keyboard a phone should show, and an example.
  // Any other name without its own example ("Label=example") gets a plain text box.
  var FIELD_KINDS = {
    phone: { mode: "tel", ph: "For example: 423-555-0142" },
    email: { mode: "email", ph: "For example: info@yourbusiness.com" },
    address: { mode: "text", ph: "For example: 120 Main St, Cleveland, TN 37311" },
    area: { mode: "text", ph: "For example: Cleveland and Chattanooga" },
    website: { mode: "url", ph: "For example: yourbusiness.com" }
  };
  function brandLogo(b) {
    var t = document.createElement("span"); t.className = "logo"; t.style.background = b.bg;
    if (b.bg === "#fff") t.style.boxShadow = "inset 0 0 0 1px #e2dcd2";
    t.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + b.svg + "</svg>";
    return t;
  }
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
    ".r{--ink:#1f1d1b;--muted:#5f5a53;--line:#e4dfd7;--soft:#f7f4ef;--paper:#fff;--accent:#c2541b;--accent-dk:#a3441a;--accent-soft:#fbeee6;--go:#2f7a4b;--go-dk:#26633d;--bad:#b3261e;",
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
    ".pin.drop{animation:drop .35s cubic-bezier(.2,1.4,.4,1)}",
    "@keyframes drop{from{transform:translateY(-16px) scale(.6);opacity:0}}",
    // while placing a note with a mouse: the pin rides on the pointer, its tip exactly where it will land
    ".ghost{position:fixed;left:0;top:0;width:0;height:0;pointer-events:none}",
    ".ghost .pin{opacity:.9;font-size:22px;font-weight:600}",
    ".ghost .tip{position:absolute;left:40px;top:-40px;display:grid;gap:1px;padding:7px 11px;background:var(--ink);color:#fff;font-size:14px;font-weight:600;line-height:1.3;white-space:nowrap;border-radius:9px;box-shadow:0 4px 14px rgba(0,0,0,.25)}",
    ".ghost .tip small{font-size:12.5px;font-weight:500;color:rgba(255,255,255,.78)}",
    ".ghost.left .tip{left:auto;right:16px}",

    /* cards: the note box, the review list, help, login */
    ".card{position:fixed;background:var(--paper);border-radius:18px;box-shadow:0 18px 48px rgba(0,0,0,.3),0 0 0 1px rgba(0,0,0,.05);display:flex;flex-direction:column;overflow:hidden}",
    ".card .hd{display:flex;align-items:flex-start;gap:12px;padding:18px 20px 10px}",
    ".card .hd h2{margin:0;font-size:21px;line-height:1.25;font-weight:700}",
    ".card .hd p{margin:3px 0 0;color:var(--muted);font-size:15px;overflow-wrap:anywhere}",
    ".card .hd .grow{flex:1;min-width:0}",
    ".xbtn{flex:none;display:grid;place-items:center;width:44px;height:44px;margin:-6px -8px 0 0;border:0;background:none;border-radius:999px;color:var(--muted)}",
    ".xbtn:hover{background:var(--soft)}",
    ".card .bd{padding:6px 20px 16px;overflow:auto;display:grid;gap:14px;align-content:start}",
    ".card .ft{padding:14px 20px calc(16px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--line);display:flex;gap:10px;align-items:center;background:var(--paper)}",
    ".num{display:inline-grid;place-items:center;flex:none;width:34px;height:34px;border-radius:50% 50% 50% 6px;background:var(--accent);color:#fff;font-weight:700;font-size:16px;font-variant-numeric:tabular-nums}",
    "label.q{font-weight:600;font-size:17px}",
    ".fields{display:grid;gap:10px}.field{display:grid;grid-template-columns:96px 1fr;align-items:center;gap:10px}.field label{font-weight:600;font-size:16px}",
    ".field input{font:inherit;font-size:17px;color:var(--ink);width:100%;min-width:0;min-height:50px;border:2px solid var(--line);border-radius:12px;padding:8px 12px;background:var(--soft)}",
    ".field input:focus{outline:none;border-color:var(--accent);background:#fff}",
    "@media (max-width:420px){.field{grid-template-columns:1fr;gap:4px}}.fields.stack .field{grid-template-columns:1fr;gap:4px}",
    /* social pages: one roomy row per site, with that site's own logo and an example address */
    ".fields.brands{gap:12px}",
    ".field .lb{font-weight:600;font-size:16px}.field.brand .lb{font-size:17px;line-height:1.2}",
    ".fv{min-width:0}.fv [hidden]{display:none!important}",
    ".cur{display:flex;align-items:center;gap:10px;min-height:50px;padding:5px 5px 5px 12px;border:1px solid var(--line);border-radius:12px;background:#fff}",
    ".cur svg{flex:none;width:18px;height:18px;color:var(--go)}",
    ".cur .val{flex:1;min-width:0;font-size:16.5px;line-height:1.3;overflow-wrap:break-word}",
    ".cur .chg,.ed .undo{flex:none;border:0;min-height:40px;padding:0 14px;border-radius:10px;font-size:15px;font-weight:600}",
    ".cur .chg{background:var(--accent-soft);color:var(--accent)}.cur .chg:hover{background:#f6dccd}",
    ".ed{display:flex;align-items:center;gap:8px}.ed input{flex:1}",
    ".ed .undo{background:transparent;color:var(--muted);text-decoration:underline;text-underline-offset:3px;padding:0 8px}",
    ".field.brand .cur{min-height:48px}",
    ".field.brand{grid-template-columns:48px minmax(0,1fr);gap:6px 14px;align-items:center;background:#fff;border:1px solid var(--line);border-radius:14px;padding:12px 14px}",
    ".field.brand .logo{grid-row:span 2;width:48px;height:48px;border-radius:12px;display:grid;place-items:center;color:#fff}",
    ".field.brand .logo svg{width:28px;height:28px}",
    ".field.brand label{font-size:17px;line-height:1.2}",
    ".field.brand input{min-height:48px;font-size:16.5px;background:var(--soft)}",
    ".field.brand:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px rgba(194,84,27,.12)}",
    ".tip{display:flex;gap:10px;align-items:flex-start;margin:-4px 0 0;color:var(--muted);font-size:15px;line-height:1.45}.tip .ic{flex:none;width:20px;height:20px;margin-top:1px;color:var(--accent)}",
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
    ".note.dropping .dropcover{position:absolute;inset:8px;z-index:3;display:grid;place-content:center;justify-items:center;gap:10px;border:3px dashed var(--accent);border-radius:16px;background:rgba(251,238,230,.94);color:var(--accent);pointer-events:none}",
    ".note .dropcover .ic{width:54px;height:54px}.note .dropcover b{font-size:21px}",
    "textarea{font:inherit;font-size:18px;color:var(--ink);width:100%;min-height:120px;border:2px solid var(--line);border-radius:12px;padding:12px 14px;background:var(--soft);resize:vertical}",
    "textarea:focus{border-color:var(--accent);background:#fff;outline:none}",
    "textarea::placeholder{color:#8d877e}",
    ".add-ph{display:flex;align-items:center;gap:14px;width:100%;text-align:left;border:2px dashed #cfc7bb;background:var(--soft);border-radius:12px;padding:14px 16px;min-height:64px}",
    ".add-ph:hover,.add-ph.over{border-color:var(--accent);background:var(--accent-soft)}",
    ".add-ph .ic{width:30px;height:30px;color:var(--accent)}",
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
    ".capts{justify-self:start;border:0;background:none;padding:6px 0;color:var(--accent);font-weight:600;font-size:15px;text-decoration:underline;text-underline-offset:3px}",
    ".b{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:52px;padding:0 20px;border-radius:12px;border:2px solid transparent;font-size:17px;font-weight:600;white-space:nowrap}",
    ".b.main{background:var(--accent);color:#fff}.b.main:hover{background:var(--accent-dk)}",
    ".b.go{background:var(--go);color:#fff}.b.go:hover{background:var(--go-dk)}",
    ".b.plain{background:#fff;border-color:var(--line);color:var(--ink)}.b.plain:hover{border-color:#bdb5a9}",
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
    ".steps{list-style:none;margin:0;padding:0;display:grid;gap:10px}",
    ".steps li{display:grid;grid-template-columns:52px minmax(0,1fr);gap:16px;align-items:center;background:#fff;border:1px solid var(--line);border-radius:16px;padding:14px 18px 14px 14px}",
    ".steps .circ{width:52px;height:52px;border-radius:15px;background:var(--accent-soft);color:var(--accent);display:grid;place-items:center;position:relative}",
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
    ".pg-top{position:sticky;top:0;z-index:2;background:rgba(244,242,238,.95);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}",
    ".pg-top-in{max-width:1040px;margin:0 auto;display:flex;align-items:center;gap:14px;padding:10px max(16px,env(safe-area-inset-right,0px)) 10px max(16px,env(safe-area-inset-left,0px))}",
    ".pg-back{display:inline-flex;align-items:center;gap:8px;min-height:48px;padding:0 18px 0 12px;border-radius:12px;border:2px solid var(--line);background:#fff;font-weight:600;font-size:16px;white-space:nowrap}",
    ".pg-back:hover{border-color:#bdb5a9}.pg-back .ic{transform:scaleX(-1)}",
    ".pg-top h1{margin:0;font:700 25px/1.15 'SW Zilla','Zilla Slab',Georgia,serif;letter-spacing:-.005em}",
    ".pg-in{max-width:1040px;margin:0 auto;padding:18px max(16px,env(safe-area-inset-right,0px)) 64px max(16px,env(safe-area-inset-left,0px));display:grid;gap:18px}",
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
    ".pg-more{margin:0;font-size:15.5px;color:var(--muted)}.pg-more a{color:var(--accent);font-weight:600}",
    "@media (max-width:719px){.pg-grid{grid-template-columns:1fr 1fr;gap:14px 10px}.pg-sec{padding:16px;border-radius:16px}.pg-top h1{font-size:21px}.pg-back{min-height:44px;padding:0 14px 0 10px}.pg-in{padding-top:14px;gap:14px}.pg-act .b{width:100%}.tag{font-size:12.5px;padding:5px 8px}.tag.off,.tag.yes{padding-left:8px}.card.photo .hd h2{font-size:17px}}",
    ".card.help .hd{padding:26px 26px 6px}.card.help .hd h2{font-size:23px}.card.help .hd p{font-size:16px;margin-top:5px}",
    ".card.help .bd{padding:14px 26px 22px;gap:12px}.card.help .ft{padding:16px 26px calc(20px + env(safe-area-inset-bottom,0px))}.card.help .ft .b{min-height:56px;font-size:18px}",
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
    ".done-ic.pop{animation:pop .45s cubic-bezier(.2,1.5,.4,1)}",
    "@keyframes pop{from{transform:scale(.3);opacity:0}}",
    ".center{text-align:center}",
    ".center h2{font-size:26px;margin:4px 0 6px}",
    ".center p{margin:0 auto;max-width:36ch;color:var(--muted);font-size:17px}",

    /* login */
    ".lock{width:64px;height:64px;border-radius:50%;background:var(--accent-soft);color:var(--accent);display:grid;place-items:center;margin:6px auto 0}",
    ".lock .ic{width:30px;height:30px}",
    ".veil.solid{background:transparent;top:70px;bottom:auto;min-height:calc(100vh - 70px);padding:40px 16px}@media (max-width:719px){.veil.solid{top:58px;min-height:calc(100vh - 58px);place-items:center stretch;padding:16px}.veil.solid > .card{border-radius:20px}}",
    ".veil.solid > .card{width:min(460px,100%);box-shadow:0 0 0 1px #e2dcd2,0 30px 60px -28px rgba(36,34,31,.45)}",
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
    // Messages from your website
    ".fp{background:var(--card);border-radius:18px;box-shadow:0 0 0 1px var(--line),0 10px 26px -20px rgba(36,34,31,.3);margin:0 0 36px;overflow:hidden}",
    ".rq:not([hidden]):has(+ .fp:not([hidden])),.sp:not([hidden]):has(+ .fp:not([hidden])){margin-bottom:16px}",
    ".fp-hd{display:flex;gap:12px 16px;align-items:baseline;justify-content:space-between;padding:18px 22px 12px}",
    ".fp-hd h2{font:700 22px/1.2 var(--slab);margin:0}",
    ".fp-hd p{margin:2px 0 0;color:var(--muted);font-size:14.5px}",
    ".fp-test{margin:0 22px 12px;padding:10px 14px;border-radius:12px;background:var(--stone);font-size:14.5px;line-height:1.45}",
    ".fp-list{list-style:none;margin:0;padding:0}",
    ".fp-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 16px;align-items:start;padding:14px 22px;border-top:1px solid var(--line)}",
    ".fp-row > b{font-size:16px;font-weight:600;line-height:1.35;overflow-wrap:anywhere}",
    ".fp-m{grid-column:1;color:var(--muted);font-size:13.5px}",
    ".fp-tag{display:inline-flex;align-items:center;gap:6px;font:500 11px/1 var(--mono);letter-spacing:.1em;text-transform:uppercase;white-space:nowrap;border-radius:999px;padding:6px 10px;border:1px solid var(--line);color:var(--muted);background:var(--stone)}",
    ".fp-tag::before{content:\"\";width:7px;height:7px;border-radius:50%;background:currentColor;opacity:.8}",
    ".fp-tag.new{color:#a94816;background:var(--accent-soft);border-color:#f1d3c0}",
    ".fp-tag.replied{color:#4d5e42;background:var(--sage-soft);border-color:#d6dfcd}",
    ".fp-ans{grid-column:1/-1;margin:6px 0 0;display:grid;grid-template-columns:minmax(110px,max-content) minmax(0,1fr);gap:4px 14px;font-size:14.5px;line-height:1.45}",
    ".fp-ans dt{color:var(--muted)}.fp-ans dd{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}",
    ".fp-files{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}",
    ".fp-files a{display:inline-flex;align-items:center;gap:6px;min-height:36px;padding:4px 12px 4px 4px;border:1px solid var(--line);border-radius:10px;font-size:13.5px;color:var(--ink);text-decoration:none;background:var(--card)}",
    ".fp-files a:hover{border-color:var(--accent)}",
    ".fp-files img{width:44px;height:32px;object-fit:cover;border-radius:7px;background:var(--stone)}",
    ".fp-files .doc{display:inline-grid;place-items:center;width:44px;height:32px;border-radius:7px;background:var(--stone);font:500 11px/1 var(--mono)}",
    ".fp-acts{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:8px 10px;align-items:center;margin-top:8px}",
    ".fp-b{min-height:38px;padding:0 14px;display:inline-flex;align-items:center;gap:6px;font:650 14px/1 system-ui,-apple-system,\"Segoe UI\",Roboto,sans-serif;color:var(--ink);background:var(--card);border:1px solid var(--line);border-radius:10px;cursor:pointer;text-decoration:none}",
    ".fp-b:hover{border-color:var(--accent)}.fp-b.main{color:#fff;background:var(--accent);border-color:var(--accent)}.fp-b.main:hover{background:#a94816}",
    ".fp-b[disabled]{opacity:.6;cursor:default}",
    ".fp-x{background:none;border:0;padding:8px 4px;font:650 14px/1.2 system-ui,-apple-system,\"Segoe UI\",Roboto,sans-serif;color:#b4361c;cursor:pointer;text-decoration:underline;text-underline-offset:3px}",
    ".fp-x.no{color:var(--muted)}",
    ".fp-mail{grid-column:1/-1;margin:4px 0 0;color:#b4361c;font-size:13.5px}",
    ".fp-none{margin:0;padding:14px 22px 18px;border-top:1px solid var(--line);color:var(--muted);font-size:14.5px}",
    ".fp-more{display:block;margin:0;padding:10px 22px 14px;border-top:1px solid var(--line)}",
    ".fp-more button{font:650 14px/1.2 system-ui,-apple-system,\"Segoe UI\",Roboto,sans-serif;background:none;border:0;padding:4px 0;cursor:pointer;color:var(--accent);text-decoration:underline;text-underline-offset:3px}",
    ".fp-to{display:grid;gap:8px;padding:16px 22px 18px;border-top:1px dashed var(--line);background:#faf8f4}",
    ".fp-to label{font-weight:600;font-size:15px}",
    ".fp-to .row{display:flex;flex-wrap:wrap;gap:8px 10px;align-items:center}",
    ".fp-to input{flex:1 1 280px;min-width:0;min-height:42px;font:inherit;font-size:15px;color:var(--ink);background:var(--card);border:1px solid var(--line);border-radius:10px;padding:8px 12px}",
    ".fp-to input:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px rgba(194,84,27,.2)}",
    ".fp-to small{color:var(--muted);font-size:13.5px;line-height:1.45}",
    ".fp-to .err{margin:0;color:#b4361c;font-size:14px}",
    ".fp button:focus-visible,.fp a:focus-visible{outline:3px solid var(--accent-hi);outline-offset:2px}",
    "@media (min-width:1800px){.fp-hd h2{font-size:24px}.fp-row > b{font-size:17px}}",
    "@media (min-width:2400px){.fp-hd h2{font-size:27px}.fp-hd p,.fp-ans,.fp-test{font-size:16px}.fp-row > b{font-size:18.5px}.fp-m,.fp-to small{font-size:14.5px}.fp-tag{font-size:12px}.fp-b{font-size:15.5px;min-height:44px}}",
    "@media (max-width:560px){.fp-hd{flex-wrap:wrap;padding:16px 16px 10px}.fp-hd h2{font-size:20px}.fp-test{margin-inline:16px}.fp-row{grid-template-columns:minmax(0,1fr);padding:14px 16px}",
    "  .fp-row .fp-tag{grid-row:1;justify-self:start}.fp-ans{grid-template-columns:minmax(0,1fr);gap:0}.fp-ans dd{margin-bottom:6px}.fp-to,.fp-none,.fp-more{padding-left:16px;padding-right:16px}.fp-b{min-height:44px}}",
    // Your shop
    ".rq:not([hidden]):has(+ .sp:not([hidden])),.edit:has(+ .rq[hidden] + .sp:not([hidden])){margin-bottom:16px}",
    ".sp{background:var(--card);border-radius:18px;box-shadow:0 0 0 1px var(--line),0 10px 26px -20px rgba(36,34,31,.3);margin:0 0 36px;overflow:visible}",
    ".sp-hd{display:flex;gap:12px 16px;align-items:center;justify-content:space-between;padding:18px 22px 14px}",
    ".sp-hd h2{font:700 22px/1.2 var(--slab);margin:0}",
    ".sp-hd p{margin:2px 0 0;color:var(--muted);font-size:14.5px}",
    ".sp-add{flex:none;display:inline-flex;align-items:center;gap:7px;min-height:40px;padding:0 16px 0 13px;font:650 14px/1 system-ui,-apple-system,\"Segoe UI\",Roboto,sans-serif;color:var(--accent);background:var(--accent-soft);border:1px solid #f1d3c0;border-radius:999px;cursor:pointer;transition:background .15s,color .15s}",
    ".sp-add:hover{background:var(--accent);border-color:var(--accent);color:#fff}",
    ".sp-add[hidden]{display:none}",
    ".sp svg{flex:none;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}",
    ".sp-add svg{width:16px;height:16px;stroke-width:2.4}",
    ".sp-cat{margin:0;padding:16px 22px 4px;border-top:1px solid var(--line);font:500 11px/1 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--sage)}",
    ".sp-items{list-style:none;margin:0;padding:0}",
    ".sp-cat + .sp-items > .sp-row:first-child{border-top:0}",
    ".sp-row{display:grid;grid-template-columns:56px minmax(0,1fr) 136px 156px 92px;grid-template-areas:\"pic what price tag act\";gap:6px 16px;align-items:center;padding:12px 22px;border-top:1px solid var(--line)}",
    ".sp-row.open{background:#faf8f4}",
    // the photo: a button that adds or changes it
    ".sp-pic{grid-area:pic;position:relative;display:grid;place-items:center;width:56px;height:56px;padding:0;border:0;border-radius:11px;background:var(--stone) center/cover no-repeat;color:var(--soft);overflow:hidden}",
    "button.sp-pic{cursor:pointer;font:inherit}",
    ".sp-pic svg{width:20px;height:20px;stroke-width:1.8}",
    ".sp-pic.none{align-content:center;gap:1px;background:var(--card);border:1.5px dashed #cdc4b6;color:var(--muted)}",
    ".sp-pic.none svg{width:18px;height:18px}",
    ".sp-pic-say{font:650 10.5px/1.1 system-ui,-apple-system,\"Segoe UI\",Roboto,sans-serif;letter-spacing:.01em}",
    ".sp-pic:not(.none) .sp-pic-say{position:absolute;inset:0;display:grid;place-items:center;background:rgba(36,34,31,.55);color:#fff;opacity:0;transition:opacity .15s}",
    "button.sp-pic:hover .sp-pic-say,button.sp-pic:focus-visible .sp-pic-say{opacity:1}",
    "button.sp-pic.none:hover,.sp-pic.over{border-color:var(--accent);color:var(--accent);background-color:var(--accent-soft)}",
    ".sp-pic.over{box-shadow:0 0 0 2px var(--accent)}",
    ".sp-pic.busy{opacity:.55;cursor:progress}",
    ".sp-row.off .sp-pic:not(.none){opacity:.6}.sp-row.off .sp-what b{color:var(--muted)}",
    ".sp-what{grid-area:what;display:flex;flex-direction:column;align-items:flex-start;gap:2px;min-width:0}",
    ".sp-what b{font-size:16px;font-weight:600;line-height:1.3;overflow-wrap:anywhere}",
    ".sp-m{max-width:100%;color:var(--muted);font-size:13.5px;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    // the checkout link, and changing it in its row
    ".sp-links{display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 12px}",
    ".sp-sq{display:inline-flex;align-items:center;gap:5px;font-size:13.5px;font-weight:600;color:var(--sage);text-decoration:none;white-space:nowrap}",
    ".sp-sq:hover{text-decoration:underline;text-underline-offset:3px}",
    ".sp-sq svg{width:13px;height:13px;stroke-width:2.2}",
    ".sp-link,.sp-diff button{font:650 13.5px/1.35 system-ui,-apple-system,\"Segoe UI\",Roboto,sans-serif;color:var(--accent);background:none;border:0;padding:0;cursor:pointer;text-decoration:underline;text-underline-offset:3px}",
    ".sp-relink{font:600 13px/1.35 system-ui,-apple-system,\"Segoe UI\",Roboto,sans-serif;color:var(--muted);background:none;border:0;padding:0;cursor:pointer;text-decoration:underline;text-decoration-color:#cdc4b6;text-underline-offset:3px}",
    ".sp-relink:hover{color:var(--ink);text-decoration-color:currentColor}",
    ".sp-linkedit{display:flex;flex-direction:column;gap:4px;width:100%;margin-top:4px}",
    ".sp-lrow{display:flex;gap:6px;width:100%}",
    ".sp-lin{flex:1;min-width:0;height:38px;padding:0 11px;font:inherit;font-size:14.5px;color:var(--ink);background:#fff;border:1px solid #d8d1c6;border-radius:9px}",
    ".sp-lin:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px rgba(194,84,27,.2)}",
    ".sp-mini{flex:none;height:38px;padding:0 13px;font:650 13.5px/1 system-ui,-apple-system,\"Segoe UI\",Roboto,sans-serif;color:var(--ink);background:var(--card);border:1px solid var(--line);border-radius:9px;cursor:pointer}",
    ".sp-mini:hover{border-color:var(--ink)}",
    ".sp-mini.go{color:#fff;background:var(--accent);border-color:var(--accent)}.sp-mini.go:hover{background:#a94816}.sp-mini[disabled]{opacity:.6;cursor:default}",
    ".sp-lerr{color:#b4361c;font-size:13px;line-height:1.35}.sp-lerr[hidden]{display:none}",
    ".sp-lhelp{color:var(--soft);font-size:12.5px;line-height:1.35}",
    // the shown price
    ".sp-price{grid-area:price;display:flex;flex-direction:column;gap:3px;min-width:0}",
    ".sp-box{display:flex;align-items:center;gap:3px;height:40px;padding:0 10px;background:#fff;border:1px solid #d8d1c6;border-radius:10px;cursor:text}",
    ".sp-box span{color:var(--soft);font-weight:600}",
    ".sp-box input{flex:1;width:100%;min-width:0;border:0;padding:0;background:none;outline:none;font:600 15px/1 system-ui,-apple-system,\"Segoe UI\",Roboto,sans-serif;font-variant-numeric:tabular-nums;color:var(--ink)}",
    ".sp-box input::placeholder{color:var(--soft);font-weight:400}",
    ".sp-box:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px rgba(194,84,27,.2)}",
    ".sp-box.diff{border-color:#e39a6c;background:var(--accent-soft)}",
    ".sp-diff{font-size:12.5px;line-height:1.35;color:#a94816}.sp-diff button{font-size:12.5px}",
    // Active or Inactive: a switch
    ".sp-on{grid-area:tag;display:flex;align-items:center;gap:4px;justify-self:start}",
    ".sp-sw{position:relative;display:inline-flex;align-items:center;gap:9px;cursor:pointer;font:600 14px/1.2 system-ui,-apple-system,\"Segoe UI\",Roboto,sans-serif;color:var(--ink)}",
    ".sp .sp-sw input{position:absolute;left:0;top:0;width:40px;height:24px;min-height:0;margin:0;padding:0;opacity:0;cursor:pointer}",
    ".sp-track{position:relative;flex:none;width:40px;height:24px;border-radius:999px;background:#cfc8bd;transition:background .15s}",
    ".sp-track::after{content:\"\";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(36,34,31,.3);transition:transform .15s}",
    ".sp-sw input:checked + .sp-track{background:var(--sage)}",
    ".sp-sw input:checked + .sp-track::after{transform:translateX(16px)}",
    ".sp-sw input:focus-visible + .sp-track{outline:3px solid var(--accent-hi);outline-offset:2px}",
    ".sp-sw input:disabled + .sp-track{opacity:.55}",
    ".sp-row.off .sp-sw-w{color:var(--muted)}",
    // a "?" with a few words: on hover or focus, or a tap
    ".sp-tipw{position:relative;display:inline-flex}",
    ".sp-q{display:grid;place-items:center;width:26px;height:26px;padding:0;border:0;border-radius:50%;background:none;color:var(--soft);cursor:pointer}",
    ".sp-q svg{width:17px;height:17px}",
    ".sp-q:hover,.sp-tipw.show .sp-q{color:var(--ink)}",
    ".sp-tip{position:absolute;z-index:4;right:-12px;bottom:calc(100% + 8px);width:280px;padding:10px 12px;border-radius:10px;background:var(--char,#24221F);color:#fff;font-size:13.5px;line-height:1.45;font-weight:400;text-align:left;box-shadow:0 14px 30px -14px rgba(0,0,0,.5);opacity:0;visibility:hidden;transform:translateY(4px);transition:opacity .15s,transform .15s,visibility .15s;pointer-events:none}",
    ".sp-q:hover + .sp-tip,.sp-q:focus-visible + .sp-tip,.sp-tipw.show .sp-tip{opacity:1;visibility:visible;transform:none}",
    ".sp-btn{grid-area:act;justify-self:end;min-height:38px;padding:0 15px;font:650 14px/1 system-ui,-apple-system,\"Segoe UI\",Roboto,sans-serif;color:var(--ink);background:var(--card);border:1px solid var(--line);border-radius:999px;cursor:pointer}",
    ".sp-btn:hover{border-color:var(--ink)}",
    ".sp-none{margin:0;padding:16px 22px 18px;border-top:1px solid var(--line);color:var(--muted);font-size:14.5px}",
    ".sp-foot{margin:0;padding:12px 22px 14px;border-top:1px dashed var(--line);font-size:12.5px;line-height:1.45;color:var(--soft)}",
    ".sp-dl{display:flex;flex-wrap:wrap;gap:8px 18px;padding:12px 22px;border-top:1px solid var(--line)}",
    ".sp-dl button{display:inline-flex;align-items:center;gap:7px;padding:4px 0;border:0;background:none;font:600 14px/1.3 system-ui,-apple-system,\"Segoe UI\",Roboto,sans-serif;color:var(--ink);cursor:pointer;text-decoration:underline;text-decoration-color:var(--line);text-underline-offset:4px}",
    ".sp-dl button:hover{text-decoration-color:currentColor}.sp-dl button[disabled]{opacity:.6;cursor:progress}.sp-dl svg{width:17px;height:17px;flex:none}",
    // adding or changing one item: under its row, or at the top for a new one
    ".sp-open{list-style:none}",
    ".sp-form{padding:18px 22px 20px;background:#faf8f4;border-top:1px solid var(--line)}",
    ".sp-row.open + .sp-open .sp-form{border-top:1px dashed var(--line)}",
    ".sp-hd2 h3{font:700 18px/1.25 var(--slab);margin:0}",
    ".sp-hd2 p{margin:2px 0 14px;color:var(--muted);font-size:14px}",
    ".sp-top{display:grid;grid-template-columns:172px minmax(0,1fr);gap:20px;align-items:start}",
    ".sp-drop{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;width:172px;height:172px;padding:14px;font:inherit;font-size:13px;line-height:1.35;text-align:center;color:var(--muted);background:#fff center/cover no-repeat;border:1.5px dashed #cdc4b6;border-radius:14px;cursor:pointer;overflow:hidden;transition:border-color .15s,background-color .15s}",
    ".sp-drop svg{width:30px;height:30px;stroke-width:1.6;color:var(--soft)}",
    ".sp-drop b{color:var(--ink);font-size:14.5px;font-weight:650}",
    ".sp-drop:hover,.sp-drop.over{border-color:var(--accent);background-color:var(--accent-soft)}",
    ".sp-drop.has{justify-content:flex-end;padding:0;border-style:solid;border-color:var(--line)}",
    ".sp-drop-say{width:100%;padding:8px;background:rgba(36,34,31,.62);color:#fff;font-size:12.5px;font-weight:650}",
    ".sp-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 18px}",
    ".sp-f{display:flex;flex-direction:column;gap:5px;min-width:0}",
    ".sp-f.wide,.sp-check.wide{grid-column:1/-1}",
    ".sp-f label,.sp-lbl{font-size:14px;font-weight:650}",
    ".sp-f > input,.sp-f > select,.sp-f > textarea{width:100%;min-height:44px;font:inherit;font-size:15px;color:var(--ink);background:#fff;border:1px solid #d8d1c6;border-radius:10px;padding:9px 12px}",
    ".sp-f textarea{min-height:68px;resize:vertical}",
    ".sp-f > input:focus,.sp-f > select:focus,.sp-f > textarea:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px rgba(194,84,27,.2)}",
    ".sp-f .sp-box{height:44px}.sp-f .sp-box input{font-size:15px}",
    ".sp-f small{color:var(--soft);font-size:12.5px;line-height:1.35}",
    ".sp-lblrow{display:flex;align-items:baseline;justify-content:space-between;gap:10px}",
    ".sp-test{display:inline-flex;align-items:center;gap:4px;font-size:13px;font-weight:600;color:var(--sage);text-decoration:none;white-space:nowrap}",
    ".sp-test:hover{text-decoration:underline;text-underline-offset:3px}.sp-test svg{width:12px;height:12px}.sp-test[hidden]{display:none}",
    ".sp-activef{flex-direction:row;flex-wrap:wrap;align-items:center;gap:6px 14px;padding:11px 14px;background:#fff;border:1px solid var(--line);border-radius:12px}",
    ".sp-activef .sp-sw b{font-size:15px;font-weight:650}",
    ".sp-activef small{font-size:13.5px;color:var(--muted)}",
    ".sp-more{margin-top:16px;padding-top:12px;border-top:1px solid var(--line)}",
    ".sp-more summary{cursor:pointer;width:max-content;max-width:100%;font-size:14.5px;font-weight:650;color:var(--ink)}",
    ".sp-more summary:hover{color:var(--accent)}",
    ".sp-more[open] summary{margin-bottom:14px}",
    ".sp-kinds{display:flex;flex-wrap:wrap;gap:8px}",
    ".sp-kind{display:inline-flex;align-items:center;gap:8px;min-height:42px;padding:0 15px;font-size:14.5px;font-weight:500;background:#fff;border:1px solid #d8d1c6;border-radius:999px;cursor:pointer}",
    ".sp-kind input{margin:0;accent-color:var(--accent)}",
    ".sp-kind:has(input:checked){border-color:var(--accent);background:var(--accent-soft)}",
    ".sp-class{display:contents}.sp-class[hidden]{display:none}",
    ".sp-check{display:flex;align-items:flex-start;gap:10px;font-size:14px;color:var(--muted);cursor:pointer}",
    ".sp-check input{flex:none;width:18px;height:18px;margin:2px 0 0;accent-color:var(--accent)}",
    ".sp-check b{color:var(--ink);font-weight:650}",
    ".sp-ft{display:flex;flex-wrap:wrap;align-items:center;gap:10px 12px;margin-top:16px}",
    ".sp-ft .gap{flex:1}",
    ".sp-form > .rq-err{margin-top:12px}",
    ".sp-del{font:650 14px/1.2 system-ui,-apple-system,\"Segoe UI\",Roboto,sans-serif;color:#b4361c;background:none;border:0;padding:8px 0;cursor:pointer;text-decoration:underline;text-underline-offset:3px}",
    ".sp-sure{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;font-size:14px}",
    ".sp-sure .sp-del{min-height:40px;padding:0 14px;color:#fff;background:#b4361c;border-radius:10px;text-decoration:none}",
    ".sp-sure .sp-del:hover{background:#962b14}",
    ".sp button:focus-visible,.sp a:focus-visible,.sp summary:focus-visible{outline:3px solid var(--accent-hi);outline-offset:2px}",
    "@media (min-width:1800px){.sp-hd h2{font-size:24px}.sp-what b{font-size:17px}}",
    "@media (min-width:2400px){.sp-hd h2{font-size:27px}.sp-hd p,.sp-hd2 p{font-size:16px}.sp-what b{font-size:18.5px}.sp-m,.sp-sq,.sp-relink{font-size:14.5px}.sp-sw{font-size:15px}",
    "  .sp-row{grid-template-columns:64px minmax(0,1fr) 150px 172px 104px}.sp-pic{width:64px;height:64px}.sp-box{height:46px}.sp-box input{font-size:16.5px}.sp-btn,.sp-add{font-size:15.5px;min-height:46px}",
    "  .sp-f label,.sp-lbl{font-size:15.5px}.sp-f > input,.sp-f > select,.sp-f > textarea{font-size:16.5px;min-height:48px}.sp-f small,.sp-foot{font-size:14px}.sp-hd2 h3{font-size:21px}}",
    "@media (max-width:720px){",
    "  .sp-hd{flex-wrap:wrap;padding:16px 16px 12px}.sp-hd h2{font-size:20px}",
    "  .sp-row{grid-template-columns:52px 40px minmax(0,1fr) auto;grid-template-areas:\"pic what what what\" \"price price tag act\";gap:10px 8px;padding:12px 16px}",
    "  .sp-pic{width:52px;height:52px;align-self:start}.sp-what{align-self:center}.sp-price{align-self:center}.sp-what{padding-left:4px}.sp-box{width:100%}.sp-btn{align-self:center;padding:0 12px}",
    "  .sp-cat,.sp-none,.sp-foot{padding-left:16px;padding-right:16px}",
    "  .sp-tip{position:fixed;left:16px;right:16px;bottom:16px;width:auto;font-size:14.5px}",
    "  .sp-form{padding:16px}.sp-top{grid-template-columns:minmax(0,1fr)}.sp-drop{width:100%;height:150px}.sp-fields{grid-template-columns:minmax(0,1fr)}",
    "  .sp-ft .rq-go{flex:1 1 100%;min-height:48px;order:3}",
    "}",
    // The header's links to each part of the page ([data-portal-nav]); the part on screen is underlined
    ".sw-nav{border-top:1px solid var(--line)}",
    ".sw-nav .nav-in{max-width:1180px;margin:0 auto;padding:0 20px;display:flex;align-items:center;gap:4px;min-height:50px;overflow-x:auto;scrollbar-width:none}",
    ".sw-nav .nav-in::-webkit-scrollbar{display:none}",
    // faded at an edge with more links to slide to
    ".sw-nav .nav-in.more{-webkit-mask-image:linear-gradient(90deg,#000 85%,transparent);mask-image:linear-gradient(90deg,#000 85%,transparent)}",
    ".sw-nav .nav-in.less{-webkit-mask-image:linear-gradient(90deg,transparent,#000 15%);mask-image:linear-gradient(90deg,transparent,#000 15%)}",
    ".sw-nav .nav-in.more.less{-webkit-mask-image:linear-gradient(90deg,transparent,#000 15%,#000 85%,transparent);mask-image:linear-gradient(90deg,transparent,#000 15%,#000 85%,transparent)}",
    ".sw-nav a{position:relative;display:inline-flex;align-items:center;gap:7px;height:50px;padding:0 11px;font:600 14.5px/1 system-ui,-apple-system,\"Segoe UI\",Roboto,sans-serif;color:var(--muted);text-decoration:none;white-space:nowrap}",
    ".sw-nav a:hover,.sw-nav a.on{color:var(--ink)}",
    ".sw-nav a.on::after{content:\"\";position:absolute;left:11px;right:11px;bottom:-1px;height:3px;border-radius:3px 3px 0 0;background:var(--accent)}",
    ".sw-nav a:focus-visible{outline:3px solid var(--accent);outline-offset:-3px;border-radius:8px}",
    ".sw-nav .n{font-size:12px;font-weight:600;color:var(--muted);background:var(--stone);border-radius:999px;padding:4px 7px}",
    ".sw-nav .ask{font-size:12px;font-weight:600;color:#fff;background:var(--accent);border-radius:999px;padding:4px 8px}",
    ".sw-nav .nav-fill{flex:1}",
    ".sw-nav a.nav-edit{height:36px;padding:0 15px 0 13px;border-radius:999px;background:var(--accent);color:#fff}",
    ".sw-nav a.nav-edit:hover{background:var(--accent-hi,var(--accent));color:#fff}",
    ".sw-nav .nav-edit svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}",
    "@media (min-width:2400px){.sw-nav .nav-in{max-width:1400px}.sw-nav a{font-size:16px}}",
    "@media (max-width:1060px){.sw-nav .nav-fill,.sw-nav .nav-edit{display:none}}",   // the Edit mode card is right under the welcome
    "@media (max-width:720px){.sw-nav .nav-in{padding:0 8px;gap:0}.sw-nav a{height:46px;padding:0 10px;font-size:14px}}"
  ].join("\n");

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
      toastUndo ? h("button", { class: "undo-t", type: "button", text: "Undo", onclick: function () { var u = toastUndo; toastUndo = toastAfter = null; clearToast(); if (u) u(); } }) : null]);
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
    var pw = h("input", { type: "password", id: "swn-pw", autocapitalize: "off", autocomplete: "current-password", "aria-label": "Password" });
    var showBtn = h("button", { type: "button", onclick: function () {
      var on = pw.type === "password"; pw.type = on ? "text" : "password";
      showBtn.lastChild.textContent = on ? "Hide" : "Show"; pw.focus();
    } }, [icon("eye"), h("span", { text: "Show" })]);
    var err = h("p", { class: "err", hidden: true, role: "alert" });
    var btn = h("button", { class: "b main wide", type: "submit", text: "Log in" });
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
        h("div", { class: "center" }, [NAME ? h("p", { class: "kick" }, [icon("lock"), h("span", { text: IS_HUB ? "Client Portal" : "Owner login" })]) : null, h("h2", { text: NAME ? "Welcome, " + NAME : "Owner login" }), h("p", { text: "Type the password " + TO + " gave you." })]),
        h("label", { class: "q", for: "swn-pw", text: "Password" }),
        h("div", { class: "pw" }, [pw, showBtn]),
        err, btn,
        h("p", { class: "center", style: "font-size:15px;color:var(--muted);margin:0", text: DEMO ? "Demo password: wolf" : "Forgot it? Just ask " + TO + "." })
      ])
    ]);
    var veil = h("div", { class: "veil" + (IS_HUB ? " solid" : "") }, [form]);
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
    // On their own page, "Sent" is only ever the message in the middle. However that message is closed
    // (Done, Esc, a tap outside), the page starts fresh: no leftover "Sent" bar at the bottom.
    if (MODE === "hub" && st.sent && !els.veil) {
      st.notes.forEach(function (x) { x.pics.forEach(picDel); if (x.shot) picDel(x.shot); });
      st.notes = []; st.sent = false; st.sentNotes = st.sentPics = 0; save();
    }
    var n = st.notes.length;
    els.frame.className = "frame" + (picking ? " picking" : "");
    // on their own page with nothing written yet, only the slim "logged in" bar shows, so the boxes stay clear
    var quiet = MODE === "hub" && !st.sent && !n && !picking && !(els.note && st.notes[active]);
    els.dock.className = "dock " + MODE + (picking ? " picking" : "") + (quiet ? " quiet" : "") + (els.bare ? " bare" : "");
    if (els.spacer) els.spacer.style.height = quiet && els.bare ? "0px" : "150px";
    els.btns.textContent = "";
    els.say.textContent = "";
    if (st.sent) {
      els.say.append(h("b", { text: "Sent to " + TO + ". Thank you!" }), h("span", { text: "Nothing on your site changes until " + TO + " makes the update." }));
      els.btns.append(dockBtn("plus", "Start new notes", "main", function () { newList(); }));
    } else if (picking) {
      els.say.append(h("b", { text: canHover ? "Click exactly where the note should go." : "Now tap exactly where the note should go." }),
        h("span", { text: canHover ? "On a word, a picture, a price, anything. You can scroll first. Esc cancels." : "On a word, a picture, a price, anything. You can scroll first." }));
      els.btns.append(
        dockBtn("pencil", "Write it without tapping", "second", function () { stopPicking(); addNote(null, "Something else"); }),
        dockBtn("x", "Cancel", "second", function () { stopPicking(); }));
    } else if (MODE === "hub" && !(els.note && st.notes[active])) {
      els.say.append(
        h("b", { text: n ? plural(n, "note") + " ready" : "Tap a box to add something." }),
        h("span", { text: n ? "Add more, or send them to " + TO + " when you're done." : "Or tap Edit mode to point at things on your website." }));
      els.btns.append(dockBtn("send", "Send to " + TO, n ? "go" : "go off", function () { reviewFrom = null; if (st.notes.length) openReview(); else toast("Tap a box first. Then you can send it."); }, n));
    } else if (els.note && st.notes[active]) {
      // one thing at a time: while a note is open, the bar only points at it
      els.say.append(h("b", { text: "You're writing note " + (active + 1) + "." }), h("span", { text: "Type what you'd like, then tap Save note." }));
      els.btns.append(dockBtn("check", "Save note", "main", saveNote));
    } else {
      els.say.append(
        h("b", { text: n ? plural(n, "note") + " ready" : "Want something changed?" }),
        h("span", { text: n ? "Add more, or send them to " + TO + " when you're done." : "Tap Add a note, then tap the part of the page." }));
      els.btns.append(
        dockBtn("note", "Add a note", "main", startPicking),
        dockBtn("photo", "Add photos", "second", function () { addNote(null, "Photos for the site", null, true); }),
        dockBtn("send", "Send to " + TO, n ? "go" : "go off", function () { reviewFrom = null; if (st.notes.length) openReview(); else toast("Add a note first. Then you can send it."); }, n));
    }
    els.btns.className = "btns n" + els.btns.children.length;
    placePins();
  }
  function dockBtn(ic, text, kind, fn, count) {
    var b = h("button", { class: "db " + kind, type: "button", onclick: fn }, [icon(ic), h("span", { text: text })]);
    if (count) b.appendChild(h("span", { class: "badge", text: String(count), "aria-label": plural(count, "note") }));
    return b;
  }

  function placePins() {
    if (!els.pins) return;
    els.pins.textContent = "";
    if (st.sent) return;
    var base = host.getBoundingClientRect();
    st.notes.forEach(function (n, i) {
      if (!n.path || n.page !== location.pathname) return;
      var node = nodeAt(n.path); if (!node) return;
      var r = node.getBoundingClientRect(); if (!r.width && !r.height) return;
      var pin = h("button", { class: "pin" + (i === active ? " on" : "") + (n.id === lastPin ? " drop" : ""), type: "button", "aria-label": "Note " + (i + 1) + ". Tap to open it.", text: String(i + 1),
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
      if (target.hasAttribute("data-note-fields")) { note.fields = target.getAttribute("data-note-fields").split("|"); note.vals = {}; note.extra = ""; }
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

  function openNote(i, wantPhotos) {
    if (st.notes[i] && st.notes[i].pg && photosBox()) return openPhotos();   // the Photos box's note lives on the Photos page
    remember(); closePanels();
    active = i; panel = "note";
    var note = st.notes[i], phone = isPhone();
    var text = h("textarea", { id: "swn-text", placeholder: note.hint || "For example: Change the price to $32.", onkeydown: function (e) { if (e.key === "Escape") saveNote(); } });
    text.value = note.fields ? note.extra || "" : note.text;
    // A box can ask for a few named things, one line each (like Facebook, Instagram...).
    // "Label" or "Label=example text"
    var fieldEls = (note.fields || []).map(function (raw, k) {
      var f = raw.split("=")[0], ex = raw.split("=")[1];
      var b = !ex && BRANDS[f.toLowerCase()], kind = !ex && !b && FIELD_KINDS[f.toLowerCase()];
      var inp = h("input", b ? { type: "text", id: "swn-f" + k, inputmode: "url", autocapitalize: "off", autocomplete: "off", placeholder: b.ph }
                             : { type: "text", id: "swn-f" + k, inputmode: kind ? kind.mode : "text", autocapitalize: kind && kind.mode !== "text" ? "off" : null, autocomplete: "off",
                                 placeholder: ex || (kind ? kind.ph : "Type it here") });
      inp.value = (note.vals && note.vals[f]) || "";
      // Already on their site: show it, with a Change button. Only a tap on Change opens the box,
      // filled in with what's there now, so they fix it instead of typing it all again.
      var now = note.now && note.now[f], slot = inp, fe = { name: f, input: inp, brand: !!b, now: now || "" };
      if (now) {
        var cur = h("div", { class: "cur" }), ed = h("div", { class: "ed" });
        var open = function (on, focus) {
          fe.editing = on; cur.hidden = on; ed.hidden = !on;
          if (on && !inp.value) inp.value = now;
          if (!on) inp.value = "";
          if (on && focus) { inp.focus(); try { inp.select(); } catch (e) {} }
        };
        cur.append(icon("check"), h("span", { class: "val" }, now.replace(/([@\/?])/g, "$1\u0001").split("\u0001").reduce(function (a, p, i) { if (i) a.push(h("wbr")); a.push(p); return a; }, [])), h("button", { class: "chg", type: "button", text: "Change", "aria-label": "Change " + f, onclick: function () { open(true, true); } }));
        ed.append(inp, h("button", { class: "undo", type: "button", text: "Undo", "aria-label": "Keep " + f + " as it is", onclick: function () { open(false); } }));
        slot = h("div", { class: "fv" }, [cur, ed]);
        open(!!inp.value && inp.value !== now);
      }
      fe.row = b ? h("div", { class: "field brand" }, [brandLogo(b), h(now ? "span" : "label", now ? { class: "lb", text: f === "Google" ? "Google business" : f } : { for: "swn-f" + k, text: f === "Google" ? "Google business" : f }), slot])
                 : h("div", { class: "field" }, [h(now ? "span" : "label", now ? { class: "lb", text: f } : { for: "swn-f" + k, text: f }), slot]);
      return fe;
    });
    var brands = fieldEls.length && fieldEls.every(function (f) { return f.brand; });
    var hasNow = fieldEls.some(function (f) { return f.now; });
    if (note.fields) { text.placeholder = "Anything else? (You can leave this empty.)"; text.style.minHeight = "70px"; }
    text.addEventListener("paste", function (e) { var f = e.clipboardData && e.clipboardData.files; if (f && f.length) { e.preventDefault(); addPictures(f); } });
    var thumbs = h("div", { class: "thumbs" });
    var drop = h("button", { class: "add-ph" + (note.photos ? " big" : ""), type: "button", onclick: function () { els.file.click(); } }, [
      icon("photo"), h("div", {}, [h("b", { text: dropTitle(note, phone) }), h("span", { text: phone ? "From your photos, or take a new one" : "Click to choose, or drag them here from your computer" })])]);
    // Ideas for what to send ("A shed on a finished gravel pad"): one tap puts the words on a photo.
    var ideas = note.photos && note.ideas && note.ideas.length ? h("div", { class: "ideas" }, [
      h("p", {}, [h("b", { text: "Need ideas?" }), " These would help most. Tap one to label a photo with it."]),
      h("div", { class: "chips" }, note.ideas.map(function (idea) {
        return h("button", { class: "chip", type: "button", text: idea, onclick: function () { useIdea(note, idea); } });
      }))]) : null;

    if (note.photos) { text.placeholder = "Anything else about these photos? (optional)"; text.style.minHeight = "70px"; }
    var card = h("div", { class: "card note" + (brands || hasNow || note.photos ? " wide" : "") + (note.photos ? " photos" : "") + (phone ? " sheet" : ""), role: "dialog", tabindex: "-1", "aria-label": "Note " + (i + 1) + ", about " + short(note.on, 60) }, [
      h("div", { class: "dropcover", "aria-hidden": "true" }, [icon("photo"), h("b", { text: "Drop your photos here" })]),
      h("div", { class: "hd" }, [
        h("span", { class: "num", text: String(i + 1) }),
        h("div", { class: "grow" }, [h("h2", { text: note.text || note.pics.length ? "Your note" : "New note" })]),
        h("button", { class: "xbtn", type: "button", "aria-label": "Close and keep this note", onclick: saveNote }, [icon("x")])
      ]),
      h("div", { class: "bd" }, [
        h("div", { class: "where" }, [h("span", { text: "About:" }), h("b", { text: note.on })]),
        h("label", { class: "q", for: note.fields ? "swn-f0" : "swn-text", text: note.ask || "What would you like changed?" }),
        brands ? h("p", { class: "tip" }, [icon("help"), h("span", { text: "Not sure where to find it? Open your page, then copy the address from the top of the screen." })]) : null,
        note.fields ? h("div", { class: "fields" + (brands ? " brands" : fieldEls.some(function (f) { return f.name.length > 11; }) ? " stack" : "") }, fieldEls.map(function (f) { return f.row; })) : null,
        note.photos ? drop : null, note.photos ? thumbs : null, ideas,
        text, note.photos ? null : thumbs, note.photos || note.fields ? null : drop
      ]),
      h("div", { class: "ft" }, [
        h("button", { class: "b danger", type: "button", onclick: function () { removeNote(active); } }, [icon("trash"), h("span", { text: "Delete" })]),
        h("button", { class: "b main push", type: "button", onclick: saveNote }, [icon("check"), h("span", { text: note.photos ? "Save photos" : "Save note" })])
      ])
    ]);
    // Files dragged anywhere over the note: the whole card lights up and takes them.
    var depth = 0;
    card.addEventListener("dragenter", function (e) { if (!hasFiles(e)) return; e.preventDefault(); depth++; card.classList.add("dropping"); });
    card.addEventListener("dragover", function (e) { if (!hasFiles(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = "copy"; });
    card.addEventListener("dragleave", function () { if (--depth <= 0) { depth = 0; card.classList.remove("dropping"); } });
    card.addEventListener("drop", function (e) { if (!hasFiles(e)) return; e.preventDefault(); e.stopPropagation(); depth = 0; card.classList.remove("dropping"); addPictures(e.dataTransfer.files); });
    els.note = { card: card, text: text, thumbs: thumbs, drop: drop, fields: fieldEls };
    layer.appendChild(card);
    els.dock.hidden = phone;
    drawThumbs(note, thumbs, true);
    render();
    if (phone && note.path) {               // keep the spot in view above the sheet
      var node = nodeAt(note.path);
      if (node) { var r = node.getBoundingClientRect(); window.scrollBy({ top: r.top - window.innerHeight * 0.18, behavior: reduceMotion ? "auto" : "smooth" }); }
    }
    placeNoteCard();
    if (wantPhotos) els.file.click();
    else if (!phone) { var first = fieldEls.length ? fieldEls[0].input : text; try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); } }
    else { try { card.focus({ preventScroll: true }); } catch (e) {} }   // phones: no keyboard popping up yet, but focus is in the note
  }
  // Big screens: the note box sits next to its pin. Phones: it's a sheet at the bottom.
  function placeNoteCard() {
    if (!els.note || panel !== "note") return;
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
      var ph = h("span", { class: "ph" }, [img, editable ? h("button", { class: "rm", type: "button", "aria-label": "Take out photo " + (k + 1), onclick: function () {
        note.pics.splice(note.pics.indexOf(id), 1); delete note.caps[id]; picDel(id); save(); drawThumbs(note, box, true); refreshDrop(note);
      } }, [icon("x")]) : null]);
      var cap = withCaps ? h(note.photos ? "textarea" : "input", { class: "cap", rows: note.photos ? "2" : null, type: note.photos ? null : "text", maxlength: "140", autocomplete: "off", "aria-label": "What is photo " + (k + 1) + "? (optional)",
        placeholder: k === 0 && !note.photos && CAPTION_EXAMPLE ? "What is this? For example: " + CAPTION_EXAMPLE : "What is this? (optional)",
        oninput: function () { var v = this.value.trim(); if (v) note.caps[id] = v; else delete note.caps[id]; img.alt = v || "Photo " + (k + 1); save(); } }) : null;
      if (cap) cap.value = note.caps[id] || "";
      box.appendChild(h("span", { class: "t", "data-id": id }, [ph, cap]));
    });
    if (editable && note.pics.length > CAPS_AT && !note.showCaps)
      box.appendChild(h("button", { class: "capts", type: "button", text: "Say what these are (optional)",
        onclick: function () { note.showCaps = true; save(); drawThumbs(note, box, true); var f = box.querySelector(".cap"); if (f) f.focus(); } }));
  }
  function dropTitle(note, phone) {
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
  function saveNote() {
    var note = st.notes[active];
    if (note && els.note && note.fields) {
      note.extra = els.note.text.value.trim();
      var lines = [];
      els.note.fields.forEach(function (f) {
        var v = f.input.value.trim(), name = f.name.replace(/[?:.]+$/, "");
        if (f.now) { if (!f.editing || !v || v === f.now) v = ""; }   // left as it is
        note.vals[f.name] = v;
        if (v) lines.push(name + ": " + v + (f.now ? " (was " + f.now + ")" : ""));
      });
      note.text = lines.concat(note.extra ? [note.extra] : []).join("\n");
    } else if (note && els.note) note.text = els.note.text.value.trim();
    var kept = note && (note.text || note.pics.length);
    if (note && !kept) st.notes.splice(active, 1);                    // an empty note is dropped
    closePanels(); save(); render();
    if (kept) toast(st.notes.length === 1 ? "Note saved. Add another, or tap Send to " + TO + "." : "Note saved.");
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
  function still() { document.documentElement.classList.toggle("swn-still", !!(els.veil || els.lb || panel === "photos")); }
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
  // on first (default: the box itself, so it reads its name). opts.close: what Esc or a tap outside does.
  function veil(card, opts) {
    opts = opts || {};
    remember();
    var keep = panel; closePanels(); panel = keep;      // closing the last box mustn't forget which box this is
    if (!toastUndo) clearToast();                        // a big message replaces a small one (but keeps an Undo)
    card.setAttribute("aria-modal", "true"); card.setAttribute("tabindex", "-1");
    els.veilClose = opts.close || function () { closePanels(); render(); };
    els.veil = h("div", { class: "veil", onclick: function (e) { if (e.target === els.veil && !busy) els.veilClose(); } }, [card]);
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
            here ? h("button", { class: "b quiet", type: "button", onclick: function () { openNote(i); } }, [icon("pencil"), h("span", { text: "Change" })])
                 : h("button", { class: "b quiet", type: "button", onclick: function () { if (!note.hub) lsSet("on", "1"); location.href = note.page; } }, [icon("arrow"), h("span", { text: note.hub ? "Go to your portal" : "Go to that page" })]),
            h("button", { class: "b danger", type: "button", onclick: function () { removeNote(i, true); } }, [icon("trash"), h("span", { text: "Delete" })])
          ])
        ])
      ]));
    });
    var progress = h("div", { class: "bar", hidden: true }, [h("i")]);
    var err = h("p", { class: "err", hidden: !errText, role: "alert" });
    if (errText) err.append.apply(err, [].concat(errText));
    var sendBtn = h("button", { class: "b go", type: "button", onclick: function () { send(sendBtn, progress, err); } }, [icon("send"), h("span", { text: "Send to " + TO })]);
    veil(h("div", { class: "card", role: "dialog", "aria-label": "Ready to send" }, [
      h("div", { class: "hd" }, [
        h("div", { class: "grow" }, [h("h2", { text: "Ready to send?" }), h("p", { text: plural(n, "note") + (pics ? " and " + plural(pics, "photo") : "") + ". Check them over, then tap Send." })]),
        h("button", { class: "xbtn", type: "button", "aria-label": "Close", onclick: function () { if (!busy) backFromReview(); } }, [icon("x")])
      ]),
      h("div", { class: "bd" }, [list, h("div", { class: "calm" }, [icon("check"), h("span", { text: "Your website stays exactly as it is until " + TO + " makes the change." })])]),
      h("div", { class: "ft", style: "flex-direction:column;align-items:stretch" }, [progress, err,
        h("div", { style: "display:flex;gap:10px;flex-wrap:wrap" }, [
          h("button", { class: "b plain", type: "button", text: reviewFrom === "photos" ? "Keep adding photos" : "Keep adding notes", onclick: function () { if (!busy) backFromReview(); } }),
          h("span", { class: "push" }), sendBtn])])
    ]), { close: backFromReview });
    els.dock.hidden = isPhone();
  }

  function send(btn, progress, err) {
    if (busy || !st.notes.length) return;
    busy = true; btn.disabled = true; err.hidden = true;
    var token = getToken(), total = picCount(), doneN = 0, label = btn.lastChild;
    var bar = progress.firstChild;
    var step = function (t, frac) { label.textContent = t; if (total) { progress.hidden = false; bar.style.width = Math.round(frac * 100) + "%"; } };
    var failWith = function (d) {
      busy = false; btn.disabled = false; label.textContent = "Try again"; progress.hidden = true;
      err.textContent = "";
      if (d.status === 401) {
        setToken(null);
        err.append("Your login timed out. Your notes are safe on this device. ", h("a", { href: LOGIN_URL, text: "Log in again" }), " and then tap Send.");
      } else err.textContent = (d.status === 0 ? "Your internet seems to be off." : "That didn't go through.") + " Your notes are safe on this device. Tap Try again in a minute.";
      err.hidden = false;
    };
    if (!token && !DEMO) { failWith({ status: 401 }); return; }
    step(total ? "Sending photo 1 of " + total + "…" : "Sending…", 0.02);
    var ids = []; st.notes.forEach(function (n) { n.pics.forEach(function (id) { ids.push(id); }); });
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
      return st.notes.reduce(function (p, n) {
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
      var body = { notes: st.notes.map(function (n) {
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
        st.sent = true; st.sentNotes = body.notes.length; st.sentPics = total; save();
        heads_up(body.notes.length, total);
        showSent();
      });
    });
  }
  function showSent() {
    panel = "sent";
    var done = function () {
      if (MODE !== "hub") { closePanels(); render(); return; }
      var back = reviewFrom === "photos"; reviewFrom = null; newList(true);
      loadRequests();                               // what they just sent joins "Your requests"
      if (back) openPhotos();                       // back to the Photos page, where the new ones now show as sent
    };
    var doneBtn = h("button", { class: "b main wide", type: "button", text: "Done", onclick: done });
    veil(h("div", { class: "card", role: "dialog", "aria-label": "Sent" }, [
      h("div", { class: "bd center", style: "padding-top:26px;gap:8px" }, [
        h("div", { class: "done-ic pop" }, [icon("check")]),
        h("h2", { text: "Sent!" }),
        h("p", { text: TO + " has your " + (st.sentNotes === 1 ? "note" : plural(st.sentNotes, "note")) + (st.sentPics ? " and " + plural(st.sentPics, "photo") : "") + "." }),
        h("p", { text: "You'll hear back soon. Nothing on your website changes until " + TO + " makes the update." })
      ]),
      h("div", { class: "ft" }, [doneBtn])
    ]), { focus: doneBtn, close: done });
    render();
  }
  function newList(quietly) {
    st.notes.forEach(function (n) { n.pics.forEach(picDel); if (n.shot) picDel(n.shot); });
    st.notes = []; st.sent = false; st.sentNotes = st.sentPics = 0; save(); closePanels(); render();
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
    var gotIt = h("button", { class: "b main wide", type: "button", text: first ? "Got it. Let's start." : "Got it", onclick: function () { st[MODE === "edit" ? "intro" : "introHub"] = true; save(); tuckAway(this.closest(".card")); } });
    var step = function (n, ic, title, text) { return h("li", {}, [h("div", { class: "circ" }, [icon(ic), h("i", { text: String(n) })]), h("div", {}, [h("b", { text: title }), h("span", { text: text })])]); };
    veil(h("div", { class: "card help", role: "dialog", "aria-label": "How this works" }, [
      h("div", { class: "hd" }, [
        h("div", { class: "grow" }, [h("h2", { text: first ? (MODE === "edit" ? "You're in Edit mode. Here's how it works." : "Welcome! Here's how it works.") : "How this works" }), h("p", { text: MODE === "edit" ? "Leave notes for " + TO + " right on your own website." : "This is your Client Portal for sending " + TO + " what you need." })]),
        h("button", { class: "xbtn", type: "button", "aria-label": "Close", onclick: function () { closePanels(); render(); } }, [icon("x")])
      ]),
      h("div", { class: "bd" }, [
        MODE === "edit" ? h("ol", { class: "steps" }, [
          step(1, "note", "Tap “Add a note”", "It's the orange button at the bottom of the screen."),
          step(2, "tap", "Tap right where you want the note", "On a price, a sentence, a picture. Anything. The note goes exactly there."),
          step(3, "pencil", "Say what you'd like", "Type it in your own words. Add photos if you have them."),
          step(4, "send", "Tap “Send to " + TO + "”", "Do this once you've added all your notes.")
        ]) : h("ol", { class: "steps" }, [
          step(1, "tap", "Tap a box", "Each box is one thing " + TO + " needs, like your logo or photos."),
          step(2, "photo", "Type it, or add photos", "Then tap Save note."),
          step(3, "pencil", "Want something changed on your website?", "Tap Edit mode. You'll go to your website and can tap the part you mean."),
          step(4, "send", "Tap “Send to " + TO + "”", "Do this once you're done.")
        ]),
        h("div", { class: "calm" }, [icon("check"), h("span", { text: "You can't break anything. Your website stays exactly as it is until " + TO + " makes the change." })])
      ]),
      h("div", { class: "ft" }, [gotIt])
    ]), { focus: gotIt });
    els.dock.hidden = isPhone();
  }
  // "Got it": the steps shrink down into the bar at the bottom ("Edit mode is on" / "You're logged in"),
  // so it's clear where they went and that the mode is still on. Help in that bar brings them back.
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
    var dl = h("a", { class: "b plain", href: "" }, [icon("download"), h("span", { text: "Download" })]);
    var show = function (i) {
      at = (i + items.length) % items.length; var it = items[at];
      pic.src = it.src; pic.alt = it.title || "";
      dl.href = it.src; dl.download = fileName(it.title, extFor(blobs[it.src] && blobs[it.src].type, it.src));
      dl.setAttribute("aria-label", "Download " + (it.title || "this photo"));
      title.textContent = it.title || "Photo";
      cap.textContent = (items.length > 1 ? "Photo " + (at + 1) + " of " + items.length + (it.cap ? " · " : "") : "") + (it.cap || "");
    };
    var nav = items.length > 1 ? [h("button", { class: "nav l", type: "button", "aria-label": "Previous photo", onclick: function () { show(at - 1); } }, [icon("arrow")]),
                                  h("button", { class: "nav r", type: "button", "aria-label": "Next photo", onclick: function () { show(at + 1); } }, [icon("arrow")])] : [];
    var card = h("div", { class: "card photo", role: "dialog", "aria-modal": "true", "aria-label": "Photo" }, [
      h("div", { class: "hd" }, [h("div", { class: "grow" }, [title]), h("button", { class: "xbtn", type: "button", "aria-label": "Close", onclick: closeLb }, [icon("x")])]),
      h("div", { class: "bd" }, [h("div", { class: "shot" }, [pic].concat(nav)), cap]),
      h("div", { class: "ft" }, [
        swap ? h("button", { class: "b plain", type: "button", onclick: function () { var it = items[at]; closeLb(); swap(it); } }, [icon("photo"), h("span", { text: "Swap this one" })]) : null,
        dl,
        h("button", { class: "b main push", type: "button", text: "Close", onclick: closeLb })
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
  // Opened by the Photos box (data-photos-page) or <portal>#photos. Three parts: add new photos
  // (one note, sent like any other), every photo they've sent with its status: "On your
  // site" / "Approved" / "Received" / "Not used", and the photos on their site now. Back (or the browser's Back) returns to the portal;
  // photos they added stay saved on this device until they send them.
  var reviewFrom = null;
  function photosBox() { return MODE === "hub" ? document.querySelector("[data-photos-page]") : null; }
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
    var i = -1; st.notes.forEach(function (n, k) { if (n.pg) i = k; });
    if (i < 0) { var made = makeNote(box, box.getAttribute("data-area") || "Photos"); made.pg = true; made.photos = true; st.notes.push(made); save(); i = st.notes.length - 1; }
    active = i; panel = "photos";
    var note = st.notes[i], phone = isPhone();
    if (!fromHistory && location.hash !== "#photos") { try { history.pushState({ swnPhotos: 1 }, "", "#photos"); } catch (x) {} }

    // 1. new photos
    var thumbs = h("div", { class: "thumbs" });
    var drop = h("button", { class: "add-ph big", type: "button", onclick: function () { els.file.click(); } }, [
      icon("photo"), h("div", {}, [h("b", { text: dropTitle(note, phone) }), h("span", { text: phone ? "From your photos, or take a new one" : "Click to choose, or drag them here from your computer" })])]);
    var text = h("textarea", { id: "swn-text", placeholder: "Anything else about these photos? (optional)", oninput: function () { note.text = this.value.trim(); save(); } });
    text.value = note.text || ""; text.style.minHeight = "70px";
    text.addEventListener("paste", function (e) { var f = e.clipboardData && e.clipboardData.files; if (f && f.length) { e.preventDefault(); addPictures(f); } });
    var sendBtn = h("button", { class: "b go", type: "button", onclick: function () {
      note.text = text.value.trim(); save();
      if (!note.pics.length && !note.text) { toast("Add a photo first. Then you can send it."); return; }
      reviewFrom = "photos"; closePanels(); openReview();
    } }, [icon("send"), h("span", { text: "Send to " + TO })]);
    var addSec = h("section", { class: "pg-sec add", "aria-label": "Send new photos" }, [
      h("div", { class: "pg-hd" }, [h("h2", { text: "Send new photos" })]),
      drop, thumbs, text, h("div", { class: "pg-act" }, [sendBtn])]);

    // 2. what they've sent, and which of those are on the site
    var sentSum = h("p", { class: "pg-sub", text: "Loading…" }), sentGrid = h("div", { class: "pg-grid", hidden: true }), sentNone = h("p", { class: "pg-none", hidden: true });
    var sentDl = dlButton("Download all", function () {}, null, "Every photo you've sent, in one .zip file.");
    sentDl.hidden = true;
    var sentSec = h("section", { class: "pg-sec sent", "aria-label": "Photos you sent" }, [h("div", { class: "pg-hd" }, [h("div", { class: "grow" }, [h("h2", { text: "Photos you sent" }), sentSum]), sentDl]), sentGrid, sentNone]);

    // 3. on the site now
    var site = sitePhotos(), siteSec = null;
    if (site.list.length) {
      var siteItems = site.list.map(function (p) { return { src: p.src, title: p.title || "On your site", cap: p.on.length ? p.on.join(", ") : "on your website now" }; });
      siteSec = h("section", { class: "pg-sec site", "aria-label": "On your site now" }, [
        h("div", { class: "pg-hd" }, [h("div", { class: "grow" }, [h("h2", { text: "On your site now" }), h("p", { class: "pg-sub", text: plural(site.list.length, "photo") + ". Tap one to see it bigger." })]),
          dlButton("Download all", function (b) { downloadAll(siteItems, fileName((NAME || "website") + " photos on the website", "zip"), b); }, null, "Every photo on your website, in one .zip file, each named for what it shows.")]),
        h("div", { class: "pg-grid" }, site.list.map(function (p, k) {
          return h("button", { class: "pg-ph", type: "button", "aria-label": (p.title || "Photo " + (k + 1)) + ". See it bigger.", onclick: function () { lightbox(siteItems, k, function (it) { askSwap(it.title); }); } }, [
            h("span", { class: "im" }, [h("img", { src: p.thumb, alt: "", loading: "lazy", decoding: "async" })]),
            h("span", { class: "tag on" }, [icon("check"), h("span", { text: "On your site" })]),
            p.on.length ? h("span", { class: "dt", text: p.on.join(", ") }) : null]);
        })),
        site.more ? h("p", { class: "pg-more" }, [site.more + " ", site.moreUrl ? h("a", { href: site.moreUrl, target: "_blank", rel: "noopener", text: "See them" }) : null]) : null]);
    }

    var page = h("div", { class: "pg note photos", role: "dialog", "aria-modal": "true", "aria-label": "Your photos" }, [
      h("div", { class: "dropcover", "aria-hidden": "true" }, [icon("photo"), h("b", { text: "Drop your photos here" })]),
      h("div", { class: "pg-top" }, [h("div", { class: "pg-top-in" }, [
        h("button", { class: "pg-back", type: "button", onclick: backFromPhotos }, [icon("arrow"), h("span", { text: phone ? "Back" : "Back to your portal" })]),
        h("h1", { text: "Your photos" })])]),
      h("div", { class: "pg-in" }, [addSec, sentSec, siteSec])
    ]);
    var depth = 0;
    page.addEventListener("dragenter", function (e) { if (!hasFiles(e)) return; e.preventDefault(); depth++; page.classList.add("dropping"); });
    page.addEventListener("dragover", function (e) { if (!hasFiles(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = "copy"; });
    page.addEventListener("dragleave", function () { if (--depth <= 0) { depth = 0; page.classList.remove("dropping"); } });
    page.addEventListener("drop", function (e) { if (!hasFiles(e)) return; e.preventDefault(); e.stopPropagation(); depth = 0; page.classList.remove("dropping"); addPictures(e.dataTransfer.files); });

    els.note = { card: page, text: text, thumbs: thumbs, drop: drop, fields: [], page: true };
    layer.appendChild(page);
    els.dock.hidden = true;
    els.scrollWas = document.documentElement.style.overflow; document.documentElement.style.overflow = "hidden";
    drawThumbs(note, thumbs, true);
    render(); still();
    loadSent(sentGrid, sentSum, sentNone, sentDl);
    try { page.querySelector(".pg-back").focus({ preventScroll: true }); } catch (x) {}
  }
  // Leaving the page (Back, Esc, or Send): an empty photos note is dropped, the rest stays saved.
  function leavePhotos() {
    var note = st.notes[active];
    if (note && els.note && els.note.page) note.text = els.note.text.value.trim();
    if (note && note.pg && !note.text && !note.pics.length) { st.notes.splice(active, 1); }
    save();
    document.documentElement.style.overflow = els.scrollWas || "";
    if (location.hash === "#photos") { try { history.replaceState(null, "", location.pathname + location.search); } catch (x) {} }
  }
  function backFromPhotos() {
    var note = st.notes[active];
    if (note && note.pics.length) closedToast = "Your photos are saved. Tap Send when you're ready.";
    if (history.state && history.state.swnPhotos && location.hash === "#photos") { history.back(); return; }   // the browser's Back closes it
    photosClosed();
  }
  var closedToast = "";
  function photosClosed() { closePanels(); render(); if (closedToast) toast(closedToast); closedToast = ""; }
  function backFromReview() {
    var back = reviewFrom === "photos" && MODE === "hub"; reviewFrom = null;
    closePanels(); render();
    if (back) openPhotos();
  }
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
        grid.appendChild(h("button", { class: "pg-ph", type: "button", "aria-label": (p.caption || "Photo " + (k + 1)) + ". " + items[k].cap + ". See it bigger.", onclick: function () {
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

  // A few headline numbers from Google Analytics for their page ([data-stats]). The notes service
  // asks GA4 and sends them back; with no numbers (or an older service) the card just stays hidden.
  // Same words as the admin's Analytics tab (admin-cockpit/analytics-wording.md), so client and Jeremy match.
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function shortDate(d) { return MON[d.getUTCMonth()] + " " + d.getUTCDate(); }
  function loadStats() {
    var box = document.querySelector("[data-stats]"); if (!box) return;
    var got = DEMO ? Promise.resolve({ ok: true, sample: true, days: 28, visitors: 109, visitorsPrev: 91, visitorsChange: 20, calls: 8, callsPrev: 4, callsChange: 100,
                                       leads: 3, leadsPrev: 0, leadsChange: 0, source: "Google", daily: { start: new Date(Date.now() - 28 * 864e5).toISOString().slice(0, 10) } })
                   : api("/api/stats", { token: getToken(), body: { site: SITE } });
    got.then(function (d) {
      if (!d || !d.ok || d.visitors == null) return;
      var n = function (v) { return (Number(v) || 0).toLocaleString("en-US"); };
      // say the period in plain words: 28 days = "4 weeks"
      var days = d.days || 28, span = days % 7 === 0 ? (days / 7) + " weeks" : days + " days";
      // no-break spaces keep "the 4 weeks before" together when the line wraps
      var before = ("the " + span + " before").replace(/ /g, "\u00a0");
      // ▲ 4 more than the 4 weeks before / ▼ 3 fewer than the 4 weeks before / Same as the 4 weeks before / None in the 4 weeks before
      var change = function (now, prev, pct) {
        if (typeof prev === "number") {
          if (prev === 0) return now ? { t: "None in " + before } : { t: "Same as " + before };
          var diff = now - prev;
          return diff > 0 ? { t: "▲ " + n(diff) + " more than " + before, c: "up" } : diff < 0 ? { t: "▼ " + n(-diff) + " fewer than " + before, c: "down" } : { t: "Same as " + before };
        }
        if (typeof pct === "number" && pct !== 0) return pct > 0 ? { t: "▲ " + pct + "% more than " + before, c: "up" } : { t: "▼ " + -pct + "% fewer than " + before, c: "down" };
        return null;
      };
      // nothing at all from the 4 weeks before (tracking is new): say it once in the footnote, not under every number
      var fresh = [d.visitorsPrev, d.callsPrev, d.leadsPrev].every(function (p) { return p === 0; });
      var put = function (k, now, prev, pct) {
        var el = box.querySelector('[data-stat="' + k + '"]'); if (!el) return;
        el.textContent = n(now);
        var ch = fresh ? null : change(Number(now) || 0, prev, pct); if (!ch) return;
        var slot = box.querySelector('[data-chg="' + k + '"]');
        if (slot) { slot.textContent = ch.t; slot.className = ch.c || ""; }
        else el.appendChild(h("small", { class: ch.c || "", text: ch.t }));
      };
      put("visitors", d.visitors, d.visitorsPrev, d.visitorsChange);
      put("calls", d.calls, d.callsPrev, d.callsChange);
      put("leads", d.leads, d.leadsPrev, d.leadsChange);
      // the period, with real dates when the service sends the daily numbers
      var r = box.querySelector('[data-stat="range"]');
      if (r) {
        var t = "Last " + span;
        if (d.daily && d.daily.start) { var s0 = new Date(d.daily.start + "T00:00:00Z"); if (!isNaN(s0)) t += " · " + shortDate(s0) + " – " + shortDate(new Date(s0.getTime() + (days - 1) * 864e5)); }
        r.textContent = t;
      }
      // one short line above the numbers: "109 people visited. 11 reached out."
      var sum = box.querySelector('[data-stat="summary"]');
      if (sum) {
        var out = (Number(d.calls) || 0) + (Number(d.leads) || 0), v = Number(d.visitors) || 0;
        sum.textContent = "";
        sum.append(h("b", { text: n(v) + (v === 1 ? " person" : " people") }), " visited. ");
        if (out) sum.append(h("b", { class: "out", text: n(out) + " reached out." }));
        else sum.append("Nobody reached out yet.");
      }
      var src = box.querySelector('[data-stat="note"]');
      if (fresh && src && !/compare/.test(src.textContent)) src.textContent += " · Nothing earlier to compare yet";
      if (d.sample) { var note = box.querySelector(".stats-f"); if (note && !note.querySelector(".sample")) note.appendChild(h("span", { class: "sample", text: "Sample" })); }
      box.hidden = false;
    });
  }

  // The header's links ([data-portal-nav] in their page's header): one for each part of the page marked
  // data-nav="Label" (with an id), in page order, leaving out a part that is hidden (no requests yet, no shop).
  // Requests says when a question is waiting for them, the shop how many items it has. The part on screen is
  // underlined as they scroll; on a phone the row slides sideways to keep it in view. A click scrolls there
  // without changing the address (#photos opens the Photos page). The Edit mode card ([data-edit-mode]) gets
  // a button at the end, which opens Edit mode the same way.
  var navParts = [], navSig = "";
  function drawNav() {
    var nav = document.querySelector("[data-portal-nav]"); if (!nav) return;
    var parts = [].filter.call(document.querySelectorAll("[data-nav]"), function (el) { return !el.closest("[hidden]"); });
    var asks = reqs.filter(function (r) { return r.status === "question"; }).length, open = reqs.filter(function (r) { return !reqClosed(r); }).length;
    var extra = function (el) {
      if (el.matches("[data-requests]")) return asks ? h("span", { class: "ask", text: asks === 1 ? "1 question" : asks + " questions", title: TO + " asked you something. Answer it under Your requests." })
        : open ? h("span", { class: "n", text: String(open), title: plural(open, "request") + " still open" }) : null;
      if (el.matches("[data-form-portal]") && fpNew()) return h("span", { class: "n", text: String(fpNew()), title: plural(fpNew(), "new message") + " from your website" });
      if (el.matches("[data-shop-portal]") && spShop) return h("span", { class: "n", text: String(spShop.items.length), title: plural(spShop.items.length, "item") + " in your shop" });
      return null;
    };
    var edit = document.querySelector("[data-edit-mode]");
    var sig = parts.map(function (el) { var x = extra(el); return el.getAttribute("data-nav") + (x ? x.textContent : ""); }).join("|") + (edit ? "|edit" : "");
    if (sig === navSig) return spy();
    navSig = sig;
    var row = h("div", { class: "nav-in", onscroll: function () { navMore(row); } });
    navParts = parts.map(function (el) {
      var a = h("a", { href: "#" + (el.id || ""), onclick: function (e) { e.preventDefault(); goToPart(el); } }, [h("span", { text: el.getAttribute("data-nav") }), extra(el)]);
      row.appendChild(a);
      return { el: el, a: a };
    });
    if (edit) row.append(h("span", { class: "nav-fill" }), h("a", { class: "nav-edit", href: edit.getAttribute("href") || "/", "data-edit-mode": edit.getAttribute("data-edit-mode") || "", title: "Open your website to point at what you'd like changed" }, [icon("pencil"), h("span", { text: "Edit my website" })]));
    nav.textContent = ""; nav.appendChild(row); nav.hidden = !navParts.length;
    headRoom(); spy(true);
  }
  // Leave room for the header when the browser scrolls to a part (Tab, Find on page, our links).
  function headRoom() { var hd = document.querySelector("[data-portal-nav]"); hd = hd && hd.closest("header"); if (hd) document.documentElement.style.scrollPaddingTop = (hd.offsetHeight + 12) + "px"; }
  function goToPart(el) {
    var hd = document.querySelector("[data-portal-nav]").closest("header"), off = hd ? hd.offsetHeight + 12 : 12;
    window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - off), behavior: reduceMotion ? "auto" : "smooth" });
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");   // so Tab carries on from there
    el.focus({ preventScroll: true });
  }
  // Underline the part on screen: the last one whose top has passed under the header (the last part at the very bottom).
  var navOn = null;
  function spy(force) {
    if (!navParts.length) return;
    var hd = document.querySelector("[data-portal-nav]").closest("header"), line = (hd ? hd.offsetHeight : 0) + 40, on = navParts[0];
    navParts.forEach(function (p) { if (p.el.getBoundingClientRect().top <= line) on = p; });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) on = navParts[navParts.length - 1];
    if (on === navOn && !force) return;
    navOn = on;
    navParts.forEach(function (p) { p.a.classList.toggle("on", p === on); if (p === on) p.a.setAttribute("aria-current", "location"); else p.a.removeAttribute("aria-current"); });
    var row = on.a.parentNode;
    if (row.scrollWidth > row.clientWidth) row.scrollLeft = Math.max(0, on.a.offsetLeft - 40);   // a narrow screen: keep it in view
    navMore(row);
  }
  function navMore(row) { row.classList.toggle("more", row.scrollLeft + row.clientWidth < row.scrollWidth - 2); row.classList.toggle("less", row.scrollLeft > 2); }

  // "Your requests" on their page ([data-requests]): what they've asked for and where each one stands.
  // The status is the one Stray Wolf picks in the admin, in the client's words. Only Stray Wolf changes
  // it, with one exception: answering a question hands the request back ("Working on it").
  // With nothing sent yet (or an older service) the card stays hidden.
  var REQ_WORDS = { "new": "Received", working: "Working on it", question: TO + " has a question", done: "Done", declined: "Not doing this one" };
  var REQ_SHOWN = 3;
  var reqs = [], reqAll = false, reqOpen = null, reqDraft = "";   // their requests; whether all are listed; the one being answered, and the answer so far
  function loadRequests() {
    if (!document.querySelector("[data-requests-list]")) return;
    var got = DEMO ? Promise.resolve(demoRequests()) : api("/api/my-requests", { token: getToken() });
    got.then(function (d) { if (d && d.ok && Array.isArray(d.requests)) { reqs = d.requests; drawRequests(); } });
  }
  function reqClosed(r) { return r.status === "done" || r.status === "declined"; }
  // "Home page", "About page", or the portal box it came from ("Contact info")
  function reqWhere(r) { return /portal/i.test(r.title || "") ? r.on || "Your portal" : !r.title || r.title === "Home" ? "Home page" : /\bpage$/i.test(r.title) ? r.title : r.title + " page"; }
  function drawRequests() {
    var box = document.querySelector("[data-requests]"), list = box && box.querySelector("[data-requests-list]"); if (!list) return;
    if (!reqs.length) { box.hidden = true; drawNav(); return; }
    // questions first (they are waiting on the client), then open ones, then finished ones; newest first in each
    var rank = function (r) { return r.status === "question" ? 0 : reqClosed(r) ? 2 : 1; }, when = function (r) { return String((reqClosed(r) && r.statusAt) || r.at || ""); };
    var sorted = reqs.slice().sort(function (a, b) { return rank(a) - rank(b) || (when(a) < when(b) ? 1 : when(a) > when(b) ? -1 : 0); });
    var few = Math.max(REQ_SHOWN, sorted.filter(function (r) { return r.status === "question"; }).length);
    var more = box.querySelector("[data-requests-all]");
    if (more) {
      more.hidden = sorted.length <= few; more.textContent = reqAll ? "Show fewer" : "See all " + sorted.length;
      more.onclick = function () { reqAll = !reqAll; drawRequests(); };
    }
    list.textContent = "";
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
      box.appendChild(h("button", { class: "rq-go", type: "button", text: "Answer", onclick: function () {
        reqOpen = key; reqDraft = ""; drawRequests();
        var f = document.querySelector("[data-requests-list] textarea"); if (f) f.focus();
      } }));
      return box;
    }
    var field = h("textarea", { rows: "2", maxlength: "600", "aria-label": "Your answer", placeholder: "Type your answer", oninput: function () { reqDraft = field.value; } });
    field.value = reqDraft;
    var err = h("p", { class: "rq-err", role: "alert", hidden: true });
    var send = h("button", { class: "rq-go", type: "button", text: "Send answer", onclick: function () {
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
    box.append(field, err, send, h("button", { class: "rq-no", type: "button", text: "Cancel", onclick: function () { reqOpen = null; reqDraft = ""; drawRequests(); } }));
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
  // website, when its form sends to the notes service. Each message was also emailed to them, so this is the copy they
  // can come back to (kept a year). They mark one replied, reply, call, or delete it, and they choose where the emails
  // go. Stray Wolf switches the form on in the admin and never reads these. Form off, or an older service: no card.
  var FP_SHOWN = 5;
  var fpForm = null, fpLeads = [], fpAll = false, fpOpen = {}, fpDel = null, fpTyped = null;
  function fpNew() { return fpForm && fpForm.state === "on" ? fpLeads.filter(function (l) { return l.status !== "replied"; }).length : 0; }
  function formCall(path, body) { return DEMO ? Promise.resolve(demoFormCall(path, body || {})) : api("/api/my-form" + path, { token: getToken(), body: body || {} }); }
  function loadForm() {
    formCall("").then(function (d) { if (d && d.ok && d.form) { fpForm = d.form; fpLeads = Array.isArray(d.leads) ? d.leads : []; drawForm(); } });
  }
  // The card goes under Your requests (or the shop), unless the page placed its own.
  function formBox() {
    var box = document.querySelector("[data-form-portal]"); if (box) return box;
    var after = document.querySelector("[data-shop-portal]") || document.querySelector("[data-requests]"); if (!after) return null;
    box = h("section", { class: "fp", id: "messages", "data-nav": "Messages", "data-form-portal": true, hidden: true, "aria-labelledby": "fp-h" });
    after.parentNode.insertBefore(box, after.nextSibling);
    return box;
  }
  function fpWho(l) { return l.name || l.email || l.phone || "Someone"; }
  function fpTrouble(d, what) { return d.status === 401 ? "Your login timed out. Log in again to " + what + "." : d.status === 0 ? d.error : d.error || "That didn't " + what + ". Try again in a minute."; }
  function drawForm() {
    var box = formBox(); if (!box) return;
    if (!fpForm || fpForm.state === "off") { box.hidden = true; drawNav(); return; }
    box.className = "fp"; box.textContent = "";
    var n = fpNew();
    box.appendChild(h("div", { class: "fp-hd" }, [h("div", {}, [h("h2", { id: "fp-h", text: "Messages from your website" }),
      h("p", { text: fpLeads.length ? plural(fpLeads.length, "message") + (n ? ", " + n + " not replied to yet" : ", all replied to") + ". Each one was also emailed to you." : "What people send with the form on your website. Each one is also emailed to you." })])]));
    if (fpForm.state === "test") box.appendChild(h("p", { class: "fp-test", text: TO + " is testing your website's form, so messages aren't coming to you yet. Once it's switched on, they'll be emailed to the addresses below and listed here." }));
    if (!fpLeads.length) box.appendChild(h("p", { class: "fp-none", text: fpForm.state === "on" ? "No messages yet. When someone fills in the form on your website, it shows up here." : "Nothing here yet." }));
    else {
      var list = h("ul", { class: "fp-list" }), shown = fpAll ? fpLeads : fpLeads.slice(0, FP_SHOWN);
      shown.forEach(function (l) { list.appendChild(fpRow(l)); });
      box.appendChild(list);
      if (fpLeads.length > FP_SHOWN) box.appendChild(h("p", { class: "fp-more" }, [h("button", { type: "button", text: fpAll ? "Show fewer" : "See all " + fpLeads.length, onclick: function () { fpAll = !fpAll; drawForm(); } })]));
    }
    box.appendChild(fpToBox());
    box.hidden = false;
    drawNav();
  }
  function fpRow(l) {
    var open = !!fpOpen[l.id], replied = l.status === "replied";
    var fields = Array.isArray(l.fields) ? l.fields : [], files = Array.isArray(l.files) ? l.files : [];
    var about = fields.filter(function (f) { return !/name|e-?mail|phone|mobile|cell/i.test(f[0]); })[0];
    var row = h("li", { class: "fp-row" }, [
      h("b", { text: fpWho(l) + (about ? ": " + short(about[1], 90) : "") }),
      h("span", { class: "fp-tag " + (replied ? "replied" : "new"), text: replied ? "Replied" : "New" }),
      h("span", { class: "fp-m", text: [l.title ? l.title.charAt(0).toUpperCase() + l.title.slice(1) : "Message", l.at ? dayWord(l.at) : "", files.length ? plural(files.length, "file") : ""].filter(Boolean).join(" · ") })]);
    if (open) {
      var dl = h("dl", { class: "fp-ans" });
      fields.forEach(function (f) { dl.append(h("dt", { text: f[0] }), h("dd", { text: f[1] })); });
      row.appendChild(dl);
      if (files.length) row.appendChild(h("div", { class: "fp-files" }, files.map(function (f) {
        var pic = /^image\/(jpeg|png|webp)$/.test(f.type || "");
        return h("a", { href: f.url, target: "_blank", rel: "noopener", title: "Open " + f.name }, [pic ? h("img", { src: f.url, alt: "", loading: "lazy" }) : h("span", { class: "doc", text: /pdf/.test(f.type || "") ? "PDF" : "FILE" }), short(f.name, 28)]);
      })));
    }
    if (l.mail && l.mail.ok === false && l.mail.why !== "off") row.appendChild(h("p", { class: "fp-mail", text: "This one couldn't be emailed to you, so it's only here." }));
    var acts = h("div", { class: "fp-acts" }, [
      h("button", { class: "fp-b", type: "button", "aria-expanded": open ? "true" : "false", text: open ? "Hide answers" : "Show answers" + (files.length ? " and files" : ""), onclick: function () { fpOpen[l.id] = !open; drawForm(); } }),
      l.email ? h("a", { class: "fp-b main", href: "mailto:" + l.email + "?subject=" + encodeURIComponent("Re: your " + (l.title || "message")), text: "Reply by email" }) : null,
      l.phone ? h("a", { class: "fp-b", href: "tel:" + String(l.phone).replace(/[^\d+]/g, ""), text: "Call " + l.phone }) : null,
      h("button", { class: "fp-b", type: "button", text: replied ? "Mark as new" : "Mark replied", onclick: function (e) {
        var b = e.currentTarget; b.disabled = true;
        formCall("/lead", { id: l.id, status: replied ? "new" : "replied" }).then(function (d) {
          if (!d.ok) { b.disabled = false; toast(fpTrouble(d, "save")); return; }
          l.status = replied ? "new" : "replied"; drawForm();
        });
      } })]);
    if (fpDel === l.id) acts.append(h("span", { class: "fp-m", text: "Delete this message and its files for good?" }),
      h("button", { class: "fp-x", type: "button", text: "Delete", onclick: function (e) {
        e.currentTarget.disabled = true;
        formCall("/lead/delete", { id: l.id }).then(function (d) {
          if (!d.ok) { toast(fpTrouble(d, "delete")); drawForm(); return; }
          fpDel = null; fpLeads = fpLeads.filter(function (x) { return x !== l; }); drawForm(); toast("Deleted.");
        });
      } }), h("button", { class: "fp-x no", type: "button", text: "Keep it", onclick: function () { fpDel = null; drawForm(); } }));
    else acts.appendChild(h("button", { class: "fp-x", type: "button", text: "Delete", onclick: function () { fpDel = l.id; drawForm(); } }));
    row.appendChild(acts);
    return row;
  }
  // Where the emails go: the client's own choice. A new address gets a short email at once.
  function fpToBox() {
    var input = h("input", { id: "fp-to", type: "text", autocomplete: "off", spellcheck: "false", "aria-describedby": "fp-to-help", placeholder: "name@business.com",
      oninput: function () { fpTyped = input.value; } });
    input.value = fpTyped != null ? fpTyped : (fpForm.to || []).join(", ");
    var err = h("p", { class: "err", role: "alert", hidden: true });
    var save = h("button", { class: "fp-b main", type: "button", text: "Save", onclick: function () {
      save.disabled = true; err.hidden = true;
      formCall("/to", { to: input.value }).then(function (d) {
        save.disabled = false;
        if (!d.ok) { err.textContent = fpTrouble(d, "save"); err.hidden = false; return; }
        fpForm = d.form; fpTyped = null; drawForm();
        toast(d.added && d.added.length ? (d.mail && d.mail.ok === false ? "Saved, but the hello email to " + d.added.join(", ") + " didn't go. Check the address." : "Saved. " + d.added.join(", ") + " just got a short email from your website.") : "Saved.");
      });
    } });
    var test = h("button", { class: "fp-b", type: "button", text: "Send a test email", onclick: function () {
      test.disabled = true;
      formCall("/test").then(function (d) { test.disabled = false; toast(d.ok ? "A test email went to " + d.to.join(", ") + "." : fpTrouble(d, "send")); });
    } });
    return h("div", { class: "fp-to" }, [h("label", { for: "fp-to", text: "Form emails go to" }), h("div", { class: "row" }, [input, save, test]), err,
      h("small", { id: "fp-to-help", text: "One or more email addresses, separated by commas, for example you@yourbusiness.com, office@yourbusiness.com. A newly added address gets a short email right away, so you'll know it works." })]);
  }
  // Demo only: a form that is on, with two made-up messages.
  function demoFormCall(path, b) {
    var D = demoFormCall.d || (demoFormCall.d = { form: { state: "on", to: ["owner@example.com"] }, leads: [
      { id: "demo-2", at: new Date(Date.now() - 3 * 36e5).toISOString(), title: "estimate request", name: "Sarah Mills", email: "sarah@example.com", phone: "423-555-0101", status: "new",
        fields: [["Name", "Sarah Mills"], ["Phone", "423-555-0101"], ["email", "sarah@example.com"], ["Project type", "Drainage"], ["Project details", "Water pools by the garage after every rain.\nAbout 30 feet of the yard slopes toward it."]], files: [] },
      { id: "demo-1", at: new Date(Date.now() - 50 * 36e5).toISOString(), title: "estimate request", name: "Ray Fox", email: "", phone: "423-555-0177", status: "replied",
        fields: [["Name", "Ray Fox"], ["Phone", "423-555-0177"], ["Project type", "Gravel driveway"], ["Project details", "About 120 feet, mostly washed out."]], files: [] }] });
    if (path === "") return { ok: true, form: D.form, leads: D.leads };
    if (path === "/to") { var to = String(b.to || "").toLowerCase().split(/[\s,;]+/).filter(Boolean), added = to.filter(function (x) { return D.form.to.indexOf(x) < 0; });
      if (!to.length) return { ok: false, status: 400, error: "The form is on, so it needs at least one address to send to." };
      D.form.to = to; return { ok: true, form: D.form, added: added, mail: { ok: true } }; }
    if (path === "/test") return { ok: true, to: D.form.to };
    if (path === "/lead") return { ok: true };
    if (path === "/lead/delete") { D.leads = D.leads.filter(function (x) { return x.id !== b.id; }); return { ok: true }; }
    return { ok: false, status: 404, error: "Not found." };
  }

  // "Your shop" on their page ([data-shop-portal]): what their website sells (kit/shop draws it there). They keep
  // it themselves, the same as Stray Wolf in the admin. Each row does the everyday jobs in place: the photo (tap it
  // or drop one on it), the shown price (typed right there), the checkout link (Change link), and Active or
  // Inactive (one switch). Add an item and Change open a short form for the rest. Every Buy opens the item's
  // checkout link, so no payment ever comes through here. Stray Wolf starts the shop in the admin, imports into it
  // there, and picks its kind of checkout (shop.checkout): "square" takes only Square links and keeps Square's own
  // price beside the shown one; "generic" takes any https checkout link. No shop, or an older service: no card.
  var SHOP_SWITCH_TIP = "Active: on your website with its Buy button. Inactive: taken off your website within a minute. It stays saved here with its price, photo and link, so you can switch it back on anytime.";
  // The card's words for each kind of checkout. A shop from a service that doesn't say its kind is a Square shop.
  var SHOP_KINDS = {
    square: { link: "Square checkout link", ph: "square.link/u/…", add: "Add the Square link", buys: "your Square checkout",
      says: "Only Square checkout links work here, so every payment goes through Square.",
      help: "In Square: Payment links, then copy the link. The Buy button opens it.",
      need: "Add its Square checkout link first, then switch it to Active.",
      seats: "Shown beside the date. Square keeps the real count.", priced: "Price saved. Change it in Square too, so checkout matches." },
    generic: { link: "Checkout link", ph: "https://buy.stripe.com/…", add: "Add the checkout link", buys: "the checkout link you set for it",
      says: "Paste the link to the page where people pay you, at Stripe, PayPal, Etsy or anywhere else. No payment comes through here.",
      help: "The page where people pay for this. The Buy button opens it.",
      need: "Add its checkout link first, then switch it to Active.",
      seats: "Shown beside the date. Your checkout keeps the real count.", priced: "Price saved. Change it at your checkout too, so the two match." }
  };
  var PHOTO_TYPES = /^image\/(jpeg|png|webp)$/, PHOTO_MAX = 3 * 1024 * 1024;
  function shopSquare() { return !spShop || spShop.checkout !== "generic"; }
  function shopKind() { return SHOP_KINDS[shopSquare() ? "square" : "generic"]; }
  // their shop; the item being added or changed (a copy, no id = new); Delete asked once; the row whose link is being changed
  var spShop = null, spEdit = null, spDel = false, spLink = null, spLinkOn = false;   // spLink: the row whose link is being changed; spLinkOn: switch it on once the link is in
  function loadShop() {
    if (!document.querySelector("[data-shop-portal]")) return;
    shopCall("").then(function (d) { if (d && d.ok && d.shop && Array.isArray(d.shop.items)) { spShop = d.shop; drawShop(); } });
  }
  function shopCall(path, body) { return DEMO ? Promise.resolve(demoShopCall(path, body || {})) : api("/api/my-shop" + path, { token: getToken(), body: body || {} }); }
  function shopTrouble(d, what) {
    return d.status === 401 ? "Your login timed out. Log in again to " + what + "." : d.status === 0 ? d.error : d.error || "That didn't " + what + ". Try again in a minute.";
  }
  function money(c) { return "$" + (c / 100).toLocaleString("en-US", { minimumFractionDigits: c % 100 ? 2 : 0, maximumFractionDigits: 2 }); }
  function dollars(c) { return c == null ? "" : (c / 100).toFixed(2); }
  // Everything the service needs to save one item, with some of it changed: one call does the switch or the link.
  function shopFields(x, change) {
    var f = { id: x.id, name: x.name, kind: x.kind, price: dollars(x.price), was: dollars(x.was), link: x.link || "", cat: x.cat || "",
      when: x.when || "", seats: x.seats || "", show: x.show, desc: x.desc || "" };
    for (var k in change) f[k] = change[k];
    return f;
  }
  function photoProblem(file) {
    return !PHOTO_TYPES.test(file.type) ? "That isn't a JPG, PNG or WebP photo." : file.size > PHOTO_MAX ? "That photo is too big (3 MB at most)." : "";
  }
  // A class's date is kept as the client typed it (2026-12-06T10:00, their own time), so it is read as written.
  function classWhen(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(s || ""); if (!m) return "";
    var d = new Date(+m[1], m[2] - 1, +m[3], +m[4], +m[5]);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) + ", " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  // Photos come from the shop's public address, read as a file so their page's policy never needs that address.
  var spPics = {};
  function shopPic(key) {
    if (!spPics[key]) spPics[key] = DEMO ? Promise.resolve(key.indexOf("data:") === 0 ? key : demoPic(key))
      : fetch(API + "/api/shop/pic?key=" + encodeURIComponent(key)).then(function (r) { return r.ok ? r.blob() : null; })
          .then(function (b) { return b ? keepBlob(b) : ""; }, function () { return ""; });
    return spPics[key];
  }
  function shopThumb(x) {
    var t = h("span", { class: "sp-pic", "aria-hidden": "true" }, x.photo ? [] : [icon("tag")]);
    if (x.photo) shopPic(x.photo).then(function (u) { if (u) t.style.backgroundImage = 'url("' + u + '")'; });
    return t;
  }
  // Redraws the card. Whatever had the cursor (a price box, while tabbing down the list) keeps it.
  function shopSaved(d, words) {
    var at = document.activeElement, label = at && at.getAttribute && at.getAttribute("aria-label");
    spShop = d.shop; drawShop(); if (words) toast(words);
    if (label) { var back = document.querySelector('[data-shop-portal] [aria-label="' + label.replace(/["\\]/g, "\\$&") + '"]'); if (back) back.focus({ preventScroll: true }); }
  }
  function drawShop() {
    var box = document.querySelector("[data-shop-portal]"), list = box && box.querySelector("[data-shop-list]"); if (!list || !spShop) return;
    var items = spShop.items, shown = items.filter(function (x) { return x.show !== "hidden"; }).length;
    var count = box.querySelector("[data-shop-count]");
    if (count) count.textContent = "What your website sells. " + (items.length ? plural(items.length, "item") + ": " + shown + " active, " + (items.length - shown) + " inactive." : "Nothing in it yet.");
    var foot = box.querySelector(".sp-foot");
    if (foot) foot.textContent = "Every Buy button on your website opens " + shopKind().buys + ", so payments never come through here. Changes show on your website within a minute.";
    var add = box.querySelector("[data-shop-add]");
    if (add) { add.hidden = !!(spEdit && !spEdit.id); add.onclick = function () { editShopItem(null); }; }
    var top = box.querySelector("[data-shop-form]");
    if (top) { top.textContent = ""; if (spEdit && !spEdit.id) top.appendChild(shopForm()); }
    list.textContent = "";
    if (!items.length) list.appendChild(h("p", { class: "sp-none", text: "Add the first thing your website sells. It stays inactive, off your website, until you switch it on." }));
    // grouped by category, first seen first, no category last
    var cats = [];
    items.forEach(function (x) { if (cats.indexOf(x.cat || "") < 0) cats.push(x.cat || ""); });
    cats.sort(function (a, z) { return !a ? 1 : !z ? -1 : 0; });
    cats.forEach(function (cat) {
      if (cats.length > 1 || cat) list.appendChild(h("h3", { class: "sp-cat", text: cat || "No category" }));
      var ul = h("ul", { class: "sp-items" });
      items.filter(function (x) { return (x.cat || "") === cat; }).forEach(function (x) {
        ul.appendChild(shopRow(x));
        if (spEdit && spEdit.id === x.id) ul.appendChild(h("li", { class: "sp-open" }, [shopForm()]));
      });
      list.appendChild(ul);
    });
    if (items.length) {
      var withPics = items.filter(function (x) { return x.photo; });
      list.appendChild(h("div", { class: "sp-dl" }, [
        dlButton("Download the list as a spreadsheet", function () { saveFile(shopCsv(items), fileName((NAME || "your") + " shop", "csv")); toast("Downloading your shop list. It opens in Excel, Numbers or Google Sheets."); }, "",
          "Every item with its category, price, Active or not, and checkout link, in one file that opens in Excel, Numbers or Google Sheets."),
        withPics.length ? dlButton("Download all the photos", function (b) { downloadAll(withPics.map(function (x) { return { title: x.name, src: shopPic(x.photo) }; }), fileName((NAME || "your") + " shop photos", "zip"), b); }, "",
          "Every item's photo in one .zip file, each named after its item.") : null]));
    }
    box.hidden = false;
    drawNav();
  }
  // The shop as a spreadsheet: one row per item, prices in dollars. A cell that starts like a formula gets a ' in
  // front, so a spreadsheet shows it as words instead of running it.
  function shopCsv(items) {
    var q = function (v) { v = v == null ? "" : String(v); if (/^[=+\-@]/.test(v)) v = "'" + v; return /[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var usd = function (c) { return c == null ? "" : (c / 100).toFixed(2); };
    var rows = [["Item", "Category", "Kind", "Shown price", "Was price", "On the website", "Checkout link", "Class date", "Seats", "Description"]].concat(items.map(function (x) {
      return [x.name, x.cat, x.kind === "class" ? "Class or workshop" : "Item", usd(x.price), usd(x.was), x.show === "hidden" ? "Inactive" : x.show === "sold" ? "Sold out" : "Active", x.link, x.when ? String(x.when).replace("T", " ") : "", x.seats, x.desc];
    }));
    return new Blob(["\ufeff" + rows.map(function (r) { return r.map(q).join(","); }).join("\r\n") + "\r\n"], { type: "text/csv;charset=utf-8" });
  }
  function editShopItem(x) {
    spEdit = x ? JSON.parse(JSON.stringify(x)) : { kind: "item", show: "hidden" }; spDel = false; spLink = null; spLinkOn = false; drawShop();
    var f = document.getElementById("sp-name"); if (f) { f.scrollIntoView({ block: "center" }); f.focus({ preventScroll: true }); }
  }
  // One row: the photo, the name and its checkout link, the shown price (typed right here), Active or Inactive, Change.
  // x.via is whose checkout the link opens, as the service names it ("Square", "Stripe", or the link's own address).
  function shopRow(x) {
    var words = shopKind(), off = shopSquare() && x.sqPrice != null && x.price !== x.sqPrice;
    var price = h("input", { class: "sp-in", inputmode: "decimal", autocomplete: "off", placeholder: "none", "aria-label": "Shown price for " + x.name });
    price.value = dollars(x.price);
    var save = function (v, said) {
      shopCall("/prices", { prices: [{ id: x.id, price: v }] }).then(function (d) {
        if (!d.ok) { toast(shopTrouble(d, "save")); drawShop(); return; }
        var now = d.shop.items.filter(function (y) { return y.id === x.id; })[0] || x;
        shopSaved(d, said || (shopSquare() && now.sqPrice != null && now.price === now.sqPrice ? "Price saved. It matches Square." : words.priced));
      });
    };
    // after Tab has moved on, so the next price box keeps the cursor
    price.onchange = function () { var v = price.value.trim(); if (v !== dollars(x.price)) setTimeout(function () { save(v); }, 0); };
    price.onkeydown = function (e) { if (e.key === "Enter") { e.preventDefault(); price.blur(); } else if (e.key === "Escape") { price.value = dollars(x.price); price.blur(); } };
    var sub = [x.kind === "class" ? classWhen(x.when) || "Class" : "", x.kind === "class" ? x.seats : ""].filter(Boolean).join(" · ") || x.desc || "";
    var open = spEdit && spEdit.id === x.id;
    return h("li", { class: "sp-row" + (x.show === "hidden" ? " off" : "") + (open ? " open" : "") }, [shopPhotoButton(x),
      h("div", { class: "sp-what" }, [h("b", { text: x.name }), sub ? h("span", { class: "sp-m", text: sub }) : null, spLink === x.id ? linkEditor(x) : linkLine(x)]),
      h("div", { class: "sp-price" }, [h("label", { class: "sp-box" + (off ? " diff" : "") }, [h("span", { "aria-hidden": "true", text: "$" }), price]),
        x.was != null ? h("span", { class: "sp-m", text: "Was " + money(x.was) }) : null,
        off ? h("span", { class: "sp-diff" }, ["Square charges " + money(x.sqPrice) + " · ",
          h("button", { type: "button", text: "Use " + money(x.sqPrice), onclick: function () { save(dollars(x.sqPrice), "Price saved. It matches Square."); } })]) : null]),
      shopSwitch(x),
      open ? null : h("button", { class: "sp-btn", type: "button", text: "Change", "aria-label": "Change " + x.name, onclick: function () { editShopItem(x); } })]);
  }
  // The picture in each row is also how it's added or changed: tap it to choose a photo, or drop one on it.
  // It goes up straight away.
  function shopPhotoButton(x) {
    var b = h("button", { class: "sp-pic" + (x.photo ? "" : " none"), type: "button", "aria-label": (x.photo ? "Change the photo of " : "Add a photo of ") + x.name },
      x.photo ? [h("span", { class: "sp-pic-say", text: "Change" })] : [icon("photo"), h("span", { class: "sp-pic-say", text: "Add photo" })]);
    if (x.photo) shopPic(x.photo).then(function (u) { if (u) b.style.backgroundImage = 'url("' + u + '")'; });
    var take = function (file) {
      if (!file) return;
      var no = photoProblem(file); if (no) { toast(no); return; }
      b.disabled = true; b.classList.add("busy");
      shopPhoto(x.id, file).then(function (d) {
        if (!d.ok) { toast("The photo didn't upload. " + shopTrouble(d, "upload")); drawShop(); return; }
        shopSaved(d, "Photo saved. Your website shows it within a minute.");
      });
    };
    b.onclick = function () { pickPhoto(take); };
    dropPhoto(b, take);
    return b;
  }
  function pickPhoto(take) { var f = h("input", { type: "file", accept: "image/jpeg,image/png,image/webp" }); f.onchange = function () { take(f.files[0]); }; f.click(); }
  // A photo dropped on this spot comes here, not to the note boxes around it.
  function dropPhoto(spot, take) {
    spot.addEventListener("dragover", function (e) { if (!hasFiles(e)) return; e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = "copy"; spot.classList.add("over"); });
    spot.addEventListener("dragleave", function () { spot.classList.remove("over"); });
    spot.addEventListener("drop", function (e) { if (!hasFiles(e)) return; e.preventDefault(); e.stopPropagation(); spot.classList.remove("over"); take(e.dataTransfer.files[0]); });
  }
  // Under the name: whose checkout the Buy button opens, and Change link right beside it.
  function linkLine(x) {
    var words = shopKind(), via = x.via || "Square";
    var change = function () { spLink = x.id; spLinkOn = false; spEdit = null; drawShop(); var i = document.querySelector("[data-shop-portal] .sp-lin"); if (i) { i.focus(); i.select(); } };
    return h("span", { class: "sp-links" }, x.link
      ? [h("a", { class: "sp-sq", href: x.link, target: "_blank", rel: "noopener", "aria-label": "Open the " + via + " checkout for " + x.name + " (new tab)" }, [via + " checkout", icon("ext")]),
         h("button", { class: "sp-relink", type: "button", text: "Change link", "aria-label": "Change the checkout link for " + x.name, onclick: change })]
      : [h("button", { class: "sp-link", type: "button", text: words.add, "aria-label": words.add + " for " + x.name, onclick: change })]);
  }
  // The checkout link, changed right in its row: Enter or Save keeps it, Esc or Cancel leaves it as it was.
  // Opened by switching an item on without a link, saving the link also switches it on.
  function linkEditor(x) {
    var words = shopKind(), err = h("span", { class: "sp-lerr", role: "alert", hidden: true });
    var box = h("input", { class: "sp-lin", inputmode: "url", autocomplete: "off", autocapitalize: "off", spellcheck: "false", placeholder: words.ph, "aria-label": words.link + " for " + x.name });
    box.value = x.link || "";
    var go = h("button", { class: "sp-mini go", type: "submit", text: spLinkOn ? "Save and switch on" : "Save" });
    // back on the button that opened it: Change link, or Add the link when it has none
    var cancel = function () {
      spLink = null; spLinkOn = false; drawShop();
      var q = function (label) { return '[data-shop-portal] [aria-label="' + label.replace(/["\\]/g, "\\$&") + '"]'; };
      var b = document.querySelector(q("Change the checkout link for " + x.name) + "," + q(words.add + " for " + x.name)); if (b) b.focus();
    };
    box.onkeydown = function (e) { if (e.key === "Escape") { e.preventDefault(); cancel(); } };
    return h("form", { class: "sp-linkedit", onsubmit: function (e) {
      e.preventDefault(); err.hidden = true; go.disabled = true;
      var link = box.value.trim(), on = spLinkOn && link;
      shopCall("/item", { item: shopFields(x, on ? { link: link, show: "live" } : { link: link }) }).then(function (d) {
        go.disabled = false;
        if (!d.ok) { err.textContent = shopTrouble(d, "save"); err.hidden = false; box.focus(); return; }
        spLink = null; spLinkOn = false;
        shopSaved(d, !link ? "Link removed." : on ? "Link saved and switched to Active. Your website shows it within a minute."
          : x.show === "hidden" ? "Link saved. Switch it to Active when you're ready." : "Link saved. The Buy button opens it within a minute.");
      });
    } }, [h("span", { class: "sp-lrow" }, [box, go, h("button", { class: "sp-mini", type: "button", text: "Cancel", onclick: cancel })]), err,
      h("span", { class: "sp-lhelp", text: words.help })]);
  }
  // Active or Inactive, one switch per row. Switching on needs a checkout link (the service asks for one too).
  function shopSwitch(x) {
    var on = x.show !== "hidden", tip = "sp-tip-" + x.id;
    var box = h("input", { type: "checkbox", role: "switch", "aria-label": x.name + " on your website", "aria-describedby": tip });
    box.checked = on;
    box.onchange = function () {
      if (box.checked && !x.link) {
        box.checked = false; toast(shopKind().need); spLink = x.id; spLinkOn = true; spEdit = null; drawShop();
        var i = document.querySelector("[data-shop-portal] .sp-lin"); if (i) i.focus();
        return;
      }
      box.disabled = true;
      shopCall("/item", { item: shopFields(x, { show: box.checked ? "live" : "hidden" }) }).then(function (d) {
        if (!d.ok) { toast(shopTrouble(d, "save")); drawShop(); return; }
        shopSaved(d, box.checked ? "Active. Your website shows it within a minute." : "Inactive. It's off your website within a minute and stays saved here.");
      });
    };
    return h("div", { class: "sp-on" }, [
      h("label", { class: "sp-sw" }, [box, h("span", { class: "sp-track", "aria-hidden": "true" }),
        h("span", { class: "sp-sw-w", text: x.show === "sold" ? "Sold out" : on ? "Active" : "Inactive" })]),
      tipButton(SHOP_SWITCH_TIP, tip)]);
  }
  // A small "?" that shows a few words on hover, on focus, or on a tap (a second tap, Esc or a tap elsewhere hides them).
  function tipButton(text, id) {
    var wrap = h("span", { class: "sp-tipw" }), q = h("button", { class: "sp-q", type: "button", "aria-label": "What Active and Inactive mean", "aria-expanded": "false" }, [icon("help")]);
    var shut = function () { wrap.classList.remove("show"); q.setAttribute("aria-expanded", "false"); document.removeEventListener("click", away, true); };
    var away = function (e) { if (!wrap.contains(e.target)) shut(); };
    q.onclick = function () { if (wrap.classList.toggle("show")) { q.setAttribute("aria-expanded", "true"); document.addEventListener("click", away, true); } else shut(); };
    q.onkeydown = function (e) { if (e.key === "Escape") shut(); };
    wrap.appendChild(q); wrap.appendChild(h("span", { class: "sp-tip", role: "tooltip", id: id, text: text }));
    return wrap;
  }
  // Add or change one item. Up front: the photo, the name, the price, the checkout link and Active. The rest
  // (kind, category, sale price, words, a class's date and seats, Sold out) waits under More options.
  function shopForm() {
    var s = spEdit, isNew = !s.id, words = shopKind(), file = null, preview = "";
    var input = function (id, value, props) { props.id = id; props.autocomplete = "off"; var i = h("input", props); i.value = value || ""; return i; };
    var field = function (label, el, help, cls) { return h("div", { class: "sp-f" + (cls ? " " + cls : "") }, [h("label", { for: el.id, text: label }), el, help ? h("small", { text: help }) : null]); };
    var cats = (spShop.items || []).map(function (x) { return x.cat; }).filter(function (c, i, all) { return c && all.indexOf(c) === i; });
    var name = input("sp-name", s.name, { maxlength: "100", placeholder: "What it's called" }),
        price = input("sp-price", dollars(s.price), { inputmode: "decimal", placeholder: "18.00" }),
        link = input("sp-link", s.link, { inputmode: "url", placeholder: words.ph, autocapitalize: "off", spellcheck: "false" }),
        was = input("sp-was", dollars(s.was), { inputmode: "decimal", placeholder: "Leave empty" }),
        cat = input("sp-cat", s.cat, { maxlength: "60", list: "sp-cats", placeholder: cats[0] || "Bread" }),
        when = input("sp-when", s.when, { type: "datetime-local" }),
        seats = input("sp-seats", s.seats, { maxlength: "40", placeholder: "8 seats" }),
        desc = h("textarea", { id: "sp-desc", rows: "2", maxlength: "400", placeholder: "One or two lines your website shows under the name." }),
        active = h("input", { type: "checkbox", role: "switch", id: "sp-active", "aria-describedby": "sp-active-say" }),
        sold = h("input", { type: "checkbox", id: "sp-sold" }),
        err = h("p", { class: "rq-err", role: "alert", hidden: true }),
        go = h("button", { class: "rq-go", type: "submit", text: isNew ? "Add it" : "Save" });
    desc.value = s.desc || ""; active.checked = s.show !== "hidden"; sold.checked = s.show === "sold";
    // the kind: something to buy or a class; a class also gets its date and seats
    var kinds = h("div", { class: "sp-kinds", role: "radiogroup", "aria-label": "Kind" }), kind = s.kind === "class" ? "class" : "item";
    var classBits = h("div", { class: "sp-class", hidden: kind !== "class" }, [field("Date and time", when, "When it starts."), field("Seats", seats, words.seats)]);
    [["item", "Something to buy"], ["class", "A class or workshop"]].forEach(function (k) {
      var r = h("input", { type: "radio", name: "sp-kind", value: k[0], id: "sp-kind-" + k[0] }); r.checked = kind === k[0];
      r.onchange = function () { kind = k[0]; classBits.hidden = kind !== "class"; };
      kinds.appendChild(h("label", { class: "sp-kind", for: r.id }, [r, h("span", { text: k[1] })]));
    });
    // the photo: tap the square to choose one, or drop it there; it shows straight away and goes up with Save
    var pic = h("button", { class: "sp-drop" + (s.photo ? " has" : ""), type: "button", "aria-label": s.photo ? "Change the photo" : "Add a photo" });
    var paint = function () {
      pic.textContent = "";
      if (preview || s.photo) pic.appendChild(h("span", { class: "sp-drop-say", text: "Change photo" }));
      else { pic.appendChild(icon("photo")); pic.appendChild(h("b", { text: "Add a photo" })); pic.appendChild(h("span", { text: "Tap to choose one, or drop it here" })); }
      pic.classList.toggle("has", !!(preview || s.photo));
    };
    var take = function (f) {
      if (!f) return;
      var no = photoProblem(f); if (no) { err.textContent = no; err.hidden = false; return; }
      err.hidden = true; file = f; if (preview) URL.revokeObjectURL(preview); preview = URL.createObjectURL(f);
      pic.style.backgroundImage = 'url("' + preview + '")'; paint();
    };
    if (s.photo) shopPic(s.photo).then(function (u) { if (u && !preview) pic.style.backgroundImage = 'url("' + u + '")'; });
    pic.onclick = function () { pickPhoto(take); };
    dropPhoto(pic, take); paint();
    // the link: Test it opens what was typed, once it looks like an address
    var test = h("a", { class: "sp-test", target: "_blank", rel: "noopener", hidden: true }, ["Test the link", icon("ext")]);
    var testable = function () { var v = link.value.trim(); test.hidden = !/^(https:\/\/)?[\w-]+(\.[\w-]+)+\/\S*/i.test(v); test.href = /^https:/i.test(v) ? v : "https://" + v; };
    link.oninput = testable; testable();
    var activeSay = h("small", { id: "sp-active-say" });
    var sayActive = function () { activeSay.textContent = active.checked ? (sold.checked ? "On your website, marked sold out, with no Buy button." : "On your website with its Buy button.") : "Saved here, not on your website. Switch it on when it's ready."; };
    active.onchange = sold.onchange = sayActive; sayActive();
    var more = h("details", { class: "sp-more" }, [h("summary", { text: "More options: kind, category, sale price, description, sold out" }),
      h("div", { class: "sp-fields" }, [
        h("div", { class: "sp-f wide" }, [h("span", { class: "sp-lbl", text: "Kind" }), kinds]), classBits,
        field("Category", cat, "Groups things on your website. Pick one you use, or type a new one.", ""),
        field("Was (optional)", was, "A higher price shown crossed out, for a sale.", ""),
        field("Description", desc, "", "wide"),
        h("label", { class: "sp-check wide", for: "sp-sold" }, [sold, h("span", {}, [h("b", { text: "Sold out" }), " Shown on your website without a Buy button."])])])]);
    if (!isNew && (s.kind === "class" || s.cat || s.was != null || s.desc || s.show === "sold")) more.open = true;
    var problem = function (text, at) { err.textContent = text; err.hidden = false; go.disabled = false; if (at) at.focus(); };
    var done = function (d, said) { if (preview) URL.revokeObjectURL(preview); spEdit = null; spDel = false; shopSaved(d, said); };
    var close = function () { var id = s.id; if (preview) URL.revokeObjectURL(preview); spEdit = null; spDel = false; drawShop(); var back = document.querySelector(id ? '[data-shop-portal] [aria-label="Change ' + (s.name || "").replace(/["\\]/g, "\\$&") + '"]' : "[data-shop-add]"); if (back) back.focus(); };
    var del = isNew ? null : spDel
      ? h("span", { class: "sp-sure" }, [h("span", { text: "Take it off your shop and your website?" }),
          h("button", { class: "sp-del", type: "button", text: "Yes, delete", onclick: function () {
            shopCall("/item/delete", { id: s.id }).then(function (d) { if (!d.ok) { toast(shopTrouble(d, "delete")); return; } done(d, "Deleted. It's off your website within a minute."); });
          } }),
          h("button", { class: "rq-no", type: "button", text: "Keep it", onclick: function () { spDel = false; drawShop(); } })])
      : h("button", { class: "sp-del", type: "button", text: "Delete", onclick: function () { spDel = true; drawShop(); var y = document.querySelector("[data-shop-portal] .sp-sure .sp-del"); if (y) y.focus(); } });
    return h("form", { class: "sp-form", "aria-label": isNew ? "Add an item" : "Change " + s.name, onsubmit: function (e) {
      e.preventDefault(); err.hidden = true;
      if (!name.value.trim()) return problem("Give it a name first.", name);
      if (active.checked && !link.value.trim()) return problem(words.need, link);
      var show = !active.checked ? "hidden" : sold.checked ? "sold" : "live";
      go.disabled = true;
      shopCall("/item", { item: { id: s.id, name: name.value, kind: kind, price: price.value, was: was.value, link: link.value, cat: cat.value,
        when: kind === "class" ? when.value : "", seats: kind === "class" ? seats.value : "", show: show, desc: desc.value } }).then(function (d) {
        if (!d.ok) return problem(shopTrouble(d, "save"));
        var said = show === "hidden" ? (isNew ? "Added. It's inactive, off your website, until you switch it on." : "Saved.") : (isNew ? "Added. " : "Saved. ") + "Your website shows it within a minute.";
        if (!file) return done(d, said);
        spShop = d.shop; s.id = d.item.id;   // saved; if the photo fails the form stays open on the saved item
        shopPhoto(d.item.id, file).then(function (p) {
          if (!p.ok) { spEdit = JSON.parse(JSON.stringify(d.item)); drawShop(); toast("Saved, but the photo didn't upload. " + shopTrouble(p, "upload")); return; }
          done(p, said);
        });
      });
    } }, [
      h("div", { class: "sp-hd2" }, [h("h3", { text: isNew ? "Add an item" : "Change " + s.name }), h("p", { text: words.says })]),
      h("div", { class: "sp-top" }, [pic,
        h("div", { class: "sp-fields" }, [
          field("Name", name, "What your website calls it.", "wide"),
          h("div", { class: "sp-f" }, [h("label", { for: "sp-price", text: "Price" }), h("label", { class: "sp-box" }, [h("span", { "aria-hidden": "true", text: "$" }), price]),
            h("small", { text: shopSquare() && s.sqPrice != null ? "Square charges " + money(s.sqPrice) + "." : "What your website shows. Empty shows no price." })]),
          h("div", { class: "sp-f" }, [h("span", { class: "sp-lblrow" }, [h("label", { for: "sp-link", text: words.link }), test]), link, h("small", { text: words.help })]),
          h("div", { class: "sp-f wide sp-activef" }, [h("label", { class: "sp-sw", for: "sp-active" }, [active, h("span", { class: "sp-track", "aria-hidden": "true" }), h("b", { text: "Active" })]), activeSay])])]),
      more,
      cats.length ? h("datalist", { id: "sp-cats" }, cats.map(function (c) { return h("option", { value: c }); })) : null,
      err,
      h("div", { class: "sp-ft" }, [del, h("span", { class: "gap" }), h("button", { class: "rq-no", type: "button", text: "Cancel", onclick: close }), go])]);
  }
  // A photo goes up as the raw file, like the photos in their notes.
  function shopPhoto(id, file) {
    if (DEMO) return new Promise(function (done) {
      var r = new FileReader();
      r.onload = function () { spShop.items.forEach(function (x) { if (x.id === id) x.photo = r.result; }); done({ ok: true, shop: spShop }); };
      r.readAsDataURL(file);
    });
    return api("/api/my-shop/pic?id=" + encodeURIComponent(id), { token: getToken(), raw: file, type: file.type });
  }
  // Demo only: a made-up bakery with a Square shop, kept in this page, with the service's own checks.
  function demoShopCall(path, b) {
    if (!spShop) {
      var two = function (n) { return (n < 10 ? "0" : "") + n; };
      var d = function (n, hr) { var t = new Date(Date.now() + n * 864e5); return t.getFullYear() + "-" + two(t.getMonth() + 1) + "-" + two(t.getDate()) + "T" + two(hr) + ":00"; };
      spShop = { items: [
        { id: "s1", name: "Sourdough loaf", kind: "item", cat: "Bread", desc: "Baked Friday mornings.", price: 900, sqPrice: 900, show: "live", link: "https://square.link/u/demo1", photo: "demo1" },
        { id: "s2", name: "Rye sandwich loaf", kind: "item", cat: "Bread", desc: "", price: 1000, show: "live", link: "https://square.link/u/demo2", photo: "demo2" },
        { id: "s3", name: "Pecan pie", kind: "item", cat: "Holiday", desc: "Order by Nov 24.", price: 3200, was: 3600, sqPrice: 3000, show: "live", link: "https://square.link/u/demo3", photo: "demo3" },
        { id: "s4", name: "Gift card, $25", kind: "item", cat: "Holiday", desc: "", price: 2500, show: "hidden", link: "" },
        { id: "s5", name: "Bread baking class", kind: "class", cat: "Classes", desc: "", price: 6500, show: "live", when: d(12, 10), seats: "8 seats", link: "https://square.link/u/demo5", photo: "demo4" },
        { id: "s6", name: "Holiday cookie class", kind: "class", cat: "Classes", desc: "", price: 4500, show: "sold", when: d(20, 14), seats: "Full", link: "https://square.link/u/demo6", photo: "demo5" } ] };
    }
    var cents = function (v) { if (v === "" || v == null) return null; var n = Number(String(v).replace(/[$,\s]/g, "")); return isFinite(n) && n >= 0 ? Math.round(n * 100) : undefined; };
    var no = function (error) { return { ok: false, status: 400, error: error }; };
    if (path === "") return { ok: true, shop: spShop };
    if (path === "/prices") {
      var p = b.prices[0], it = spShop.items.filter(function (x) { return x.id === p.id; })[0], c = cents(p.price);
      if (c === undefined) return no("That price doesn't look right. Type it like 12.50.");
      it.price = c; return { ok: true, shop: spShop };
    }
    if (path === "/item/delete") { spShop.items = spShop.items.filter(function (x) { return x.id !== b.id; }); return { ok: true, shop: spShop }; }
    var i = b.item, old = spShop.items.filter(function (x) { return x.id === i.id; })[0], link = String(i.link || "").trim();
    if (link && !/^(https:\/\/)?(square\.link|[\w-]+\.square\.site|([\w-]+\.)?squareup\.com)\//i.test(link)) return no("The checkout link must be a Square link, like square.link/u/…, so every payment goes through Square.");
    if (cents(i.price) === undefined || cents(i.was) === undefined) return no("That price doesn't look right. Type it like 12.50.");
    var item = { id: old ? old.id : "d" + Date.now(), name: i.name.trim(), kind: i.kind, cat: i.cat.trim(), desc: i.desc.trim(), price: cents(i.price), link: link ? (/^https:/.test(link) ? link : "https://" + link) : "", show: i.show };
    if (cents(i.was) != null) item.was = cents(i.was);
    if (i.kind === "class") { if (i.when) item.when = i.when; if (i.seats) item.seats = i.seats; }
    if (old) { if (old.photo) item.photo = old.photo; if (old.sqPrice != null) item.sqPrice = old.sqPrice; spShop.items[spShop.items.indexOf(old)] = item; } else spShop.items.push(item);
    return { ok: true, item: item, shop: spShop };
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

  function tuckAway(card) {
    var to = els.stripLbl, v = els.veil;
    var finish = function () {
      closePanels(); render();
      if (to && to.animate && !reduceMotion) to.animate([{ transform: "scale(1)" }, { transform: "scale(1.12)", offset: .35 }, { transform: "scale(1)" }], { duration: 650, easing: "ease-out" });
    };
    if (!card || !card.animate || reduceMotion || !to) return finish();
    if (els.dock) els.dock.hidden = false;             // the bar has to be on screen to shrink into it
    var a = card.getBoundingClientRect(), b = to.getBoundingClientRect();
    if (!b.width) return finish();
    var dx = (b.left + b.width / 2) - (a.left + a.width / 2), dy = (b.top + b.height / 2) - (a.top + a.height / 2);
    card.style.pointerEvents = "none";
    if (v) v.animate([{ backgroundColor: "rgba(24,22,20,.55)" }, { backgroundColor: "rgba(24,22,20,0)" }], { duration: 520, easing: "ease-in", fill: "forwards" });
    card.animate([{ transform: "none", opacity: 1, borderRadius: "18px" },
                  { transform: "translate(" + dx + "px," + dy + "px) scale(.06)", opacity: .2, borderRadius: "60px" }],
                 { duration: 520, easing: "cubic-bezier(.5,0,.75,0)", fill: "forwards" }).onfinish = finish;
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
    var stay = h("button", { class: "b plain", type: "button", text: "Stay logged in", onclick: function () { closePanels(); render(); } });
    veil(h("div", { class: "card", role: "dialog", "aria-label": "Log out" }, [
      h("div", { class: "hd" }, [h("div", { class: "grow" }, [h("h2", { text: "Log out?" }),
        h("p", { text: (n ? "Your " + plural(n, "note") + " will stay saved on this device. " : "") + "To come back, open this page again and type your password." })])]),
      h("div", { class: "ft" }, [
        stay,
        h("button", { class: "b main push", type: "button", onclick: function () { endSession(); location.reload(); } }, [icon("power"), h("span", { text: "Log out" })])
      ])
    ]), { focus: stay });
  }

  /* =========================================================== start */

  function start() {
    els.file = h("input", { type: "file", accept: "image/*", multiple: true, hidden: true, onchange: function () { addPictures(els.file.files); els.file.value = ""; } });
    els.pins = h("div");
    els.ghost = h("div", { class: "ghost", hidden: true, "aria-hidden": "true" }, [h("span", { class: "pin", text: "+" }), h("span", { class: "tip" }, [h("span", { text: "Click to place your note" }), h("small", { text: "Esc cancels" })])]);
    els.frame = h("div", { class: "frame", "aria-hidden": "true", hidden: MODE !== "edit" });
    var helpBtn = h("button", { type: "button", onclick: function () { showHelp(false); } }, [icon("help"), h("span", { text: "Help" })]);
    var strip = MODE === "edit"
      ? h("div", { class: "strip" }, [h("div", { class: "strip-in" }, [
          els.stripLbl = h("span", { class: "lbl" }, [h("span", { class: "dot" }), h("span", { text: "Edit mode is on" })]),
          h("span", { class: "sub", text: "· Your website isn't changing" }),
          h("span", { class: "gap" }), helpBtn,
          h("button", { type: "button", onclick: exitEdit }, [icon("power"), h("span", { class: "lg", text: "Exit edit mode" }), h("span", { class: "sm", text: "Exit" })])
        ])])
      : h("div", { class: "strip hub" }, [h("div", { class: "strip-in" }, [
          els.stripLbl = h("span", { class: "lbl" }, [icon("lock"), h("span", { class: "lg", text: "You're logged in" }), h("span", { class: "sm", text: "Logged in" })]),
          h("span", { class: "sub", text: "· Only you can see this page" }),
          h("span", { class: "gap" }), helpBtn,
          h("button", { type: "button", onclick: askLogOut }, [icon("power"), h("span", { text: "Log out" })])
        ])]);
    els.say = h("div", { class: "say", "aria-live": "polite" });
    els.btns = h("div", { class: "btns" });
    // Their own page can hold Help and Log out up in its header ([data-portal-actions]). Then there's no
    // bar at the bottom at all until they have a note to send.
    var slot = MODE === "hub" && document.querySelector("[data-portal-actions]");
    if (slot) {
      els.bare = true;
      slot.textContent = "";
      slot.append(els.stripLbl = h("button", { type: "button", onclick: function () { showHelp(false); } }, [icon("help"), h("span", { text: "Help" })]),
                  h("button", { type: "button", onclick: askLogOut }, [icon("power"), h("span", { text: "Log out" })]));
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
      var em = MODE === "hub" && !els.veil && e.target.closest && e.target.closest("[data-edit-mode]");
      if (em) { e.preventDefault(); goEdit(em.getAttribute("data-edit-mode") || em.getAttribute("href") || "/"); return; }
      // A photo with data-big (the Photos box on their page) opens bigger instead of starting a note.
      var big = MODE === "hub" && !picking && !els.note && !els.veil && e.target.closest && e.target.closest("[data-big]");
      if (big) { e.preventDefault(); e.stopPropagation(); showPhoto(big); return; }
      // Boxes made for notes (like on the welcome page) open a note with one tap, no "Add a note" first.
      var box = !picking && !st.sent && !els.note && !els.veil && e.target.closest && e.target.closest("[data-note-box]");
      // A booking page set on the box (Let's talk, later a Google Calendar schedule) opens that instead of a note.
      var book = box && (box.getAttribute("data-booking-url") || "").trim();
      if (book) { e.preventDefault(); window.open(book, "_blank", "noopener"); return; }
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
      else if (panel && !busy) { if (panel === "note") saveNote(); else if (panel === "photos") backFromPhotos(); else if (els.veil && els.veilClose) els.veilClose(); else { closePanels(); render(); } }
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
    if (MODE === "hub") {
      addCss(document, PAGE_CSS); loadStats(); loadRequests(); loadShop(); loadForm(); dropOnBoxes(); drawNav();
      var spyTick = false; window.addEventListener("scroll", function () { if (spyTick) return; spyTick = true; requestAnimationFrame(function () { spyTick = false; spy(); }); }, { passive: true });
      window.addEventListener("resize", function () { headRoom(); spy(true); });
    }
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
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
