import { batteryRuntime, drivetrainSpeed, droneLift, powerCurrent } from './calculators.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const number = (value, places = 1) => value.toLocaleString('en-IN', { maximumFractionDigits: places });

const sectors = {
  quadrupeds: { name: 'Quadruped robotics', title: 'New ground. No limits.', code: 'MOBILITY / Q-01', image: 'quadruped-hero.webp', alt: 'Original concept of a quadruped robot in a sunlit hangar', description: 'Explore legged platforms for research, remote inspection and navigating spaces that challenge conventional robots.', tags: ['Legged mobility', 'Sensor integration', 'Research platforms'] },
  drones: { name: 'Drone technology', title: 'A whole new perspective.', code: 'AERIAL / D-02', image: 'drone.webp', alt: 'Original concept of an industrial survey drone in a hangar', description: 'Bring your aerial ideas into focus. Discuss drone platforms, payloads and sensing for mapping, inspection and research.', tags: ['Aerial platforms', 'Mapping & sensing', 'Payload sourcing'] },
  healthcare: { name: 'Hospital & healthcare', title: 'More time for human care.', code: 'ASSISTIVE / H-03', image: 'robotic-arm.webp', alt: 'Robotic manipulator concept illustrating precision automation', description: 'Explore robotics for hospital logistics, laboratory workflows and assistive research. Every application starts with its specific safety and validation requirements.', tags: ['Hospital logistics', 'Lab automation', 'Assistive research'] },
  defence: { name: 'Defence & inspection', title: 'Distance from the difficult.', code: 'FIELD / F-04', image: 'quadruped-hero.webp', alt: 'Quadruped platform concept for remote inspection', description: 'Discuss remote inspection, uncrewed mobility and rugged sensing platforms for challenging environments and safety-focused applications.', tags: ['Remote inspection', 'Rugged mobility', 'Sensing platforms'] },
  industrial: { name: 'Industrial automation', title: 'Precision. On repeat.', code: 'AUTOMATION / I-05', image: 'robotic-arm.webp', alt: 'Industrial robotic arm concept holding a precision component', description: 'Find the building blocks for smarter workflows, from actuators and robotic manipulators to perception hardware and automation integration.', tags: ['Manipulators', 'Machine vision', 'Actuators & control'] },
  custom: { name: 'Custom robotics', title: "Your idea doesn't need a box.", code: 'EXPLORATION / X-06', image: 'robotic-arm.webp', alt: 'Robotic arm concept representing custom robotics development', description: "Have something that doesn't fit a category? Bring your requirements and explore hardware, embedded systems and a practical development path with us.", tags: ['Custom platforms', 'Embedded systems', 'Hardware sourcing'] }
};

let currentSector = 'quadrupeds';
function selectSector(key) {
  const sector = sectors[key];
  if (!sector) return;
  currentSector = key;
  $$('.sector-tab').forEach(tab => {
    const active = tab.dataset.sector === key;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  });
  $('#sector-panel').setAttribute('aria-labelledby', `tab-${key}`);
  $('#sector-image').src = `assets/${sector.image}`;
  $('#sector-image').alt = sector.alt;
  $('#sector-code').textContent = sector.code;
  $('#sector-title').textContent = sector.title;
  $('#sector-description').textContent = sector.description;
  $('#sector-enquire').setAttribute('aria-label', `Discuss ${sector.name.toLowerCase()}`);
  $('#sector-tags').replaceChildren(...sector.tags.map(tag => {
    const element = document.createElement('span');
    element.textContent = tag;
    return element;
  }));
}
$$('.sector-tab').forEach(tab => tab.addEventListener('click', () => selectSector(tab.dataset.sector)));
$$('[data-sector-link]').forEach(link => link.addEventListener('click', () => selectSector(link.dataset.sectorLink)));
$('#sector-enquire').addEventListener('click', () => { $('#contact-sector').value = sectors[currentSector].name; });

const toolDefinitions = {
  battery: {
    title: 'How far can your battery go?', code: 'ENERGY / 01',
    fields: [
      { key: 'voltage', name: 'Battery voltage', unit: 'V', value: 24, min: 1, max: 72, step: .1 },
      { key: 'capacity', name: 'Battery capacity', unit: 'Ah', value: 10, min: .1, max: 100, step: .1 },
      { key: 'load', name: 'Average power draw', unit: 'W', value: 120, min: 1, max: 2000, step: 1 },
      { key: 'usable', name: 'Usable capacity', unit: '%', value: 80, min: 1, max: 100, step: 1 }
    ], calculate: batteryRuntime,
    result: r => ({ label: 'ESTIMATED RUNTIME', value: number(r.hours, 2), unit: 'hours', detail: `${number(r.minutes)} minutes of possibility.`, secondary: `${number(r.energy)} Wh usable energy` }),
    formula: 'Runtime = (voltage x capacity x usable fraction) / average power draw'
  },
  drive: {
    title: 'Put your drivetrain in motion.', code: 'MOTION / 02',
    fields: [
      { key: 'rpm', name: 'Motor speed', unit: 'RPM', value: 3000, min: 1, max: 10000, step: 1 },
      { key: 'reduction', name: 'Gear reduction', unit: ':1', value: 30, min: 1, max: 100, step: 1 },
      { key: 'diameter', name: 'Wheel diameter', unit: 'mm', value: 150, min: 1, max: 500, step: 1 },
      { key: 'loss', name: 'Estimated speed loss', unit: '%', value: 10, min: 0, max: 99, step: 1 }
    ], calculate: drivetrainSpeed,
    result: r => ({ label: 'ESTIMATED GROUND SPEED', value: number(r.speed, 2), unit: 'm/s', detail: `${number(r.kmh, 2)} km/h at the wheels.`, secondary: `${number(r.wheelRpm)} wheel RPM` }),
    formula: 'Speed = pi x diameter (m) x (motor RPM / reduction) / 60 x (1 - loss)'
  },
  drone: {
    title: 'Give your build a lift check.', code: 'AERIAL / 03',
    fields: [
      { key: 'rotors', name: 'Number of rotors', unit: '#', value: 4, min: 2, max: 16, step: 1 },
      { key: 'thrust', name: 'Peak thrust per rotor', unit: 'gf', value: 1200, min: 1, max: 10000, step: 1 },
      { key: 'mass', name: 'Total take-off mass', unit: 'kg', value: 2, min: .1, max: 25, step: .1 },
      { key: 'usable', name: 'Available thrust', unit: '%', value: 80, min: 1, max: 100, step: 1 }
    ], calculate: droneLift,
    result: r => ({ label: 'THRUST-TO-WEIGHT RATIO', value: number(r.ratio, 2), unit: ': 1', detail: r.ratio <= 1 ? 'Below the static hover threshold.' : r.ratio < 2 ? 'Limited thrust headroom.' : '2:1 planning ratio met.', secondary: `${number(r.planningMass, 2)} kg at a 2:1 ratio` }),
    formula: 'Ratio = (rotors x peak thrust x available fraction) / take-off weight. Static estimate; not a flight clearance.'
  },
  power: {
    title: 'Know what your system draws.', code: 'ELECTRICAL / 04',
    fields: [
      { key: 'voltage', name: 'Supply voltage', unit: 'V', value: 24, min: 1, max: 72, step: .1 },
      { key: 'power', name: 'Output power', unit: 'W', value: 120, min: 1, max: 2000, step: 1 },
      { key: 'efficiency', name: 'Conversion efficiency', unit: '%', value: 90, min: 1, max: 100, step: 1 },
      { key: 'duty', name: 'Active duty cycle', unit: '%', value: 80, min: 1, max: 100, step: 1 }
    ], calculate: powerCurrent,
    result: r => ({ label: 'ACTIVE SUPPLY CURRENT', value: number(r.current, 2), unit: 'A', detail: `${number(r.average, 2)} A time-average current.`, secondary: `${number(r.inputPower)} W input power` }),
    formula: 'Active current = output power / (efficiency x voltage). Average assumes zero standby draw; excludes start-up peaks.'
  }
};

let activeTool = 'battery';
const savedToolValues = {};
function renderTool(key) {
  const definition = toolDefinitions[key];
  if (!definition) return;
  activeTool = key;
  $$('.tool-tab').forEach(tab => {
    const active = tab.dataset.tool === key;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  });
  const panel = $('#tool-panel');
  panel.setAttribute('aria-labelledby', `tool-tab-${key}`);
  panel.innerHTML = `<div class="tool-heading"><h3>${definition.title}</h3><span class="mono">${definition.code}</span></div>
    <div class="tool-fields">${definition.fields.map(field => `<div><label for="input-${field.key}">${field.name}</label><div class="tool-input-wrap"><input id="input-${field.key}" data-field="${field.key}" type="number" inputmode="decimal" min="${field.min}" max="${field.max}" step="${field.step}" value="${savedToolValues[key]?.[field.key] ?? field.value}" aria-describedby="unit-${field.key}"><span id="unit-${field.key}">${field.unit}</span></div><input type="range" data-slider="${field.key}" aria-label="${field.name} slider" min="${field.min}" max="${field.max}" step="${field.step}" value="${savedToolValues[key]?.[field.key] ?? field.value}"></div>`).join('')}</div>
    <div class="tool-result" id="tool-result" aria-live="polite" aria-atomic="true"></div><p class="tool-error" id="tool-error" role="status" hidden></p><p class="formula">${definition.formula}</p>`;
  $$('input', panel).forEach(input => input.addEventListener('input', () => {
    const key = input.dataset.field || input.dataset.slider;
    const counterpart = input.dataset.field ? $(`[data-slider="${key}"]`, panel) : $(`[data-field="${key}"]`, panel);
    counterpart.value = input.value;
    updateResult();
  }));
  updateResult();
}

function updateResult() {
  const inputs = $$('[data-field]', $('#tool-panel'));
  const values = Object.fromEntries(inputs.map(input => [input.dataset.field, input.value === '' ? NaN : Number(input.value)]));
  try {
    const invalid = inputs.find(input => !input.validity.valid || input.value === '');
    if (invalid) throw new RangeError(`Check ${$(`label[for="${invalid.id}"]`).textContent.toLowerCase()}: use ${invalid.min} to ${invalid.max}.`);
    const definition = toolDefinitions[activeTool];
    const result = definition.result(definition.calculate(values));
    savedToolValues[activeTool] = values;
    $('#tool-result').innerHTML = `<div class="result-main"><span class="mono">${result.label}</span><output class="result-number">${result.value}<small>${result.unit}</small></output></div><div class="result-side"><strong>${result.detail}</strong><span class="mono">${result.secondary}</span></div>`;
    $('#tool-error').hidden = true;
    inputs.forEach(input => input.removeAttribute('aria-invalid'));
  } catch (error) {
    $('#tool-result').innerHTML = '<span class="mono">ADJUST YOUR INPUTS TO SEE THE ESTIMATE.</span>';
    $('#tool-error').textContent = error.message;
    $('#tool-error').hidden = false;
    inputs.forEach(input => input.setAttribute('aria-invalid', String(!input.validity.valid || input.value === '')));
  }
}
$$('.tool-tab').forEach(tab => tab.addEventListener('click', () => renderTool(tab.dataset.tool)));
renderTool('battery');

function keyboardTabs(selector, onSelect, dataKey) {
  const tabs = $$(selector);
  tabs.forEach((tab, index) => tab.addEventListener('keydown', event => {
    let next;
    if (['ArrowDown', 'ArrowRight'].includes(event.key)) next = (index + 1) % tabs.length;
    if (['ArrowUp', 'ArrowLeft'].includes(event.key)) next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    tabs[next].focus();
    onSelect(tabs[next].dataset[dataKey]);
  }));
}
keyboardTabs('.sector-tab', selectSector, 'sector');
keyboardTabs('.tool-tab', renderTool, 'tool');
const mobileQuery = matchMedia('(max-width: 600px)');
function tabOrientation() { $$('[role="tablist"]').forEach(list => list.setAttribute('aria-orientation', mobileQuery.matches ? 'horizontal' : 'vertical')); }
mobileQuery.addEventListener('change', tabOrientation);
tabOrientation();

const menu = $('.menu-toggle');
function closeMenu() { menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Open navigation'); $('.main-nav').classList.remove('open'); }
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  $('.main-nav').classList.toggle('open', open);
});
$$('.main-nav a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let motion = !reducedMotion.matches;
let gazeFrame = 0;
const gaze = { x: 0, y: 0 };
const targetGaze = { x: 0, y: 0 };
const pupils = $$('.pupil');
const dogHead = $('.dog-head');
const dogStatus = $('#dog-status');
let greetTimer;
function drawGaze() {
  pupils.forEach(pupil => pupil.style.transform = `translate(${gaze.x.toFixed(2)}px,${gaze.y.toFixed(2)}px)`);
  dogHead.style.transform = `translate(${(gaze.x * .25).toFixed(2)}px,${(gaze.y * .2).toFixed(2)}px) rotate(${(gaze.x * .9).toFixed(2)}deg)`;
}
function animateGaze() {
  gazeFrame = 0;
  if (!motion) return;
  gaze.x += (targetGaze.x - gaze.x) * .2;
  gaze.y += (targetGaze.y - gaze.y) * .2;
  drawGaze();
  if (Math.abs(targetGaze.x - gaze.x) + Math.abs(targetGaze.y - gaze.y) > .02) gazeFrame = requestAnimationFrame(animateGaze);
}
function moveGaze(x, y) {
  targetGaze.x = x;
  targetGaze.y = y;
  if (motion && !gazeFrame) gazeFrame = requestAnimationFrame(animateGaze);
}
function setMotion(enabled) {
  motion = enabled;
  document.body.classList.toggle('motion-off', !enabled);
  $('#motion-toggle').textContent = `MOTION: ${enabled ? 'ON' : 'OFF'}`;
  $('#motion-toggle').setAttribute('aria-pressed', String(!enabled));
  dogStatus.textContent = enabled ? 'ONLINE' : 'RESTING';
  if (!enabled) {
    cancelAnimationFrame(gazeFrame);
    gazeFrame = 0;
    gaze.x = gaze.y = targetGaze.x = targetGaze.y = 0;
    drawGaze();
  }
}
setMotion(motion);
reducedMotion.addEventListener('change', event => setMotion(!event.matches));
$('#motion-toggle').addEventListener('click', () => setMotion(!motion));
function followPointer(event) {
  if (!motion) return;
  const box = $('.dog').getBoundingClientRect();
  const originX = box.left + box.width * .49;
  const originY = box.top + box.height * .43;
  const dx = event.clientX - originX;
  const dy = event.clientY - originY;
  // Scale by the space on each side, keeping gaze responsive across the entire page.
  const spanX = dx < 0 ? originX : innerWidth - originX;
  const spanY = dy < 0 ? originY : innerHeight - originY;
  const x = Math.max(-1, Math.min(1, dx / Math.max(1, spanX))) * 7;
  const y = Math.max(-1, Math.min(1, dy / Math.max(1, spanY))) * 5;
  moveGaze(x, y);
  if (!$('.companion').classList.contains('greeting')) dogStatus.textContent = 'TRACKING';
}
document.addEventListener('pointermove', followPointer, { passive: true });
document.addEventListener('pointerdown', followPointer, { passive: true });
document.documentElement.addEventListener('pointerleave', () => {
  moveGaze(0, 0);
  if (!$('.companion').classList.contains('greeting')) dogStatus.textContent = motion ? 'ONLINE' : 'RESTING';
});
$('#dog-button').addEventListener('click', () => {
  clearTimeout(greetTimer);
  $('.companion').classList.remove('greeting');
  requestAnimationFrame(() => $('.companion').classList.add('greeting'));
  $('#dog-status').textContent = 'HELLO!';
  $('#dog-hint').textContent = 'Big ideas? You came to the right place.';
  greetTimer = setTimeout(() => {
    $('.companion').classList.remove('greeting');
    $('#dog-status').textContent = motion ? 'ONLINE' : 'RESTING';
    $('#dog-hint').textContent = "Move your cursor. I'll follow.";
  }, 2800);
});

let briefText = '';
const dialog = $('#brief-dialog');
$('#brief-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const name = data.get('name').trim();
  const email = data.get('email').trim();
  const message = data.get('message').trim();
  if (!name || message.length < 10) {
    const input = !name ? $('#contact-name') : $('#contact-message');
    input.setCustomValidity(!name ? 'Please enter your name.' : 'Please describe your idea in at least 10 characters.');
    input.reportValidity();
    input.addEventListener('input', () => input.setCustomValidity(''), { once: true });
    return;
  }
  briefText = `ROBOKING PROJECT BRIEF\n\nName: ${name}\nEmail: ${email}\nField: ${data.get('sector')}\n\nTHE IDEA\n${message}\n\nPrepared with the Roboking project workbench.`;
  $('#brief-preview').textContent = briefText;
  $('#brief-mailto').href = `mailto:sales@roboking.in?subject=${encodeURIComponent(`Project enquiry: ${data.get('sector')}`)}&body=${encodeURIComponent(briefText)}`;
  $('#copy-status').textContent = '';
  dialog.showModal();
});
$('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
$('#brief-copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(briefText); $('#copy-status').textContent = 'Brief copied. Ready when you are.'; }
  catch { $('#copy-status').textContent = 'Clipboard unavailable. Use Download .txt to keep your brief.'; }
});
$('#brief-download').addEventListener('click', () => {
  const blob = new Blob([briefText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = 'roboking-project-brief.txt';
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
