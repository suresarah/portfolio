// Tenets accordion: one panel open at a time. Tabs are real buttons with
// aria-expanded; arrow keys move between tabs; the URL hash opens a panel.
(function () {
  const root = document.querySelector('.tenets');
  if (!root) return;

  const tenets = Array.from(root.querySelectorAll('.tenet'));
  const tabs = tenets.map(t => t.querySelector('.tenet-tab'));

  function open(index, { focus = false, updateHash = true } = {}) {
    tenets.forEach((t, i) => {
      const isOpen = i === index;
      t.classList.toggle('is-open', isOpen);
      tabs[i].setAttribute('aria-expanded', String(isOpen));
      t.querySelector('.tenet-panel').hidden = !isOpen;
    });
    if (focus) tabs[index].focus();
    if (updateHash) {
      const id = tenets[index].id;
      history.replaceState(null, '', index === 0 ? location.pathname : '#' + id);
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

  function openFromHash() {
    const i = tenets.findIndex(t => '#' + t.id === location.hash);
    if (i >= 0 || !location.hash) open(i >= 0 ? i : 0, { updateHash: false });
  }
  window.addEventListener('hashchange', openFromHash);
  openFromHash();
})();
