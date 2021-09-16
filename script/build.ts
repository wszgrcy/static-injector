import * as rollup from 'rollup';
interface BuildOptions {
  output: string;
  format: rollup.ModuleFormat;
}
async function bundleImport(options: BuildOptions) {
  let bundle = await rollup.rollup({
    input: './dist/import/es2015/index.js',
    treeshake: false,
  });
  bundle.write({
    file: options.output,
    format: options.format,
  });
}
(
  [
    { output: './dist/import/commonjs/index.js', format: 'commonjs' },
    { output: './dist/import/fesm2015/index.js', format: 'es' },
  ] as BuildOptions[]
).forEach((options) => {
  bundleImport(options);
});
