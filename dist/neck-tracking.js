const VERTEX = `
attribute vec2 position;
varying vec2 screenUV;
void main() {
  screenUV = position * vec2(0.5, -0.5) + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const FRAGMENT = `
precision highp float;
uniform sampler2D artwork;
uniform vec2 viewSize;
uniform vec2 imageSize;
uniform vec2 renderedSize;
uniform vec2 imageOrigin;
uniform vec2 look;
varying vec2 screenUV;
void main() {
  vec2 uv = (screenUV * viewSize - imageOrigin) / renderedSize;
  vec2 p = uv * imageSize;
  // The influence ends at the neck joint. Torso, legs and floor stay fixed.
  float neck = smoothstep(235.0, 335.0, p.y);
  float left = mix(785.0, 853.0, neck);
  float right = mix(1100.0, 1060.0, neck);
  float crown = mix(169.0, 114.0, smoothstep(790.0, 1010.0, p.x));
  float weight = smoothstep(left, left + 27.0, p.x)
    * (1.0 - smoothstep(right - 35.0, right, p.x))
    * smoothstep(crown - 12.0, crown + 3.0, p.y)
    * (1.0 - smoothstep(247.0, 338.0, p.y));
  vec2 pivot = vec2(948.0, 334.0);
  vec2 shift = look * vec2(18.0, 12.0) * weight;
  float angle = (look.y * 0.05 - look.x * 0.015) * weight;
  vec2 q = p - pivot - shift;
  float c = cos(angle), s = sin(angle);
  q = mat2(c, -s, s, c) * q;
  q.x /= 1.0 - abs(look.x) * 0.045 * weight;
  gl_FragColor = texture2D(artwork, (q + pivot) / imageSize);
}`;

export async function initNeckTracking(container) {
  const image = container.querySelector('img');
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.className = 'neck-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, powerPreference: 'low-power' });
  if (!gl) { container.dataset.neckState = 'static'; return; }
  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); throw new Error('Neck shader unavailable'); }
    return shader;
  };
  const program = gl.createProgram();
  const vertex = compile(gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT);
  gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
  gl.deleteShader(vertex); gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { gl.deleteProgram(program); throw new Error('Neck renderer unavailable'); }
  gl.useProgram(program);
  const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  const uniforms = Object.fromEntries(['viewSize','imageSize','renderedSize','imageOrigin','look'].map(name => [name, gl.getUniformLocation(program, name)]));
  gl.uniform1i(gl.getUniformLocation(program, 'artwork'), 0);
  gl.uniform2f(uniforms.imageSize, image.naturalWidth, image.naturalHeight);
  const target = { x: 0, y: 0 }, current = { x: 0, y: 0 };
  let frame = 0, visible = true, lost = false;
  let motion = !document.body.classList.contains('motion-off');
  let layout = { width: 1, height: 1, renderedWidth: 1, renderedHeight: 1, originX: 0, originY: 0 };
  const clamp = value => Math.max(-1, Math.min(1, value));
  function draw() {
    if (lost) return;
    gl.uniform2f(uniforms.look, current.x, current.y);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    container.dataset.neckLook = `${current.x.toFixed(3)},${current.y.toFixed(3)}`;
  }
  function animate() {
    frame = 0;
    if (!visible || document.hidden || lost) return;
    current.x += (target.x - current.x) * .14;
    current.y += (target.y - current.y) * .14;
    if (Math.abs(target.x - current.x) + Math.abs(target.y - current.y) < .002) { current.x = target.x; current.y = target.y; }
    draw();
    if (current.x !== target.x || current.y !== target.y) frame = requestAnimationFrame(animate);
  }
  function schedule() { if (!frame && visible && !document.hidden && !lost) frame = requestAnimationFrame(animate); }
  function reset(immediate = false) {
    target.x = target.y = 0;
    if (immediate) { cancelAnimationFrame(frame); frame = 0; current.x = current.y = 0; draw(); }
    else schedule();
  }
  function resize() {
    const rect = image.getBoundingClientRect();
    if (!rect.width || !rect.height || lost) return;
    const scale = Math.max(rect.width / image.naturalWidth, rect.height / image.naturalHeight);
    const [px, py] = getComputedStyle(image).objectPosition.split(' ').map(value => parseFloat(value) / 100);
    layout = { width: rect.width, height: rect.height, renderedWidth: image.naturalWidth * scale, renderedHeight: image.naturalHeight * scale,
      originX: (rect.width - image.naturalWidth * scale) * px, originY: (rect.height - image.naturalHeight * scale) * py };
    const bounds = container.getBoundingClientRect();
    canvas.style.left = `${rect.left - bounds.left - container.clientLeft + container.scrollLeft}px`;
    canvas.style.top = `${rect.top - bounds.top - container.clientTop + container.scrollTop}px`;
    canvas.style.width = `${rect.width}px`; canvas.style.height = `${rect.height}px`;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(rect.height * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uniforms.viewSize, layout.width, layout.height);
    gl.uniform2f(uniforms.renderedSize, layout.renderedWidth, layout.renderedHeight);
    gl.uniform2f(uniforms.imageOrigin, layout.originX, layout.originY);
    reset(true);
  }
  container.append(canvas);
  resize();
  container.dataset.neckState = 'ready';
  container.classList.add('neck-ready');
  document.addEventListener('pointermove', event => {
    if (!motion || !visible || lost || event.pointerType === 'touch') return;
    const rect = image.getBoundingClientRect();
    const x = rect.left + layout.originX + layout.renderedWidth * (948 / image.naturalWidth);
    const y = rect.top + layout.originY + layout.renderedHeight * (200 / image.naturalHeight);
    const dx = event.clientX - x, dy = event.clientY - y;
    target.x = clamp(dx / Math.max(1, dx < 0 ? x : innerWidth - x));
    target.y = clamp(dy / Math.max(1, dy < 0 ? y : innerHeight - y));
    schedule();
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => reset());
  window.addEventListener('blur', () => reset(true));
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(true); });
  document.addEventListener('motionchange', event => { motion = event.detail; if (!motion) reset(true); });
  new ResizeObserver(resize).observe(image);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (!visible) reset(true); }, { threshold: 0 }).observe(container);
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); lost = true; cancelAnimationFrame(frame); frame = 0;
    canvas.hidden = true; container.classList.remove('neck-ready'); container.dataset.neckState = 'static';
  });
}
