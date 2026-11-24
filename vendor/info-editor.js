/*
 * Stray Wolf business info editor: a client's hours, holidays and special days, contact details and social pages.
 * One screen for both sides: Stray Wolf's admin (every part on the client's page) and the client's own portal
 * (one part at a time, as a page over the portal). What is saved here is what the client's website shows
 * (kit/info/info.js reads it from SW Core), within about a minute.
 *
 * Needs kit/info/info.js loaded first (the same hours logic the website uses) and editor.css.
 *
 *   SWInfoEditor.mount(el, opts)   every part, drawn inside el (the admin). Answers {set(info), dirty()}.
 *   SWInfoEditor.open(part, opts)  one part ("hours", "contact" or "social") as a page over the portal.
 *   SWInfoEditor.fill(root, info)  the portal's "On your site now" lists inside root, from the saved info.
 *   SWInfoEditor.demo(info, by)    a stand-in for SW Core that keeps changes in the page: {call}. by = who is
 *                                  changing it, "client" (the portal's try-it mode) or "sw" (the admin's).
 *
 * opts:
 *   info      the record from SW Core (/api/my-info or /api/admin/infos)
 *   mode      "portal" or "admin" (the admin also sets the time zone and links the Google listing)
 *   call      function (path, body) -> Promise of SW Core's answer; path is "/save", "/undo", "/google", ...
 *   name      the client's name (the admin's list of changes says who changed what)
 *   title     the hours part's heading, "Shop hours" unless given
 *   fields    which contact lines to show, ["phone", "email", "address", "area"] unless given
 *   socials   the social pages the website has a spot for, by name: ["Instagram", "Etsy"]
 *   typed     what is typed into the website today, shown until something is saved in its place:
 *             {hours: [7 days, Sunday first], contact: {phone, ...}, social: {Instagram: "instagram.com/..."}}
 *   zones     (admin) the time zones to pick from, {id: name};  googleKey  (admin) whether Google hours are set up
 *   live      (admin) false while the client's website isn't hooked up yet, so "Saved" doesn't promise it shows
 *   back      the back link's words, "Overview" unless given
 *   onChange  function (info) after every save or undo;  onClose  function () after the page closes
 */
(function () {
  var I = window.SWInfo;
  var CONTACT = { phone: ["Phone", "tel", "tel"], email: ["Email", "email", "email"], address: ["Address", "text", "street-address"], area: ["Area served", "text", "off"] };
  var LIVE = "Changes you save here go live on your website within a minute.";
  var EXAMPLE = { instagram: "instagram.com/yourname", facebook: "facebook.com/yourpage", etsy: "etsy.com/shop/YourShop", tiktok: "tiktok.com/@yourname",
    youtube: "youtube.com/@yourname", linkedin: "linkedin.com/company/yourname", google: "maps.app.goo.gl/yourplace" };

  /* ----- small helpers ----- */
  function h(tag, props, kids) {
    var el = document.createElement(tag), k;
    for (k in props || {}) {
      if (props[k] == null || props[k] === false) continue;
      if (k === "text") el.textContent = props[k];
      else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), props[k]);
      else if (k === "checked" || k === "value" || k === "disabled" || k === "hidden" || k === "open") el[k] = props[k];
      else el.setAttribute(k, props[k] === true ? "" : props[k]);
    }
    (kids || []).forEach(function (c) { if (c) el.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return el;
  }
  function copy(v) { return JSON.parse(JSON.stringify(v == null ? null : v)); }
  function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function pretty(url) { return String(url || "").replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, ""); }
  function svg(d) { var s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true"); s.innerHTML = d; return s; }
  var ICON = {
    back: '<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    x: '<path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    google: '<path fill="#4285F4" d="M22.5 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2.1v2.8A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.7 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8l3.6-2.8z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.6l3.1-3.1A11 11 0 0 0 2.1 7.1l3.6 2.8C6.6 7.3 9.1 5.4 12 5.4z"/>'
  };
  // The holidays most businesses close or change hours for, as dates from `today` through the next year.
  function holidays(today) {
    var year = +today.slice(0, 4), list = [];
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    var nth = function (y, month, dow, n) {              // the nth (or, n = -1, the last) weekday of a month
      var d = new Date(Date.UTC(y, n < 0 ? month + 1 : month, n < 0 ? 0 : 1)), step = n < 0 ? -1 : 1;
      while (d.getUTCDay() !== dow) d.setUTCDate(d.getUTCDate() + step);
      d.setUTCDate(d.getUTCDate() + (n < 0 ? 0 : (n - 1) * 7));
      return d.toISOString().slice(0, 10);
    };
    [year, year + 1].forEach(function (y) {
      list.push([y + "-01-01", "New Year's Day"], [nth(y, 4, 1, -1), "Memorial Day"], [y + "-07-04", "Independence Day"], [nth(y, 8, 1, 1), "Labor Day"],
        [nth(y, 10, 4, 4), "Thanksgiving"], [y + "-12-24", "Christmas Eve"], [y + "-12-25", "Christmas"], [y + "-12-31", "New Year's Eve"]);
    });
    var until = (year + 1) + today.slice(4);
    return list.filter(function (x) { return x[0] >= today && x[0] < until; }).sort().map(function (x) { return { date: x[0], name: x[1] }; });
  }
  function shortDay(date) { return new Date(date + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }); }

  /* ----- one editor ----- */
  function Editor(box, o, parts) {
    var mode = o.mode === "admin" ? "admin" : "portal", admin = mode === "admin";
    var info, draft, base, google = null, busy = false, flash = "", problems = {}, leaving = false, found = null;
    var typed = o.typed || {}, fields = o.fields || ["phone", "email", "address", "area"];
    var has = function (p) { return parts.indexOf(p) >= 0; };

    // What the screen starts from: what is saved, else what is typed into the website, else a plain week.
    function start(next) {
      info = next;
      var week = info.hours || typed.hours || [null, 1, 1, 1, 1, 1, null].map(function (on) { return on ? { open: "09:00", close: "17:00" } : null; });
      var names = (o.socials || []).slice();
      info.social.forEach(function (x) { if (!names.some(function (n) { return n.toLowerCase() === x.name.toLowerCase(); })) names.push(x.name); });
      draft = { tz: info.tz, hours: copy(week), special: copy(info.special), contact: {}, social: names.map(function (name) {
        var kept = info.social.filter(function (x) { return x.name.toLowerCase() === name.toLowerCase(); })[0];
        return { name: name, url: pretty(kept ? kept.url : (typed.social || {})[name]) };
      }) };
      fields.forEach(function (k) { draft.contact[k] = info.contact[k] || (typed.contact || {})[k] || ""; });
      base = copy(draft); problems = {};
    }
    // Which parts differ from what the screen started with. A week that was never saved always counts.
    function changed() {
      var out = {};
      if (has("hours") && (!info.hours || !same(draft.hours, base.hours))) out.hours = draft.hours;
      if (has("hours") && !same(sentSpecial(), sentSpecial(base.special))) out.special = sentSpecial();
      if (has("contact") && !same(draft.contact, base.contact)) out.contact = Object.assign({}, info.contact, draft.contact);
      if (has("social") && !same(draft.social, base.social)) out.social = draft.social.filter(function (x) { return x.url.trim(); });
      if (admin && draft.tz !== base.tz) out.tz = draft.tz;
      return out;
    }
    function sentSpecial(list) { return (list || draft.special).map(function (x) { return x.open != null ? { date: x.date, name: x.name, open: x.open, close: x.close } : { date: x.date, name: x.name }; }); }
    function dirty() { return Object.keys(changed()).length > 0; }

    // Checks the draft the way SW Core will, and says what to fix beside each line. true = good to save.
    function check() {
      problems = {};
      var need = "Pick an opening time and a later closing time.";
      if (has("hours")) {
        draft.hours.forEach(function (d, i) { if (d && !(d.open && d.close && d.close > d.open)) problems["d" + i] = need; });
        var seen = {};
        draft.special.forEach(function (x, i) {
          if (!x.date) problems["s" + i] = "Pick the date.";
          else if (seen[x.date]) problems["s" + i] = "That date is already on the list.";
          else if (x.open != null && !(x.open && x.close && x.close > x.open)) problems["s" + i] = need;
          seen[x.date] = true;
        });
      }
      if (has("contact") && draft.contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.contact.email.trim())) problems.email = "That email address doesn't look right.";
      if (has("social")) draft.social.forEach(function (x, i) {
        if (x.url.trim() && !/^(https?:\/\/)?[^\s/]+\.[^\s/]+/i.test(x.url.trim())) problems["u" + i] = "That needs a web address, like instagram.com/yourname.";
        if (x.url.trim() && !x.name.trim()) problems["u" + i] = "Name this page, for example TikTok.";
      });
      return !Object.keys(problems).length;
    }

    /* ----- talking to SW Core ----- */
    function send(path, body, done) {
      if (busy) return; busy = true; flash = ""; draw();
      o.call(path, body).then(function (d) {
        busy = false;
        if (!d || !d.ok) { flash = (d && d.error) || "That didn't save. Check your internet and try again."; draw(); return; }
        done(d);
      }, function () { busy = false; flash = "That didn't save. Check your internet and try again."; draw(); });
    }
    function save() {
      if (!check()) { draw(); var bad = box.querySelector("[aria-invalid=true]"); if (bad) bad.focus(); return; }
      send("/save", changed(), function (d) { start(d.info); flash = "saved"; draw(); if (o.onChange) o.onChange(info); if (leaving) close(); });
    }
    function undo(id) { send("/undo", { id: id }, function (d) { start(d.info); flash = "undone"; draw(); if (o.onChange) o.onChange(info); }); }
    function askGoogle(fresh) {
      if (!has("hours") || !(info.onGoogle || info.google)) { google = null; return; }
      o.call("/google", fresh ? { fresh: true } : {}).then(function (d) { google = d && d.ok ? d.google : null; drawGoogle(); }, function () {});
    }

    /* ----- drawing ----- */
    function timeBox(value, label, key, bad, on) {
      return h("input", { class: "swi-t", type: "time", value: value || "", "aria-label": label, "data-k": key, "aria-invalid": bad ? "true" : null, "aria-describedby": bad ? key.replace(/[oc]$/, "e") : null,
        oninput: function () { on(this.value); touched(); } });
    }
    function toggle(on, label, key, change) {
      return h("label", { class: "swi-sw" }, [
        h("input", { type: "checkbox", role: "switch", checked: on, "aria-label": label, "data-k": key, onchange: function () { change(this.checked); redraw(); } }),
        h("span", { text: on ? "Open" : "Closed" })]);
    }
    function weekCard() {
      var today = I.now(draft.tz).day, first = I.WEEK.filter(function (d) { return draft.hours[d]; })[0];
      var rows = I.WEEK.map(function (d) {
        var day = draft.hours[d], name = I.DAY[d], bad = problems["d" + d];
        return h("div", { class: "swi-row" + (d === today ? " today" : "") }, [
          h("span", { class: "swi-day" }, [name, d === today ? h("small", { text: "Today" }) : null]),
          toggle(!!day, name + ", open", "d" + d + "s", function (on) {
            // A day switched on starts with the hours of the open day before it, so a week is quick to fill in.
            var near = I.WEEK.slice(0, I.WEEK.indexOf(d)).reverse().concat(I.WEEK).map(function (n) { return draft.hours[n]; }).filter(Boolean)[0];
            draft.hours[d] = on ? copy(near || { open: "09:00", close: "17:00" }) : null;
          }),
          day ? h("div", { class: "swi-times" }, [
            timeBox(day.open, name + " opens", "d" + d + "o", bad, function (v) { day.open = v; }), h("span", { class: "swi-to", text: "to" }),
            timeBox(day.close, name + " closes", "d" + d + "c", bad, function (v) { day.close = v; })])
            : h("div", { class: "swi-times swi-closed", text: "Closed all day" }),
          bad ? h("p", { class: "swi-err", id: "d" + d + "e", role: "alert", text: bad }) : null]);
      });
      return h("section", { class: "swi-card", "aria-labelledby": "swi-wk" }, [
        h("div", { class: "swi-head" }, [
          h("div", {}, [h("h2", { id: "swi-wk", text: "Every week" }), h("p", { class: "swi-hint", text: info.hours ? "Switch a day off to show it as closed." : "Not saved yet. Check each day, then save." })]),
          first != null ? h("button", { class: "swi-link", type: "button", "data-k": "copy", title: "Give every day the same hours as " + I.DAY[first],
            onclick: function () { draft.hours = draft.hours.map(function () { return copy(draft.hours[first]); }); redraw(); }, text: "Copy " + I.DAY[first] + " to all days" }) : null]),
        h("div", {}, rows),
        h("div", { class: "swi-google", "data-google": true, hidden: true })]);
    }
    function specialCard() {
      var today = I.now(draft.tz).date, taken = {};
      draft.special.forEach(function (x) { taken[x.date] = true; });
      var rows = draft.special.map(function (x, i) {
        var open = x.open != null, bad = problems["s" + i], label = x.name || (x.date ? I.dateWords(x.date) : "This day");
        var what = x.fresh
          ? h("div", { class: "swi-new" }, [
              h("input", { class: "swi-in", type: "date", min: today, value: x.date, "aria-label": "Date", "data-k": "s" + i + "d", "aria-invalid": bad && !open ? "true" : null, oninput: function () { x.date = this.value; touched(); } }),
              h("input", { class: "swi-in", type: "text", maxlength: 60, value: x.name, placeholder: "What's the day? (optional)", "aria-label": "Name of the day", "data-k": "s" + i + "n", oninput: function () { x.name = this.value; touched(); } })])
          : h("div", { class: "swi-what" }, [h("b", { text: I.dateWords(x.date) }), x.name ? h("small", { text: x.name }) : null]);
        return h("div", { class: "swi-sp" }, [
          what,
          toggle(open, label + ", open", "s" + i + "s", function (on) { if (on) { x.open = "09:00"; x.close = "17:00"; } else { delete x.open; delete x.close; } }),
          h("button", { class: "swi-x", type: "button", "aria-label": "Remove " + label, title: "Remove " + label, "data-k": "s" + i + "x", onclick: function () { draft.special.splice(i, 1); redraw("add"); } }, [svg(ICON.x)]),
          open ? h("div", { class: "swi-times" }, [
            timeBox(x.open, label + " opens", "s" + i + "o", bad, function (v) { x.open = v; }), h("span", { class: "swi-to", text: "to" }),
            timeBox(x.close, label + " closes", "s" + i + "c", bad, function (v) { x.close = v; })]) : null,
          bad ? h("p", { class: "swi-err", id: "s" + i + "e", role: "alert", text: bad }) : null]);
      });
      var quick = holidays(today).filter(function (x) { return !taken[x.date]; }).slice(0, 3).map(function (x) {
        return h("button", { class: "swi-chip", type: "button", title: "Add " + x.name + " as closed. You can give it hours instead.", text: x.name + ", " + shortDay(x.date),
          onclick: function () { draft.special.push({ date: x.date, name: x.name }); sortSpecial(); redraw("add"); } });
      });
      return h("section", { class: "swi-card", "aria-labelledby": "swi-sp" }, [
        h("h2", { id: "swi-sp", text: "Holidays and special days" }),
        h("p", { class: "swi-hint", text: "These days replace the usual hours, then drop off on their own." }),
        h("div", {}, rows),
        h("div", { class: "swi-add" }, [
          h("p", { text: "Add a day. It starts as closed." }),
          h("div", { class: "swi-chips" }, quick.concat(h("button", { class: "swi-chip other", type: "button", "data-k": "add", text: "+ Another day",
            onclick: function () { draft.special.push({ date: "", name: "", fresh: true }); redraw("s" + (draft.special.length - 1) + "d"); } })))])]);
    }
    function sortSpecial() { draft.special.sort(function (a, z) { return (a.date || "9") < (z.date || "9") ? -1 : 1; }); }
    function field(label, key, value, attrs, on, hint) {
      var bad = problems[key];
      return h("div", { class: "swi-f" }, [
        h("label", { for: "swi-" + key, text: label }),
        h("input", Object.assign({ class: "swi-in", id: "swi-" + key, value: value, "data-k": key, "aria-invalid": bad ? "true" : null, "aria-describedby": bad ? "swi-" + key + "-e" : null,
          oninput: function () { on(this.value); touched(); } }, attrs)),
        bad ? h("p", { class: "swi-err", id: "swi-" + key + "-e", role: "alert", text: bad }) : hint ? h("p", { class: "swi-hint", text: hint }) : null]);
    }
    function contactCard() {
      return h("section", { class: "swi-card swi-pad", "aria-labelledby": "swi-ct" }, [
        admin ? h("h2", { id: "swi-ct", text: "Contact info" }) : h("h2", { id: "swi-ct", class: "swi-sr", text: "Contact info" }),
        h("div", { class: "swi-fields" }, fields.map(function (k) {
          var c = CONTACT[k];
          return field(c[0], k, draft.contact[k], { type: c[1], autocomplete: c[2], maxlength: k === "address" ? 200 : 120 }, function (v) { draft.contact[k] = v; });
        })),
        h("p", { class: "swi-hint", text: "An empty line keeps what " + (admin ? "is typed into their website." : "your website shows now.") })]);
    }
    function socialCard() {
      var lines = draft.social.map(function (x, i) {
        var loose = admin && x.fresh;                       // a page Stray Wolf adds by hand also needs its name
        return h("div", { class: "swi-soc" }, [
          loose ? h("input", { class: "swi-in name", type: "text", maxlength: 30, value: x.name, placeholder: "TikTok", "aria-label": "Name of the page", "data-k": "u" + i + "n", oninput: function () { x.name = this.value; touched(); } }) : null,
          field(loose ? "Its web address" : x.name, "u" + i, x.url, { type: "text", inputmode: "url", autocapitalize: "off", autocomplete: "off", spellcheck: "false", maxlength: 300,
            placeholder: EXAMPLE[x.name.toLowerCase()] || "Paste the link to the page" }, function (v) { x.url = v; })]);
      });
      return h("section", { class: "swi-card swi-pad", "aria-labelledby": "swi-so" }, [
        admin ? h("h2", { id: "swi-so", text: "Social pages" }) : h("h2", { id: "swi-so", class: "swi-sr", text: "Social pages" }),
        h("div", { class: "swi-fields" }, lines),
        h("p", { class: "swi-hint", text: admin ? "The website shows the pages it has a spot for. An empty line keeps what is typed into it." : "Paste the link to each page you have. An empty line keeps what your website shows now." }),
        admin ? h("div", { class: "swi-chips" }, [h("button", { class: "swi-chip other", type: "button", "data-k": "addsoc", text: "+ Another page",
          onclick: function () { draft.social.push({ name: "", url: "", fresh: true }); redraw("u" + (draft.social.length - 1) + "n"); } })]) : null]);
    }
    // Admin only: the clock the website uses for "Open now", and which Google listing to compare hours with.
    function setupCard() {
      var zone = h("select", { class: "swi-in", id: "swi-tz", "data-k": "tz", onchange: function () { draft.tz = this.value; redraw(); } },
        Object.keys(o.zones || {}).map(function (id) { var op = h("option", { value: id, text: o.zones[id] }); op.selected = id === draft.tz; return op; }));
      var g = info.google, list = null;
      if (found) list = h("ul", { class: "swi-found" }, found.length ? found.map(function (p) {
        return h("li", {}, [h("div", {}, [h("b", { text: p.name }), h("small", { text: p.address })]),
          h("button", { class: "swi-btn quiet", type: "button", text: "Use this", onclick: function () { found = null; send("/google-link", { placeId: p.id, name: p.name, address: p.address }, function (d) { info.google = d.info.google; google = d.google; draw(); }); } })]);
      }) : [h("li", { text: "Google found no business by that name. Add the town." })]);
      var q = h("input", { class: "swi-in", id: "swi-gq", type: "search", placeholder: "Business name and town", "data-k": "gq", onkeydown: function (e) { if (e.key === "Enter") { e.preventDefault(); find(); } } });
      function find() { send("/google-find", { q: q.value }, function (d) { found = d.places; draw(); }); }
      var listing = !o.googleKey ? h("p", { class: "swi-hint", text: "Off until SW Core has its Google key (the PLACES_API_KEY secret)." })
        : g ? h("div", { class: "swi-linked" }, [h("div", {}, [h("b", { text: g.name }), h("small", { text: g.address })]),
            h("button", { class: "swi-btn quiet", type: "button", text: "Unlink", title: "Stop comparing hours with this listing", onclick: function () { send("/google-link", { placeId: "" }, function (d) { delete info.google; google = null; draw(); }); } })])
          : h("div", {}, [h("div", { class: "swi-find" }, [q, h("button", { class: "swi-btn quiet", type: "button", text: "Find on Google", onclick: find })]), list]);
      return h("section", { class: "swi-card swi-pad", "aria-labelledby": "swi-su" }, [
        h("h2", { id: "swi-su", text: "Set up" }),
        h("div", { class: "swi-fields" }, [
          h("div", { class: "swi-f" }, [h("label", { for: "swi-tz", text: "Time zone" }), zone, h("p", { class: "swi-hint", text: "The clock their website uses to say Open now." })]),
          h("div", { class: "swi-f" }, [h("label", { for: "swi-gq", text: "Google listing" }), listing,
            o.googleKey ? h("p", { class: "swi-hint", text: "Only read: the hours above get a line when Google's are different. Nothing is changed on Google." }) : null])])]);
    }
    // One line under the week when Google's hours differ from the ones on screen. Saving here never changes Google.
    function drawGoogle() {
      var line = box.querySelector("[data-google]"); if (!line) return;
      var diff = [];
      if (google && google.days) I.WEEK.forEach(function (d) {
        var g = google.days[d], mine = draft.hours[d];
        if (g && g.text) diff.push(I.DAY[d] + " is " + g.text); else if (!same(g, mine)) diff.push(I.DAY[d] + " is " + (g ? I.span(g) : "closed"));
      });
      var text = google && !google.days ? "Your Google listing shows no hours." : diff.length ? "Google says " + diff[0] + (diff.length > 1 ? ", and " + (diff.length - 1) + " more " + (diff.length > 2 ? "days differ" : "day differs") : "") + "." : "";
      line.hidden = !text; if (!text) return;
      line.replaceChildren(svg(ICON.google), h("span", {}, [h("b", { text: text }), " Saving here doesn't change Google."]),
        h("a", { href: google.fix, target: "_blank", rel: "noopener", text: "Fix it on Google" }));
    }
    function changesList() {
      if (!info.history.length) return null;
      var who = function (by) { return admin ? (by === "sw" ? "Stray Wolf" : o.name || "The client") : by === "client" ? "You" : "Stray Wolf"; };
      return h("details", { class: "swi-changes" }, [h("summary", { text: "Recent changes" }), h("ul", {}, info.history.slice(0, 8).map(function (c) {
        return h("li", {}, [
          h("span", {}, [h("b", { text: c.what }), h("small", { text: who(c.by) + " · " + new Date(c.at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) })]),
          h("button", { class: "swi-link", type: "button", text: "Undo", title: "Put everything back to how it was just before this change", disabled: busy, onclick: function () { undo(c.id); } })]);
      }))]);
    }
    function saveBar() {
      var d = dirty(), said;
      if (leaving && d) said = h("span", { class: "swi-note warn", role: "status", text: "You have changes that aren't saved." });
      else if (flash === "saved" || flash === "undone") said = h("span", { class: "swi-note ok", role: "status" }, [(flash === "saved" ? "Saved. " : "Put back. ") + (!admin ? "Your website shows it within a minute. " : o.live === false ? "" : "Their website shows it within a minute. "),
        flash === "saved" && info.history[0] ? h("button", { class: "swi-link", type: "button", text: "Undo", "data-k": "undo", onclick: function () { undo(info.history[0].id); } }) : null]);
      else if (flash) said = h("span", { class: "swi-note bad", role: "alert", text: flash });
      else said = h("span", { class: "swi-note", text: d ? "Nothing changes until you save. You can undo it after." : "No changes to save." });
      return h("div", { class: "swi-save" }, [
        h("button", { class: "swi-btn", type: "button", "data-k": "save", disabled: busy || !d, text: busy ? "Saving…" : "Save", onclick: save }),
        leaving && d ? h("button", { class: "swi-btn quiet", type: "button", "data-k": "leave", text: "Leave without saving", onclick: function () { start(info); close(); } }) : null,
        said]);
    }
    function draw() {
      var kids = [];
      if (has("hours")) {
        var s = info.hours ? I.status(info) : null;
        if (admin) kids.push(h("h2", { class: "swi-part", text: "Hours" }));
        if (s) kids.push(h("p", { class: "swi-pill " + (s.open ? "open" : "shut") }, [h("i"), (admin ? "Their" : "Your") + " website says: " + s.short]));
        kids.push(h("div", { class: "swi-cols" }, [weekCard(), specialCard()]));
      }
      if (has("contact")) kids.push(contactCard());
      if (has("social")) kids.push(socialCard());
      if (admin) kids.push(setupCard());
      kids.push(saveBar(), changesList());
      box.replaceChildren.apply(box, kids.filter(Boolean));
      drawGoogle();
    }
    // Redraws and puts the keyboard back where it was (or on `to`), so a switch or a chip never loses its place.
    function redraw(to) {
      var at = to || (document.activeElement && document.activeElement.getAttribute("data-k"));
      flash = ""; problems = {}; draw();
      var el = at && box.querySelector('[data-k="' + at + '"]'); if (el) el.focus();
    }
    // A typed change: no redraw (the keyboard stays in the box), only the save bar and the Google line follow.
    function touched() {
      flash = "";
      var bar = box.querySelector(".swi-save"); if (bar) bar.replaceWith(saveBar());
      drawGoogle();
    }
    var close = function () {};
    start(o.info); draw(); askGoogle();
    return { set: function (next) { start(next); draw(); askGoogle(); }, dirty: dirty,
      leave: function (done) { close = done; if (!dirty()) return done(); leaving = true; draw(); var b = box.querySelector('[data-k="save"]'); if (b) b.focus(); } };
  }

  /* ----- the admin: every part, inside a box on the client's page ----- */
  function mount(el, o) {
    el.classList.add("swi", o.mode === "admin" ? "admin" : "portal");
    return Editor(el, o, ["hours", "contact", "social"]);
  }

  /* ----- the portal: one part as a page over the portal ----- */
  var page = null;
  function open(part, o) {
    if (page) return;
    var titles = { hours: o.title || "Shop hours", contact: "Contact info", social: "Your social pages" };
    var from = document.activeElement, body = h("div", { class: "swi-body" });
    var back = h("button", { class: "swi-back", type: "button", onclick: function () { ed.leave(shut); } }, [svg(ICON.back), h("span", { text: o.back || "Overview" })]);
    var el = h("div", { class: "swi swi-page portal", role: "dialog", "aria-modal": "true", "aria-labelledby": "swi-title" }, [
      h("div", { class: "swi-wrap" }, [back, h("h1", { id: "swi-title", text: titles[part] }), h("p", { class: "swi-sub", text: LIVE }), body])]);
    // Everything behind the page is out of reach while it is open (keyboard and screen readers too).
    var behind = Array.prototype.filter.call(document.body.children, function (x) { return !x.inert; });
    behind.forEach(function (x) { x.inert = true; });
    document.body.appendChild(el); document.documentElement.classList.add("swi-on");
    var ed = Editor(body, o, [part]);
    function shut() {
      behind.forEach(function (x) { x.inert = false; });
      el.remove(); document.documentElement.classList.remove("swi-on"); page = null;
      document.removeEventListener("keydown", onKey); window.removeEventListener("popstate", onPop);
      // The address goes back to the portal's own: the step this page added to the browser's Back is taken away again.
      if (history.state && history.state.swi === part) history.back();
      if (from && from.focus) from.focus();
      if (o.onClose) o.onClose();
    }
    function onKey(e) { if (e.key === "Escape") ed.leave(shut); }
    // The browser's Back closes the page too; with unsaved changes it stays and asks at the Save button.
    function onPop() { if (!ed.dirty()) return shut(); try { history.pushState({ swi: part }, "", "#" + part); } catch (e) {} ed.leave(shut); }
    document.addEventListener("keydown", onKey); window.addEventListener("popstate", onPop);
    try { history.pushState({ swi: part }, "", "#" + part); } catch (e) {}
    page = el; el.scrollTop = 0; back.focus();
  }

  /* ----- the portal's "On your site now" lists ----- */
  // Inside each box marked data-info ("hours", "contact", "social"): its <dl class="facts"> rows or its
  // <ul class="soc"> lines are brought in step with what is saved, so the box never shows old facts.
  function fill(root, info) {
    var row = function (k, v) { return h("div", {}, [h("dt", { text: k }), h("dd", { text: v })]); };
    var hours = root.querySelector('[data-info="hours"] dl.facts');
    if (hours && info.hours) hours.replaceChildren.apply(hours, I.groups(info.hours).map(function (g) { return row(g.label, g.time); })
      .concat(I.specialLines(info, I.now(info.tz).date, 60).map(function (line) { return row("Special day", line); })));
    var facts = root.querySelector('[data-info="contact"] dl.facts');
    if (facts) Object.keys(CONTACT).forEach(function (k) {
      if (!info.contact[k]) return;
      var at = Array.prototype.filter.call(facts.children, function (d) { var dt = d.querySelector("dt"); return dt && dt.textContent.trim().toLowerCase() === CONTACT[k][0].toLowerCase().split(" ")[0]; })[0];
      if (at) { var dd = at.querySelector("dd"); dd.textContent = info.contact[k]; dd.classList.remove("miss"); } else facts.appendChild(row(CONTACT[k][0].split(" ")[0], info.contact[k]));
    });
    var soc = root.querySelector('[data-info="social"] ul.soc');
    if (soc) info.social.forEach(function (x) {
      Array.prototype.forEach.call(soc.children, function (li) {
        var name = li.firstElementChild, state = li.lastElementChild;
        if (!name || name === state || name.textContent.trim().toLowerCase() !== x.name.toLowerCase()) return;
        state.className = "on"; state.replaceChildren(h("span", { class: "url", text: pretty(x.url) }));
      });
    });
  }

  /* ----- demo: SW Core's part, kept in the page (the try-it mode of the portal and of the admin) ----- */
  function demo(info, by) {
    var kept = copy(info), snaps = {}, n = 0;
    return { call: function (path, d) {
      if (path === "/google") return Promise.resolve({ ok: true, google: null });
      var id = "demo" + (++n), before = copy(kept), what = "Changed your info";
      if (path === "/save") {
        ["tz", "hours", "special", "contact", "social"].forEach(function (k) { if (d[k] !== undefined) kept[k] = copy(d[k]); });
        kept.social = kept.social.map(function (x) { return { name: x.name, url: /^https?:/i.test(x.url) ? x.url : "https://" + x.url }; });
        what = d.hours ? "Changed the hours" : d.special ? "Changed the special days" : d.contact ? "Changed the contact info" : d.social ? "Changed the social pages" : "Changed the time zone";
      } else if (path === "/undo") { if (!snaps[d.id]) return Promise.resolve({ ok: false, error: "That change isn't on the list any more." }); var old = snaps[d.id]; old.history = kept.history; kept = old; what = "Undid a change"; }
      else return Promise.resolve({ ok: false, error: "Not found." });
      snaps[id] = before;
      kept.history = [{ id: id, at: new Date().toISOString(), by: by || "client", what: what }].concat(kept.history).slice(0, 30);
      return Promise.resolve({ ok: true, info: copy(kept) });
    } };
  }

  window.SWInfoEditor = { mount: mount, open: open, fill: fill, demo: demo };
})();
