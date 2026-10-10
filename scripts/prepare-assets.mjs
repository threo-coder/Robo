import sharp from 'sharp';
import { mkdir, rename, writeFile } from 'node:fs/promises';

await mkdir('artwork', { recursive: true });
for (const asset of ['quadruped-hero', 'drone', 'robotic-arm']) {
  await sharp(`dist/assets/${asset}.png`).webp({ quality: 86 }).toFile(`dist/assets/${asset}.webp`);
  await rename(`dist/assets/${asset}.png`, `artwork/${asset}.png`);
  console.log(`Optimized ${asset}`);
}

const families = [
  ['DM+Sans:wght@400;450;500;550;600;650;700', 'dm-sans'],
  ['Space+Grotesk:wght@400;500;600;700', 'space-grotesk'],
  ['IBM+Plex+Mono:wght@400', 'ibm-plex-mono']
];
for (const [family, file] of families) {
  const response = await fetch(`https://fonts.googleapis.com/css2?family=${family}&display=swap`, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' } });
  if (!response.ok) throw new Error(`Font CSS: ${response.status}`);
  const css = await response.text();
  const urls = [...css.matchAll(/url\((https:\/\/[^)]+\.woff2)\)/g)];
  if (!urls.length) throw new Error(`No WOFF2 found for ${family}`);
  const font = await fetch(urls.at(-1)[1]);
  if (!font.ok) throw new Error(`Font asset: ${font.status}`);
  await writeFile(`dist/assets/${file}.woff2`, new Uint8Array(await font.arrayBuffer()));
  console.log(`Downloaded Latin font: ${file}`);
}
