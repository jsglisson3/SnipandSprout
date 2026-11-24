/*
 * Stray Wolf business info, for a client's website.
 * Fills the page's hours, "Open now" line, holidays, phone, email, address and social links from what is saved
 * for the client in Stray Wolf Admin or their Client Portal (SW Core, GET /api/info?site=). What is typed into the
 * page stays as the fallback: nothing saved yet, or the service can't be reached, and the page shows what it
 * always did. A change saved in the admin or the portal shows here within about a minute.
 *
 * On the page:
 *   <script src="/info.js" defer data-site="their-short-name"></script>
 *
 * Settings on the script tag:
 *   data-site   the client's short name in the admin (required)
 *   data-api    the service, if it ever moves (default https://site-notes.jsglisson.workers.dev)
 *
 * Mark the spots to fill with data-info:
 *   data-info="hours"       a list of hours. Its rows are the elements with data-days ("1,2" = Mon and Tue,
 *                           0 = Sunday); the first row is the pattern for the rest: its first child gets the days
 *                           ("Mon – Tue"), its last child the times ("10 AM – 3 PM" or "Closed"). Days with the
 *                           same hours share a row. Today's row gets the class is-today.
 *   data-info="open"        "Open now until 6 PM" / "Closed now · opens tomorrow at 9 AM", with the class
 *                           is-open or is-closed. The words go in its [data-info-text] child if it has one.
 *   data-info="open-long"   the same as a sentence: "We’re open until 6 PM today."
 *   data-info="special"     holidays and special days in the next 14 days (data-ahead="30" for more), one line
 *                           each; hidden while there are none. Lines go in its <ul> or <ol> if it has one.
 *   data-info="phone"       the phone number; on a link the href becomes tel:
 *   data-info="email"       the email address; on a link the href becomes mailto: (a ?subject= is kept)
 *   data-info="address"     the address; with data-info-lines it keeps two lines, broken after the street
 *                           ("1 Main St." above "Springdale, AR 72764")
 *   data-info="map"         a link to the address on Google Maps (its href)
 *   data-info="area"        the area served
 *   data-info="social:instagram"   that social page's link (the name as saved, lower case; "google" also
 *                           matches "Google business"). A spot with the hidden attribute shows once it has a link.
 *   Add data-info-keep to change only a link's href and leave its words alone ("Email Dani").
 *   Add data-info-attr="data-copy" to put the value in that attribute instead of the words (a Copy button).
 * An empty line in the admin keeps what is typed into the page.
 *
 * The typed fallback, when the page's own script needs the hours before the service answers (optional):
 *   <script type="application/json" data-info-fallback>{"tz":"America/Chicago","hours":[null,{"open":"09:00","close":"17:00"}, ...7 days, Sunday first]}</script>
 *
 * The page's Google copy (a <script type="application/ld+json"> with openingHoursSpecification) is kept in step:
 * the hours, the special days, and the email, phone and address it already names.
 * After each fill the page hears a "sw-info" event (detail = the info); window.SWInfo has the helpers below.
 * The page's policy must allow the service: connect-src https://site-notes.jsglisson.workers.dev
 * This file must stay the same on every client site (and beside the editor, kit/info/editor.js, which uses it).
 */
(function () {
  var me = document.currentScript, set = me ? me.dataset : {};
  var API = String(set.api || "https://site-notes.jsglisson.workers.dev").replace(/\/+$/, ""), SITE = set.site || "";
  var DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var WEEK = [1, 2, 3, 4, 5, 6, 0];                     // the order a week is shown in: Monday first
  var SCHEMA_DAY = "https://schema.org/";

  // "09:00" -> "9 AM", "17:30" -> "5:30 PM"; minutes since midnight; "2026-11-26" -> "Thu, Nov 26".
  function clock(t) { var h = +t.slice(0, 2), m = t.slice(3); return (h % 12 || 12) + (m === "00" ? "" : ":" + m) + (h < 12 ? " AM" : " PM"); }
  function mins(t) { return +t.slice(0, 2) * 60 + +t.slice(3); }
  function span(d) { return d ? clock(d.open) + " – " + clock(d.close) : "Closed"; }
  function atNoon(date) { return new Date(date + "T12:00:00Z"); }
  function dateWords(date, long) { return atNoon(date).toLocaleDateString("en-US", { weekday: long ? "long" : "short", month: "short", day: "numeric", timeZone: "UTC" }); }
  function addDays(date, n) { var d = atNoon(date); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function dayOf(date) { return atNoon(date).getUTCDay(); }

  // Right now on the business's own clock: {date: "2026-11-24", day: 2, mins: 615}.
  function now(tz) {
    var p = {};
    try {
      new Intl.DateTimeFormat("en-CA", { timeZone: tz || undefined, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
        .formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    } catch (e) { return now(""); }                     // a zone this browser doesn't know: the visitor's own clock
    var date = p.year + "-" + p.month + "-" + p.day;
    return { date: date, day: dayOf(date), mins: +p.hour % 24 * 60 + +p.minute };
  }
  // The hours on one date: a special day if there is one, else that weekday's. null = closed.
  // Answers {open, close, name?} or {closed: true, name?}.
  function hoursOn(info, date) {
    var sp = (info.special || []).filter(function (x) { return x.date === date; })[0];
    if (sp) return sp.open ? { open: sp.open, close: sp.close, name: sp.name } : { closed: true, name: sp.name };
    var d = info.hours && info.hours[dayOf(date)];
    return d ? { open: d.open, close: d.close } : { closed: true };
  }
  // Open or closed right now, in words. when = now(tz), or a made-up moment for a test. No hours saved = null.
  function status(info, when) {
    if (!info || !info.hours) return null;
    var t = when || now(info.tz), today = hoursOn(info, t.date);
    if (!today.closed && t.mins >= mins(today.open) && t.mins < mins(today.close))
      return { open: true, short: "Open now until " + clock(today.close), long: "We’re open until " + clock(today.close) + " today." };
    var next = null;
    if (!today.closed && t.mins < mins(today.open)) next = { day: "today", at: today.open };
    for (var i = 1; i <= 7 && !next; i++) {
      var date = addDays(t.date, i), h = hoursOn(info, date);
      if (!h.closed) next = { day: i === 1 ? "tomorrow" : DAY[dayOf(date)], at: h.open };
    }
    var why = today.closed && today.name ? "Closed today for " + today.name : "Closed now";
    if (!next) return { open: false, short: why, long: "We’re closed right now." };
    return { open: false, short: why + " · opens " + next.day + " at " + clock(next.at), long: "We open " + next.day + " at " + clock(next.at) + "." };
  }
  // The week as rows, Monday first, days with the same hours next to each other sharing a row:
  // [{days: [1, 2], label: "Mon – Tue", time: "10 AM – 3 PM"}, ...].
  function groups(hours) {
    var rows = [];
    WEEK.forEach(function (d) {
      var time = span(hours[d]), last = rows[rows.length - 1];
      if (last && last.time === time) last.days.push(d); else rows.push({ days: [d], time: time });
    });
    rows.forEach(function (r) {
      var a = DAY[r.days[0]].slice(0, 3), z = DAY[r.days[r.days.length - 1]].slice(0, 3);
      r.label = r.days.length === 7 ? "Every day" : r.days.length === 1 ? a : a + " – " + z;
    });
    return rows;
  }
  // Special days from today through the next `ahead` days, each as one line.
  function specialLines(info, today, ahead) {
    var until = addDays(today, ahead);
    return (info.special || []).filter(function (x) { return x.date >= today && x.date <= until; }).map(function (x) {
      return x.open ? dateWords(x.date) + ": " + span(x) + (x.name ? " (" + x.name + ")" : "") : "Closed " + dateWords(x.date) + (x.name ? " for " + x.name : "");
    });
  }

  /* ----- filling the page ----- */
  function all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function setText(el, text) { var t = el.querySelector("[data-info-text]") || el; if (t.textContent !== text) t.textContent = text; }
  function paintHours(info, t) {
    if (!info.hours) return;
    var rows = groups(info.hours);
    all('[data-info="hours"]').forEach(function (box) {
      var old = Array.prototype.slice.call(box.querySelectorAll("[data-days]")), pattern = old[0]; if (!pattern) return;
      var home = pattern.parentNode;
      rows.forEach(function (r) {
        var row = pattern.cloneNode(true);
        row.setAttribute("data-days", r.days.join(","));
        row.firstElementChild.textContent = r.label; row.lastElementChild.textContent = r.time;
        row.classList.toggle("is-today", r.days.indexOf(t.day) >= 0);
        home.appendChild(row);
      });
      old.forEach(function (row) { home.removeChild(row); });
    });
  }
  function paintStatus(info, t) {
    var s = status(info, t); if (!s) return;
    all('[data-info="open"]').forEach(function (el) { el.classList.toggle("is-open", s.open); el.classList.toggle("is-closed", !s.open); setText(el, s.short); });
    all('[data-info="open-long"]').forEach(function (el) { setText(el, s.long); });
  }
  function paintSpecial(info, t) {
    all('[data-info="special"]').forEach(function (box) {
      var lines = specialLines(info, t.date, +box.getAttribute("data-ahead") || 14), list = box.querySelector("ul, ol") || box;
      list.replaceChildren.apply(list, lines.map(function (text) { var el = document.createElement(list === box ? "p" : "li"); el.textContent = text; return el; }));
      box.hidden = !lines.length;
    });
  }
  function paintContact(info) {
    var c = info.contact || {};
    ["phone", "email", "address", "area"].forEach(function (k) {
      if (!c[k]) return;                                  // an empty line keeps what is typed into the page
      all('[data-info="' + k + '"]').forEach(function (el) {
        var attr = el.getAttribute("data-info-attr"), cut = c[k].indexOf(",");
        if (attr) { el.setAttribute(attr, c[k]); return; }
        if (el.tagName === "A" && k === "phone") el.href = "tel:" + c.phone.replace(/[^\d+]/g, "");
        if (el.tagName === "A" && k === "email") el.href = "mailto:" + c.email + ((el.getAttribute("href") || "").match(/\?.*$/) || [""])[0];
        if (el.hasAttribute("data-info-keep")) return;
        if (k === "address" && cut > 0 && el.hasAttribute("data-info-lines")) el.replaceChildren(c[k].slice(0, cut), document.createElement("br"), c[k].slice(cut + 1).trim());
        else setText(el, c[k]);
      });
    });
    if (c.address) all('[data-info="map"]').forEach(function (el) { el.href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(c.address); });
  }
  function paintSocial(info) {
    (info.social || []).forEach(function (x) {
      var name = x.name.toLowerCase();
      all('[data-info^="social:"]').forEach(function (el) {
        var key = el.getAttribute("data-info").slice(7).toLowerCase();
        if (name !== key && name.indexOf(key + " ") !== 0) return;
        el.href = x.url;
        var wrap = el.closest("[hidden]"); if (wrap) wrap.hidden = false;
      });
    });
  }
  // The page's copy for Google (schema.org): the week, the special days still ahead, and the contact details it
  // already names. An address is only changed when it reads as "street, town, ST 12345".
  function paintSchema(info, t) {
    var c = info.contact || {}, place = /^(.+?),\s*([^,]+),\s*([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/.exec(c.address || "");
    all('script[type="application/ld+json"]').forEach(function (tag) {
      var d; try { d = JSON.parse(tag.textContent); } catch (e) { return; }
      if (!d || !d.openingHoursSpecification) return;
      if (c.email && d.email) d.email = c.email;
      if (c.phone && d.telephone) d.telephone = c.phone;
      if (place && d.address && d.address.streetAddress) { d.address.streetAddress = place[1]; d.address.addressLocality = place[2]; d.address.addressRegion = place[3].toUpperCase(); d.address.postalCode = place[4]; }
      if (!info.hours) { tag.textContent = JSON.stringify(d); return; }
      d.openingHoursSpecification = groups(info.hours).filter(function (r) { return r.time !== "Closed"; }).map(function (r) {
        var h = info.hours[r.days[0]];
        return { "@type": "OpeningHoursSpecification", dayOfWeek: r.days.map(function (n) { return DAY[n]; }), opens: h.open, closes: h.close };
      });
      var ahead = (info.special || []).filter(function (x) { return x.date >= t.date; });
      if (ahead.length) d.specialOpeningHoursSpecification = ahead.map(function (x) {
        return { "@type": "OpeningHoursSpecification", validFrom: x.date, validThrough: x.date, opens: x.open || "00:00", closes: x.close || "00:00" };
      }); else delete d.specialOpeningHoursSpecification;
      tag.textContent = JSON.stringify(d);
    });
  }
  var shown = null;
  function paint(info) {
    shown = info;
    var t = now(info.tz);
    paintHours(info, t); paintStatus(info, t); paintSpecial(info, t); paintContact(info); paintSocial(info); paintSchema(info, t);
    document.dispatchEvent(new CustomEvent("sw-info", { detail: info }));
  }

  window.SWInfo = { status: status, now: now, hoursOn: hoursOn, groups: groups, specialLines: specialLines, clock: clock, span: span, dateWords: dateWords, addDays: addDays, paint: paint, DAY: DAY, WEEK: WEEK };
  if (!SITE) return;                                      // beside the editor: only the helpers are used

  function start() {
    var typed = document.querySelector("script[data-info-fallback]"), fallback = null;
    if (typed) { try { fallback = JSON.parse(typed.textContent); paint(fallback); } catch (e) {} }
    // Contact details can be saved before any hours are: the typed week then stays, so "Open now" keeps turning over.
    fetch(API + "/api/info?site=" + encodeURIComponent(SITE)).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (!d || !d.ok) return; if (!d.hours && fallback && fallback.hours) d.hours = fallback.hours; paint(d); }, function () {});
    // "Open now" turns over by itself while the page stays open.
    setInterval(function () { if (shown) { var t = now(shown.tz); paintStatus(shown, t); } }, 30000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
