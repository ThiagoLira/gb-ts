const esbuild = require('esbuild');
const fs = require('fs');

async function build() {
  await esbuild.build({
    entryPoints: ['src/main.ts'],
    bundle: true,
    outfile: 'dist/index.js',
    format: 'esm',
    platform: 'browser',
    target: ['es2020'],
    sourcemap: true,
    logLevel: 'info'
  });
  fs.copyFileSync('src/index_template.html', 'dist/index.html');
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
