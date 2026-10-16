// Tenets accordion: one panel open at a time. Tabs are real buttons with
// aria-expanded; arrow keys move between tabs; the URL hash opens a panel.
// A panel's "read" link loads that case study underneath instead of
// navigating away (the standalone pages still work for direct links).
(function () {
  const root = document.querySelector('.tenets');
  if (!root) return;

  // The header is sticky and its height changes (links wrap on phones), so
  // measure it; the compact tab bar and case-study bar stick just below it.
  const header = document.querySelector('.site-header');
  if (header && 'ResizeObserver' in window) {
    new ResizeObserver(() => {
      document.documentElement.style.setProperty('--header-live', header.offsetHeight + 'px');
    }).observe(header);
  }

  const tenets = Array.from(root.querySelectorAll('.tenet'));
  const tabs = tenets.map(t => t.querySelector('.tenet-tab'));

  const detail = document.getElementById('detail');
  const detailBody = document.getElementById('detail-body');
  const detailTitle = document.getElementById('detail-title');
  const detailClose = document.getElementById('detail-close');
  const cache = new Map();
  let shownId = null;

  // While a case study is open, its tab in the compact bar carries a close
  // button (it replaces the separate title bar). One button, moved to
  // whichever tab is open; a sibling of .tenet-tab so buttons don't nest.
  const tabClose = document.createElement('button');
  tabClose.type = 'button';
  tabClose.className = 'tab-close';
  tabClose.innerHTML = '<span aria-hidden="true">✕</span>';
  tabClose.addEventListener('click', () => hideDetail());

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scrollBehavior = reduceMotion ? 'auto' : 'smooth';

  function setHash(hash) {
    history.replaceState(null, '', hash ? '#' + hash : location.pathname);
  }

  function open(index, { focus = false, updateHash = true } = {}) {
    tenets.forEach((t, i) => {
      const isOpen = i === index;
      t.classList.toggle('is-open', isOpen);
      tabs[i].setAttribute('aria-expanded', String(isOpen));
      t.querySelector('.tenet-panel').hidden = !isOpen;
    });
    if (focus) tabs[index].focus();

    // Header: About lights up while the About panel is open, Work otherwise.
    const onAbout = tenets[index].dataset.id === 'about';
    document.querySelectorAll('.site-header nav a[href="#intro"], .site-header nav a[href="#about"]').forEach(a => {
      const current = (a.getAttribute('href') === '#about') === onAbout;
      if (current) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });

    // If a case study is showing, keep it in step with the open panel.
    const tenet = tenets[index];
    const link = tenet.querySelector('.read');
    if (shownId && shownId !== tenet.dataset.id) {
      if (link) showDetail(tenet, { jump: true }); // open the new case study at its top
      else hideDetail({ focusLink: false }); // Intro / About: back to the full accordion
    }
    if (updateHash) setHash(index === 0 ? '' : tenet.dataset.id + (shownId === tenet.dataset.id ? '/read' : ''));
  }

  // Fetch a case-study page and return its content, with relative URLs
  // rewritten so images and links still resolve from the homepage.
  async function loadPage(url) {
    if (cache.has(url)) return cache.get(url).cloneNode(true);
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.status);
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    const main = doc.querySelector('main');
    main.querySelectorAll('.next').forEach(n => n.remove());
    const base = new URL(url, location.href);
    main.querySelectorAll('[src]').forEach(el => el.setAttribute('src', new URL(el.getAttribute('src'), base).href));
    main.querySelectorAll('a[href]').forEach(el => {
      const href = el.getAttribute('href');
      if (!href.startsWith('#') && !/^[a-z]+:/i.test(href)) el.setAttribute('href', new URL(href, base).href);
    });
    const frag = document.createDocumentFragment();
    Array.from(main.childNodes).forEach(n => frag.appendChild(n));
    cache.set(url, frag.cloneNode(true));
    return frag;
  }

  // Bottom of an inline case study: previous / next case study, switching
  // in place (the standalone pages' own links would leave the home page).
  function pager(tenet) {
    const i = tenets.indexOf(tenet);
    const readable = t => t && t.querySelector('.read');
    const name = t => t.querySelector('.tenet-tab span').textContent.trim();
    let prev = null, next = null;
    for (let j = i - 1; j >= 0; j--) if (readable(tenets[j])) { prev = tenets[j]; break; }
    for (let j = i + 1; j < tenets.length; j++) if (readable(tenets[j])) { next = tenets[j]; break; }
    const nav = document.createElement('nav');
    nav.className = 'next next--inline';
    nav.setAttribute('aria-label', 'More case studies');
    const make = (t, dir) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'next-link next-link--' + dir;
      b.innerHTML = '<small>' + (dir === 'prev' ? 'Previous' : 'Next case study') + '</small><b></b>';
      b.querySelector('b').textContent = dir === 'prev' ? '\u2190 ' + name(t) : name(t) + ' \u2192';
      b.addEventListener('click', () => open(tenets.indexOf(t)));
      return b;
    };
    if (prev) nav.appendChild(make(prev, 'prev')); else nav.appendChild(document.createElement('span'));
    if (next) nav.appendChild(make(next, 'next'));
    else {
      const about = tenets.findIndex(t => t.dataset.id === 'about');
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'next-link next-link--next';
      b.innerHTML = '<small>That\u2019s the work</small><b>About Sarah \u2192</b>';
      b.addEventListener('click', () => open(about >= 0 ? about : 0));
      nav.appendChild(b);
    }
    return nav;
  }

  async function showDetail(tenet, { scroll = true, jump = false } = {}) {
    const link = tenet.querySelector('.read');
    if (!link) return;
    shownId = tenet.dataset.id;
    detail.hidden = false;
    root.classList.add('is-compact');
    detail.style.setProperty('--tone', tenet.style.getPropertyValue('--tone'));
    detailTitle.textContent = tenet.querySelector('.tenet-tab span').textContent;
    tabClose.setAttribute('aria-label', 'Close ' + detailTitle.textContent + ' case study');
    tenet.appendChild(tabClose);
    detail.classList.add('is-loading');
    try {
      const content = await loadPage(link.getAttribute('href'));
      if (shownId !== tenet.dataset.id) return; // another panel was picked meanwhile
      detailBody.replaceChildren(content);
      detailBody.appendChild(pager(tenet));
      if (window.siteMotion) window.siteMotion(detailBody);
    } catch (e) {
      // If loading fails (e.g. opened from a file), fall back to the page itself.
      root.classList.remove('is-compact');
      tabClose.remove();
      location.href = link.href;
      return;
    } finally {
      detail.classList.remove('is-loading');
    }
    setHash(tenet.dataset.id + '/read');
    if (scroll) {
      // Land on the case study's top. The panels above are still collapsing
      // into the tab bar, which shifts the page, so jump now and again as
      // the layout settles, unless the reader has started scrolling.
      const toTop = () => detail.scrollIntoView({ behavior: 'auto', block: 'start' });
      let moved = false;
      const stop = () => { moved = true; };
      ['wheel', 'touchmove', 'keydown'].forEach(ev => window.addEventListener(ev, stop, { once: true, passive: true }));
      toTop();
      requestAnimationFrame(() => { if (!moved) toTop(); });
      [200, 450, 800, 1200].forEach(t => setTimeout(() => { if (!moved) toTop(); }, t));
      detailBody.focus({ preventScroll: true });
    }
  }

  function hideDetail({ focusLink = true } = {}) {
    const wasId = shownId;
    shownId = null;
    detail.hidden = true;
    detailBody.replaceChildren();
    tabClose.remove();
    root.classList.remove('is-compact');
    setHash(wasId || '');
    window.scrollTo({ top: 0, behavior: scrollBehavior });
    if (focusLink) {
      const i = tenets.findIndex(t => t.dataset.id === wasId);
      if (i >= 0) tenets[i].querySelector('.read')?.focus({ preventScroll: true });
    }
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => open(i));
    tab.addEventListener('keydown', e => {
      const next = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (next) {
        e.preventDefault();
        open((i + next + tabs.length) % tabs.length, { focus: true });
      } else if (e.key === 'Home') {
        e.preventDefault(); open(0, { focus: true });
      } else if (e.key === 'End') {
        e.preventDefault(); open(tabs.length - 1, { focus: true });
      }
    });
  });

  tenets.forEach(tenet => {
    const link = tenet.querySelector('.read');
    if (!link) return;
    link.addEventListener('click', e => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // let new-tab clicks through
      e.preventDefault();
      showDetail(tenet);
    });
  });

  detailClose?.addEventListener('click', () => hideDetail());

  function openFromHash() {
    const [id, mode] = location.hash.slice(1).split('/');
    const i = tenets.findIndex(t => t.dataset.id === id);
    if (i >= 0 || !location.hash) open(i >= 0 ? i : 0, { updateHash: false });
    if (i >= 0 && mode === 'read') {
      showDetail(tenets[i]);
    } else if (i >= 0) {
      // A panel hash shouldn't scroll the page: the accordion already fills the view.
      window.scrollTo(0, 0);
    }
  }
  window.addEventListener('hashchange', openFromHash);
  openFromHash();
})();
