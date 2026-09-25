// HUD layer: tracks which panel is being read and feeds the page chrome.
// Sets --ambient (backdrop glow colour) from that section's accent,
// --scroll-progress for the topbar bar, the topbar readout text, and
// aria-current on the matching nav link. Everything degrades to the
// static page if this never runs.
(() => {
  const root = document.documentElement;
  const body = document.body;
  const readout = document.querySelector('.hud-readout');
  const links = [...document.querySelectorAll('.noct-topbar__link')];

  const targets = [
    { el: document.getElementById('top'), index: '§00', name: 'Index' },
    ...[...document.querySelectorAll('.noct-panel')].map((el) => ({
      el,
      index: el.querySelector('.noct-panel__index')?.textContent.trim() ?? '',
      name: el.querySelector('.noct-panel__title')?.firstChild?.textContent.trim() ?? '',
    })),
    { el: document.getElementById('contact'), index: '§09', name: 'Contact' },
  ].filter((t) => t.el);

  // nav link for a target: the last link whose section starts at or
  // before the target's section (so the project sections map to "Projects")
  const navFor = (el) => {
    const top = (el.closest('section') ?? el).getBoundingClientRect().top;
    let match = null;
    for (const link of links) {
      const dest = document.querySelector(link.getAttribute('href'));
      if (dest && dest.getBoundingClientRect().top <= top + 1) match = link;
    }
    return match;
  };

  let active = null;
  const setActive = (t) => {
    if (t === active) return;
    active = t;
    const accent = getComputedStyle(t.el.closest('section') ?? t.el).getPropertyValue('--section-accent').trim();
    if (accent) body.style.setProperty('--ambient', accent);
    if (readout) {
      readout.innerHTML = '';
      const b = document.createElement('b');
      b.textContent = t.index;
      readout.append(b, t.name);
    }
    const current = navFor(t.el);
    for (const link of links) {
      if (link === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  };

  let queued = false;
  const update = () => {
    queued = false;
    const max = root.scrollHeight - innerHeight;
    const progress = max > 0 ? Math.min(1, scrollY / max) : 0;
    root.style.setProperty('--scroll-progress', progress.toFixed(4));

    // the target whose top has passed 40% down the viewport; at the very
    // bottom, force the last one, which may never reach that line
    const line = innerHeight * 0.4;
    let pick = targets[0];
    if (progress > 0.995) pick = targets[targets.length - 1];
    else for (const t of targets) if (t.el.getBoundingClientRect().top <= line) pick = t;
    if (pick) setActive(pick);
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };

  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  update();
})();
