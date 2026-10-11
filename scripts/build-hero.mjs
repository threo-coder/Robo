import { build } from 'esbuild';
await build({ entryPoints: ['src/hero-robot.js'], bundle: true, format: 'esm', minify: true, outfile: 'dist/hero-robot.js', legalComments: 'eof', target: ['es2022'] });
console.log('Built articulated hero robot.');
