import { batteryRuntime, drivetrainSpeed, droneLift, powerCurrent } from './calculators.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const number = (value, places = 1) => value.toLocaleString('en-IN', { maximumFractionDigits: places });

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

keyboardTabs('.tool-tab', renderTool, 'tool');
const mobileQuery = matchMedia('(max-width: 600px)');
function tabOrientation() { $$('[role="tablist"]').forEach(list => list.setAttribute('aria-orientation', mobileQuery.matches ? 'horizontal' : 'vertical')); }
mobileQuery.addEventListener('change', tabOrientation);
tabOrientation();

