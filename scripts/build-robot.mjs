import { build } from 'esbuild';
await build({entryPoints:['src/robot-viewer.js'],bundle:true,format:'esm',minify:true,outfile:'dist/robot-viewer.js',legalComments:'eof',target:['es2022']});
console.log('Built self-hosted Three.js robot viewer.');
