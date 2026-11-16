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
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
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
    if (mins >= o * 60 && mins < c * 60) return { open: true, day, mins, short: 'Open now until ' + fmt(c), long: 'We’re open until ' + fmt(c) + ' today.', plan: 'We’re open until ' + fmt(c) + ' today. Walk right in.' };
    if (mins < o * 60) return { open: false, day, mins, short: 'Closed now · opens today at ' + fmt(o), long: 'We open today at ' + fmt(o) + '.', plan: 'We open today at ' + fmt(o) + '. Walk in any time after that.' };
    const n = (day + 1) % 7;
    return { open: false, day, mins, short: 'Closed now · opens tomorrow at ' + fmt(H[n][0]), long: 'We open tomorrow at ' + fmt(H[n][0]) + '.', plan: 'We’re closed for today. Tomorrow we open at ' + fmt(H[n][0]) + ', and you can walk right in.' };
  };
  const paintHours = () => {
    const s = state();
    $$('[data-open]').forEach((el) => { el.classList.toggle('is-open', s.open); const t = $('[data-open-text]', el); if (t) t.textContent = s.short; });
    $$('[data-open-long]').forEach((el) => { el.textContent = s.long; });
    $$('[data-hours3] tr').forEach((tr) => tr.classList.toggle('is-today', tr.dataset.days.split(',').includes(String(s.day))));
    $$('[data-week] tr').forEach((tr) => {
      const today = tr.dataset.day === String(s.day); tr.classList.toggle('is-today', today);
      const needle = $('.week__now', tr); if (!needle) return;
      const pos = (s.mins / 60 - 9) / 9;
      needle.classList.toggle('is-on', today && pos >= 0 && pos <= 1);
      needle.style.left = 'calc(' + (pos * 100).toFixed(2) + '% - 2px)';
    });
    const live = $('[data-plan-live]'); if (live && live.dataset.kind === 'pbar') live.textContent = s.plan;
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

  /* ---------- the stage: the photograph follows what you are reading ---------- */
  const stage = $('.stage');
  const stakeEl = $('[data-stage-stake]');
  let chosenStake = 'Little sprout';
  const setStake = (el, text) => {
    if (!el) return; const label = $('.stake__label', el);
    if (label.textContent === text) return;
    label.textContent = text; el.classList.remove('is-planting'); void el.offsetWidth; el.classList.add('is-planting');
  };
  if (stage && 'IntersectionObserver' in window) {
    const pics = $$('.stage__pics img');
    const show = (sec) => {
      const key = sec.dataset.stageFor; const pic = pics.find((p) => p.dataset.stage === key);
      if (pic && !pic.classList.contains('is-on')) { pics.forEach((p) => p.classList.toggle('is-on', p === pic)); }
      const text = sec.hasAttribute('data-stake-live') ? chosenStake : sec.dataset.stake;
      if (text) setStake(stakeEl, text);
    };
    const so = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) show(e.target); }), { rootMargin: '-42% 0px -42% 0px' });
    $$('[data-stage-for]').forEach((s) => so.observe(s));
  }

  /* ---------- plant markers: pick the one that goes in your pot ---------- */
  const stakes = $('[data-stakes]');
  if (stakes) stakes.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    $$('button', stakes).forEach((x) => x.setAttribute('aria-pressed', x === b));
    chosenStake = b.textContent;
    setStake(stakeEl, chosenStake); setStake($('[data-stake-inline]'), chosenStake);
  });

  /* ---------- the planner ---------- */
  const plan = $('[data-plan]'), out = $('[data-plan-out]');
  const arrow = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 10h11M11 5l5 5-5 5"/></svg>';
  if (plan && out) {
    const who = { me: 'a little time to yourself', date: 'a date', friends: 'a creative outing with friends', group: 'a group', gift: 'a gift' };
    const pick = () => {
      const v = (n) => $('input[name="' + n + '"]:checked', plan).value;
      const w = v('who'), where = v('where'), when = v('when'); const s = state();
      if (where === 'home') return { kind: 'kit', title: 'A DIY Terrarium Kit', facts: ['$55', 'Made at home', 'Pickup at the shop'],
        text: w === 'date' ? 'Plan an at-home date night. Choose your terrarium style and we’ll have the kit ready to pick up.' : w === 'gift' ? 'Gift a kit to your favorite plant lover. Choose a style and we’ll have it ready to pick up.' : w === 'group' ? 'One kit each around the kitchen table. For a bigger get-together, ask Dani about a private event.' : 'Bring the Snip & Sprout experience to your kitchen table for a relaxing creative afternoon.',
        live: 'Kits are prepared to order and ready for pickup at the shop.', href: 'shop.html#kits', cta: 'Choose a kit', alt: w === 'group' ? ['workshops.html#private', 'Ask about a private event'] : ['visit.html', 'Pickup hours'] };
      if (w === 'group' && when !== 'nov22') return { kind: 'private', title: 'A private event', facts: ['In the shop', 'Your own table', 'Reply in one business day'],
        text: 'Birthdays, bridal showers, team building and client gatherings. You gather the guests. We provide the plants, supplies and instructions.',
        live: 'Tell Dani the occasion and the date you have in mind.', href: 'workshops.html#private', cta: 'Plan a private event', alt: ['workshops.html', 'See workshops'] };
      if (when === 'nov22') return { kind: 'workshop', title: 'The November Terrarium Workshop', facts: ['from $40', 'Sunday, Nov 22, 1 PM', 'All supplies included'],
        text: w === 'group' ? 'Seats are limited, so reserve together. For a table of your own, ask about a private event.' : 'Pull up a chair at the table in the back. Choose Open, Closed, Skull, Teardrop Glass or Pumpkin, and take it home.',
        live: 'Seating is limited.', href: 'workshops.html#next', cta: 'See the workshop', alt: w === 'group' ? ['workshops.html#private', 'Ask about a private event'] : ['shop.html#tbar', 'Or book the Terrarium Bar'] };
      if (when === 'later') return { kind: 'tbar', title: 'The Terrarium Bar', facts: ['from $45', 'In the shop', 'One day’s notice'],
        text: (w === 'friends' ? 'A fun, hands-on outing with friends. ' : w === 'me' ? 'A little time to yourself. ' : w === 'date' ? 'A hands-on date. ' : w === 'gift' ? 'Build the gift yourself. ' : '') + 'Choose your terrarium style, then come in and personalize it with plants and decorative details.',
        live: 'Book at least one day ahead so we can prepare your vessel.', href: 'shop.html#tbar', cta: 'Book the Terrarium Bar', alt: ['shop.html#pbar', 'Or just walk in to the Plant Bar'] };
      return { kind: 'pbar', title: 'The Plant Bar', facts: ['$22', 'In the shop', 'No notice needed'],
        text: (w === 'gift' ? 'Make a thoughtful gift. ' : w === 'friends' ? 'A spontaneous outing with friends. ' : w === 'date' ? 'An easy, hands-on date. ' : 'Treat yourself. ') + 'Pick out a plant and a pot, then put it together at our planting station.',
        live: s.plan, href: 'shop.html#pbar', cta: 'See the Plant Bar', alt: ['visit.html', 'Hours and directions'] };
    };
    const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const render = () => {
      const r = pick();
      out.innerHTML = '<h3>' + esc(r.title) + '</h3><p>' + esc(r.text) + '</p><div class="plan__facts">' + r.facts.map((f) => '<span>' + esc(f) + '</span>').join('') + '</div><p class="plan__live" data-plan-live data-kind="' + r.kind + '">' + esc(r.live) + '</p><div class="plan__acts"><a class="btn btn--paper" href="' + r.href + '">' + esc(r.cta) + ' ' + arrow + '</a><a class="link" href="' + r.alt[0] + '">' + esc(r.alt[1]) + '</a></div>';
      out.classList.remove('is-swap'); void out.offsetWidth; out.classList.add('is-swap');
    };
    plan.addEventListener('change', render);
    const first = $('[data-plan-live]'); if (first) first.dataset.kind = 'pbar';
    void who;
  }

  paintHours();
  setInterval(paintHours, 30000);

  /* ---------- workshop countdown and calendar ---------- */
  $$('[data-count]').forEach((box) => {
    const t = new Date(box.dataset.count).getTime();
    const tick = () => {
      let s = Math.floor((t - Date.now()) / 1000);
      if (s <= 0) { box.innerHTML = '<div><b>Today</b><span>See you at the table.</span></div>'; return; }
      const d = Math.floor(s / 86400); s -= d * 86400; const h = Math.floor(s / 3600); s -= h * 3600; const m = Math.floor(s / 60);
      $('[data-d]', box).textContent = d; $('[data-h]', box).textContent = h; $('[data-m]', box).textContent = m;
    };
    tick(); setInterval(tick, 20000);
  });
  $$('[data-cal]').forEach((cal) => {
    const b = $('button', cal);
    if (framed) $$('[data-ics]', cal).forEach((a) => a.remove());   // file downloads are blocked inside a preview frame
    b.addEventListener('click', (e) => { e.stopPropagation(); const on = cal.classList.toggle('is-open'); b.setAttribute('aria-expanded', on); });
    document.addEventListener('click', (e) => { if (!cal.contains(e.target)) { cal.classList.remove('is-open'); b.setAttribute('aria-expanded', 'false'); } });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { cal.classList.remove('is-open'); b.setAttribute('aria-expanded', 'false'); } });
  });

  /* ---------- plant match ---------- */
  const match = $('[data-match]');
  if (match) {
    const tabs = $$('[role="tab"]', match), panels = $$('[role="tabpanel"]', match);
    const sum = $('[data-match-sum]'), send = $('[data-match-send]'), file = $('[data-match-file]');
    const img = $('[data-match-img]'), stake = $('[data-match-stake]'), label = $('[data-match-photo-label]');
    let photo = null;
    const open = (i, focus) => { tabs.forEach((t, k) => { t.setAttribute('aria-selected', k === i); t.tabIndex = k === i ? 0 : -1; }); panels.forEach((p, k) => { p.hidden = k !== i; }); if (focus) tabs[i].focus(); };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => open(i));
      t.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') open((i + 1) % tabs.length, true); if (e.key === 'ArrowLeft') open((i + tabs.length - 1) % tabs.length, true); });
    });
    const answers = () => ['light', 'water', 'pets'].map((n) => { const c = $('input[name="' + n + '"]:checked', match); return c ? c.value : ''; });
    const body = () => { const [l, w, p] = answers(); return 'Hi Dani!\n\nI’m looking for a plant for a spot at home.\n\nLight: ' + (l || 'not sure') + '\nWatering: ' + (w || 'not sure') + '\nAt home: ' + (p || 'not sure') + '\n\n' + (photo ? 'A photo of the spot is attached.' : 'I’ll send a photo of the spot.') + '\n'; };
    const update = () => {
      const a = answers(); const got = a.filter(Boolean);
      tabs.forEach((t, i) => t.classList.toggle('is-done', !!a[i]));
      if (got.length) sum.textContent = got.join(' · ');
      send.href = mail('Plant match', body());
    };
    match.addEventListener('change', (e) => {
      update();
      const i = panels.findIndex((p) => p.contains(e.target));
      if (i > -1 && i < panels.length - 1) setTimeout(() => open(i + 1), 320);
    });
    file.addEventListener('change', () => {
      photo = file.files && file.files[0]; if (!photo) return;
      img.src = URL.createObjectURL(photo); img.alt = 'Your photo of the spot';
      stake.hidden = false; stake.classList.remove('is-planting'); void stake.offsetWidth; stake.classList.add('is-planting');
      label.textContent = 'Photo added. Tap to change it';
      update();
    });
    send.addEventListener('click', async (e) => {
      if (photo && navigator.canShare && navigator.canShare({ files: [photo] })) {
        e.preventDefault();
        try { await navigator.share({ files: [photo], title: 'Plant match for Snip & Sprout', text: body() + '\nSend to: ' + MAIL }); return; } catch (err) { if (err && err.name === 'AbortError') return; }
        go(send.href);
      } else if (framed) { e.preventDefault(); go(send.href); }
    });
    update();
  }

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
