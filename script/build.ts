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
    minify: true,
    tsconfig: 'tsconfig.import.json',
    charset: 'utf8',
    external: ['rxjs', 'mocha', 'chai'],
    define: {
      ngDevMode: 'false',
      Zone: 'undefined',
    },
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
