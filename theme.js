// Day / night toggle. Loaded in <head> so the saved theme is applied before
// first paint (no dark flash on light pages). Dark ("night") is the default;
// the choice is remembered in localStorage. The switch itself is injected
// into the header nav, just before the "Email me" button.
(function () {
  const KEY = 'theme';
  const root = document.documentElement;

  function saved() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function apply(theme) {
    if (theme === 'light') root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');
  }
  apply(saved());

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Sunrise (to day) or sunset (to night): a soft wash of warm light passes
  // over the page while the colours cross-fade. The glow is centred on the
  // toggle, so the "sun" comes up from (or goes down toward) the switch.
  function sweep(kind, from) {
    const old = document.querySelector('.sky-sweep');
    if (old) old.remove();
    const el = document.createElement('div');
    el.className = 'sky-sweep sky-sweep--' + kind;
    el.setAttribute('aria-hidden', 'true');
    const r = from.getBoundingClientRect();
    el.style.setProperty('--sx', ((r.left + r.width / 2) / window.innerWidth * 100).toFixed(1) + '%');
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
    setTimeout(() => el.remove(), 2000);
  }

  function mount() {
    const nav = document.querySelector('.site-header nav');
    if (!nav || nav.querySelector('.theme-toggle')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-toggle';
    btn.setAttribute('role', 'switch');
    btn.setAttribute('aria-label', 'Light mode');
    btn.innerHTML =
      '<span class="tt-sky" aria-hidden="true">' +
        '<i class="tt-cloud tt-cloud--1"></i><i class="tt-cloud tt-cloud--2"></i>' +
        '<i class="tt-star tt-star--1"></i><i class="tt-star tt-star--2"></i>' +
        '<i class="tt-star tt-star--3"></i><i class="tt-star tt-star--4"></i>' +
        '<i class="tt-hill"></i>' +
      '</span>' +
      '<span class="tt-knob" aria-hidden="true"><i class="tt-crater"></i></span>';

    const sync = () => {
      const light = root.getAttribute('data-theme') === 'light';
      btn.setAttribute('aria-checked', String(light));
      btn.title = light ? 'Switch to night' : 'Switch to day';
    };
    sync();

    btn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      if (!reduceMotion) {
        root.classList.add('theme-anim');
        clearTimeout(btn._t);
        btn._t = setTimeout(() => root.classList.remove('theme-anim'), 1400);
        sweep(next === 'light' ? 'rise' : 'set', btn);
      }
      apply(next);
      try { localStorage.setItem(KEY, next); } catch (e) {}
      sync();
    });

    const cta = nav.querySelector('.cta');
    nav.insertBefore(btn, cta);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
