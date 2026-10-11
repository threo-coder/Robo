const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const menu = $('.menu-toggle');
function closeMenu() { menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Open navigation'); $('.main-nav').classList.remove('open'); }
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  $('.main-nav').classList.toggle('open', open);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
$$('.main-nav a').forEach(link => link.addEventListener('click', closeMenu));
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let motion = !reduced.matches;
function setMotion(enabled) {
  motion = enabled;
  document.body.classList.toggle('motion-off', !enabled);
  $('#motion-toggle').textContent = `Motion: ${enabled ? 'on' : 'off'}`;
  $('#motion-toggle').setAttribute('aria-pressed', String(!enabled));
  document.dispatchEvent(new CustomEvent('motionchange', { detail: enabled }));
}
setMotion(motion);
reduced.addEventListener('change', e => setMotion(!e.matches));
$('#motion-toggle').addEventListener('click', () => setMotion(!motion));
const explorer = $('.sector-explorer');
if (explorer) {
  const data = await fetch('/sectors.json').then(response => { if (!response.ok) throw new Error('Sector content unavailable'); return response.json(); }).catch(() => []);
  const tabs = $$('.sector-tab'), slides = $$('.sector-slide');
  let active = 0, paused = false, hovering = false, focused = false, timer;
  function schedule() { clearTimeout(timer); if (!paused && motion && !hovering && !focused && !document.hidden && data.length) timer = setTimeout(() => select((active + 1) % data.length), 6000); }
  function select(index) {
    if (!data[index]) return;
    active = index;
    const [key, , title, , description] = data[index];
    tabs.forEach((tab, i) => { tab.classList.toggle('active', i === index); tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; });
    slides.forEach((slide, i) => { slide.classList.toggle('active', i === index); slide.setAttribute('aria-hidden', String(i !== index)); });
    $('#sector-title').textContent = title;
    $('#sector-description').textContent = description;
    $('#sector-count').textContent = `0${index + 1} / 06`;
    $('#sector-link').href = `/solutions/#${key}`;
    $('#sector-info').textContent = description;
    $('#sector-info').setAttribute('aria-labelledby', `sector-tab-${key}`);
    schedule();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(index));
    tab.addEventListener('keydown', e => {
      const next = ['ArrowRight','ArrowDown'].includes(e.key) ? (index + 1) % tabs.length : ['ArrowLeft','ArrowUp'].includes(e.key) ? (index + tabs.length - 1) % tabs.length : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : null;
      if (next !== null) { e.preventDefault(); tabs[next].focus(); select(next); }
    });
  });
  $('#carousel-pause').addEventListener('click', () => { paused = !paused; $('#carousel-pause').setAttribute('aria-pressed', String(paused)); $('#carousel-pause').setAttribute('aria-label', paused ? 'Resume automatic sector switching' : 'Pause automatic sector switching'); $('#carousel-pause').textContent = paused ? 'Resume rotation >' : 'Pause rotation II'; schedule(); });
  explorer.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { hovering = true; schedule(); } });
  explorer.addEventListener('pointerleave', () => { hovering = false; schedule(); });
  explorer.addEventListener('focusin', () => { focused = true; schedule(); });
  explorer.addEventListener('focusout', () => setTimeout(() => { focused = explorer.contains(document.activeElement); schedule(); }, 0));
  document.addEventListener('visibilitychange', schedule);
  document.addEventListener('motionchange', schedule);
  select(0);
}
$$('[data-hero-robot]').forEach(container => {
  import('./hero-robot.js').then(({ initHeroRobot }) => initHeroRobot(container)).catch(() => {
    container.dataset.robotState = 'static';
    container.querySelector('.robot-status').textContent = 'Concept image / 3D unavailable';
  });
});
const field = new URLSearchParams(location.search).get('field');
if (field && $('#contact-sector')) {
  const option = [...$('#contact-sector').options].find(option => option.dataset.field === field);
  if (option) $('#contact-sector').value = option.value;
}
