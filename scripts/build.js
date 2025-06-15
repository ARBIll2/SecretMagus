const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'public');
fs.mkdirSync(outDir, { recursive: true });

// copy index.html
fs.copyFileSync(path.join(__dirname, '..', 'client', 'index.html'), path.join(outDir, 'index.html'));

// copy global css
// esbuild will output bundle.css from imported CSS

esbuild.build({
  entryPoints: ['client/main.jsx'],
  bundle: true,
  outfile: 'public/bundle.js',
  sourcemap: true,
  loader: { '.js': 'jsx', '.jsx': 'jsx' },
  define: { 'process.env.NODE_ENV': '"production"' },
}).catch(() => process.exit(1));
