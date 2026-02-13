const esbuild = require('esbuild');
const fs = require('fs');

const watchMode = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: ['src/main.ts'],
  bundle: true,
  outfile: 'dist/index.js',
  format: 'esm',
  platform: 'browser',
  target: ['es2020'],
  sourcemap: true,
  logLevel: 'info'
};

function copyHtml() {
  let html = fs.readFileSync('src/index_template.html', 'utf8');
  html = html.replace(
    '</body>',
    '  <script type="module" src="index.js"></script>\n</body>'
  );
  fs.writeFileSync('dist/index.html', html);
}

async function build() {
  fs.mkdirSync('dist', { recursive: true });

  if (watchMode) {
    const ctx = await esbuild.context({
      ...buildOptions,
      plugins: [{
        name: 'copy-html',
        setup(build) {
          build.onEnd(() => {
            copyHtml();
            console.log('HTML copied to dist/');
          });
        }
      }]
    });
    await ctx.watch();
    console.log('Watching for changes...');
  } else {
    await esbuild.build(buildOptions);
    copyHtml();
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
