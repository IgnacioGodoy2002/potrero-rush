import {build} from 'esbuild';
await build({entryPoints:['src/client3d/entry.js'],bundle:true,minify:true,format:'iife',target:['es2020'],outfile:'public/engine3d.js',legalComments:'eof'});
