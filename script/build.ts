import * as esbuild from 'esbuild';
import * as path from 'path';
import * as glob from 'fast-glob';
async function bundleImport() {
  let options: esbuild.BuildOptions = {
    platform: 'node',
    sourcemap: 'linked',
    bundle: true,
    entryPoints: [{ in: './src/import/index.ts', out: './index' }],
    splitting: false,
    outdir: path.join(process.cwd(), './test-dist'),
    outExtension: {
      '.js': '.mjs',
    },
    format: 'esm',
    minify: false,
    tsconfig: 'tsconfig.import.json',
    charset: 'utf8',
    packages: 'external',
    define: {
      Zone: 'undefined',
      ERROR_DETAILS_PAGE_BASE_URL: `'https://v20.angular.dev/errors'`,
    },
    inject: ['./script/shim.js'],
  };
  await esbuild.build({ ...options, outdir: './dist' });
  await esbuild.build({
    ...options,
    outdir: './dist',
    format: 'cjs',
    outExtension: {},
  });
}

bundleImport();
