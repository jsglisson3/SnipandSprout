/*
 * Stray Wolf shop list, for a client's website.
 * Shows the items kept in Stray Wolf Admin (Shop) and the client's Client Portal (Your shop). Every Buy button opens
 * that item's own checkout link, at Square or whichever service the client is paid through: no payment is ever taken
 * by this page or by Stray Wolf.
 *
 * On the page:
 *   <div data-shop>  …what shows if the list can't load, for example a link to their store…  </div>
 *   <link rel="stylesheet" href="/shop.css">
 *   <script src="/shop.js" defer data-site="their-short-name"></script>
 *
 * Settings on the script tag (all optional except data-site):
 *   data-site         the client's short name in the admin (required)
 *   data-api          SW Core, if it ever moves (default https://site-notes.jsglisson.workers.dev)
 *   data-buy          the button's words for something to buy        (default "Buy")
 *   data-book         the button's words for a class or workshop     (default "Sign up")
 * Settings on a [data-shop] box:
 *   data-kind="class" only classes and workshops;  data-kind="item" only things to buy
 *   data-cat="Bread"  only that category
 *   data-group="off"  one list, without a heading per category
 * An item the page shows in its own design (a tab, a section) is kept up to date instead of being listed again:
 *   <div data-shop-item="diy-kit">   the item's ID from the import file, or its name
 *     … <span data-shop-price>$55</span> …  <a data-shop-buy href="…">Buy</a> …  <p data-shop-sold>Sold out for now</p>
 *   [data-shop-price] shows today's price (a sale's, with the regular one crossed out) and every [data-shop-buy]
 *   link opens the item's checkout. The element gets data-shop-state: "live"; "sold" (shop.css hides its Buy
 *   links and shows its [data-shop-sold]); or "hidden" when the item is set to Hidden or deleted (shop.css hides
 *   the whole element, and a radio tab inside it hands its turn to the next one still showing).
 * Each item shows its photos (up to 5: swipe, or the arrows, to see the next), its price (a sale's price with the
 * regular one crossed out, and the sale's last day), its options (Size: S, M, L), and a tag for a sale, New or Featured.
 * The page's policy must allow SW Core: connect-src and img-src https://site-notes.jsglisson.workers.dev
 * This file must stay the same on every client site; per-site words go in the data- settings above.
 */
(function () {
  var me = document.currentScript, set = me ? me.dataset : {};
  var API = String(set.api || "https://site-notes.jsglisson.workers.dev").replace(/\/+$/, ""), SITE = set.site || "";
  var BUY = set.buy || "Buy", BOOK = set.book || "Sign up", TAGS = { new: "New", featured: "Featured" };
  var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var money = function (c) { return "$" + (c / 100).toLocaleString("en-US", { minimumFractionDigits: c % 100 ? 2 : 0, maximumFractionDigits: 2 }); };
  // A class's date is kept as the client's own local time (2026-12-06T10:00), so it is read and shown as written.
  var when = function (s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(s || ""); if (!m) return "";
    var d = new Date(+m[1], m[2] - 1, +m[3], +m[4], +m[5]);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) + " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };
  // A sale's last day (2026-11-26), shown as "Nov 26".
  var day = function (s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ""); return m ? new Date(+m[1], m[2] - 1, +m[3]).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
  };
  var el = function (tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  var chevron = function (d) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"), path = document.createElementNS(svg.namespaceURI, "path");
    svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("aria-hidden", "true"); path.setAttribute("d", d); svg.appendChild(path); return svg;
  };

  // An item's photos, main one first. Before SW Core 2.2 an item had one photo, without a description.
  function photosOf(x) {
    var list = Array.isArray(x.photos) ? x.photos : x.photo ? [{ src: x.photo }] : [];
    return list.filter(function (p) { return p && /^https:\/\//.test(p.src || ""); }).slice(0, 5);
  }
  // The photo frame: one photo, or a row of them to swipe through, with arrows for a mouse or keyboard and a dot for each.
  function frame(x, pics) {
    var box = el("div", "sw-shop-photo"), strip = el("div", "sw-shop-strip");
    pics.forEach(function (p, i) {
      var img = el("img"); img.src = p.src; img.alt = p.alt || (i ? "" : x.name); img.loading = "lazy"; img.decoding = "async"; strip.appendChild(img);
    });
    box.appendChild(strip);
    if (pics.length < 2) return box;
    box.setAttribute("role", "group"); box.setAttribute("aria-label", pics.length + " photos of " + x.name);
    var dots = el("div", "sw-shop-dots"), at = 0, busy = 0;
    dots.setAttribute("aria-hidden", "true");
    strip.tabIndex = -1;   // the arrows are the keyboard's way through, so the row itself isn't one more stop
    pics.forEach(function (p, i) { dots.appendChild(el("span", i ? "" : "is-on")); });
    var show = function (i) { at = (i + pics.length) % pics.length; Array.prototype.forEach.call(dots.children, function (d, n) { d.className = n === at ? "is-on" : ""; }); };
    var go = function (step) { show(at + step); strip.scrollTo({ left: at * strip.clientWidth, behavior: still ? "auto" : "smooth" }); };
    strip.addEventListener("scroll", function () {   // swiped: the dots follow the photo that's showing
      if (!busy) busy = requestAnimationFrame(function () { busy = 0; show(Math.round(strip.scrollLeft / Math.max(1, strip.clientWidth))); });
    }, { passive: true });
    [["sw-shop-go is-prev", "Previous photo of ", -1, "M15 5l-7 7 7 7"], ["sw-shop-go is-next", "Next photo of ", 1, "M9 5l7 7-7 7"]].forEach(function (b) {
      var btn = el("button", b[0]); btn.type = "button"; btn.setAttribute("aria-label", b[1] + x.name); btn.appendChild(chevron(b[3]));
      btn.addEventListener("click", function () { go(b[2]); }); box.appendChild(btn);
    });
    box.appendChild(dots);
    return box;
  }
  // Tags over the photo (or above the name, with no photo): a sale, then New or Featured.
  function tags(x) {
    var list = [];
    if (x.was != null) list.push(el("span", "sw-shop-tag is-sale", x.salePct ? x.salePct + "% off" : "Sale"));
    if (TAGS[x.tag]) list.push(el("span", "sw-shop-tag", TAGS[x.tag]));
    if (!list.length) return null;
    var box = el("p", "sw-shop-tags"); list.forEach(function (t) { box.appendChild(t); }); return box;
  }
  // Today's price: the lowest of the item's and its choices' (from: they differ), and on a sale the regular one.
  function cost(x) {
    var now = [], was = [];
    if (x.price != null) { now.push(x.price); was.push(x.was != null ? x.was : x.price); }
    (x.options || []).forEach(function (o) {
      (o.choices || []).forEach(function (c) { if (c.price != null) { now.push(c.price); was.push(c.was != null ? c.was : c.price); } });
    });
    if (!now.length) return null;
    var low = Math.min.apply(null, now), before = Math.min.apply(null, was);
    return { low: low, from: Math.max.apply(null, now) > low, before: x.was != null && before > low ? before : null };
  }
  // The amount, with the regular price crossed out in front of it on a sale.
  function amount(c) {
    var f = document.createDocumentFragment();
    if (c.before != null) {
      f.appendChild(el("span", "sw-shop-sr", "Was ")); f.appendChild(el("s", "sw-shop-was", money(c.before)));
      f.appendChild(document.createTextNode(" ")); f.appendChild(el("span", "sw-shop-sr", "now "));
    }
    f.appendChild(document.createTextNode(money(c.low)));
    return f;
  }
  // The price on a card: one amount, or "From" the lowest when its choices cost different amounts.
  function price(x) {
    var c = cost(x); if (!c) return null;
    var p = el("p", "sw-shop-price");
    if (c.from) p.appendChild(document.createTextNode("From "));
    p.appendChild(amount(c));
    return { el: p, low: c.low, from: c.from };
  }
  // Each option as one line, "Size: S, M, L", with each choice's price when that option's choices have their own.
  function options(x) {
    return (x.options || []).filter(function (o) { return o && o.name && (o.choices || []).length; }).map(function (o) {
      var priced = o.choices.some(function (c) { return c.price != null; });
      var line = el("p", "sw-shop-opt"); line.appendChild(el("span", "sw-shop-opt-name", o.name + ": "));
      line.appendChild(document.createTextNode(o.choices.map(function (c) {
        var cost = c.price != null ? c.price : x.price; return c.name + (priced && cost != null ? " " + money(cost) : "");
      }).join(", ")));
      return line;
    });
  }

  function card(x) {
    var li = el("li", "sw-shop-item" + (x.soldOut ? " is-sold" : "")), body = el("div", "sw-shop-body"), pics = photosOf(x), tag = tags(x);
    if (pics.length) { var pic = frame(x, pics); if (tag) pic.appendChild(tag); li.appendChild(pic); }
    else if (tag) body.appendChild(tag);
    body.appendChild(el("h3", "sw-shop-name", x.name));
    if (x.kind === "class" && (x.when || x.seats)) body.appendChild(el("p", "sw-shop-when", [when(x.when), x.seats].filter(Boolean).join(" · ")));
    if (x.desc) body.appendChild(el("p", "sw-shop-desc", x.desc));
    options(x).forEach(function (o) { body.appendChild(o); });
    if (x.was != null && day(x.saleEnds)) body.appendChild(el("p", "sw-shop-ends", "Sale ends " + day(x.saleEnds)));
    var foot = el("div", "sw-shop-foot"), cost = price(x);
    if (cost) foot.appendChild(cost.el);
    if (x.soldOut) foot.appendChild(el("span", "sw-shop-soldout", x.kind === "class" ? "Full" : "Sold out"));
    else if (/^https:\/\//.test(x.buy || "")) {
      var words = x.kind === "class" ? BOOK : BUY, a = el("a", "sw-shop-buy", words); a.href = x.buy; a.rel = "noopener";
      // x.via is whose checkout the link opens, as SW Core names it: "Square", "Stripe", or the link's own address.
      a.setAttribute("aria-label", words + ": " + x.name + (cost ? ", " + (cost.from ? "from " : "") + money(cost.low) : "") + " (opens " + (x.via ? x.via + " checkout" : "the checkout") + ")");
      foot.appendChild(a);
    }
    body.appendChild(foot); li.appendChild(body);
    return li;
  }
  function fill(box, items) {
    var kind = box.getAttribute("data-kind"), cat = box.getAttribute("data-cat"), grouped = box.getAttribute("data-group") !== "off";
    var list = items.filter(function (x) { return (!kind || x.kind === kind) && (!cat || x.cat === cat); });
    if (!list.length) return;   // nothing to show: whatever the page had stays
    var out = el("div", "sw-shop"), cats = [];
    list.forEach(function (x) { if (cats.indexOf(x.cat) < 0) cats.push(x.cat); });
    (grouped ? cats : [null]).forEach(function (c) {
      var part = el("section", "sw-shop-group");
      if (grouped && c && cats.length > 1) part.appendChild(el("h2", "sw-shop-cat", c));
      var ul = el("ul", "sw-shop-list");
      list.filter(function (x) { return c === null || x.cat === c; }).forEach(function (x) { ul.appendChild(card(x)); });
      part.appendChild(ul); out.appendChild(part);
    });
    box.replaceChildren(out); box.setAttribute("data-shop-ready", "");
  }
  // The items the page shows in its own design, kept up to date (see the top of this file). Returns those items.
  function spots(items) {
    var key = function (s) { return String(s || "").trim().toLowerCase(); }, used = [];
    var within = function (box, sel) { var list = Array.prototype.slice.call(box.querySelectorAll(sel)); if (box.matches(sel)) list.unshift(box); return list; };
    Array.prototype.forEach.call(document.querySelectorAll("[data-shop-item]"), function (box) {
      var want = key(box.getAttribute("data-shop-item"));
      var x = items.filter(function (i) { return [i.ref, i.id, i.name].some(function (k) { return k && key(k) === want; }); })[0];
      box.setAttribute("data-shop-state", !x ? "hidden" : x.soldOut ? "sold" : "live");
      if (!x) return;
      used.push(x);
      var c = cost(x);
      if (c) within(box, "[data-shop-price]").forEach(function (p) { p.replaceChildren(amount(c)); });
      if (/^https:\/\//.test(x.buy || "")) within(box, "a[data-shop-buy]").forEach(function (a) { a.href = x.buy; });
    });
    // A radio tab that just went out of sight hands its turn to the first one still showing.
    var gone = '[data-shop-state="hidden"]';
    Array.prototype.forEach.call(document.querySelectorAll(gone + ' input[type="radio"]:checked'), function (r) {
      var next = Array.prototype.filter.call(document.getElementsByName(r.name), function (o) { return !o.closest(gone); })[0];
      if (next) { next.checked = true; next.dispatchEvent(new Event("change", { bubbles: true })); }
    });
    return used;
  }
  function start() {
    var boxes = document.querySelectorAll("[data-shop]"); if ((!boxes.length && !document.querySelector("[data-shop-item]")) || !SITE) return;
    fetch(API + "/api/shop?site=" + encodeURIComponent(SITE)).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.ok || !Array.isArray(d.items)) return;
        var used = spots(d.items), rest = d.items.filter(function (x) { return used.indexOf(x) < 0; });
        Array.prototype.forEach.call(boxes, function (b) { fill(b, rest); });
      })
      .catch(function () {});   // can't reach it: the page keeps what it had
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
