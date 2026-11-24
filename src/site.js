// Snip & Sprout Co. Every page reads fine without this file; it adds the live parts.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const framed = window.self !== window.top;           // true inside a preview frame
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let MAIL = 'snipandsproutco@gmail.com';              // her saved email takes its place when info.js has it
  document.addEventListener('sw-info', (e) => { const saved = e.detail && e.detail.contact && e.detail.contact.email; if (saved) MAIL = saved; });
  const mail = (subject, body) => 'mailto:' + MAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  const go = (href) => { if (framed) window.open(href, '_blank', 'noopener'); else location.href = href; };
  // A round pause and play button for something that moves by itself; change(held) is told each time it is pressed.
  const pauseButton = (cls, what, change) => {
    const btn = document.createElement('button'); let held = false;
    btn.type = 'button';
    btn.className = cls;
    btn.innerHTML = '<svg class="i-pause" viewBox="0 0 14 14" aria-hidden="true"><path fill="currentColor" d="M3 2h3v10H3zM8 2h3v10H8z"/></svg>'
      + '<svg class="i-play" viewBox="0 0 14 14" aria-hidden="true"><path fill="currentColor" d="M4 2l8 5-8 5z"/></svg>';
    const label = () => { btn.setAttribute('aria-label', (held ? 'Play ' : 'Pause ') + what); btn.classList.toggle('is-held', held); };
    btn.addEventListener('click', () => { held = !held; label(); change(held); });
    label();
    return btn;
  };

  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- entrances ---------- */
  const ins = $$('[data-in]');
  ins.forEach((el) => { const sib = [...el.parentElement.children].filter((c) => c.hasAttribute('data-in')); el.style.setProperty('--d', Math.min(sib.indexOf(el), 5) * 0.08 + 's'); });
  if ('IntersectionObserver' in window && !calm) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    ins.forEach((el) => io.observe(el));
  } else ins.forEach((el) => el.classList.add('in'));

  /* ---------- her shop across the top of the footer ----------
     The footer shows shop-scene.svg as a still picture. Here the same drawing is put in inline so it can move:
     the watering can comes in from the left, stops over each plant on screen and waters it, and the plant grows
     (the first time; after that it just perks up). It plays while the footer is on screen, comes round again
     every so often, and has a pause button. Anyone who asked for less motion keeps the still picture. */
  const shop = $('[data-shop-scene]');
  if (shop && !calm && 'IntersectionObserver' in window && 'getAnimations' in Element.prototype) {
    const still = $('img', shop);
    fetch(still.currentSrc || still.src)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(r.status))))
      .then((text) => {
        const art = new DOMParser().parseFromString(text, 'image/svg+xml').documentElement;
        if (art.nodeName !== 'svg') return;
        const svg = document.importNode(art, true);
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        still.replaceWith(svg);
        water(shop, svg);
      })
      .catch(() => {});   // the still picture stays
  }
  function water(box, svg) {
    const W = 2400, H = 214;                       // the drawing's size (its viewBox)
    const SPEED = 0.2, STAY = 950, REST = 7000;   // units a millisecond; time over each plant; pause between rounds
    const can = $('.sc-can', svg), tilt = $('.sc-can__tilt', svg), rain = $('.sc-rain', svg);
    const plants = $$('.sp', svg).map((el) => {
      const grow = $('.sp__grow', el), [ox, oy] = grow.dataset.o.split(' ');
      grow.style.transformOrigin = ox + 'px ' + oy + 'px';
      return { x: +el.dataset.x, top: +el.dataset.top, grow };
    });
    const GROW = [{ transform: 'scale(.14, .1)' }, { transform: 'scale(1.03, 1.06)', offset: 0.7 }, { transform: 'none' }];
    const PERK = [{ transform: 'none' }, { transform: 'scale(1.02, 1.05)', offset: 0.4 }, { transform: 'none' }];
    let run = [], first = true, onScreen = false, held = false;

    // The part of the drawing on screen: it is cropped at the sides to fill the footer's width.
    const seen = () => {
      const r = svg.getBoundingClientRect(), half = r.width / Math.max(r.width / W, r.height / H) / 2;
      return [W / 2 - half, W / 2 + half];
    };
    const sync = () => svg.getAnimations({ subtree: true }).forEach((a) => {
      if (onScreen && !held) { if (a.playState === 'paused') a.play(); } else a.pause();
    });
    const round = () => {
      run.forEach((a) => a.cancel());
      const [from, to] = seen();
      const stops = plants.filter((p) => p.x > from + 40 && p.x < to - 40);
      // the can's path: in from the left, a stop over each plant (high enough to clear it), out to the right
      const frames = [{ x: from - 140, y: 96, t: 0 }];
      let t = 0;
      const go = (x, y) => { const last = frames[frames.length - 1]; t += Math.hypot(x - last.x, y - last.y) / SPEED; frames.push({ x, y, t }); };
      stops.forEach((p) => { go(p.x - 64, Math.min(150, Math.max(84, p.top - 26))); p.at = t; t += STAY; frames.push({ ...frames[frames.length - 1], t }); });
      go(to + 80, 96);
      const total = t, at = (ms) => Math.min(1, Math.max(0, ms / total));
      const tip = [{ transform: 'rotate(0deg)', offset: 0 }], pour = [{ opacity: 0, offset: 0 }];
      stops.forEach((p) => {
        tip.push({ transform: 'rotate(0deg)', offset: at(p.at) }, { transform: 'rotate(26deg)', offset: at(p.at + 260) },
          { transform: 'rotate(26deg)', offset: at(p.at + STAY - 260) }, { transform: 'rotate(0deg)', offset: at(p.at + STAY) });
        pour.push({ opacity: 0, offset: at(p.at + 200) }, { opacity: 1, offset: at(p.at + 320) },
          { opacity: 1, offset: at(p.at + STAY - 300) }, { opacity: 0, offset: at(p.at + STAY - 160) });
      });
      tip.push({ transform: 'rotate(0deg)', offset: 1 }); pour.push({ opacity: 0, offset: 1 });
      const timing = { duration: total, fill: 'both' };
      run = [
        can.animate(frames.map((f) => ({ transform: `translate(${f.x}px, ${f.y}px)`, offset: at(f.t), easing: 'ease-in-out' })), timing),
        tilt.animate(tip, timing),
        rain.animate(pour, timing),
        ...stops.map((p) => p.grow.animate(first ? GROW : PERK,
          { duration: first ? 1400 : 900, delay: p.at + 380, fill: 'backwards', easing: 'cubic-bezier(.3, .7, .3, 1)' })),
      ];
      const rest = can.animate([{ opacity: 1 }, { opacity: 1 }], { duration: REST, delay: total });   // a quiet spell before the next round
      run.push(rest);
      rest.finished.then(() => { first = false; round(); }, () => {});
      sync();
    };

    box.append(pauseButton('shop-scene__toggle', 'the shop animation', (h) => { held = h; sync(); }));

    round();
    new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); }, { threshold: 0.35 }).observe(box);
  }


  /* ---------- add to my calendar ---------- */
  $$('[data-cal]').forEach((cal) => {
    const b = $('button', cal);
    if (framed) $$('[data-ics]', cal).forEach((a) => a.remove());   // file downloads are blocked inside a preview frame
    b.addEventListener('click', (e) => { e.stopPropagation(); const on = cal.classList.toggle('is-open'); b.setAttribute('aria-expanded', on); });
    document.addEventListener('click', (e) => { if (!cal.contains(e.target)) { cal.classList.remove('is-open'); b.setAttribute('aria-expanded', 'false'); } });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { cal.classList.remove('is-open'); b.setAttribute('aria-expanded', 'false'); } });
  });

  /* ---------- one frame, contents change ----------
     The photo changes by itself every few seconds while the frame is on screen, and its round button pauses
     that. A tap on the photo shows the next one. The caption is read out only when a visitor changes the
     photo, never on the timer. Anyone who asked for less motion gets no timer, so no button either. */
  const frame = $('[data-frame]');
  if (frame) {
    const pics = $$('img', frame), cap = $('[data-frame-cap]'); let i = 0, timer, held = calm, seen = false;
    const next = (byHand) => {
      i = (i + 1) % pics.length;
      pics.forEach((p, k) => p.classList.toggle('is-on', k === i));
      cap.setAttribute('aria-live', byHand ? 'polite' : 'off');
      cap.textContent = pics[i].dataset.cap;
    };
    const play = () => { clearInterval(timer); if (seen && !held) timer = setInterval(() => { if (!document.hidden) next(false); }, 3200); };
    frame.addEventListener('click', () => { next(true); play(); });
    if (!calm && 'IntersectionObserver' in window) {
      frame.after(pauseButton('frame__toggle', 'the changing photos', (h) => { held = h; play(); }));
      new IntersectionObserver(([e]) => { seen = e.isIntersecting; play(); }).observe(frame);
    }
  }

  /* ---------- the Gallery's photo viewer ----------
     Each tile links to the whole photo. Here a tap opens it in a full-screen viewer instead, with her caption,
     previous and next buttons, the arrow keys and a swipe; Esc, the close button or a tap beside the photo
     closes it and puts you back on the same tile. */
  const lb = $('[data-lb]');
  if (lb && typeof lb.showModal === 'function') {
    const items = $$('.gal__item'), img = $('[data-lb-img]', lb), cap = $('[data-lb-cap]', lb), num = $('[data-lb-n]', lb);
    const wrap = (i) => (i + items.length) % items.length;
    let at = 0, x0 = null, swiped = false;
    img.addEventListener('load', () => img.classList.toggle('is-loading', false));
    const show = (i) => {
      at = wrap(i);
      const a = items[at];
      img.classList.toggle('is-loading', true);
      img.src = a.href;
      img.alt = $('img', a).alt;
      cap.textContent = a.dataset.cap;
      num.textContent = (at + 1) + ' of ' + items.length;
      [at - 1, at + 1].forEach((k) => { new Image().src = items[wrap(k)].href; });   // the next ones, ready
    };
    items.forEach((a, i) => a.addEventListener('click', (e) => { e.preventDefault(); show(i); lb.showModal(); }));
    $$('[data-lb-step]', lb).forEach((b) => b.addEventListener('click', () => show(at + Number(b.dataset.lbStep))));
    $('[data-lb-close]', lb).addEventListener('click', () => lb.close());
    lb.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') show(at - 1);
      else if (e.key === 'ArrowRight') show(at + 1);
    });
    lb.addEventListener('pointerdown', (e) => { x0 = e.clientX; swiped = false; });
    lb.addEventListener('pointerup', (e) => {
      if (x0 !== null && Math.abs(e.clientX - x0) > 50) { swiped = true; show(at + (e.clientX < x0 ? 1 : -1)); }
      x0 = null;
    });
    lb.addEventListener('click', (e) => {   // a tap beside the photo closes it (not the end of a swipe)
      if (!swiped && (e.target === lb || e.target.classList.contains('lb__fig'))) lb.close();
    });
    lb.addEventListener('close', () => items[at].focus());
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
