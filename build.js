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

  let html = fs.readFileSync('src/index_template.html', 'utf8');
  html = html.replace(
    '</body>',
    '  <script type="module" src="index.js"></script>\n</body>'
  );
  fs.writeFileSync('dist/index.html', html);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
