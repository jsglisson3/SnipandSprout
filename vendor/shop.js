/*
 * Stray Wolf shop list, for a client's website.
 * Shows the items kept in Stray Wolf Admin (Shop page). Every Buy button opens that item's own checkout link, at
 * Square or whichever service the client is paid through: no payment is ever taken by this page or by Stray Wolf.
 *
 * On the page:
 *   <div data-shop>  …what shows if the list can't load, for example a link to their store…  </div>
 *   <link rel="stylesheet" href="/shop.css">
 *   <script src="/shop.js" defer data-site="their-short-name"></script>
 *
 * Settings on the script tag (all optional except data-site):
 *   data-site         the client's short name in the admin (required)
 *   data-api          the notes service, if it ever moves (default https://site-notes.jsglisson.workers.dev)
 *   data-buy          the button's words for something to buy        (default "Buy")
 *   data-book         the button's words for a class or workshop     (default "Sign up")
 * Settings on a [data-shop] box:
 *   data-kind="class" only classes and workshops;  data-kind="item" only things to buy
 *   data-cat="Bread"  only that category
 *   data-group="off"  one list, without a heading per category
 * The page's policy must allow the service: connect-src and img-src https://site-notes.jsglisson.workers.dev
 * This file must stay the same on every client site; per-site words go in the data- settings above.
 */
(function () {
  var me = document.currentScript, set = me ? me.dataset : {};
  var API = String(set.api || "https://site-notes.jsglisson.workers.dev").replace(/\/+$/, ""), SITE = set.site || "";
  var BUY = set.buy || "Buy", BOOK = set.book || "Sign up";
  var money = function (c) { return "$" + (c / 100).toLocaleString("en-US", { minimumFractionDigits: c % 100 ? 2 : 0, maximumFractionDigits: 2 }); };
  // A class's date is kept as the client's own local time (2026-12-06T10:00), so it is read and shown as written.
  var when = function (s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(s || ""); if (!m) return "";
    var d = new Date(+m[1], m[2] - 1, +m[3], +m[4], +m[5]);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) + " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };
  var el = function (tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  function card(x) {
    var li = el("li", "sw-shop-item" + (x.soldOut ? " is-sold" : "")), body = el("div", "sw-shop-body");
    if (x.photo) { var img = el("img", "sw-shop-photo"); img.src = x.photo; img.alt = ""; img.loading = "lazy"; img.decoding = "async"; li.appendChild(img); }
    body.appendChild(el("h3", "sw-shop-name", x.name));
    if (x.kind === "class" && (x.when || x.seats)) body.appendChild(el("p", "sw-shop-when", [when(x.when), x.seats].filter(Boolean).join(" · ")));
    if (x.desc) body.appendChild(el("p", "sw-shop-desc", x.desc));
    var foot = el("div", "sw-shop-foot");
    if (x.price != null) {
      var p = el("p", "sw-shop-price");
      if (x.was != null) { var was = el("s", "sw-shop-was", money(x.was)); p.appendChild(el("span", "sw-shop-sr", "Was ")); p.appendChild(was); p.appendChild(document.createTextNode(" ")); p.appendChild(el("span", "sw-shop-sr", "now ")); }
      p.appendChild(document.createTextNode(money(x.price))); foot.appendChild(p);
    }
    if (x.soldOut) foot.appendChild(el("span", "sw-shop-soldout", x.kind === "class" ? "Full" : "Sold out"));
    else if (/^https:\/\//.test(x.buy || "")) {
      var a = el("a", "sw-shop-buy", x.kind === "class" ? BOOK : BUY); a.href = x.buy; a.rel = "noopener";
      // x.via is whose checkout the link opens, as the notes service names it: "Square", "Stripe", or the link's own address.
      a.setAttribute("aria-label", (x.kind === "class" ? BOOK : BUY) + ": " + x.name + (x.price != null ? ", " + money(x.price) : "") + " (opens " + (x.via ? x.via + " checkout" : "the checkout") + ")");
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
  function start() {
    var boxes = document.querySelectorAll("[data-shop]"); if (!boxes.length || !SITE) return;
    fetch(API + "/api/shop?site=" + encodeURIComponent(SITE)).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d && d.ok && Array.isArray(d.items)) Array.prototype.forEach.call(boxes, function (b) { fill(b, d.items); }); })
      .catch(function () {});   // can't reach it: the page keeps what it had
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
