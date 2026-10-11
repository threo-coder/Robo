import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

test('Vercel serves the static build rather than the local preview server', async () => {
  const config = JSON.parse(await readFile('vercel.json', 'utf8'));
  assert.equal(config.framework, null);
  assert.equal(config.buildCommand, 'npm run build');
  assert.equal(config.outputDirectory, 'dist');
  assert.equal(config.functions, undefined);
  assert.equal(config.rewrites, undefined);
  for (const route of ['index.html', 'solutions/index.html', 'lab/index.html', 'contact/index.html']) {
    const html = await readFile(resolve(config.outputDirectory, route), 'utf8');
    assert.match(html, /RoboKing/);
    for (const [, url] of html.matchAll(/(?:src|href)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)) {
      const path = resolve(config.outputDirectory, '.' + url);
      assert.ok((await stat(path)).isFile() || (await stat(resolve(path, 'index.html'))).isFile(), url);
    }
  }
  const modelPath = 'dist/assets/model/go2/go2-seated.gltf';
  const model = JSON.parse(await readFile(modelPath, 'utf8'));
  for (const buffer of model.buffers) {
    if (buffer.uri.startsWith('data:')) continue;
    assert.equal((await stat(resolve(dirname(modelPath), buffer.uri))).size, buffer.byteLength);
  }
});
