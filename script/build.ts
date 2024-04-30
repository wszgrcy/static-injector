import * as rollup from 'rollup';

async function bundleImport() {
  let bundle = await rollup.rollup({
    input: './dist/es2022/index.js',
    treeshake: true,
  });

  await bundle.write({ file: './dist/commonjs/index.js', format: 'commonjs' });
  await bundle.write({
    file: './dist/fesm2022/index.js',
    format: 'module',
  });
}

bundleImport();
