// Snip & Sprout Co. Every page reads fine without this file; it adds the live parts.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const framed = window.self !== window.top;           // true inside a preview frame
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MAIL = 'snipandsproutco@gmail.com';
  const mail = (subject, body) => 'mailto:' + MAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  const go = (href) => { if (framed) window.open(href, '_blank', 'noopener'); else location.href = href; };

  /* ---------- hours, in Springdale time ---------- */
  const H = { 0: [9, 14], 1: [10, 15], 2: [10, 15], 3: [9, 18], 4: [9, 18], 5: [9, 18], 6: [9, 14] };
  const fmt = (h) => (h > 12 ? h - 12 : h) + (h >= 12 ? ' PM' : ' AM');
  const now = () => {
    try {
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
      const get = (t) => parts.find((p) => p.type === t).value;
      return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday')), mins: (+get('hour')) * 60 + (+get('minute')) };
    } catch (e) { const d = new Date(); return { day: d.getDay(), mins: d.getHours() * 60 + d.getMinutes() }; }
  };
  const state = () => {
    const { day, mins } = now(); const [o, c] = H[day];
    if (mins >= o * 60 && mins < c * 60) return { open: true, day, short: 'Open now until ' + fmt(c), long: 'We’re open until ' + fmt(c) + ' today.' };
    if (mins < o * 60) return { open: false, day, short: 'Closed now · opens today at ' + fmt(o), long: 'We open today at ' + fmt(o) + '.' };
    const n = (day + 1) % 7;
    return { open: false, day, short: 'Closed now · opens tomorrow at ' + fmt(H[n][0]), long: 'We open tomorrow at ' + fmt(H[n][0]) + '.' };
  };
  const paintHours = () => {
    const s = state();
    $$('[data-open]').forEach((el) => { el.classList.toggle('is-open', s.open); const t = $('[data-open-text]', el); if (t) t.textContent = s.short; });
    $$('[data-open-long]').forEach((el) => { el.textContent = s.long; });
    $$('[data-hours3] [data-days]').forEach((row) => row.classList.toggle('is-today', row.dataset.days.split(',').includes(String(s.day))));
    return s;
  };
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- entrances ---------- */
  const ins = $$('[data-in]');
  ins.forEach((el) => { const sib = [...el.parentElement.children].filter((c) => c.hasAttribute('data-in')); el.style.setProperty('--d', Math.min(sib.indexOf(el), 5) * 0.08 + 's'); });
  if ('IntersectionObserver' in window && !calm) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    ins.forEach((el) => io.observe(el));
  } else ins.forEach((el) => el.classList.add('in'));

  paintHours();
  setInterval(paintHours, 30000);

  /* ---------- add to my calendar ---------- */
  $$('[data-cal]').forEach((cal) => {
    const b = $('button', cal);
    if (framed) $$('[data-ics]', cal).forEach((a) => a.remove());   // file downloads are blocked inside a preview frame
    b.addEventListener('click', (e) => { e.stopPropagation(); const on = cal.classList.toggle('is-open'); b.setAttribute('aria-expanded', on); });
    document.addEventListener('click', (e) => { if (!cal.contains(e.target)) { cal.classList.remove('is-open'); b.setAttribute('aria-expanded', 'false'); } });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { cal.classList.remove('is-open'); b.setAttribute('aria-expanded', 'false'); } });
  });

  /* ---------- one frame, contents change ---------- */
  const frame = $('[data-frame]');
  if (frame) {
    const pics = $$('img', frame), cap = $('[data-frame-cap]'); let i = 0, timer;
    const next = () => { i = (i + 1) % pics.length; pics.forEach((p, k) => p.classList.toggle('is-on', k === i)); cap.textContent = pics[i].dataset.cap; };
    const play = () => { clearInterval(timer); if (!calm) timer = setInterval(() => { if (!document.hidden) next(); }, 3200); };
    frame.addEventListener('click', () => { next(); play(); });
    if ('IntersectionObserver' in window) new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) play(); else clearInterval(timer); })).observe(frame);
  }

  /* ---------- copy the address ---------- */
  $$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    const text = b.dataset.copy, was = b.textContent; let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
      const t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select();
      try { ok = document.execCommand('copy'); } catch (e2) { ok = false; } t.remove();
    }
    b.textContent = ok ? 'Copied. See you soon!' : text; setTimeout(() => { b.textContent = was; }, 2600);
  }));

  /* ---------- private event inquiry ---------- */
  $$('[data-stepper]').forEach((st) => {
    const input = $('input', st), [minus, plus] = $$('button', st);
    minus.addEventListener('click', () => { input.value = Math.max(1, (+input.value || 1) - 1); });
    plus.addEventListener('click', () => { input.value = (+input.value || 0) + 1; });
  });
  const inq = $('[data-inquiry]');
  if (inq) inq.addEventListener('submit', (e) => {
    e.preventDefault(); const f = new FormData(inq);
    go(mail('Private event: ' + f.get('occasion'), ['Hi Dani!', '', 'I’d like to plan a private event.', '', 'Name: ' + f.get('name'), 'Email: ' + f.get('email'), 'Occasion: ' + f.get('occasion'), 'Guests: ' + (f.get('guests') || '?'), 'Dates: ' + (f.get('dates') || '?'), '', f.get('notes') || ''].join('\n')));
  });

  /* ---------- mail links inside a preview frame open in a new tab ---------- */
  if (framed) $$('a[href^="mailto:"]').forEach((a) => { a.target = '_blank'; a.rel = 'noopener'; });

  /* ---------- Shop: #kits, #tbar, #pbar open the right tab ---------- */
  const map = { '#kits': 'kit', '#tbar': 'tbar', '#pbar': 'pbar' };
  const tab = () => { const r = map[location.hash] && document.getElementById('sns-t-' + map[location.hash]); if (r) { r.checked = true; const s = document.getElementById('shop'); if (s) s.scrollIntoView(); } };
  tab(); window.addEventListener('hashchange', tab);
})();
