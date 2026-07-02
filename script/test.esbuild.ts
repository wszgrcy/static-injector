import * as esbuild from 'esbuild';
import * as path from 'path';
import * as glob from 'fast-glob';

async function main() {
  let options: esbuild.BuildOptions = {
    platform: 'node',
    sourcemap: 'linked',
    bundle: true,
    entryPoints: [
      ...glob.sync('./test/**/*.spec.ts', {}).map((item) => {
        return { in: item, out: path.join('', item.slice(0, -3)) };
      }),
    ],
    splitting: true,
    outdir: path.join(process.cwd(), './test-dist'),
    outExtension: {
      '.js': '.mjs',
    },
    format: 'esm',
    // minify: true,
    tsconfig: 'tsconfig.spec.json',
    charset: 'utf8',
    packages: 'external',
    define: {
      Zone: 'undefined',
      ERROR_DETAILS_PAGE_BASE_URL: `'https://v22.angular.dev/errors'`,
      ngServerMode: 'true',
    },
    inject: ['./script/shim.js'],
  };
  await esbuild.build(options);
}
main();
