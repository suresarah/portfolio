// Subtle page motion for case studies: panels ease in as they scroll
// into view, big numbers count up once, and a thin progress line tracks
// reading position. Everything is skipped for reduced-motion users, and
// content is fully visible if this script never runs.
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const root = document.documentElement;
  root.classList.add('motion');

  // Reading progress
  const bar = document.createElement('div');
  bar.className = 'read-progress'; bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  const onScroll = () => {
    const max = root.scrollHeight - innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, scrollY / max) : 0) + ')';
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Panels ease in
  const items = document.querySelectorAll('.sheet > *, .cs-hero .facts');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in'); io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  items.forEach((el, i) => {
    el.classList.add('reveal');
    el.style.setProperty('--d', (i % 3) * 70 + 'ms');
    io.observe(el);
  });

  // Numbers count up once
  const nums = document.querySelectorAll('.stat-n');
  const run = el => {
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
    entries.forEach(e => { if (e.isIntersecting) { run(e.target); no.unobserve(e.target); } });
  }, { threshold: 0.6 });
  nums.forEach(n => no.observe(n));
})();
