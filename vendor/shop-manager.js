/*
 * Stray Wolf shop manager: a client's items for sale, as one list with the item opening beside it.
 * The same file runs in Stray Wolf Admin (the Shop page) and in the client's own Client Portal (Your shop), byte for
 * byte: kit/shop/manager.js and manager.css here; the admin keeps a copy as docs/admin/shop-manager.js and .css, and
 * each client site with a shop keeps one next to its site-notes.js. Change it here, then copy it to each.
 *
 * This is not a store: there is no cart and no stock count. Every Buy button on the website opens that item's own
 * checkout link (Square, Stripe, ...), so no payment ever comes through SW Core or this page.
 *
 *   var m = SWShopManager.mount(box, {
 *     mode:    "admin" or "portal" (the words: "their website" or "your website", who saved what),
 *     shop:    the shop as SW Core sends it ({checkout, items, history, updated, by}), today: "2026-11-17",
 *     site:    the client's short name, name: their business name (admin words),
 *     call:    function (path, body) -> Promise of SW Core's answer. path is "/item", "/bulk", ... The host adds the
 *              site (admin) and the login, and sends it to /api/admin/shop or /api/my-shop.
 *     upload:  function (query, file) -> Promise of the answer to "/photo" + query (the raw file).
 *     image:   function (path) -> Promise of an address the page may show for "/api/shop/pic?key=..." or
 *              "/api/shop/peek?..." (each host's page policy decides how: a blob: address, or the service itself).
 *     extra:   more top buttons, put before Export (the admin's Import), who: an element at the left of the top row
 *              (the admin's menu of shops), checkout: an element in place of the checkout badge (the admin's
 *              Square or Generic switch), onChange: function (shop) after every save.
 *   });
 *   m.el (the box), m.update(shop) (a newer copy, e.g. after an import), m.open(id), m.add(), m.destroy()
 *
 * SWShopManager.demo(shop, pics) gives call, upload and image for a made-up shop kept in the page (the admin's and the
 * portal's demo modes), with the same checks as SW Core where they matter on screen.
 *
 * The page's policy needs nothing extra: no inline styles or scripts are written, and photos come through image().
 */
(function () {
  "use strict";
  var MAX = { photos: 5, desc: 3000, name: 100, cat: 60, alt: 200, options: 3, choices: 20, perCall: 8 };
  var SVG = "http://www.w3.org/2000/svg";
  var P = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', plus: '<path d="M12 5v14M5 12h14"/>', chev: '<path d="m6 9 6 6 6-6"/>',
    hist: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>', up: '<path d="M12 15V3"/><path d="m7 8 5-5 5 5"/><path d="M5 21h14"/>',
    down: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>', star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/>', eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.9M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>', trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>', photo: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>', ext: '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>',
    check: '<path d="m5 12 5 5 9-10"/>', folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>', dollar: '<path d="M12 3v18"/><path d="M17 7H9.5a3 3 0 0 0 0 6h5a3 3 0 0 1 0 6H6"/>',
    grip: '<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',
    back: '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>', ban: '<circle cx="12" cy="12" r="9"/><path d="m5.7 5.7 12.6 12.6"/>', lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>', undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>'
  };
  // The words for each kind of checkout a shop takes (SW Core keeps the kind on the shop: shop.checkout).
  var KINDS = {
    square: { badge: "Square checkout", label: "Square checkout link", ph: "square.link/u/…", help: "The Buy button opens this. Payments go only to Square.",
      need: "Add the Square checkout link first, so the Buy button has somewhere to go.", tip: "Only Square links are taken, so every payment goes to Square." },
    generic: { badge: "Any checkout link", label: "Checkout link", ph: "https://buy.stripe.com/…", help: "The Buy button opens this: Stripe, PayPal, Shopify, Etsy or any https checkout page.",
      need: "Add the checkout link first, so the Buy button has somewhere to go.", tip: "Any https checkout link is taken: Stripe, PayPal, Shopify, Etsy and others." }
  };
  var SHOW = [["live", "Showing", "On the website with its Buy button."], ["sold", "Sold out", "On the website, marked Sold out, with no Buy button."],
    ["hidden", "Hidden", "Not on the website. Everything stays saved here."]];
  var TAGS = [["", "None", "No tag."], ["new", "New", "Shows a New badge, near the top of the shop."], ["featured", "Featured", "Shows first on the website, with a Featured badge."]];
  var SORTS = [["order", "Your order"], ["name", "Name, A to Z"], ["low", "Price, low to high"], ["high", "Price, high to low"]];

  /* ---------- small helpers ---------- */
  function ico(name, size, weight) {
    var s = document.createElementNS(SVG, "svg");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("width", size || 16); s.setAttribute("height", size || 16); s.setAttribute("fill", "none");
    s.setAttribute("stroke", "currentColor"); s.setAttribute("stroke-width", weight || 2); s.setAttribute("stroke-linecap", "round"); s.setAttribute("stroke-linejoin", "round");
    s.setAttribute("aria-hidden", "true"); s.innerHTML = P[name]; return s;
  }
  // el("button", {class: "x", text: "Save", onclick: fn, "aria-label": "..."}, [children]). Never writes a style attribute.
  // Puts kids in a box in place of what it had. A part left out (null) is skipped, never written as "null".
  function fill(box, kids) { box.replaceChildren.apply(box, kids.filter(function (k) { return k != null; })); return box; }
  function el(tag, props, kids) {
    var e = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      var v = props[k]; if (v == null || v === false) return;
      if (k === "class") e.className = v; else if (k === "text") e.textContent = v;
      else if (k.slice(0, 2) === "on" && typeof v === "function") e[k] = v;
      else if (k === "value" || k === "checked" || k === "disabled" || k === "hidden" || k === "selected" || k === "open") e[k] = v;
      else e.setAttribute(k, v === true ? "" : v);
    });
    (kids || []).forEach(function (c) { if (c != null && c !== false) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }
  function money(c) { return c == null ? "" : "$" + (c / 100).toLocaleString("en-US", { minimumFractionDigits: c % 100 ? 2 : 0, maximumFractionDigits: 2 }); }
  function dollarsIn(c) { return c == null ? "" : (c / 100).toFixed(2); }
  function toCents(v) { var s = String(v == null ? "" : v).replace(/[$,\s]/g, ""); if (!s) return null; var n = Number(s); return isFinite(n) && n >= 0 ? Math.round(n * 100) : undefined; }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }
  function dayWords(d, year) { var m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(d || ""); if (!m) return ""; return new Date(+m[1], m[2] - 1, +m[3]).toLocaleDateString("en-US", year ? { month: "short", day: "numeric", year: "numeric" } : { month: "short", day: "numeric" }); }
  function ago(iso) {
    var s = (Date.now() - Date.parse(iso)) / 1000; if (!isFinite(s)) return "";
    return s < 50 ? "just now" : s < 3600 ? Math.round(s / 60) + " min ago" : s < 86400 ? plural(Math.round(s / 3600), "hour", "hours") + " ago"
      : s < 172800 ? "yesterday" : new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  function localToday() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function copy(x) { return JSON.parse(JSON.stringify(x)); }
  function has(q, list) { q = q.toLowerCase(); return list.some(function (s) { return String(s || "").toLowerCase().indexOf(q) >= 0; }); }
  function hostOf(u) { try { return new URL(/^https?:/i.test(u) ? u : "https://" + u).host; } catch (e) { return u || ""; } }
  // Whether an item's sale is on today, and an item's price as the website shows it today.
  function saleOn(x, today) { return !!(x.sale && x.price != null && (!x.sale.ends || x.sale.ends >= today)); }
  function saleOf(x, cents) { if (cents == null) return null; return x.sale.pct ? Math.round(cents * (100 - x.sale.pct) / 100) : cents === x.price ? x.sale.price : cents; }
  function shownPrice(x, today) { return saleOn(x, today) ? saleOf(x, x.price) : x.price; }
  function priceFrom(x) {   // the lowest price of an item with priced choices ("from $45")
    var all = [x.price]; (x.options || []).forEach(function (o) { o.choices.forEach(function (c) { if (c.price != null) all.push(c.price); }); });
    all = all.filter(function (c) { return c != null; }); return all.length > 1 && Math.min.apply(null, all) !== Math.max.apply(null, all);
  }

  function mount(box, opts) {
    var you = opts.mode === "portal", shop = opts.shop, today = opts.today || localToday(), imgCache = {};
    var whose = you ? "your website" : "the website", whoseCap = you ? "Your website" : "The website";
    var st = { q: "", chip: "all", cat: "", sort: "order", picked: [], open: null, draft: null, dirty: false, sel: 0, pending: [], dragId: null };
    var finder = { status: "idle", from: "", photos: [], suggest: {}, listing: {}, plan: {}, error: "", hidden: false, adding: "" };
    var kind = function () { return KINDS[shop.checkout === "generic" ? "generic" : "square"]; };
    var byId = function (id) { return shop.items.filter(function (x) { return x.id === id; })[0]; };
    var image = function (path) { return imgCache[path] = imgCache[path] || Promise.resolve(opts.image(path)).catch(function () { return ""; }); };
    var picPath = function (key) { return "/api/shop/pic?key=" + encodeURIComponent(key); };
    var peekPath = function (p) { return "/api/shop/peek?site=" + encodeURIComponent(opts.site) + "&src=" + encodeURIComponent(p.src) + "&sig=" + encodeURIComponent(p.sig); };
    // An <img> that fills in once its address is ready.
    function photoImg(path, alt) { var i = el("img", { alt: alt || "", loading: "lazy", decoding: "async" }); image(path).then(function (u) { if (u) i.src = u; else i.classList.add("swm-gone"); }); return i; }

    /* ---------- the frame: drawn once; each part repaints itself ---------- */
    var root = el("div", { class: "swm", "data-mode": you ? "portal" : "admin" });
    var sum = el("span", { class: "swm-sum" }), coBadge = opts.checkout || el("span", { class: "swm-co" });
    var acts = el("div", { class: "swm-acts" });
    var top = el("div", { class: "swm-top" }, [opts.who || null, el("div", { class: "swm-top-t" }, [sum]), coBadge, acts]);
    var banner = el("div", { class: "swm-banner", hidden: true, role: "status" });
    var find = el("input", { type: "search", class: "swm-find-in", autocomplete: "off", "aria-label": "Search items" });
    var catSel = el("select", { class: "swm-sel", "aria-label": "Category" });
    var sortSel = el("select", { class: "swm-sel", "aria-label": "Order" }, SORTS.map(function (s) { return el("option", { value: s[0], text: s[1] }); }));
    var tools = el("div", { class: "swm-tools" }, [el("label", { class: "swm-find" }, [ico("search", 16), find]), catSel, sortSel]);
    var chips = el("div", { class: "swm-chips", role: "group", "aria-label": "Which items" });
    var table = el("table", { class: "swm-t" }), tbody = el("tbody"), none = el("p", { class: "swm-none", hidden: true });
    var headCk = el("input", { type: "checkbox", class: "swm-ck", "aria-label": "Select every item shown" });
    table.appendChild(el("thead", {}, [el("tr", {}, [el("th", { class: "c-ck", scope: "col" }, [headCk]), el("th", { scope: "col", text: "Item" }), el("th", { scope: "col", class: "c-pr", text: "Price" }),
      el("th", { scope: "col", class: "c-st", text: you ? "On your website" : "On the website" })])]));
    table.appendChild(tbody);
    var left = el("div", { class: "swm-left" }, [table, none]);
    var ed = el("section", { class: "swm-ed", hidden: true, "aria-label": "Item" });
    var split = el("div", { class: "swm-split" }, [left, ed]);
    var bulk = el("div", { class: "swm-bulk", hidden: true, role: "region", "aria-label": "Change the selected items" });
    var toastBox = el("div", { class: "swm-toast", role: "status", "aria-live": "polite", hidden: true });
    var live = el("div", { class: "swm-sr", "aria-live": "assertive" });
    root.appendChild(top); root.appendChild(banner); root.appendChild(tools); root.appendChild(chips); root.appendChild(split); root.appendChild(bulk); root.appendChild(toastBox); root.appendChild(live);
    box.appendChild(root);

    // The top buttons: Changes, (Import), Export, Add an item.
    var changesBtn = el("button", { class: "swm-btn plain", type: "button", onclick: showChanges }, [ico("hist", 15), "Changes"]);
    var exportBtn = el("button", { class: "swm-btn plain", type: "button", title: "A spreadsheet (CSV) of every item, for Excel, Google Sheets or Numbers", onclick: exportCsv }, [ico("down", 15), "Export"]);
    var addBtn = el("button", { class: "swm-btn", type: "button", onclick: function () { openItem(null); } }, [ico("plus", 15), "Add an item"]);
    [changesBtn].concat(opts.extra || [], [exportBtn, addBtn]).forEach(function (b) { acts.appendChild(b); });

    find.oninput = function () { st.q = find.value; paintList(); };
    catSel.onchange = function () { st.cat = catSel.value; paintList(); };
    sortSel.onchange = function () { st.sort = sortSel.value; paintList(); };
    headCk.onchange = function () { var ids = shownItems().map(function (x) { return x.id; }); st.picked = headCk.checked ? ids : []; paintList(); paintBulk(); };

    /* ---------- the list ---------- */
    function counts() {
      var n = { all: shop.items.length, live: 0, sold: 0, hidden: 0, sale: 0, tagged: 0, nophoto: 0, nolink: 0 };
      shop.items.forEach(function (x) { n[x.show]++; if (saleOn(x, today)) n.sale++; if (x.tag) n.tagged++; if (!(x.photos || []).length) n.nophoto++; if (!x.link) n.nolink++; });
      return n;
    }
    var CHIPS = [["all", "All"], ["live", you ? "Showing on your website" : "Showing on the website"], ["sold", "Sold out"], ["hidden", "Hidden"], ["sale", "On sale"],
      ["tagged", "New or Featured"], ["nophoto", "No photos yet"], ["nolink", "No checkout link yet"]];
    function fits(x, chip) {
      return chip === "all" || (chip === "sale" ? saleOn(x, today) : chip === "tagged" ? !!x.tag : chip === "nophoto" ? !(x.photos || []).length : chip === "nolink" ? !x.link : x.show === chip);
    }
    function shownItems() {
      var q = st.q.trim(), list = shop.items.filter(function (x) {
        return fits(x, st.chip) && (!st.cat || (st.cat === "\u0000" ? !x.cat : x.cat === st.cat)) && (!q || has(q, [x.name, x.cat, x.desc]));
      });
      var price = function (x) { return x.price == null ? Infinity : shownPrice(x, today); };
      if (st.sort === "name") list.sort(function (a, z) { return a.name.localeCompare(z.name); });
      if (st.sort === "low") list.sort(function (a, z) { return price(a) - price(z); });
      if (st.sort === "high") list.sort(function (a, z) { return (z.price == null ? -1 : shownPrice(z, today)) - (a.price == null ? -1 : shownPrice(a, today)); });
      return list;
    }
    // Drag to reorder only when the whole list shows in its own order.
    function reorderable() { return st.sort === "order" && st.chip === "all" && !st.cat && !st.q.trim(); }
    function paintTop() {
      var n = counts(), c = kind();
      sum.textContent = plural(n.all, "item", "items") + ": " + [n.live + " showing", n.sold ? n.sold + " sold out" : "", n.hidden + " hidden"].filter(Boolean).join(", ")
        + (shop.updated ? " · saved " + ago(shop.updated) + (shop.by === "client" ? (you ? " by you" : " by " + (opts.name || "the client") + " in their portal") : you ? " by Stray Wolf" : "") : "");
      if (!opts.checkout) { fill(coBadge, [ico("lock", 13), c.badge]); coBadge.title = c.tip; }
      changesBtn.disabled = !(shop.history || []).length;
      exportBtn.disabled = !shop.items.length;
    }
    function paintChips() {
      var n = counts();
      if (st.chip !== "all" && !n[st.chip]) st.chip = "all";
      fill(chips, CHIPS.filter(function (c) { return c[0] === "all" || n[c[0]]; }).map(function (c) {
        return el("button", { class: "swm-chip", type: "button", "aria-pressed": String(st.chip === c[0]), onclick: function () { st.chip = c[0]; paintChips(); paintList(); } }, [c[1] + " ", el("b", { text: String(n[c[0]]) })]);
      }));
      var cats = []; shop.items.forEach(function (x) { if (x.cat && cats.indexOf(x.cat) < 0) cats.push(x.cat); });
      if (st.cat && st.cat !== "\u0000" && cats.indexOf(st.cat) < 0) st.cat = "";
      fill(catSel, [el("option", { value: "", text: "All categories" })].concat(cats.sort().map(function (c) { return el("option", { value: c, text: c, selected: c === st.cat }); }),
        shop.items.some(function (x) { return !x.cat; }) && cats.length ? [el("option", { value: "\u0000", text: "No category", selected: st.cat === "\u0000" })] : []));
      catSel.hidden = !cats.length; tools.hidden = chips.hidden = !shop.items.length;
    }
    function paintList() {
      var list = shownItems(), drag = reorderable(), focus = document.activeElement, label = focus && root.contains(focus) && focus.getAttribute("aria-label");
      st.picked = st.picked.filter(function (id) { return byId(id); });
      fill(tbody, list.map(function (x) { return row(x, drag); }));
      table.hidden = !list.length; none.hidden = !!list.length;
      none.textContent = shop.items.length ? "No items match that. Clear the search or pick All." : "No items yet. " + (you ? "Add one with Add an item." : "Import a list, or add one with Add an item.");
      headCk.checked = list.length > 0 && list.every(function (x) { return st.picked.indexOf(x.id) >= 0; });
      headCk.indeterminate = !headCk.checked && list.some(function (x) { return st.picked.indexOf(x.id) >= 0; });
      root.classList.toggle("is-drag", drag);
      if (label) { var back = root.querySelector('[aria-label="' + label.replace(/["\\]/g, "\\$&") + '"]'); if (back && back !== focus) back.focus({ preventScroll: true }); }
    }
    function thumb(x) {
      var p = (x.photos || [])[0];
      return p ? el("span", { class: "swm-th" }, [photoImg(picPath(p.key), "")]) : el("span", { class: "swm-th is-empty", title: "No photos yet" }, [ico("photo", 16)]);
    }
    function flag(x) {
      return x.tag === "featured" ? el("span", { class: "swm-flag" }, [ico("star", 12, 2.2), "Featured"]) : x.tag === "new" ? el("span", { class: "swm-flag is-new", text: "New" }) : null;
    }
    function metaLine(x) {
      var n = (x.photos || []).length, bits = [x.cat || null];
      if (x.kind === "class") bits.push("Class" + (x.when ? ", " + whenWords(x.when) : ""));
      (x.options || []).forEach(function (o) { bits.push(plural(o.choices.length, o.name.toLowerCase().replace(/s$/, ""), o.name.toLowerCase().replace(/s?$/, "s"))); });
      var out = el("small", {}, [bits.filter(Boolean).join(" · ")]);
      if (bits.filter(Boolean).length) out.appendChild(document.createTextNode(" · "));
      out.appendChild(n ? document.createTextNode(plural(n, "photo", "photos")) : el("span", { class: "swm-warn", text: "No photos yet" }));
      if (!x.link) { out.appendChild(document.createTextNode(" · ")); out.appendChild(el("span", { class: "swm-warn", text: "No checkout link" })); }
      return out;
    }
    function whenWords(s) {
      var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(s || ""); if (!m) return "";
      var d = new Date(+m[1], m[2] - 1, +m[3], +m[4], +m[5]);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ", " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    }
    function row(x, drag) {
      var picked = st.picked.indexOf(x.id) >= 0, on = saleOn(x, today);
      var ck = el("input", { type: "checkbox", class: "swm-ck", checked: picked, "aria-label": "Select " + x.name, onchange: function () {
        st.picked = ck.checked ? st.picked.concat(x.id) : st.picked.filter(function (id) { return id !== x.id; }); tr.classList.toggle("is-picked", ck.checked); paintBulk(); paintHeadCk();
      } });
      // The price, typed right in the row: Enter or leaving the box saves it, Esc puts it back.
      var price = el("input", { class: "swm-price", inputmode: "decimal", autocomplete: "off", value: dollarsIn(x.price), placeholder: "none", "aria-label": "Price of " + x.name,
        title: "The regular price. Type a new one and press Enter." });
      price.onkeydown = function (e) { if (e.key === "Enter") { e.preventDefault(); price.blur(); } else if (e.key === "Escape") { price.value = dollarsIn(x.price); price.blur(); } };
      price.onchange = function () {
        var v = price.value.trim(); if (toCents(v) === x.price) { price.value = dollarsIn(x.price); return; }
        if (toCents(v) === undefined) { toast("That price doesn't look right. Type it like 12.50."); price.value = dollarsIn(x.price); return; }
        setTimeout(function () { save("/prices", { prices: [{ id: x.id, price: v }] }); }, 0);   // after Tab has moved on, so the next box keeps the cursor
      };
      var stSel = el("select", { class: "swm-state is-" + x.show, "aria-label": x.name + (you ? " on your website" : " on the website"), title: SHOW.filter(function (s) { return s[0] === x.show; })[0][2] },
        SHOW.map(function (s) { return el("option", { value: s[0], text: s[1], selected: s[0] === x.show }); }));
      stSel.onchange = function () {
        var v = stSel.value;
        if (v !== "hidden" && !x.link) { stSel.value = x.show; toast(kind().need); openItem(x.id, "link"); return; }
        save("/bulk", { ids: [x.id], do: v });
      };
      var nameBtn = el("button", { class: "swm-name-b", type: "button", text: x.name, title: "Open " + x.name, onclick: function () { openItem(x.id); } });
      var grip = drag ? el("button", { class: "swm-grip", type: "button", draggable: "true", "aria-label": "Move " + x.name + ": drag, or use the up and down arrow keys", title: "Drag to change the order on " + whose }, [ico("grip", 14)]) : null;
      var tr = el("tr", { class: [x.id === st.open ? "is-open" : "", picked ? "is-picked" : "", x.show === "hidden" ? "is-dim" : ""].join(" ").trim() || null, "data-id": x.id }, [
        el("td", { class: "c-ck" }, [ck]),
        el("td", { class: "c-it" }, [el("div", { class: "swm-name" }, [grip, thumb(x), el("div", { class: "swm-name-t" }, [el("div", { class: "swm-name-l" }, [nameBtn, flag(x)]), metaLine(x)])])]),
        el("td", { class: "c-pr" }, [el("div", { class: "swm-pbox" }, [el("span", { "aria-hidden": "true", text: "$" }), price]),
          on ? el("small", { class: "swm-sale-w" }, [ico("tag", 12), (x.sale.pct ? x.sale.pct + "% off: " : "Sale: ") + money(shownPrice(x, today)) + (x.sale.ends ? " until " + dayWords(x.sale.ends) : "")])
            : x.sale ? el("small", { class: "swm-muted", text: "Sale ended " + dayWords(x.sale.ends) }) : priceFrom(x) ? el("small", { class: "swm-muted", text: "Choices have their own prices" }) : null,
          shop.checkout !== "generic" && x.sqPrice != null && x.sqPrice !== x.price ? el("small", { class: "swm-warn" }, ["Square charges " + money(x.sqPrice) + " ",
            el("button", { class: "swm-link-b", type: "button", text: "Use " + money(x.sqPrice), "aria-label": "Use Square's price, " + money(x.sqPrice) + ", for " + x.name,
              onclick: function () { save("/prices", { prices: [{ id: x.id, price: dollarsIn(x.sqPrice) }] }); } })]) : null]),
        el("td", { class: "c-st" }, [stSel])]);
      if (grip) rowDrag(tr, grip, x);
      tr.ondblclick = function (e) { if (!/INPUT|SELECT|BUTTON/.test(e.target.tagName)) openItem(x.id); };
      return tr;
    }
    function paintHeadCk() { var list = shownItems(); headCk.checked = list.length > 0 && list.every(function (x) { return st.picked.indexOf(x.id) >= 0; }); headCk.indeterminate = !headCk.checked && st.picked.length > 0; }
    // Rows move by dragging the grip, or with the arrow keys on it; the new order is saved once the move ends.
    function rowDrag(tr, grip, x) {
      grip.ondragstart = function (e) { st.dragId = x.id; e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", x.name); e.dataTransfer.setDragImage(tr, 20, 20); } catch (err) {} tr.classList.add("is-moving"); };
      grip.ondragend = function () { tr.classList.remove("is-moving"); if (st.dragId) { st.dragId = null; saveOrder(); } };
      tr.ondragover = function (e) {
        if (!st.dragId || st.dragId === x.id) return; e.preventDefault();
        var from = byId(st.dragId), r = tr.getBoundingClientRect(), after = e.clientY > r.top + r.height / 2;
        shop.items.splice(shop.items.indexOf(from), 1); shop.items.splice(shop.items.indexOf(x) + (after ? 1 : 0), 0, from);
        var moving = tbody.querySelector('tr[data-id="' + st.dragId + '"]'); if (moving) tbody.insertBefore(moving, after ? tr.nextSibling : tr);
      };
      grip.onkeydown = function (e) {
        if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return; e.preventDefault();
        var at = shop.items.indexOf(x), to = at + (e.key === "ArrowUp" ? -1 : 1); if (to < 0 || to >= shop.items.length) return;
        shop.items.splice(at, 1); shop.items.splice(to, 0, x); paintList(); say(x.name + " moved to " + (to + 1) + " of " + shop.items.length + ".");
        clearTimeout(rowDrag.t); rowDrag.t = setTimeout(saveOrder, 900);
      };
    }
    function saveOrder() { save("/order", { ids: shop.items.map(function (x) { return x.id; }) }, "The new order shows on " + whose + " within a minute."); }

    /* ---------- saving: every change goes to SW Core, the answer is the whole shop ---------- */
    // words: what the toast says (default: the change as SW Core words it, with Undo).
    function save(path, body, words) {
      return opts.call(path, body || {}).then(function (d) {
        if (!d || !d.ok) { toast((d && d.error) || "That didn't save. Check your internet and try again."); paintList(); return d || {}; }
        took(d.shop, words);
        return d;
      });
    }
    function took(next, words) {
      var before = (shop.history || [])[0], line = (next.history || [])[0];
      shop = next; paintTop(); paintChips(); paintList(); paintBulk();
      if (opts.onChange) opts.onChange(shop);
      if (words !== false) toast(words || (line ? line.what + "." : "Saved."), line && (!before || line.id !== before.id) ? line : null);
    }
    function update(next) { shop = next; paintTop(); paintChips(); paintList(); paintBulk(); if (st.open && st.open !== "new" && !byId(st.open)) closeItem(true); }

    /* ---------- toast, with Undo for the change it names ---------- */
    var toastTimer;
    function toast(text, line) {
      clearTimeout(toastTimer);
      fill(toastBox, [el("span", { text: text }), line ? el("button", { type: "button", class: "swm-undo", onclick: function () { undo(line); } }, [ico("undo", 14), "Undo"]) : null]);
      toastBox.hidden = false; toastTimer = setTimeout(function () { toastBox.hidden = true; }, line ? 9000 : 5000);
    }
    function say(text) { live.textContent = ""; setTimeout(function () { live.textContent = text; }, 30); }
    function undo(line) {
      toastBox.hidden = true;
      return opts.call("/undo", { id: line.id }).then(function (d) {
        if (!d || !d.ok) { toast((d && d.error) || "That couldn't be undone. Try again."); return; }
        took(d.shop, "Undone: " + line.what + ".");
        if (st.open && st.open !== "new") { if (byId(st.open)) loadDraft(byId(st.open)); else closeItem(true); }
      });
    }

    /* ---------- many at once ---------- */
    var pop = null;
    function paintBulk() {
      var n = st.picked.length; bulk.hidden = !n; closePop();
      if (!n) { bulk.replaceChildren(); return; }
      var items = st.picked.map(byId).filter(Boolean), anySale = items.some(function (x) { return !!x.sale; });
      var b = function (icon, text, fn, title) { return el("button", { type: "button", title: title || null, onclick: fn }, [ico(icon, 15), text]); };
      fill(bulk, [el("b", { text: n + " selected" }), el("span", { class: "swm-sep" }),
        b("eye", "Show", function () { save("/bulk", { ids: st.picked, do: "live" }).then(skippedNote); }, "Show them on " + whose + " with their Buy buttons"),
        b("eyeoff", "Hide", function () { save("/bulk", { ids: st.picked, do: "hidden" }); }, "Take them off " + whose + "; they stay saved here"),
        b("ban", "Sold out", function () { save("/bulk", { ids: st.picked, do: "sold" }).then(skippedNote); }, "Keep them on " + whose + ", marked Sold out, with no Buy button"),
        b("tag", "Put on sale", function (e) { salePop(e.currentTarget, items); }),
        anySale ? b("x", "End sale", function () { save("/bulk", { ids: st.picked, do: "unsale" }); }) : null,
        b("dollar", "Change price", function (e) { pricePop(e.currentTarget, items); }),
        b("folder", "Category", function (e) { catPop(e.currentTarget); }),
        b("star", "Tag", function (e) { tagPop(e.currentTarget); }),
        b("copy", "Duplicate", function () { save("/bulk", { ids: st.picked, do: "duplicate" }); }, "A hidden copy of each, right after it"),
        b("trash", "Delete", function () { var ids = st.picked; st.picked = []; save("/bulk", { ids: ids, do: "delete" }); if (ids.indexOf(st.open) >= 0) closeItem(true); }),
        el("span", { class: "swm-sep" }), el("button", { type: "button", class: "swm-clear", text: "Clear", onclick: function () { st.picked = []; paintList(); paintBulk(); } })]);
    }
    function skippedNote(d) { if (d && d.skipped) toast(plural(d.skipped, "item has", "items have") + " no checkout link yet, so " + (d.skipped === 1 ? "it stays" : "they stay") + " hidden. Add the link, then show it.", (shop.history || [])[0]); }
    function closePop() { if (pop) { pop.remove(); pop = null; } }
    // A small panel above the bar, beside the button that opened it. Esc or Cancel closes it.
    function popover(btn, title, body, go, goText) {
      closePop();
      var err = el("p", { class: "swm-err", role: "alert", hidden: true });
      var ok = el("button", { class: "swm-btn is-sm", type: "submit", text: goText });
      pop = el("form", { class: "swm-pop", "aria-label": title, onsubmit: function (e) { e.preventDefault(); var no = go(); if (no) { err.textContent = no; err.hidden = false; } else closePop(); } },
        [el("h3", { text: title })].concat(body, [err, el("div", { class: "swm-pop-acts" }, [el("button", { class: "swm-btn plain is-sm", type: "button", text: "Cancel", onclick: function () { closePop(); btn.focus(); } }), ok])]));
      pop.onkeydown = function (e) { if (e.key === "Escape") { closePop(); btn.focus(); } };
      bulk.appendChild(pop);
      var x = Math.max(0, Math.min(btn.offsetLeft - 20, bulk.clientWidth - pop.offsetWidth)); pop.style.left = x + "px";
      var first = pop.querySelector("input,select,button"); if (first) first.focus();
    }
    function preview(items, after) {
      var shown = items.slice(0, 5);
      return el("ul", { class: "swm-pv" }, shown.map(function (x) { var now = after(x); return el("li", {}, [el("span", { text: x.name }), x.price == null ? el("em", { text: "no price" }) : el("s", { text: money(x.price) }), el("b", { text: now == null ? "–" : money(now) })]); })
        .concat(items.length > 5 ? [el("li", { class: "is-more", text: "and " + plural(items.length - 5, "more item", "more items") })] : []));
    }
    function salePop(btn, items) {
      var pct = el("input", { inputmode: "numeric", value: "20", "aria-label": "Percent off", id: "swm-bp" }), ends = el("input", { type: "date", min: today, "aria-label": "Last day of the sale", id: "swm-be" });
      var pv = el("div"), paint = function () { var n = Math.round(Number(pct.value)); fill(pv, [preview(items, function (x) { return x.price == null ? null : n >= 1 && n <= 95 ? Math.round(x.price * (100 - n) / 100) : x.price; })]); };
      pct.oninput = paint; paint();
      popover(btn, "Put " + plural(items.length, "item", "items") + " on sale", [el("div", { class: "swm-row2" }, [
        el("div", { class: "swm-f" }, [el("label", { for: "swm-bp", text: "Percent off" }), el("div", { class: "swm-money is-r" }, [pct, el("span", { text: "%" })])]),
        el("div", { class: "swm-f" }, [el("label", { for: "swm-be" }, ["Last day ", el("em", { text: "(optional)" })]), ends])]), pv,
        el("p", { class: "swm-hint", text: "Each shows its sale price with the regular one crossed out" + " until the end of the last day, then goes back by itself." })], function () {
        var n = Number(pct.value); if (!(n >= 1 && n <= 95 && Math.round(n) === n)) return "Type a whole number from 1 to 95.";
        save("/bulk", { ids: st.picked, do: "sale", pct: n, ends: ends.value || "" }); return "";
      }, "Put on sale");
    }
    function pricePop(btn, items) {
      var how = "set", val = el("input", { inputmode: "decimal", "aria-label": "New price", id: "swm-bpv" }), unit = el("span", { text: "$" }), money1 = el("div", { class: "swm-money" }, [unit, val]);
      var pv = el("div"), seg = el("div", { class: "swm-seg", role: "group", "aria-label": "How" });
      var calc = function (x) { if (how === "set") { var c = toCents(val.value); return c === undefined ? x.price : c; } var p = Number(val.value); return x.price == null || !isFinite(p) ? x.price : Math.round(x.price * (100 + p) / 100); };
      var paint = function () { fill(pv, [preview(items, calc)]); };
      [["set", "Set a price"], ["pct", "Raise or lower by %"]].forEach(function (o) {
        seg.appendChild(el("button", { type: "button", "aria-pressed": String(how === o[0]), text: o[1], onclick: function () {
          how = o[0]; Array.prototype.forEach.call(seg.children, function (b, i) { b.setAttribute("aria-pressed", String(i === (how === "set" ? 0 : 1))); });
          money1.className = "swm-money" + (how === "pct" ? " is-r" : ""); fill(money1, how === "pct" ? [val, el("span", { text: "%" })] : [unit, val]);
          val.placeholder = how === "pct" ? "10 raises, -10 lowers" : "12.50"; val.setAttribute("aria-label", how === "pct" ? "Percent up or down" : "New price"); paint(); val.focus();
        } }));
      });
      val.placeholder = "12.50"; val.oninput = paint; paint();
      popover(btn, "Change the price of " + plural(items.length, "item", "items"), [seg, money1, pv], function () {
        if (how === "set") { var c = toCents(val.value); if (c === undefined || c === null) return "Type a price like 12.50."; save("/bulk", { ids: st.picked, do: "price", set: val.value }); return ""; }
        var p = Number(val.value); if (!isFinite(p) || !p || p < -90 || p > 500) return "Type a percent like 10 (up) or -10 (down)."; save("/bulk", { ids: st.picked, do: "price", pct: p }); return "";
      }, "Change prices");
    }
    function catPop(btn) {
      var cats = []; shop.items.forEach(function (x) { if (x.cat && cats.indexOf(x.cat) < 0) cats.push(x.cat); });
      var inp = el("input", { list: "swm-cats-b", maxlength: String(MAX.cat), placeholder: cats[0] || "Planters", "aria-label": "Category", id: "swm-bc" });
      popover(btn, "Move to a category", [el("div", { class: "swm-f" }, [el("label", { for: "swm-bc", text: "Category" }), inp, el("small", { text: "Pick one in use, or type a new one. Leave it empty for none." })]),
        el("datalist", { id: "swm-cats-b" }, cats.map(function (c) { return el("option", { value: c }); }))], function () { save("/bulk", { ids: st.picked, do: "cat", cat: inp.value.trim() }); return ""; }, "Move");
    }
    function tagPop(btn) {
      var pickTag = "", seg = el("div", { class: "swm-seg", role: "group", "aria-label": "Tag" }), help = el("small", { text: TAGS[0][2] });
      TAGS.forEach(function (t, i) { seg.appendChild(el("button", { type: "button", "aria-pressed": String(i === 0), text: t[1], onclick: function () { pickTag = t[0]; help.textContent = t[2]; Array.prototype.forEach.call(seg.children, function (b, j) { b.setAttribute("aria-pressed", String(j === i)); }); } })); });
      popover(btn, "Tag", [seg, help], function () { save("/bulk", { ids: st.picked, do: "tag", tag: pickTag }); return ""; }, "Apply");
    }

    /* ---------- the item, opened beside the list ---------- */
    function openItem(id, focusOn) {
      if (st.dirty && st.open !== id) { askSave(function () { openItem(id, focusOn); }); return; }
      var x = id ? byId(id) : null; if (id && !x) return;
      st.open = id || "new"; st.pending = [];
      loadDraft(x || { name: "", kind: "item", cat: "", desc: "", price: null, link: "", show: "hidden", photos: [], options: [] });
      paintList(); split.classList.add("is-open");
      if (!left.offsetWidth) ed.scrollIntoView({ block: "start" });   // a narrow box: the item takes the list's place, so show it from its top
      var f = ed.querySelector(focusOn === "link" ? ".swm-link" : id ? "h2" : "#swm-name"); if (f) { if (f.tagName === "H2") f.setAttribute("tabindex", "-1"); f.focus({ preventScroll: !!id }); }
    }
    function loadDraft(x) { st.draft = copy(x); st.draft.photos = st.draft.photos || []; st.draft.options = st.draft.options || []; st.dirty = false; st.sel = 0; paintEditor(); }
    function closeItem(force) {
      if (!force && st.dirty) { askSave(function () { closeItem(true); }); return; }
      var was = st.open, inPlace = !left.offsetWidth; st.open = null; st.draft = null; st.dirty = false; st.pending = []; ed.hidden = true; ed.replaceChildren(); split.classList.remove("is-open"); paintList();
      // Back on the item's row; when the item had taken the list's place, the row is scrolled back into view too.
      var back = was && tbody.querySelector('tr[data-id="' + was + '"] .swm-name-b'); if (back) { if (inPlace) back.scrollIntoView({ block: "center" }); back.focus({ preventScroll: true }); }
    }
    // Unsaved changes, and another item (or closing) asked for: save them, or leave them.
    function askSave(then) {
      var bar = ed.querySelector(".swm-ask"); if (bar) bar.remove();
      bar = el("div", { class: "swm-ask", role: "alert" }, [el("span", { text: "Save your changes to " + (st.draft.name || "this item") + " first?" }),
        el("button", { class: "swm-btn is-sm", type: "button", text: "Save", onclick: function () { saveDraft().then(function (ok) { if (ok) then(); }); } }),
        el("button", { class: "swm-btn plain is-sm", type: "button", text: "Don't save", onclick: function () { st.dirty = false; then(); } })]);
      ed.insertBefore(bar, ed.firstChild.nextSibling); bar.querySelector("button").focus();
    }
    function changed() { if (!st.dirty) { st.dirty = true; paintFoot(); } }
    var foot, errBox, savedNote;
    function paintFoot() { if (!foot) return; var s = foot.querySelector(".swm-save"); s.disabled = !st.dirty && st.open !== "new"; foot.querySelector(".swm-cancel").textContent = st.dirty || st.open === "new" ? "Cancel" : "Close"; }

    function paintEditor() {
      var d = st.draft, isNew = st.open === "new", c = kind();
      ed.hidden = false; ed.setAttribute("aria-label", isNew ? "New item" : d.name);
      var title = el("h2", { text: isNew ? "New item" : d.name });
      savedNote = el("span", { class: "swm-saved", text: isNew ? "Not saved yet" : "" });
      var head = el("header", { class: "swm-ed-hd" }, [
        el("button", { class: "swm-back", type: "button", onclick: function () { closeItem(); } }, [ico("back", 15), "All items"]),
        el("div", { class: "swm-ed-t" }, [title, el("p", {}, [isNew ? null : pill(byId(d.id) ? byId(d.id).show : d.show), isNew ? null : flag(d), savedNote])]),
        el("button", { class: "swm-close", type: "button", "aria-label": "Close " + (d.name || "this item"), title: "Close", onclick: function () { closeItem(); } }, [ico("x", 18)])]);
      errBox = el("p", { class: "swm-err", role: "alert", hidden: true });
      foot = el("div", { class: "swm-foot" }, [
        el("div", { class: "swm-foot-l" }, isNew ? [] : [
          el("button", { class: "swm-btn plain is-sm", type: "button", title: "A hidden copy, right after it, with the same photos", onclick: duplicate }, [ico("copy", 14), "Duplicate"]),
          el("button", { class: "swm-btn plain is-sm swm-del", type: "button", onclick: removeItem }, [ico("trash", 14), "Delete"])]),
        el("div", { class: "swm-foot-r" }, [el("button", { class: "swm-btn plain swm-cancel", type: "button", text: "Cancel", onclick: function () { closeItem(true); } }),
          el("button", { class: "swm-btn swm-save", type: "submit", text: isNew ? "Add it" : "Save" })])]);
      var form = el("form", { class: "swm-form", novalidate: true, onsubmit: function (e) { e.preventDefault(); saveDraft(); } }, [
        photosPart(), namePart(), salePart(), optionsPart(), descPart(), showPart(), linkPart(), errBox, foot,
        el("p", { class: "swm-foot-n", text: "Saved changes show on " + whose + " within a minute. Every change can be undone under Changes." })]);
      form.onkeydown = function (e) { if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) { e.preventDefault(); saveDraft(); } };
      form.addEventListener("input", function (e) { if (!e.target.closest(".swm-noedit")) changed(); });
      fill(ed, [head, form]); paintFoot();
    }
    function pill(show) { var s = SHOW.filter(function (x) { return x[0] === show; })[0]; return el("span", { class: "swm-st is-" + show }, [el("i"), s[1]]); }
    function section(kids, cls) { return el("div", { class: "swm-sec" + (cls ? " " + cls : "") }, kids); }
    function field(label, input, help, cls) { return el("div", { class: "swm-f" + (cls ? " " + cls : "") }, [typeof label === "string" ? el("label", { for: input.id, text: label }) : label, input, help ? el("small", { text: help }) : null]); }
    function input(id, value, props) { return el("input", Object.assign({ id: id, autocomplete: "off", value: value == null ? "" : String(value) }, props || {})); }

    /* Photos: up to five, the first is the main one. Drag to move (or the arrow keys on a photo), x takes one off.
       On a saved item a new photo goes up at once; on a new one it waits for the first save. */
    function photosPart() {
      var d = st.draft, wrap = el("div", { class: "swm-sec swm-photos" });
      var paint = function () {
        var list = d.photos.concat(st.pending), room = MAX.photos - list.length;
        var grid = el("div", { class: "swm-ph", role: "list", "aria-label": "Photos, the first is the main one" });
        list.forEach(function (p, i) { grid.appendChild(tile(p, i, list.length, paint)); });
        if (room > 0) grid.appendChild(el("button", { type: "button", class: "swm-ph-add" + (list.length ? "" : " is-first"), onclick: function () { pickFiles(paint); } },
          [ico("photo", list.length ? 18 : 24), el("span", { text: list.length ? "Add" : "Add photos" }), list.length ? null : el("small", { text: "Pick from " + whose + ", or upload. Up to 5." })]));
        dropFiles(grid, paint);
        var sel = list[Math.min(st.sel, list.length - 1)];
        var alt = sel ? input("swm-alt", sel.alt || "", { maxlength: String(MAX.alt), class: "swm-noedit-not", oninput: function () { sel.alt = alt.value; if (!sel.local && !sel.pick) changed(); auto.hidden = true; } }) : null;
        var auto = el("span", { class: "swm-auto", hidden: !(sel && (sel.from || sel.pick || sel.alt === d.name)) }, [ico("sparkle", 12), "Filled in for you"]);
        fill(wrap, [
          el("div", { class: "swm-lbl" }, [el("b", { text: "Photos" }), el("span", { text: list.length + " of " + MAX.photos })]), grid,
          list.length > 1 ? el("p", { class: "swm-hint", text: "Drag a photo to move it. The first one is the main photo on " + whose + "; the rest show when someone opens it." }) : null,
          el("div", { class: "swm-ph-acts" }, [
            el("button", { class: "swm-btn plain is-sm", type: "button", disabled: room <= 0, onclick: function () { openPicker(paint); } }, [ico("globe", 14), "Pick from " + whose]),
            el("button", { class: "swm-btn plain is-sm", type: "button", disabled: room <= 0, onclick: function () { pickFiles(paint); } }, [ico("up", 14), "Upload a photo"])]),
          sel ? el("div", { class: "swm-f swm-alt" }, [el("label", { for: "swm-alt" }, [(st.sel === 0 ? "Main photo" : "Photo " + (st.sel + 1)) + " description", auto]), alt,
            el("small", { text: "Read aloud to people who can't see the photo, and read by Google. Change it if it's not right." })]) : null]);
      };
      paint(); return wrap;
    }
    function tile(p, i, n, paint) {
      var d = st.draft, all = d.photos.concat(st.pending), img = p.key ? photoImg(picPath(p.key), "") : el("img", { alt: "", src: p.url || "" });
      var fig = el("div", { class: "swm-tile" + (i === 0 ? " is-main" : "") + (i === st.sel ? " is-sel" : ""), role: "listitem", tabindex: "0", draggable: "true",
        "aria-label": (i === 0 ? "Main photo" : "Photo " + (i + 1)) + (p.alt ? ": " + p.alt : "") + ". Arrow keys move it.", onclick: function () { st.sel = i; paint(); focusTile(i); } }, [
        img, i === 0 ? el("span", { class: "swm-main", text: "Main photo" }) : null, p.local || p.pick ? el("span", { class: "swm-wait", text: "Goes up when you save" }) : null,
        i > 0 ? el("button", { class: "swm-mk", type: "button", text: "Make main", "aria-label": "Make photo " + (i + 1) + " the main photo", onclick: function (e) { e.stopPropagation(); move(i, 0); } }) : null,
        el("button", { class: "swm-rm", type: "button", "aria-label": "Take off " + (i === 0 ? "the main photo" : "photo " + (i + 1)), title: "Take this photo off", onclick: function (e) {
          e.stopPropagation(); if (p.local || p.pick) st.pending.splice(st.pending.indexOf(p), 1); else { d.photos.splice(d.photos.indexOf(p), 1); changed(); }
          st.sel = Math.max(0, Math.min(st.sel, all.length - 2)); paint(); say("Photo taken off. Save to keep it that way.");
        } }, [ico("x", 12, 2.4)])]);
      // Saved photos and waiting ones move separately: a waiting one can't go before a saved one until it is saved.
      function move(from, to) {
        var list = (all[from].local || all[from].pick) ? st.pending : d.photos, base = list === d.photos ? 0 : d.photos.length;
        from -= base; to = Math.max(0, Math.min(list.length - 1, to - base)); if (from === to) return;
        list.splice(to, 0, list.splice(from, 1)[0]); if (list === d.photos) changed(); st.sel = to + base; paint(); focusTile(to + base); say("Moved to " + (to + base === 0 ? "the main photo" : "place " + (to + base + 1)) + ".");
      }
      fig.onkeydown = function (e) { if (e.target !== fig) return; if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); move(i, i - 1); } else if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); move(i, i + 1); } };
      fig.ondragstart = function (e) { tile.from = i; e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", "photo"); } catch (err) {} };
      fig.ondragover = function (e) { if (tile.from != null) { e.preventDefault(); fig.classList.add("is-over"); } };
      fig.ondragleave = function () { fig.classList.remove("is-over"); };
      fig.ondrop = function (e) { if (tile.from == null) return; e.preventDefault(); e.stopPropagation(); var f = tile.from; tile.from = null; move(f, i); };
      fig.ondragend = function () { tile.from = null; };
      return fig;
    }
    function focusTile(i) { var t = ed.querySelectorAll(".swm-tile")[i]; if (t) t.focus(); }
    function photoProblem(f) { return !/^image\/(jpeg|png|webp)$/.test(f.type) ? f.name + " isn't a JPG, PNG or WebP photo." : f.size > 3 * 1024 * 1024 ? f.name + " is too big (3 MB at most)." : ""; }
    function pickFiles(paint) { var f = el("input", { type: "file", accept: "image/jpeg,image/png,image/webp", multiple: true }); f.onchange = function () { takeFiles(Array.prototype.slice.call(f.files), paint); }; f.click(); }
    // Photos dragged in from the computer light the box up. depth: dragenter and dragleave also fire for the tiles inside.
    function dropFiles(zone, paint) {
      var depth = 0, hasFiles = function (e) { return !!e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], "Files") >= 0; };
      zone.addEventListener("dragenter", function (e) { if (!hasFiles(e)) return; e.preventDefault(); depth++; zone.classList.add("is-drop"); });
      zone.addEventListener("dragover", function (e) { if (!hasFiles(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = "copy"; });
      zone.addEventListener("dragleave", function () { if (--depth <= 0) { depth = 0; zone.classList.remove("is-drop"); } });
      zone.addEventListener("drop", function (e) {
        depth = 0; zone.classList.remove("is-drop"); if (!hasFiles(e) || !e.dataTransfer.files.length) return;
        e.preventDefault(); e.stopPropagation(); takeFiles(Array.prototype.slice.call(e.dataTransfer.files), paint);
      });
    }
    function takeFiles(files, paint) {
      var d = st.draft, room = MAX.photos - d.photos.length - st.pending.length, bad = [];
      files = files.filter(function (f) { var no = photoProblem(f); if (no) bad.push(no); return !no; });
      if (bad.length) toast(bad[0]);
      if (files.length > room) toast("An item has 5 photos at most, so " + plural(files.length - room, "photo was", "photos were") + " left out.");
      files = files.slice(0, Math.max(0, room)); if (!files.length) return;
      if (st.open === "new") { files.forEach(function (f) { st.pending.push({ local: true, file: f, url: URL.createObjectURL(f), alt: d.name || "" }); }); paint(); return; }
      savedNote.textContent = "Adding " + plural(files.length, "photo", "photos") + "…";
      files.reduce(function (p, f) { return p.then(function () { return upload(d.id, f, d.name); }); }, Promise.resolve()).then(function () { savedNote.textContent = ""; paint(); });
    }
    function upload(id, file, alt) {
      return Promise.resolve(opts.upload("?id=" + encodeURIComponent(id) + "&alt=" + encodeURIComponent(alt || ""), file)).then(function (r) {
        if (!r || !r.ok) { toast("The photo didn't go up: " + ((r && r.error) || "try again.")); return; }
        mergePhotos(r.item); took(r.shop, false);
      });
    }
    // Photos SW Core now has for the open item that the draft doesn't yet: added after the draft's own (its order and
    // descriptions may have unsaved changes).
    function mergePhotos(item) {
      if (!st.draft || !item || st.draft.id !== item.id) return;
      var keys = st.draft.photos.map(function (p) { return p.key; });
      (item.photos || []).forEach(function (p) { if (keys.indexOf(p.key) < 0) st.draft.photos.push(copy(p)); });
    }

    function namePart() {
      var d = st.draft, cats = [];
      shop.items.forEach(function (x) { if (x.cat && cats.indexOf(x.cat) < 0) cats.push(x.cat); });
      var name = input("swm-name", d.name, { maxlength: String(MAX.name), placeholder: "What it's called", required: true, oninput: function () { d.name = name.value; } });
      var price = input("swm-price", dollarsIn(d.price), { inputmode: "decimal", placeholder: "Leave empty for no price", oninput: function () { d.priceText = price.value; salePaint(); } });
      var cat = input("swm-cat", d.cat, { maxlength: String(MAX.cat), list: "swm-cats", placeholder: cats[0] || "Planters", oninput: function () { d.cat = cat.value; } });
      var isClass = el("input", { type: "checkbox", id: "swm-class", checked: d.kind === "class" });
      var when = input("swm-when", d.when, { type: "datetime-local", oninput: function () { d.when = when.value; } }), seats = input("swm-seats", d.seats, { maxlength: "40", placeholder: "8 seats", oninput: function () { d.seats = seats.value; } });
      var classBits = el("div", { class: "swm-grid is-span", hidden: d.kind !== "class" }, [field("Date and time", when, "When it starts, local time."), field("Seats", seats, "Words shown beside the date. The checkout keeps the real count.")]);
      isClass.onchange = function () { d.kind = isClass.checked ? "class" : "item"; classBits.hidden = !isClass.checked; changed(); };
      var sq = shop.checkout !== "generic" && d.sqPrice != null ? "Square charges " + money(d.sqPrice) + (d.sqPrice !== toCents(price.value) ? ". Change it in Square too, or type the same here." : ".") : "The regular price. Empty shows no price.";
      return section([field("Name", name, null, "span"),
        field("Price", el("div", { class: "swm-money" }, [el("span", { "aria-hidden": "true", text: "$" }), price]), sq),
        field("Category", cat, "Groups items on " + whose + "."),
        el("label", { class: "swm-check is-span", for: "swm-class" }, [isClass, el("span", {}, [el("b", { text: "A class or workshop" }), " It gets a date and seats, and its button says Sign up."])]), classBits,
        cats.length ? el("datalist", { id: "swm-cats" }, cats.map(function (c) { return el("option", { value: c }); })) : null], "swm-grid");
    }
    // The price as typed in the editor right now, in cents (the saved one until it's changed).
    function draftPrice() { var d = st.draft; return d.priceText != null ? toCents(d.priceText) : d.price; }
    var salePaint = function () {};
    function salePart() {
      var d = st.draft, s = d.sale || {}, mode = s.price != null && !s.pct ? "price" : "pct";
      var on = el("input", { type: "checkbox", role: "switch", id: "swm-sale", checked: !!d.sale });
      var pct = input("swm-pct", s.pct || "", { inputmode: "numeric", placeholder: "15" }), fixed = input("swm-sp", dollarsIn(s.price), { inputmode: "decimal", placeholder: "40.00" });
      var ends = input("swm-ends", s.ends || "", { type: "date" });
      var amount = el("div", { class: "swm-f" }), seg = el("div", { class: "swm-seg is-sm", role: "group", "aria-label": "Sale by" });
      var line = el("p", { class: "swm-preview" }), body = el("div", { class: "swm-sale-b", hidden: !d.sale });
      var sync = function () {
        d.sale = on.checked ? (mode === "pct" ? { pct: pct.value === "" ? "" : Number(pct.value) } : { price: fixed.value }) : null;
        if (d.sale && ends.value) d.sale.ends = ends.value;
        body.hidden = !on.checked; salePaint();
      };
      [["pct", "Percent off"], ["price", "Sale price"]].forEach(function (o, i) {
        seg.appendChild(el("button", { type: "button", "aria-pressed": String(mode === o[0]), text: o[1], onclick: function () {
          mode = o[0]; Array.prototype.forEach.call(seg.children, function (b, j) { b.setAttribute("aria-pressed", String(j === i)); }); paintAmount(); sync(); changed(); } }));
      });
      var paintAmount = function () {
        fill(amount, mode === "pct" ? [el("label", { for: "swm-pct", text: "Percent off" }), el("div", { class: "swm-money is-r" }, [pct, el("span", { text: "%" })])]
          : [el("label", { for: "swm-sp", text: "Sale price" }), el("div", { class: "swm-money" }, [el("span", { text: "$" }), fixed])]);
      };
      salePaint = function () {
        var price = draftPrice(), sale = d.sale; line.hidden = !on.checked; if (!on.checked) return;
        var now = price == null || price === undefined ? null : mode === "pct" ? (pct.value >= 1 && pct.value <= 95 ? Math.round(price * (100 - Number(pct.value)) / 100) : null) : toCents(fixed.value);
        line.className = "swm-preview";
        if (price == null) { fill(line, [ico("tag", 14), el("span", { text: "Add the regular price above first." })]); return; }
        if (now == null || now === undefined || now >= price) { fill(line, [ico("tag", 14), el("span", { text: mode === "pct" ? "Type a whole number from 1 to 95." : "Type a sale price under " + money(price) + "." })]); return; }
        if (sale && sale.ends && sale.ends < today) { line.className = "swm-preview is-warn"; fill(line, [ico("tag", 14), el("span", { text: "This sale ended " + dayWords(sale.ends, true) + ", so " + whose + " shows " + money(price) + ". Change the last day, or switch the sale off." })]); return; }
        fill(line, [ico("tag", 14), el("span", {}, [whoseCap + " shows ", el("b", { text: money(now) }), " with ", el("s", { text: money(price) }), " crossed out" +
          (sale && sale.ends ? " until the end of " + dayWords(sale.ends, true) + ", then goes back to " + money(price) + " by itself." : " until you switch the sale off.")])]);
      };
      on.onchange = function () { if (on.checked && !pct.value && mode === "pct") pct.value = "15"; sync(); changed(); if (on.checked) (mode === "pct" ? pct : fixed).focus(); };
      pct.oninput = fixed.oninput = ends.oninput = sync; ends.min = today;
      paintAmount(); sync();
      return section([el("label", { class: "swm-sw", for: "swm-sale" }, [on, el("span", { class: "swm-track", "aria-hidden": "true" }), el("b", { text: "On sale" })]),
        body, line].map(function (k) { if (k === body) fill(body, [seg, el("div", { class: "swm-row2" }, [amount, field(el("label", { for: "swm-ends" }, ["Last day ", el("em", { text: "(optional)" })]), ends)])]); return k; }), "swm-salebox");
    }
    /* Options, like sizes or colors: up to 3, each with up to 20 choices; a choice can have its own price. */
    function optionsPart() {
      var d = st.draft, wrap = el("div", { class: "swm-sec" });
      var paint = function (focusSel) {
        var boxes = d.options.map(function (o, oi) {
          var name = el("input", { class: "swm-opt-name", value: o.name, maxlength: String(MAX.optName || 40), placeholder: "Size", "aria-label": "Option " + (oi + 1) + " name", oninput: function () { o.name = name.value; } });
          var rows = o.choices.map(function (c, ci) {
            var cn = el("input", { value: c.name, maxlength: "60", placeholder: ci === 0 ? "Small" : "", "aria-label": (o.name || "Option") + " choice " + (ci + 1), oninput: function () { c.name = cn.value; } });
            var cp = el("input", { value: c.priceText != null ? c.priceText : dollarsIn(c.price), inputmode: "decimal", placeholder: "Same price", "aria-label": "Price for " + (c.name || "choice " + (ci + 1)) + ", empty for the same price", oninput: function () { c.priceText = cp.value; } });
            return el("li", {}, [cn, el("div", { class: "swm-money is-sm" }, [el("span", { text: "$" }), cp]),
              el("button", { class: "swm-x", type: "button", "aria-label": "Take off " + (c.name || "this choice"), onclick: function () { o.choices.splice(ci, 1); changed(); paint(".swm-opt:nth-child(" + (oi + 1) + ") li:last-child input"); } }, [ico("x", 12, 2.4)])]);
          });
          return el("div", { class: "swm-opt" }, [el("div", { class: "swm-opt-hd" }, [name, el("button", { class: "swm-link-b", type: "button", text: "Remove", "aria-label": "Remove the option " + (o.name || oi + 1), onclick: function () { d.options.splice(oi, 1); changed(); paint(); } })]),
            el("ul", {}, rows), o.choices.length < MAX.choices ? el("button", { class: "swm-link-b swm-add", type: "button", onclick: function () { o.choices.push({ name: "" }); changed(); paint(".swm-opt:nth-child(" + (oi + 1) + ") li:last-child input"); } }, [ico("plus", 13), "Add a choice"]) : null]);
        });
        fill(wrap, [el("div", { class: "swm-lbl" }, [el("b", { text: "Options" }), el("span", { text: "Like sizes or colors. Buyers see them on " + whose + " and pick one at checkout." })]),
          el("div", { class: "swm-opts" }, boxes),
          d.options.length < MAX.options ? el("button", { class: "swm-btn plain is-sm", type: "button", onclick: function () { d.options.push({ name: "", choices: [{ name: "" }, { name: "" }] }); changed(); paint(".swm-opt:last-child .swm-opt-name"); } },
            [ico("plus", 14), d.options.length ? "Add another option" : "Add an option, like Size"]) : null]);
        if (focusSel) { var f = wrap.querySelector(focusSel); if (f) f.focus(); }
      };
      paint(); return wrap;
    }
    function descPart() {
      var d = st.draft, n = el("small", {}), desc = el("textarea", { id: "swm-desc", rows: "5", maxlength: String(MAX.desc), placeholder: "What it is, what's included, sizes, care. As long as you like." });
      desc.value = d.desc || "";
      var count = function () { n.textContent = "A blank line starts a new paragraph on " + whose + "." + (desc.value.length > MAX.desc - 300 ? " " + (MAX.desc - desc.value.length) + " characters left." : ""); };
      desc.oninput = function () { d.desc = desc.value; count(); }; count();
      return section([el("div", { class: "swm-f" }, [el("label", { for: "swm-desc", text: "Description" }), desc, n])]);
    }
    function segmented(id, label, list, now, help, pick) {
      var say1 = el("small", { text: list.filter(function (x) { return x[0] === now; })[0][2] });
      var seg = el("div", { class: "swm-seg", role: "radiogroup", "aria-labelledby": id });
      list.forEach(function (o, i) {
        seg.appendChild(el("button", { type: "button", role: "radio", "aria-checked": String(o[0] === now), tabindex: o[0] === now ? "0" : "-1", onclick: function () {
          if (pick(o[0]) === false) return;
          Array.prototype.forEach.call(seg.children, function (b, j) { b.setAttribute("aria-checked", String(j === i)); b.tabIndex = j === i ? 0 : -1; }); say1.textContent = o[2]; changed();
        } }, [id === "swm-show-l" ? el("i", { class: "swm-dot is-" + o[0] }) : o[0] === "featured" ? ico("star", 13, 2.2) : null, o[1]]));
      });
      seg.onkeydown = function (e) { var b = Array.prototype.indexOf.call(seg.children, document.activeElement), n = seg.children.length; if (b < 0) return;
        var to = e.key === "ArrowRight" || e.key === "ArrowDown" ? (b + 1) % n : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (b + n - 1) % n : -1; if (to < 0) return; e.preventDefault(); seg.children[to].focus(); seg.children[to].click(); };
      return el("div", { class: "swm-f" }, [el("span", { class: "swm-flabel", id: id, text: label }), seg, say1]);
    }
    function showPart() {
      var d = st.draft;
      return section([segmented("swm-show-l", you ? "On your website" : "On the website", SHOW, d.show, null, function (v) {
          if (v !== "hidden" && !(st.draft.link || "").trim()) { showErr(kind().need, ed.querySelector(".swm-link")); return false; } d.show = v; }),
        segmented("swm-tag-l", "Tag", TAGS, d.tag || "", null, function (v) { d.tag = v; })], "swm-grid is-one");
    }
    function linkPart() {
      var d = st.draft, c = kind(), lk = input("swm-link", d.link, { class: "swm-link", inputmode: "url", autocapitalize: "off", spellcheck: "false", placeholder: c.ph });
      var test = el("a", { class: "swm-test", target: "_blank", rel: "noopener", hidden: true }, ["Test the link", ico("ext", 12)]);
      var testable = function () { var v = lk.value.trim(); test.hidden = !/^(https:\/\/)?[\w-]+(\.[\w-]+)+\/\S*/i.test(v); test.href = /^https:/i.test(v) ? v : "https://" + v; };
      lk.oninput = function () { d.link = lk.value; testable(); }; testable();
      return section([el("div", { class: "swm-f" }, [el("div", { class: "swm-lblrow" }, [el("label", { for: "swm-link", text: c.label }), test]), lk, el("small", { text: c.help })])]);
    }
    function showErr(text, at) { errBox.textContent = text; errBox.hidden = false; if (at) at.focus(); }

    // What SW Core needs to save the open item.
    function itemBody() {
      var d = st.draft, price = d.priceText != null ? d.priceText : dollarsIn(d.price);
      return { id: d.id, name: d.name || "", kind: d.kind || "item", price: price, cat: d.cat || "", desc: d.desc || "", link: d.link || "", show: d.show, when: d.kind === "class" ? d.when || "" : "", seats: d.kind === "class" ? d.seats || "" : "",
        tag: d.tag || "", sale: d.sale || null,
        options: d.options.map(function (o) { return { name: o.name, choices: o.choices.map(function (c) { return { name: c.name, price: c.priceText != null ? c.priceText : dollarsIn(c.price) }; }) }; }),
        photos: d.photos.map(function (p) { return { key: p.key, alt: p.alt || "" }; }) };
    }
    function saveDraft() {
      var d = st.draft, isNew = st.open === "new", s = foot.querySelector(".swm-save");
      errBox.hidden = true;
      if (!(d.name || "").trim()) { showErr("Please name the item.", ed.querySelector("#swm-name")); return Promise.resolve(false); }
      if (d.show !== "hidden" && !(d.link || "").trim()) { showErr(kind().need, ed.querySelector(".swm-link")); return Promise.resolve(false); }
      if (draftPrice() === undefined) { showErr("That price doesn't look right. Type it like 12.50.", ed.querySelector("#swm-price")); return Promise.resolve(false); }
      s.disabled = true; savedNote.textContent = "Saving…";
      return Promise.resolve(opts.call("/item", { item: itemBody() })).then(function (r) {
        if (!r || !r.ok) { s.disabled = false; savedNote.textContent = ""; showErr((r && r.error) || "That didn't save. Check your internet and try again."); return false; }
        st.open = r.item.id; took(r.shop, isNew ? "Added " + r.item.name + (r.item.show === "hidden" ? ". It's hidden until you switch it to Showing." : ". It shows on " + whose + " within a minute.") : undefined);
        // The editor is drawn again with what was saved: the cursor goes back where it was, or to the item's name.
        var was = document.activeElement, keep = was === document.body || ed.contains(was), at = keep && was.id;
        var waiting = st.pending; st.pending = [];
        loadDraft(r.item); paintList(); savedNote.textContent = "Saved just now";
        if (keep) { var f = (at && ed.querySelector("#" + at)) || ed.querySelector("h2"); if (f.tagName === "H2") f.setAttribute("tabindex", "-1"); f.focus({ preventScroll: true }); }
        return sendPending(r.item, waiting).then(function () { return true; });
      });
    }
    // A new item's photos, sent once it has been saved: uploads one at a time, website photos together.
    function sendPending(item, waiting) {
      if (!waiting.length) return Promise.resolve();
      savedNote.textContent = "Adding " + plural(waiting.length, "photo", "photos") + "…";
      var picks = waiting.filter(function (p) { return p.pick; }), files = waiting.filter(function (p) { return p.local; });
      return files.reduce(function (p, f) { return p.then(function () { return upload(item.id, f.file, f.alt || item.name); }); }, Promise.resolve())
        .then(function () { return picks.length ? copyIn([{ id: item.id, photos: picks.map(function (p) { return { src: p.src, sig: p.sig, alt: p.alt }; }) }], false) : null; })
        .then(function () { if (st.open === item.id) { var x = byId(item.id); if (x) loadDraft(x); savedNote.textContent = "Saved just now"; } waiting.forEach(function (p) { if (p.url && p.local) URL.revokeObjectURL(p.url); }); });
    }
    function duplicate() {
      var id = st.draft.id, go = function () { save("/bulk", { ids: [id], do: "duplicate" }).then(function (r) { if (r && r.ok) { var at = shop.items.indexOf(byId(id)); var c = shop.items[at + 1]; if (c) openItem(c.id); } }); };
      if (st.dirty) askSave(go); else go();
    }
    function removeItem() { var id = st.draft.id; st.dirty = false; closeItem(true); save("/item/delete", { id: id }); }

    /* ---------- photos from the client's own website ----------
       Looked for once when the shop opens, if any item has no photos: SW Core reads the website (and each such item's
       store listing, whose photo becomes its main one) and suggests photos for each. One press adds them all. */
    function lookForPhotos(from) {
      finder.status = "looking"; finder.error = ""; paintBanner();
      return Promise.resolve(opts.call("/site-photos", from ? { from: from } : {})).then(function (d) {
        if (!d || !d.ok) { finder.status = "failed"; finder.error = (d && d.error) || "Couldn't read the website just now."; paintBanner(); return; }
        finder.from = d.from; finder.photos = d.photos || []; finder.suggest = d.suggest || {}; finder.listing = {};
        var ids = (d.listings || []).slice(0, 36), chunks = [];
        for (var i = 0; i < ids.length; i += 12) chunks.push(ids.slice(i, i + 12));
        return chunks.reduce(function (p, c) { return p.then(function () { return Promise.resolve(opts.call("/listing-photos", { ids: c })).then(function (r) { if (r && r.ok) Object.assign(finder.listing, r.photos || {}); }); }); }, Promise.resolve())
          .then(function () { finder.status = "done"; makePlan(); paintBanner(); });
      });
    }
    // For each item still without photos: its store listing photo first (the one it's listed for sale with), then the
    // website's photos for it, up to 5 and never the same address twice.
    function makePlan() {
      finder.plan = {};
      shop.items.forEach(function (x) {
        if ((x.photos || []).length) return;
        var list = [], seen = {};
        [finder.listing[x.id]].concat(finder.suggest[x.id] || []).forEach(function (p) { if (p && !seen[p.src] && list.length < MAX.photos) { seen[p.src] = 1; list.push(p); } });
        if (list.length) finder.plan[x.id] = list;
      });
    }
    function planCount() { var n = 0, items = 0; Object.keys(finder.plan).forEach(function (id) { if (byId(id)) { items++; n += finder.plan[id].length; } }); return { n: n, items: items }; }
    function paintBanner() {
      var c = planCount(), hide = finder.hidden || (finder.status !== "looking" && !finder.adding && !(finder.status === "done" && c.n));
      banner.hidden = hide; if (hide) { banner.replaceChildren(); return; }
      if (finder.adding) { fill(banner, [ico("sparkle", 20), el("div", {}, [el("b", { text: finder.adding })])]); return; }
      if (finder.status === "looking") { fill(banner, [el("span", { class: "swm-spin", "aria-hidden": "true" }), el("div", {}, [el("b", { text: "Looking for photos on " + (you ? "your website" : "the website") + "…" }),
        el("span", { text: "For the items with no photos yet. Their store listing photo comes first." })])]); return; }
      var names = Object.keys(finder.plan).filter(byId).map(function (id) { return byId(id).name + " " + finder.plan[id].length; });
      fill(banner, [ico("sparkle", 20), el("div", {}, [el("b", { text: "Found " + plural(c.n, "photo", "photos") + " on " + hostOf(finder.from) + " for " + plural(c.items, "item", "items") + "." }),
        el("span", { text: names.join(", ") + ". Each one's main photo is the one it's listed for sale with, when its store listing has one, and every photo keeps its description." })]),
        el("div", { class: "swm-banner-acts" }, [el("button", { class: "swm-btn", type: "button", text: "Add them all", onclick: function () { addPlan(finder.plan); } }),
          el("button", { class: "swm-btn plain", type: "button", text: "Look first", onclick: reviewPlan }),
          el("button", { class: "swm-close", type: "button", "aria-label": "Not now", title: "Not now", onclick: function () { finder.hidden = true; paintBanner(); } }, [ico("x", 16)])])]);
    }
    // Copies photos in, 8 a call. items: [{id, photos: [{src, sig, alt}]}]. Answers how many went in.
    function copyIn(items, words) {
      var batches = [], cur = [], n = 0;
      items.forEach(function (it) { it.photos.forEach(function (p) { if (n === MAX.perCall) { batches.push(cur); cur = []; n = 0; } var last = cur[cur.length - 1]; if (!last || last.id !== it.id) cur.push(last = { id: it.id, photos: [] }); last.photos.push(p); n++; }); });
      if (cur.length) batches.push(cur);
      var total = items.reduce(function (s, it) { return s + it.photos.length; }, 0), done = 0, added = 0, failed = [], first = null;
      return batches.reduce(function (p, b) {
        return p.then(function () {
          if (words !== false) { finder.adding = "Adding photos… " + done + " of " + total; paintBanner(); }
          return Promise.resolve(opts.call("/photo-from", { items: b })).then(function (r) {
            done += b.reduce(function (s, it) { return s + it.photos.length; }, 0);
            if (!r || !r.ok) { failed.push((r && r.error) || "a batch didn't go through"); return; }
            added += r.added; failed = failed.concat((r.failed || []).map(function (f) { return f.why; }));
            if (r.added && !first) first = r.shop.history[0];
            took(r.shop, false); if (st.draft) b.forEach(function (it) { mergePhotos(byId(it.id)); });
          });
        });
      }, Promise.resolve()).then(function () {
        finder.adding = ""; makePlan(); paintBanner();
        if (words !== false) toast((added ? "Added " + plural(added, "photo", "photos") + "." : "No photos were added.") + (failed.length ? " " + plural(failed.length, "photo", "photos") + " couldn't be copied (" + failed[0] + ")." : ""), first);
        return added;
      });
    }
    function addPlan(plan) {
      var items = Object.keys(plan).filter(byId).map(function (id) { return { id: id, photos: plan[id].map(function (p) { return { src: p.src, sig: p.sig, alt: p.alt }; }) }; });
      return copyIn(items).then(function () { if (st.open && st.open !== "new" && byId(st.open) && !st.dirty) loadDraft(byId(st.open)); });
    }
    function dialog(title, sub, body, footKids, cls) {
      var dlg = el("dialog", { class: "swm-dlg" + (cls ? " " + cls : ""), "aria-label": title });
      dlg.appendChild(el("header", {}, [el("div", {}, [el("h2", { text: title }), sub ? el("p", {}, [].concat(sub)) : null]),
        el("button", { class: "swm-close", type: "button", "aria-label": "Close", onclick: function () { dlg.close(); } }, [ico("x", 18)])]));
      dlg.appendChild(body); if (footKids) dlg.appendChild(el("footer", {}, footKids));
      dlg.addEventListener("close", function () { dlg.remove(); });
      root.appendChild(dlg); dlg.showModal(); return dlg;
    }
    // Look first: each item's suggested photos, in order, any of them can be taken out before adding.
    function reviewPlan() {
      var plan = {}; Object.keys(finder.plan).filter(byId).forEach(function (id) { plan[id] = finder.plan[id].slice(); });
      var keep = {}; Object.keys(plan).forEach(function (id) { keep[id] = true; });
      var list = el("div", { class: "swm-rev" }), go = el("button", { class: "swm-btn", type: "button" });
      var paint = function () {
        fill(list, Object.keys(plan).map(function (id) {
          var x = byId(id), ck = el("input", { type: "checkbox", checked: keep[id], "aria-label": "Add these photos to " + x.name, onchange: function () { keep[id] = ck.checked; paint(); } });
          return el("section", { class: "swm-rev-it" + (keep[id] ? "" : " is-off") }, [el("label", { class: "swm-rev-hd" }, [ck, el("b", { text: x.name }), el("span", { text: plural(plan[id].length, "photo", "photos") })]),
            el("div", { class: "swm-rev-ph" }, plan[id].map(function (p, i) {
              return el("figure", {}, [photoImg(peekPath(p), p.alt), el("span", { class: "swm-pk-n", text: String(i + 1) }), p.why === "listing" ? el("span", { class: "swm-badge", text: "Store listing" }) : null,
                el("button", { class: "swm-rm", type: "button", "aria-label": "Leave out photo " + (i + 1) + " of " + x.name, onclick: function () { plan[id].splice(i, 1); if (!plan[id].length) delete plan[id]; paint(); } }, [ico("x", 12, 2.4)]),
                el("figcaption", { text: p.alt })]);
            }))]);
        }));
        var n = 0, items = 0; Object.keys(plan).forEach(function (id) { if (keep[id]) { items++; n += plan[id].length; } });
        go.textContent = "Add " + plural(n, "photo", "photos") + " to " + plural(items, "item", "items"); go.disabled = !n;
      };
      paint();
      var dlg = dialog("Photos found on " + hostOf(finder.from), "The first photo of each item is its main one. Take out any that aren't right.", list,
        [el("span", { text: "Every photo keeps the description it has on the website." }), el("div", {}, [el("button", { class: "swm-btn plain", type: "button", text: "Cancel", onclick: function () { dlg.close(); } }), go])], "is-wide");
      go.onclick = function () { var picked = {}; Object.keys(plan).forEach(function (id) { if (keep[id]) picked[id] = plan[id]; }); dlg.close(); addPlan(picked); };
    }
    // Pick from the website: every photo found there, tick up to what the open item has room for, in order.
    function openPicker(paintPhotos) {
      var d = st.draft, room = MAX.photos - d.photos.length - st.pending.length, picked = [], q = "";
      var froms = d.photos.map(function (p) { return p.from; }).concat(st.pending.map(function (p) { return p.src; }));
      var grid = el("div", { class: "swm-pk" }), info = el("span", { class: "swm-from" }), use = el("button", { class: "swm-btn", type: "button" }), count = el("span");
      var search = el("input", { type: "search", placeholder: "Search photos", "aria-label": "Search photos" });
      var other = el("input", { type: "url", placeholder: "Another website, like snipandsprout.pages.dev", "aria-label": "Another website to look at", class: "swm-other" });
      var paint = function () {
        var listing = d.id && finder.listing[d.id], all = (listing ? [listing] : []).concat(finder.photos.filter(function (p) { return !listing || p.src !== listing.src; }));
        var shown = all.filter(function (p) { return !q || has(q, [p.alt, p.page, p.src]); });
        fill(info, [ico("globe", 14), finder.status === "looking" ? "Looking at the website…" : finder.status === "failed" ? finder.error : "From " + hostOf(finder.from) + ", " + plural(finder.photos.length, "photo", "photos")]);
        fill(grid, shown.map(function (p) {
          var n = picked.indexOf(p), already = froms.indexOf(p.src) >= 0;
          return el("button", { type: "button", class: "swm-pk-it" + (n >= 0 ? " is-on" : "") + (already ? " is-had" : ""), disabled: already, "aria-pressed": String(n >= 0),
            "aria-label": (p.alt || "A photo from " + p.page) + (already ? " (already on this item)" : n >= 0 ? " (picked " + (n + 1) + ")" : ""), onclick: function () {
              if (n >= 0) picked.splice(n, 1); else if (picked.length < room) picked.push(p); else { toast("This item has room for " + plural(room, "more photo", "more photos") + "."); return; }
              paint();
            } }, [photoImg(peekPath(p), ""), el("span", { class: "swm-pk-n" + (n >= 0 ? "" : " is-off"), text: n >= 0 ? String(n + 1) : "" }),
            p === listing ? el("span", { class: "swm-badge", text: "Store listing" }) : already ? el("span", { class: "swm-badge", text: "Already added" }) : null]);
        }));
        if (finder.status === "done" && !shown.length) grid.appendChild(el("p", { class: "swm-none", text: q ? "No photos match that." : "No photos found there. Try another website, or upload instead." }));
        count.textContent = picked.length ? plural(picked.length, "photo", "photos") + " picked, in this order." + (d.photos.length || picked.indexOf(listing) > 0 ? "" : " The first is the main photo.") : "Tick up to " + plural(room, "photo", "photos") + ".";
        use.textContent = picked.length ? "Use " + (picked.length === 1 ? "this photo" : "these " + picked.length + " photos") : "Use these photos"; use.disabled = !picked.length;
      };
      search.oninput = function () { q = search.value.trim(); paint(); };
      var look = el("button", { class: "swm-btn plain is-sm", type: "button", text: "Look there", onclick: function () { if (other.value.trim()) lookForPhotos(other.value.trim()).then(paint); paint(); } });
      other.onkeydown = function (e) { if (e.key === "Enter") { e.preventDefault(); look.click(); } };
      var dlg = dialog("Photos on " + whose, ["For ", el("b", { text: d.name || "this item" }), ". Tick up to " + room + "; each keeps the description it has on the website."],
        el("div", {}, [el("div", { class: "swm-dlg-f" }, [el("label", { class: "swm-find is-sm" }, [ico("search", 15), search]), info]), grid,
          el("details", { class: "swm-more" }, [el("summary", { text: "Look at another website" }), el("div", { class: "swm-row-in" }, [other, look])])]),
        [count, el("div", {}, [el("button", { class: "swm-btn plain", type: "button", text: "Cancel", onclick: function () { dlg.close(); } }), use])], "is-wide");
      use.onclick = function () {
        dlg.close(); var list = picked.map(function (p) { return { src: p.src, sig: p.sig, alt: p.alt || d.name }; });
        if (st.open === "new") { list.forEach(function (p) { st.pending.push({ pick: true, src: p.src, sig: p.sig, alt: p.alt, url: "" }); }); paintPhotos(); fillPending(); return; }
        savedNote.textContent = "Adding " + plural(list.length, "photo", "photos") + "…";
        copyIn([{ id: d.id, photos: list }]).then(function () { savedNote.textContent = ""; paintPhotos(); });
      };
      if (finder.status === "idle" || finder.status === "failed") lookForPhotos().then(paint); else if (d.id && finder.status === "done" && !finder.listing[d.id] && byId(d.id).link) {
        Promise.resolve(opts.call("/listing-photos", { ids: [d.id] })).then(function (r) { if (r && r.ok) Object.assign(finder.listing, r.photos || {}); paint(); });
      }
      paint();
    }
    // Waiting website photos on a new item show through the preview address.
    function fillPending() { st.pending.forEach(function (p, i) { if (p.pick && !p.url) image(peekPath(p)).then(function (u) { p.url = u; var img = ed.querySelectorAll(".swm-tile img")[st.draft.photos.length + i]; if (img && u) img.src = u; }); }); }

    /* ---------- the list of changes ---------- */
    function showChanges() {
      var list = el("ol", { class: "swm-hist" }), lines = shop.history || [];
      var who = function (h) { return h.by === "client" ? (you ? "You" : opts.name || "The client") : "Stray Wolf"; };
      var paint = function (asking) {
        fill(list, lines.map(function (h, i) {
          var old = Date.now() - Date.parse(h.at) > 30 * 86400e3;
          var btn = old ? el("span", { class: "swm-muted", text: "Too old to undo" }) : asking === h.id
            ? el("span", { class: "swm-sure" }, [el("span", { text: "This also undoes the " + plural(i, "change", "changes") + " after it." }),
              el("button", { class: "swm-btn is-sm", type: "button", text: "Undo " + (i + 1) + " changes", onclick: function () { dlg.close(); undo(h); } }),
              el("button", { class: "swm-btn plain is-sm", type: "button", text: "Keep", onclick: function () { paint(); } })])
            : el("button", { class: "swm-btn plain is-sm", type: "button", "aria-label": "Undo: " + h.what, onclick: function () { if (i === 0) { dlg.close(); undo(h); } else paint(h.id); } }, [ico("undo", 14), i === 0 ? "Undo" : "Undo back to here"]);
          return el("li", {}, [el("div", {}, [el("b", { text: h.what }), el("small", { text: who(h) + " · " + ago(h.at) })]), btn]);
        }));
        var f = list.querySelector(".swm-sure .swm-btn"); if (f) f.focus();
      };
      paint();
      var dlg = dialog("Changes", "The last " + plural(lines.length, "change", "changes") + ", newest first. Undo puts the items back the way they were just before that change.", list, null);
    }

    /* ---------- export: every item as a spreadsheet ---------- */
    function exportCsv() {
      // A cell that starts like a formula gets a ' first, so a spreadsheet shows it as words and never runs it.
      var cell = function (v) { v = v == null ? "" : String(v); if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
      var head = ["Name", "Price", "Sale percent off", "Sale price", "Sale last day", "Category", "Description", "Checkout link", "On the website", "Tag", "Options", "Photos", "Kind", "Date and time", "Seats", "ID"];
      var rows = shop.items.map(function (x) {
        return [x.name, dollarsIn(x.price), x.sale && x.sale.pct || "", x.sale && x.sale.price != null ? dollarsIn(x.sale.price) : "", x.sale && x.sale.ends || "", x.cat, x.desc, x.link,
          SHOW.filter(function (s) { return s[0] === x.show; })[0][1], x.tag ? x.tag.charAt(0).toUpperCase() + x.tag.slice(1) : "",
          (x.options || []).map(function (o) { return o.name + ": " + o.choices.map(function (c) { return c.name + (c.price != null ? " (" + money(c.price) + ")" : ""); }).join(" | "); }).join("; "),
          (x.photos || []).length, x.kind === "class" ? "Class" : "Item", x.when || "", x.seats || "", x.ref || x.sqId || x.id];
      });
      var text = "\ufeff" + [head].concat(rows).map(function (r) { return r.map(cell).join(","); }).join("\r\n");
      var a = el("a", { href: URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" })), download: ((opts.name || "Shop") + " shop items " + localToday()).replace(/[\\/:*?"<>|]+/g, "") + ".csv" });
      root.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      toast("Exported " + plural(shop.items.length, "item", "items") + ". It opens in Excel, Google Sheets or Numbers.");
    }

    /* ---------- start ---------- */
    root.addEventListener("keydown", function (e) { if (e.key === "Escape" && !pop && st.open && !e.target.closest("dialog") && !e.defaultPrevented) { closeItem(); } });
    paintTop(); paintChips(); paintList();
    if (shop.items.some(function (x) { return !(x.photos || []).length; })) lookForPhotos();
    return {
      el: root, update: update, open: function (id) { openItem(id); }, add: function () { openItem(null); },
      destroy: function () { closePop(); root.remove(); }
    };
  }

  /* ---------- a made-up shop kept in the page, for the demo modes ----------
     pics: function (key) -> an address for a demo photo key. The same rules as SW Core where they show on screen. */
  function demo(shop, pics) {
    shop.history = shop.history || [];
    var snaps = {}, n = 0, id = function () { return "d" + (++n) + Math.random().toString(36).slice(2, 6); };
    var cents = function (v) { return toCents(v); };
    var keep = function (what, before) { var h = { id: id(), at: new Date().toISOString(), by: "sw", what: what }; snaps[h.id] = before; shop.history.unshift(h); shop.history = shop.history.slice(0, 30); shop.updated = h.at; };
    var answer = function (extra) { return Object.assign({ ok: true, shop: copy(shop) }, extra || {}); };
    var no = function (error) { return { ok: false, error: error }; };
    function call(path, b) {
      var before = copy(shop.items), find = function (i) { return shop.items.filter(function (x) { return x.id === i; })[0]; };
      if (path === "/item") {
        var i = b.item, old = i.id ? find(i.id) : null, price = cents(i.price);
        if (!String(i.name || "").trim()) return no("Please name the item.");
        if (price === undefined) return no("That price doesn't look right. Type it like 12.50.");
        if (i.show !== "hidden" && !String(i.link || "").trim()) return no("Add the checkout link before putting it on the site.");
        var sale = i.sale ? (i.sale.pct ? { pct: Number(i.sale.pct) } : { price: cents(i.sale.price) }) : null; if (sale && i.sale.ends) sale.ends = i.sale.ends;
        if (sale && (price == null || (sale.price != null && sale.price >= price))) return no("The sale price should be lower than the regular price.");
        var keys = (old && old.photos || []).map(function (p) { return p.key; });
        var item = { id: old ? old.id : id(), name: i.name.trim(), kind: i.kind, cat: (i.cat || "").trim(), desc: i.desc || "", price: price, link: i.link ? (/^https:/.test(i.link) ? i.link : "https://" + i.link) : "", show: i.show,
          photos: (i.photos || []).filter(function (p) { return keys.indexOf(p.key) >= 0; }).map(function (p) { return { key: p.key, alt: p.alt || i.name }; }),
          options: (i.options || []).map(function (o) { return { name: o.name, choices: o.choices.filter(function (c) { return String(c.name).trim(); }).map(function (c) { var p = cents(c.price); return p == null ? { name: c.name } : { name: c.name, price: p }; }) }; }).filter(function (o) { return o.choices.length; }) };
        if (sale) item.sale = sale; if (i.tag) item.tag = i.tag; if (i.kind === "class") { item.when = i.when; item.seats = i.seats; }
        if (old) shop.items[shop.items.indexOf(old)] = item; else shop.items.push(item);
        keep((old ? "Changed " : "Added ") + item.name, before); return answer({ item: copy(item) });
      }
      if (path === "/item/delete") { var gone = find(b.id); shop.items = shop.items.filter(function (x) { return x !== gone; }); keep("Deleted " + gone.name, before); return answer(); }
      if (path === "/prices") { b.prices.forEach(function (p) { var x = find(p.id), c = cents(p.price); if (x && c !== undefined) x.price = c; }); keep("Changed " + plural(b.prices.length, "price", "prices"), before); return answer(); }
      if (path === "/order") { shop.items = b.ids.map(find).filter(Boolean).concat(shop.items.filter(function (x) { return b.ids.indexOf(x.id) < 0; })); keep("Changed the order of the items", before); return answer(); }
      if (path === "/bulk") {
        var items = shop.items.filter(function (x) { return b.ids.indexOf(x.id) >= 0; }), skipped = 0, what;
        if (SHOW.some(function (s) { return s[0] === b.do; })) { items.forEach(function (x) { if (b.do !== "hidden" && !x.link) skipped++; else x.show = b.do; }); what = plural(items.length - skipped, "item", "items") + " " + (b.do === "live" ? "showing on the website" : b.do === "sold" ? "marked sold out" : "hidden"); }
        else if (b.do === "sale") { items.forEach(function (x) { if (x.price != null) { x.sale = { pct: b.pct }; if (b.ends) x.sale.ends = b.ends; } }); what = plural(items.length, "item", "items") + " on sale (" + b.pct + "% off)"; }
        else if (b.do === "unsale") { items.forEach(function (x) { delete x.sale; }); what = plural(items.length, "item", "items") + " off sale"; }
        else if (b.do === "price") { items.forEach(function (x) { x.price = b.set != null ? cents(b.set) : x.price == null ? null : Math.round(x.price * (100 + b.pct) / 100); }); what = "Prices of " + plural(items.length, "item", "items") + " changed"; }
        else if (b.do === "cat") { items.forEach(function (x) { x.cat = b.cat; }); what = plural(items.length, "item", "items") + " moved to " + (b.cat || "no category"); }
        else if (b.do === "tag") { items.forEach(function (x) { if (b.tag) x.tag = b.tag; else delete x.tag; }); what = plural(items.length, "item", "items") + (b.tag ? " tagged " + b.tag : ": tag taken off"); }
        else if (b.do === "duplicate") { items.forEach(function (x) { var c = copy(x); c.id = id(); c.name += " (copy)"; c.show = "hidden"; shop.items.splice(shop.items.indexOf(x) + 1, 0, c); }); what = "Copied " + plural(items.length, "item", "items"); }
        else if (b.do === "delete") { shop.items = shop.items.filter(function (x) { return items.indexOf(x) < 0; }); what = items.length === 1 ? "Deleted " + items[0].name : "Deleted " + plural(items.length, "item", "items"); }
        if (skipped === items.length && skipped) return no("None of those have a checkout link yet. Add the links first.");
        keep(what, before); return answer({ skipped: skipped });
      }
      if (path === "/undo") { var h = shop.history.filter(function (x) { return x.id === b.id; })[0]; if (!h || !snaps[h.id]) return no("That change is too old to undo."); shop.items = copy(snaps[h.id]); keep("Undid: " + h.what, before); return answer(); }
      if (path === "/site-photos") return { ok: true, from: "https://example.com", pages: 1, photos: [], suggest: {}, listings: [] };
      if (path === "/listing-photos") return { ok: true, photos: {} };
      if (path === "/photo-from") return { ok: true, added: 0, failed: [], shop: copy(shop) };
      return no("That isn't in the demo.");
    }
    function upload(query, file) {
      var q = new URLSearchParams(query.replace(/^\?/, "")), x = shop.items.filter(function (y) { return y.id === q.get("id"); })[0];
      return new Promise(function (done) {
        var r = new FileReader(); r.onload = function () {
          var before = copy(shop.items); x.photos = (x.photos || []).concat({ key: r.result, alt: q.get("alt") || x.name }); keep("New photo for " + x.name, before); done(answer({ item: copy(x) }));
        }; r.readAsDataURL(file);
      });
    }
    function image(path) { var key = decodeURIComponent((/[?&]key=([^&]*)/.exec(path) || [])[1] || ""); return Promise.resolve(/^data:/.test(key) ? key : pics ? pics(key) : ""); }
    return { call: function (p, b) { return Promise.resolve(call(p, b || {})); }, upload: upload, image: image };
  }

  window.SWShopManager = { mount: mount, demo: demo };
})();
