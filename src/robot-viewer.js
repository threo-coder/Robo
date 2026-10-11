import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export async function initRobot(container) {
  const stage = container.querySelector('#robot-stage');
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(stage.clientWidth, stage.clientHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .85;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, stage.clientWidth / stage.clientHeight, .01, 20);
  const home = new THREE.Vector3(.92, .46, 1.02);
  camera.position.copy(home);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, .27, 0);
  controls.enableDamping = true;
  controls.dampingFactor = .09;
  controls.minDistance = .55;
  controls.maxDistance = 2.8;
  controls.minPolarAngle = .08;
  controls.maxPolarAngle = Math.PI - .08;
  controls.enablePan = false;
  controls.autoRotateSpeed = 1.4;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, .04).texture;
  scene.environmentIntensity = .65;
  room.dispose(); pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xe4edff, 0x5f4227, .65));
  const key = new THREE.DirectionalLight(0xffefd5, 2);
  key.position.set(2, 3, 2); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -1; key.shadow.camera.right = 1;
  key.shadow.camera.top = 1; key.shadow.camera.bottom = -1;
  key.shadow.normalBias = .005;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xf0b05d, 1.8); rim.position.set(-1, 1, -1); scene.add(rim);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(.62, 64), new THREE.ShadowMaterial({ opacity: .25 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -.003; ground.receiveShadow = true; scene.add(ground);
  let model;
  try { model = (await new GLTFLoader().loadAsync('/assets/model/go2/go2-seated.gltf')).scene; }
  catch (error) { controls.dispose(); renderer.dispose(); renderer.domElement.remove(); throw error; }
  const materials = new Set();
  model.traverse(object => {
    if (!object.isMesh) return;
    object.castShadow = true;
    for (const material of [].concat(object.material)) {
      if (materials.has(material)) continue;
      materials.add(material);
      const lightness = (material.color.r + material.color.g + material.color.b) / 3;
      if (lightness > .85) { material.color.set('#c6c1ae'); material.metalness = .32; material.roughness = .3; }
      else { material.color.set('#303832'); material.metalness = .5; material.roughness = .35; }
    }
  });
  const bounds = new THREE.Box3().setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());
  model.position.x -= center.x; model.position.z -= center.z;
  scene.add(model);
  // A restrained optical gimbal tracks the pointer, not cartoon pupils.
  const sensor = new THREE.Group();
  const base = model.getObjectByName('base');
  if (base) {
    const shell = new THREE.MeshStandardMaterial({ color: '#c9c3b0', metalness: .4, roughness: .28 });
    const carbon = new THREE.MeshStandardMaterial({ color: '#17211b', metalness: .55, roughness: .3 });
    const gold = new THREE.MeshStandardMaterial({ color: '#bd9558', metalness: .8, roughness: .3 });
    materials.add(shell); materials.add(carbon); materials.add(gold);
    const armor = new THREE.Mesh(new RoundedBoxGeometry(.31,.16,.075,3,.017), shell);
    armor.position.set(-.035,0,.078); armor.castShadow = true; base.add(armor);
    for (const y of [-.084,.084]) {
      for (let i=0;i<6;i++) {
        const vent = new THREE.Mesh(new THREE.BoxGeometry(.007,.005,.04), carbon);
        vent.position.set(-.11 + i * .024,y,.076); base.add(vent);
      }
    }
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(.039,.045,.075,24), carbon);
    neck.rotation.x = Math.PI/2; neck.position.set(.19,0,.08); base.add(neck);
    const head = new THREE.Group(); head.position.set(.255,0,.105); head.rotation.y = .681593208;
    const headShell = new THREE.Mesh(new RoundedBoxGeometry(.20,.185,.095,4,.024),shell);
    headShell.castShadow = true; head.add(headShell);
    for (const y of [-.095,.095]) {
      const temple = new THREE.Mesh(new THREE.CylinderGeometry(.034,.034,.01,24),carbon);
      temple.position.set(-.015,y,0); head.add(temple);
      for (const x of [-.065,.045]) {
        const bolt = new THREE.Mesh(new THREE.CylinderGeometry(.004,.004,.012,6),gold);
        bolt.position.set(x,y,.03); head.add(bolt);
      }
    }
    const strip = new THREE.Mesh(new THREE.BoxGeometry(.004,.10,.003), new THREE.MeshStandardMaterial({color:'#e6b465',emissive:'#e6b465',emissiveIntensity:1}));
    strip.position.set(.102,0,-.04); head.add(strip);
    sensor.position.set(.108, 0, 0);
    const housing = new THREE.Mesh(new RoundedBoxGeometry(.025,.15,.07,3,.01), new THREE.MeshStandardMaterial({ color: '#111814', metalness: .7, roughness: .25 }));
    sensor.add(housing);
    for (const y of [-.033, .033]) {
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(.013, .013, .006, 24), new THREE.MeshStandardMaterial({ color: '#233c42', metalness: .8, roughness: .1, emissive: '#79938a', emissiveIntensity: .17 }));
      lens.rotation.z = Math.PI / 2; lens.position.set(.014, y, 0); sensor.add(lens);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.014, .001, 8, 32), new THREE.MeshStandardMaterial({ color: '#879388', metalness: .8, roughness: .27 }));
      ring.rotation.y = Math.PI / 2; ring.position.set(.018, y, 0); sensor.add(ring);
    }
    head.add(sensor); base.add(head);
  }
  container.classList.add('ready');
  const targetGaze = new THREE.Vector2();
  let motion = !document.body.classList.contains('motion-off');
  document.addEventListener('pointermove', e => {
    if (!motion || container.contains(e.target)) return;
    const rect = stage.getBoundingClientRect();
    targetGaze.set(THREE.MathUtils.clamp((e.clientX - rect.left - rect.width / 2) / innerWidth, -1, 1) * .25, THREE.MathUtils.clamp((e.clientY - rect.top - rect.height / 2) / innerHeight, -1, 1) * .18);
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => targetGaze.set(0, 0));
  document.addEventListener('motionchange', e => { motion = e.detail; if (!motion) { controls.autoRotate = false; container.querySelector('[data-view="rotate"]').setAttribute('aria-pressed','false'); targetGaze.set(0,0); } });
  function zoom(factor) {
    const offset = camera.position.clone().sub(controls.target);
    offset.setLength(THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance));
    camera.position.copy(controls.target).add(offset); controls.update();
  }
  function orbit(theta, phi) {
    const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    spherical.theta += theta; spherical.phi = THREE.MathUtils.clamp(spherical.phi + phi, .08, Math.PI - .08);
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical)); controls.update();
  }
  const move = container.querySelector('.viewer-move');
  let drag;
  function place(x, y) {
    container.style.left = `${THREE.MathUtils.clamp(x, 0, Math.max(0, innerWidth - container.offsetWidth))}px`;
    container.style.top = `${THREE.MathUtils.clamp(y, 0, Math.max(0, innerHeight - container.offsetHeight))}px`;
    container.style.right = 'auto';
  }
  move.addEventListener('pointerdown', e => { if (e.button !== 0) return; const rect = container.getBoundingClientRect(); drag = { x: e.clientX - rect.left, y: e.clientY - rect.top }; move.setPointerCapture(e.pointerId); });
  move.addEventListener('pointermove', e => { if (drag) place(e.clientX - drag.x, e.clientY - drag.y); });
  move.addEventListener('pointerup', () => { drag = null; });
  move.addEventListener('pointercancel', () => { drag = null; });
  move.addEventListener('lostpointercapture', () => { drag = null; });
  move.addEventListener('keydown', e => {
    const directions = { ArrowLeft: [-20,0], ArrowRight: [20,0], ArrowUp: [0,-20], ArrowDown: [0,20] };
    if (!directions[e.key]) return;
    e.preventDefault(); const rect = container.getBoundingClientRect(); const [x,y] = directions[e.key]; place(rect.left + x, rect.top + y);
  });
  container.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
    const action = button.dataset.view;
    if (action === 'zoom-in') zoom(.8);
    if (action === 'zoom-out') zoom(1.25);
    if (action === 'rotate') { controls.autoRotate = !controls.autoRotate; button.setAttribute('aria-pressed', String(controls.autoRotate)); }
    if (action === 'wire') { const wire = button.getAttribute('aria-pressed') !== 'true'; materials.forEach(material => material.wireframe = wire); button.setAttribute('aria-pressed', String(wire)); }
    if (action === 'expand') { const expanded = container.classList.toggle('expanded'); button.setAttribute('aria-pressed', String(expanded)); button.textContent = expanded ? 'Small' : 'Expand'; const rect = container.getBoundingClientRect(); place(rect.left,rect.top); }
    if (action === 'reset') {
      container.classList.remove('expanded');
      container.querySelector('[data-view="expand"]').textContent = 'Expand';
      controls.autoRotate = false; controls.reset(); controls.target.set(0,.27,0); camera.position.copy(home); controls.update();
      materials.forEach(material => material.wireframe = false);
      container.querySelectorAll('[aria-pressed]').forEach(button => button.setAttribute('aria-pressed','false'));
      place(innerWidth - container.offsetWidth - 22, innerWidth < 760 ? 120 : 150);
    }
  }));
  stage.addEventListener('keydown', e => {
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(e.key)) e.preventDefault();
    if (e.key === 'ArrowLeft') orbit(.2,0);
    if (e.key === 'ArrowRight') orbit(-.2,0);
    if (e.key === 'ArrowUp') orbit(0,-.15);
    if (e.key === 'ArrowDown') orbit(0,.15);
    if (['+','='].includes(e.key)) zoom(.8);
    if (e.key === '-') zoom(1.25);
  });
  new ResizeObserver(() => {
    if (!stage.clientWidth || !stage.clientHeight) return;
    camera.aspect = stage.clientWidth / stage.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(stage.clientWidth, stage.clientHeight);
  }).observe(stage);
  window.addEventListener('resize', () => { const rect = container.getBoundingClientRect(); if (!container.classList.contains('minimized')) place(rect.left,rect.top); });
  document.addEventListener('robotopen', () => { const rect = container.getBoundingClientRect(); place(rect.left,rect.top); });
  let last = 0;
  renderer.setAnimationLoop(time => {
    if (document.hidden || container.classList.contains('minimized') || time - last < 32) return;
    const delta = Math.min((time - last) / 1000, .1); last = time;
    sensor.rotation.z += (targetGaze.x - sensor.rotation.z) * .12;
    sensor.rotation.y += (targetGaze.y - sensor.rotation.y) * .12;
    controls.update(delta); renderer.render(scene, camera);
    stage.dataset.azimuth = controls.getAzimuthalAngle().toFixed(3);
    stage.dataset.gaze = `${sensor.rotation.z.toFixed(3)},${sensor.rotation.y.toFixed(3)}`;
    stage.dataset.distance = camera.position.distanceTo(controls.target).toFixed(3);
  });
  renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); container.classList.remove('ready'); container.querySelector('#robot-loading').textContent = '3D paused. Reload to restore the model.'; });
}
