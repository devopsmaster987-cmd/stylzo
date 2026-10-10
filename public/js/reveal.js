// Progressive scroll reveals for the home page.
//
// The animation is opt-in per element and additive: without this script every
// section is simply visible. That matters because the content is server-rendered
// and must stay readable if the script fails, is blocked, or never loads.

const ARMED = 'reveal-armed';
const SHOWN = 'reveal-shown';

function arm() {
  const targets = document.querySelectorAll('[data-reveal]');
  if (!targets.length) return;

  // No IntersectionObserver: show everything rather than hide content behind an
  // animation that cannot run.
  if (typeof IntersectionObserver !== 'function') {
    for (const el of targets) el.setAttribute('data-reveal', 'shown');
    return;
  }

  // Honour the OS setting before arming, so a reduced-motion visit never flashes.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    for (const el of targets) el.setAttribute('data-reveal', 'shown');
    return;
  }

  for (const el of targets) el.classList.add(ARMED);

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.setAttribute('data-reveal', 'shown');
      io.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

  for (const el of targets) io.observe(el);
}

// Re-arm after client-side navigation renders new sections.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', arm, { once: true });
} else {
  arm();
}