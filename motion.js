// Subtle page motion for case studies: panels ease in as they scroll
// into view, big numbers count up once, and a thin progress line tracks
// reading position. Skipped for reduced-motion users; content is fully
// visible if this script never runs. window.siteMotion(scope) re-runs
// it for case studies the home page loads inline.
// Full-size screenshots open in a modal instead of a new tab.
(function () {
  let dlg;
  const build = () => {
    dlg = document.createElement('dialog');
    dlg.className = 'shot-modal';
    dlg.innerHTML = '<button type="button" class="shot-close" aria-label="Close">\u00d7</button><img alt="">';
    dlg.addEventListener('click', e => { if (e.target === dlg || e.target.closest('.shot-close')) { dlg.close(); document.documentElement.classList.remove('shot-open'); } });
    dlg.addEventListener('close', () => document.documentElement.classList.remove('shot-open'));
    document.body.appendChild(dlg);
  };
  document.addEventListener('click', e => {
    const a = e.target.closest('a.app-full');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || typeof HTMLDialogElement !== 'function') return;
    e.preventDefault();
    if (!dlg) build();
    const src = a.querySelector('img');
    const img = dlg.querySelector('img');
    img.src = a.href; img.alt = src ? src.alt : '';
    document.documentElement.classList.add('shot-open');
    dlg.showModal();
    dlg.scrollTop = 0;
  });
})();

(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { window.siteMotion = () => {}; return; }
  const root = document.documentElement;
  root.classList.add('motion');

  const bar = document.createElement('div');
  bar.className = 'read-progress'; bar.setAttribute('aria-hidden', 'true');
  const onScroll = () => {
    const max = root.scrollHeight - innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, scrollY / max) : 0) + ')';
  };

  // Reveal anything whose top has come into view. A plain scroll check is
  // used (not IntersectionObserver) so very tall sections and background
  // tabs behave the same.
  let pending = [];
  const check = () => {
    if (!pending.length) return;
    const line = innerHeight * 0.94;
    pending = pending.filter(el => {
      if (el.getBoundingClientRect().top < line) { el.classList.add('is-in'); return false; }
      return true;
    });
  };
  addEventListener('scroll', check, { passive: true });
  addEventListener('resize', check);

  const count = el => {
    const node = [...el.childNodes].find(n => n.nodeType === 3 && /\d/.test(n.textContent));
    if (!node) return;
    const target = parseFloat(node.textContent.replace(/[^\d.]/g, ''));
    if (!isFinite(target) || target === 0) return;
    const dec = (node.textContent.split('.')[1] || '').replace(/\D/g, '').length;
    const t0 = performance.now(), dur = 900;
    const step = now => {
      const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      node.textContent = (target * e).toFixed(dec);
      if (p < 1) requestAnimationFrame(step); else node.textContent = target.toFixed(dec);
    };
    requestAnimationFrame(step);
  };
  const no = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { count(e.target); no.unobserve(e.target); } });
  }, { threshold: 0.6 });

  window.siteMotion = (scope = document) => {
    scope.querySelectorAll('.sheet > *, .cs-hero .facts, .ill-decks > .deck, .pg-grid > .pg-card, .tile, .side-grid > *')
      .forEach((el, i) => {
        if (el.classList.contains('reveal')) return;
        el.classList.add('reveal'); el.style.setProperty('--d', (i % 3) * 70 + 'ms'); pending.push(el);
      });
    scope.querySelectorAll('.stat-n').forEach(n => no.observe(n));
    check(); setTimeout(check, 60);
  };

  const start = () => {
    if (document.querySelector('.cs-hero, .sheet')) {          // case-study pages only
      document.body.appendChild(bar);
      addEventListener('scroll', onScroll, { passive: true }); onScroll();
    }
    window.siteMotion(document.querySelector('main') || document);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
