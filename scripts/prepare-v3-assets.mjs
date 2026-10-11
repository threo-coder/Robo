import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
const root = 'C:/Users/night/.codex/generated_images/019ecac1-1502-7453-9810-a2af44df1d48/';
const files = {
  'seated-hero': 'exec-3acfbe4f-b27b-4c11-877c-08f40121ca79.png',
  healthcare: 'exec-1a69b700-20b5-4811-9991-5bb531fe6bd0.png',
  inspection: 'exec-61dd9ed1-3f88-4fc5-809f-9659c356db90.png',
  custom: 'exec-5dd83020-fd90-4393-aca5-b2472dc57da0.png',
  perception: 'exec-f654d77e-bbda-4a90-94e5-b533e4794ecc.png',
  agriculture: 'exec-7de8c7ff-1a3e-4486-a448-a63b35e7baf5.png',
  underwater: 'exec-53a5b009-befb-4778-8d77-9e96d2ed6c0e.png',
};
await mkdir('artwork', { recursive: true });
for (const [name, file] of Object.entries(files)) {
  await copyFile(root + file, `artwork/${name}.png`);
  await sharp(`artwork/${name}.png`).resize({ width: 1672, withoutEnlargement: true }).webp({ quality: 85, effort: 6 }).toFile(`dist/assets/${name}.webp`);
}
await copyFile('node_modules/three/LICENSE', 'dist/assets/three-LICENSE.txt');
console.log('Prepared seven new concept images; ten distinct images in use.');
