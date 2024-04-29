import * as rollup from 'rollup';
interface BuildOptions {
  output: string;
  format: rollup.ModuleFormat;
}
async function bundleImport() {
  let bundle = await rollup.rollup({
    input: './dist/es2022/index.js',
    treeshake: true,
  });
  for (const item of [
    { output: './dist/commonjs/index.js', format: 'commonjs' },
    { output: './dist/fesm2022/index.js', format: 'esm' },
  ] as BuildOptions[]) {
    await bundle.write({
      file: item.output,
      format: item.format,
    });
  }
}

bundleImport();
