// Tenets accordion: one panel open at a time. Tabs are real buttons with
// aria-expanded; arrow keys move between tabs; the URL hash opens a panel.
// A panel's "read" link loads that case study underneath instead of
// navigating away (the standalone pages still work for direct links).
(function () {
  const root = document.querySelector('.tenets');
  if (!root) return;

  const tenets = Array.from(root.querySelectorAll('.tenet'));
  const tabs = tenets.map(t => t.querySelector('.tenet-tab'));

  const detail = document.getElementById('detail');
  const detailBody = document.getElementById('detail-body');
  const detailTitle = document.getElementById('detail-title');
  const detailClose = document.getElementById('detail-close');
  const cache = new Map();
  let shownId = null;

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

    // If a case study is showing, keep it in step with the open panel.
    const tenet = tenets[index];
    const link = tenet.querySelector('.read');
    if (shownId && shownId !== tenet.id) {
      if (link) showDetail(tenet, { scroll: false });
      else hideDetail({ updateHash: false });
    }
    if (updateHash) setHash(index === 0 ? '' : tenet.id + (shownId === tenet.id ? '/read' : ''));
  }

  // Fetch a case-study page and return its content, with relative URLs
  // rewritten so images and links still resolve from the homepage.
  async function loadPage(url) {
    if (cache.has(url)) return cache.get(url).cloneNode(true);
    const res = await fetch(url);
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

  async function showDetail(tenet, { scroll = true } = {}) {
    const link = tenet.querySelector('.read');
    if (!link) return;
    shownId = tenet.id;
    detail.hidden = false;
    detail.style.setProperty('--tone', tenet.style.getPropertyValue('--tone'));
    detailTitle.textContent = tenet.querySelector('.tenet-tab span').textContent;
    detail.classList.add('is-loading');
    try {
      const content = await loadPage(link.getAttribute('href'));
      if (shownId !== tenet.id) return; // another panel was picked meanwhile
      detailBody.replaceChildren(content);
    } catch (e) {
      // If loading fails (e.g. opened from a file), fall back to the page itself.
      location.href = link.href;
      return;
    } finally {
      detail.classList.remove('is-loading');
    }
    setHash(tenet.id + '/read');
    if (scroll) {
      detail.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
      detailBody.focus({ preventScroll: true });
    }
  }

  function hideDetail({ updateHash = true } = {}) {
    const wasId = shownId;
    shownId = null;
    detail.hidden = true;
    detailBody.replaceChildren();
    if (updateHash) {
      setHash(wasId || '');
      root.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
      const i = tenets.findIndex(t => t.id === wasId);
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
    const i = tenets.findIndex(t => t.id === id);
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
