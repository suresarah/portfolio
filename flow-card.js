// Homepage workflow card: a highlight travels Design → Production on a
// loop, filling the line and showing what happens at each step. Hovering
// or focusing a step jumps to it and pauses the loop. With reduced motion
// it rests on Build (the step that changed) and only moves on interaction.
(function () {
  document.querySelectorAll('.flow-card').forEach(card => {
    const steps = Array.from(card.querySelectorAll('.fc-step'));
    const note = card.querySelector('.fc-note');
    const keyIndex = Math.max(0, steps.findIndex(s => s.classList.contains('is-key')));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let i = keyIndex, timer = null, paused = false, visible = false;

    function show(n) {
      i = (n + steps.length) % steps.length;
      steps.forEach((s, k) => {
        s.classList.toggle('is-active', k === i);
        s.classList.toggle('is-done', k < i);
        s.setAttribute('aria-pressed', String(k === i));
      });
      card.style.setProperty('--p', steps.length > 1 ? i / (steps.length - 1) : 0);
      note.textContent = steps[i].dataset.note;
    }
    function tick() { show(i + 1); }
    function start() {
      if (reduce || paused || !visible || timer) return;
      timer = setInterval(tick, 2400);
    }
    function stop() { clearInterval(timer); timer = null; }

    steps.forEach((s, k) => {
      s.addEventListener('pointerenter', () => { paused = true; stop(); show(k); });
      s.addEventListener('focus', () => { paused = true; stop(); show(k); });
      s.addEventListener('click', () => { paused = true; stop(); show(k); });
    });
    card.addEventListener('pointerleave', () => { paused = false; start(); });
    card.addEventListener('focusout', e => { if (!card.contains(e.relatedTarget)) { paused = false; start(); } });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        visible = e.isIntersecting && e.intersectionRatio > 0;
        if (visible) start(); else stop();
      }, { threshold: [0, .2] }).observe(card);
    } else { visible = true; start(); }

    show(reduce ? keyIndex : 0);
  });
})();
