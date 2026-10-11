import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { POSES, POSE_NAMES, mixPose, solveStance, cursorGaze } from './robot-motion.js';

export async function initHeroRobot(container) {
  const stage = container.querySelector('.robot-scene');
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, .01, 12);
  camera.position.set(1.15, .72, -1.7);
  const cameraTarget = new THREE.Vector3(0, .31, 0);
  camera.lookAt(cameraTarget);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .04);
  scene.environment = environment.texture;
  scene.environmentIntensity = .65;
  room.dispose(); pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xf5f4ee, 0x594532, 1.1));
  const key = new THREE.DirectionalLight(0xffe1ad, 3.6);
  key.position.set(.15, 4, -.15);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -.9; key.shadow.camera.right = .9;
  key.shadow.camera.top = .9; key.shadow.camera.bottom = -.9;
  key.shadow.normalBias = .003;
  key.shadow.radius = 5;
  key.shadow.blurSamples = 8;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xcadbe8, 1.2);
  fill.position.set(2, 1, 2); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffca79, 3.1);
  rim.position.set(-1.5, 1.3, 1); scene.add(rim);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShadowMaterial({ opacity: .23 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -.006;
  floor.receiveShadow = true; scene.add(floor);
  let model;
  try { model = (await new GLTFLoader().loadAsync('/assets/model/go2/go2-seated.gltf')).scene; }
  catch (error) { environment.dispose(); renderer.dispose(); throw error; }
  scene.add(model);
  const ivory = new THREE.MeshStandardMaterial({ color: '#b8b4a6', metalness: .58, roughness: .33 });
  const carbon = new THREE.MeshStandardMaterial({ color: '#171b1c', metalness: .55, roughness: .32 });
  const metal = new THREE.MeshStandardMaterial({ color: '#778080', metalness: .85, roughness: .24 });
  const gold = new THREE.MeshStandardMaterial({ color: '#be9454', metalness: .82, roughness: .3 });
  const glass = new THREE.MeshPhysicalMaterial({ color: '#08191c', metalness: .8, roughness: .13, clearcoat: 1 });
  const light = new THREE.MeshStandardMaterial({ color: '#efc786', emissive: '#d6a359', emissiveIntensity: 1.5 });
  model.traverse(object => {
    if (!object.isMesh) return;
    object.castShadow = true; object.receiveShadow = true;
    const finish = material => {
      const brightness = (material.color.r + material.color.g + material.color.b) / 3;
      return brightness > .86 ? ivory : carbon;
    };
    object.material = Array.isArray(object.material) ? object.material.map(finish) : finish(object.material);
    // Keep upstream identity in credits, not painted into the concept's bodywork.
    if (object.name.includes('base_visual') && object.geometry.groups.length === 0 && object.material === ivory) object.material = carbon;
  });
  function mesh(parent, geometry, material, x = 0, y = 0, z = 0) {
    const result = new THREE.Mesh(geometry, material);
    result.position.set(x, y, z); result.castShadow = true; result.receiveShadow = true;
    parent.add(result); return result;
  }
  const box = (x, y, z, radius = .008) => new RoundedBoxGeometry(x, y, z, 3, radius);
  const base = model.getObjectByName('base');
  const body = model.getObjectByName('seated_body_pose');
  const armor = mesh(base, box(.36, .17, .074, .022), ivory, -.015, 0, .086);
  for (const side of [-1, 1]) {
    mesh(base, box(.27, .009, .078, .012), ivory, -.005, side * .10, .014);
    mesh(base, box(.13, .003, .012, .003), carbon, -.022, side * .106, .022);
    for (let i = 0; i < 8; i++) mesh(base, box(.006, .006, .044, .001), carbon, -.14 + i * .026, side * .088, .09);
    const rail = mesh(base, new THREE.CylinderGeometry(.008, .008, .30, 12), metal, -.02, side * .077, .134);
    rail.rotation.z = Math.PI / 2;
    for (const x of [-.16, .14]) {
      const bolt = mesh(base, new THREE.CylinderGeometry(.004, .004, .006, 6), gold, x, side * .063, .127);
      bolt.rotation.x = Math.PI / 2;
    }
  }
  // Detail is attached to the existing mechanical joints, never to the background.
  for (const leg of ['FL', 'FR', 'RL', 'RR']) {
    const thigh = model.getObjectByName(leg + '_thigh');
    const side = leg.endsWith('L') ? 1 : -1;
    mesh(thigh, box(.061, .015, .14, .012), ivory, .008, side * .033, -.093);
    const hub = mesh(thigh, new THREE.CylinderGeometry(.046, .046, .019, 40), carbon, 0, side * .047, 0);
    const ring = mesh(thigh, new THREE.TorusGeometry(.038, .0025, 8, 48), gold, 0, side * .058, 0);
    ring.rotation.x = Math.PI / 2;
    mesh(thigh, new THREE.CylinderGeometry(.028, .028, .021, 32), metal, 0, side * .048, 0);
    const calf = model.getObjectByName(leg + '_calf');
    mesh(calf, box(.028, .029, .15, .008), ivory, .002, 0, -.089);
  }
  const neck = new THREE.Group(); scene.add(neck);
  const lower = mesh(neck, new THREE.CylinderGeometry(.023, .028, 1, 28), carbon);
  const upper = mesh(neck, new THREE.CylinderGeometry(.016, .019, 1, 24), metal);
  const neckJoint = mesh(neck, new THREE.SphereGeometry(.031, 24, 16), carbon);
  const neckRing = mesh(neck, new THREE.TorusGeometry(.029, .002, 8, 36), gold);
  const headSocket = mesh(neck, new THREE.SphereGeometry(.024, 24, 16), carbon);
  const head = new THREE.Group(); head.name = 'viewer_tracking_head'; scene.add(head);
  mesh(head, box(.225, .095, .16, .012), ivory);
  mesh(head, box(.209, .073, .029, .008), carbon, 0, -.005, .083);
  mesh(head, box(.194, .060, .006, .006), glass, 0, -.005, .100);
  for (const [x, radius] of [[-.047, .024], [.055, .009]]) {
    const housing = mesh(head, new THREE.CylinderGeometry(radius, radius, .012, 40), metal, x, -.004, .105);
    housing.rotation.x = Math.PI / 2;
    const lens = mesh(head, new THREE.CylinderGeometry(radius * .8, radius * .8, .014, 40), glass, x, -.004, .111);
    lens.rotation.x = Math.PI / 2;
    mesh(head, new THREE.TorusGeometry(radius * .9, .001, 8, 40), metal, x, -.004, .117);
  }
  for (let i = 0; i < 4; i++) mesh(head, box(.003, .008, .002, .0005), metal, .017 + i * .007, -.018, .105);
  mesh(head, box(.132, .003, .009, .001), light, 0, -.047, .066);
  for (const side of [-1, 1]) {
    const temple = mesh(head, new THREE.CylinderGeometry(.030, .030, .01, 32), carbon, side * .114, 0, -.023);
    temple.rotation.z = Math.PI / 2;
    for (const z of [-.043, .034]) {
      const fastener = mesh(head, new THREE.CylinderGeometry(.004, .004, .013, 6), gold, side * .113, .029, z);
      fastener.rotation.z = Math.PI / 2;
    }
    for (let i = 0; i < 5; i++) mesh(head, box(.004, .015, .004, .001), carbon, side * .113, -.009, -.053 + i * .013);
  }
  const legNodes = Object.fromEntries(['FL','FR','RL','RR'].map(name => [name, {
    thigh: model.getObjectByName(name + '_thigh_joint'), calf: model.getObjectByName(name + '_calf_joint'),
    foot: model.getObjectByName(name + '_foot'),
  }]));
  const contactMap = document.createElement('canvas'); contactMap.width = contactMap.height = 64;
  const paint = contactMap.getContext('2d');
  const gradient = paint.createRadialGradient(32, 32, 2, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(0,0,0,.65)'); gradient.addColorStop(.45, 'rgba(0,0,0,.24)'); gradient.addColorStop(1, 'rgba(0,0,0,0)');
  paint.fillStyle = gradient; paint.fillRect(0, 0, 64, 64);
  const contactTexture = new THREE.CanvasTexture(contactMap);
  for (const joint of Object.values(legNodes)) {
    joint.contact = new THREE.Mesh(new THREE.PlaneGeometry(.105, .09), new THREE.MeshBasicMaterial({ map: contactTexture, transparent: true, depthWrite: false, toneMapped: false }));
    joint.contact.rotation.x = -Math.PI / 2; scene.add(joint.contact);
  }
  const poseButtons = [...container.querySelectorAll('[data-robot-pose]')];
  const autoButton = container.querySelector('[data-robot-auto]');
  const status = container.querySelector('.robot-status');
  const pointer = new THREE.Vector2(), gaze = new THREE.Vector2();
  let hasPointer = false;
  const anchor = new THREE.Vector3(), elbow = new THREE.Vector3(), headPosition = new THREE.Vector3();
  const direction = new THREE.Vector3(), worldUp = new THREE.Vector3(0, 1, 0);
  const forward = new THREE.Vector3(), bend = new THREE.Vector3(), screenHead = new THREE.Vector3();
  const cameraUp = new THREE.Vector3(), aim = new THREE.Object3D();
  const turn = new THREE.Quaternion(), angles = new THREE.Euler(0, 0, 0, 'YXZ');
  const headOffset = new THREE.Vector3(0, .055, 0);
  let stageRect;
  let pose = { ...POSES.seated }, from = { ...pose }, next = 'seated', progress = 1;
  let idle = 0, frame = 0, lastTime = 0, visible = true, lost = false;
  let motion = !document.body.classList.contains('motion-off'), autoplay = true;
  const footBox = new THREE.Box3();
  function choosePose(name) {
    if (!POSES[name]) return;
    from = { ...pose }; next = name; progress = 0; idle = 0;
    container.dataset.robotPhase = 'transition';
    poseButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.robotPose === name)));
  }
  function applyPose(delta = 0) {
    const stance = solveStance(pose);
    body.rotation.set(0, stance.pitch, 0); body.position.z = stance.height;
    for (const [name, joint] of Object.entries(legNodes)) {
      const prefix = name.startsWith('F') ? 'front' : 'rear';
      joint.thigh.rotation.set(0, pose[prefix + 'Thigh'], 0);
      joint.calf.rotation.set(0, pose[prefix + 'Calf'], 0);
    }
    model.updateMatrixWorld(true);
    let lowest = Infinity;
    for (const joint of Object.values(legNodes)) lowest = Math.min(lowest, footBox.setFromObject(joint.foot).min.y);
    body.position.z -= lowest;
    model.updateMatrixWorld(true);
    for (const joint of Object.values(legNodes)) {
      footBox.setFromObject(joint.foot);
      joint.contact.position.set((footBox.min.x + footBox.max.x) / 2, .0005, (footBox.min.z + footBox.max.z) / 2);
    }
    anchor.set(.145, 0, .136); base.localToWorld(anchor);
    forward.set(1, 0, 0).transformDirection(base.matrixWorld);
    forward.y = 0; forward.normalize();
    headPosition.copy(anchor).addScaledVector(worldUp, .068).addScaledVector(forward, .012);
    // Fixed-length neck links meet an underside gimbal; cursor input never slides the mount.
    direction.subVectors(headPosition, anchor);
    const reach = direction.length(); direction.normalize();
    bend.copy(forward).addScaledVector(direction, -forward.dot(direction)).normalize();
    elbow.copy(anchor).add(headPosition).multiplyScalar(.5).addScaledVector(bend, Math.sqrt(.043 ** 2 - (reach / 2) ** 2));
    for (const [link, a, b] of [[lower, anchor, elbow], [upper, elbow, headPosition]]) {
      direction.subVectors(b, a);
      link.position.copy(a).add(b).multiplyScalar(.5);
      link.scale.y = direction.length();
      link.quaternion.setFromUnitVectors(worldUp, direction.normalize());
    }
    neckJoint.position.copy(elbow); neckRing.position.copy(elbow);
    headSocket.position.copy(headPosition);
    cameraUp.setFromMatrixColumn(camera.matrixWorld, 1);
    aim.up.copy(cameraUp); aim.position.copy(headPosition); aim.lookAt(camera.position);
    screenHead.copy(headOffset).applyQuaternion(aim.quaternion).add(headPosition).project(camera);
    const origin = {
      x: stageRect.left + (screenHead.x + 1) * stageRect.width / 2,
      y: stageRect.top + (1 - screenHead.y) * stageRect.height / 2,
    };
    const target = cursorGaze(hasPointer ? pointer : null, origin, { width: innerWidth, height: innerHeight });
    if (motion) gaze.lerp(new THREE.Vector2(target.x, target.y), 1 - Math.exp(-delta * 7));
    // Yaw and pitch only. Camera-relative up removes the old unintended head roll.
    angles.set(-gaze.y * .19, -gaze.x * .30, 0, 'YXZ');
    turn.setFromEuler(angles);
    head.quaternion.copy(aim.quaternion).multiply(turn);
    head.position.copy(headOffset).applyQuaternion(head.quaternion).add(headPosition);
    container.dataset.robotPose = next;
    container.dataset.robotGaze = gaze.toArray().map(v => v.toFixed(3)).join(',');
    container.dataset.robotHeadOrigin = [origin.x, origin.y].map(v => v.toFixed(2)).join(',');
    container.dataset.robotHeadAngles = [angles.x, angles.y, angles.z].map(v => v.toFixed(3)).join(',');
    container.dataset.robotNeckMount = headPosition.toArray().map(v => v.toFixed(4)).join(',');
    container.dataset.robotPhase = progress < 1 ? 'transition' : 'hold';
    const facing = new THREE.Vector3(0, 0, 1).applyQuaternion(head.quaternion);
    container.dataset.robotFacing = facing.dot(camera.position.clone().sub(head.position).normalize()).toFixed(3);
    const bounds = new THREE.Box3().setFromObject(model).union(new THREE.Box3().setFromObject(head));
    const min = new THREE.Vector2(Infinity, Infinity), max = new THREE.Vector2(-Infinity, -Infinity);
    for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
      const point = new THREE.Vector3(x, y, z).project(camera);
      min.min(new THREE.Vector2(point.x, point.y)); max.max(new THREE.Vector2(point.x, point.y));
    }
    container.dataset.robotBounds = [min.x, min.y, max.x, max.y].map(v => v.toFixed(3)).join(',');
  }
  function draw(delta = 0) { if (!lost) { applyPose(delta); renderer.render(scene, camera); } }
  function syncControls() {
    autoButton.setAttribute('aria-pressed', String(autoplay && motion));
    autoButton.textContent = autoplay && motion ? 'Pause poses' : 'Auto poses';
    status.textContent = motion ? 'Gaze locked on you' : 'Still pose / motion off';
  }
  function tick(time) {
    frame = 0;
    if (!visible || document.hidden || lost || !motion) { lastTime = 0; return; }
    const delta = lastTime ? Math.min((time - lastTime) / 1000, .05) : 0;
    lastTime = time;
    if (progress < 1) { progress = Math.min(1, progress + delta / 3.8); pose = mixPose(from, POSES[next], progress); }
    else if (autoplay) { idle += delta; if (idle > 7) choosePose(POSE_NAMES[(POSE_NAMES.indexOf(next) + 1) % POSE_NAMES.length]); }
    draw(delta); frame = requestAnimationFrame(tick);
  }
  function schedule() { if (!frame && motion && visible && !document.hidden && !lost) frame = requestAnimationFrame(tick); }
  function resize() {
    const width = stage.clientWidth, height = stage.clientHeight;
    if (!width || !height || lost) return;
    stageRect = stage.getBoundingClientRect();
    renderer.setSize(width, height); camera.aspect = width / height;
    const distance = Math.max(1.85, 1.72 / camera.aspect);
    camera.position.copy(new THREE.Vector3(1.15, .41, -1.7).normalize().multiplyScalar(distance).add(cameraTarget));
    camera.lookAt(cameraTarget); camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
    draw();
  }
  poseButtons.forEach(button => button.addEventListener('click', () => {
    autoplay = false; choosePose(button.dataset.robotPose);
    if (!motion) { progress = 1; pose = { ...POSES[next] }; draw(); }
    syncControls(); schedule();
  }));
  autoButton.addEventListener('click', () => {
    autoplay = !autoplay;
    if (!motion && autoplay) document.querySelector('#motion-toggle').click();
    idle = 0; syncControls(); schedule();
  });
  document.addEventListener('pointermove', event => {
    if (!motion || !visible || event.pointerType === 'touch') return;
    pointer.set(event.clientX, event.clientY); hasPointer = true;
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { hasPointer = false; });
  window.addEventListener('blur', () => { hasPointer = false; });
  window.addEventListener('scroll', () => { stageRect = stage.getBoundingClientRect(); }, { passive: true });
  document.addEventListener('motionchange', event => {
    motion = event.detail;
    if (!motion) { cancelAnimationFrame(frame); frame = 0; lastTime = 0; hasPointer = false; gaze.set(0, 0); draw(); }
    syncControls(); schedule();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; lastTime = 0; } else schedule();
  });
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible) { cancelAnimationFrame(frame); frame = 0; lastTime = 0; } else schedule();
  }).observe(container);
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault(); lost = true; cancelAnimationFrame(frame);
    container.dataset.robotState = 'static'; renderer.domElement.hidden = true;
    status.textContent = 'Concept image / 3D unavailable';
  });
  stage.append(renderer.domElement); resize();
  new ResizeObserver(resize).observe(stage);
  container.dataset.robotState = 'ready'; syncControls(); schedule();
}
