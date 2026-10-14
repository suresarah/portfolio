// Voyager tier track: click a tier stop to fly the rocket there, or click
// the rocket to fly to the next tier (it wraps back after Galactic).
// Uses event delegation on document, so it also works when the case study
// is loaded inline on the homepage (scripts inside fetched pages don't run).
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function go(track, i) {
    const stops = Array.from(track.querySelectorAll('.trk-stop'));
    i = (i + stops.length) % stops.length;
    const stop = stops[i];
    track.style.setProperty('--at', i);
    stops.forEach((s, n) => {
      s.setAttribute('aria-pressed', String(n === i));
      s.classList.toggle('is-passed', n < i);
    });
    track.querySelector('.trk-name').textContent = stop.dataset.name;
    track.querySelector('.trk-spend').textContent = stop.dataset.spend;
    track.querySelector('.trk-perk').textContent = stop.dataset.perk;
    track.style.setProperty('--trk-tone', stop.dataset.tone);

    if (!reduceMotion) {
      track.classList.remove('is-flying');
      void track.offsetWidth; // restart the thrust animation
      track.classList.add('is-flying');
      clearTimeout(track._t);
      track._t = setTimeout(() => track.classList.remove('is-flying'), 900);
    }
  }

  document.addEventListener('click', e => {
    const track = e.target.closest('[data-tier-track]');
    if (!track) return;
    const stop = e.target.closest('.trk-stop');
    if (stop) {
      go(track, Array.from(track.querySelectorAll('.trk-stop')).indexOf(stop));
    } else if (e.target.closest('.trk-rocket')) {
      go(track, Number(getComputedStyle(track).getPropertyValue('--at')) + 1);
    }
  });
})();
