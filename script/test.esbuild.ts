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
    external: ['rxjs', 'mocha', 'chai'],
    define: {
      ngDevMode: 'false',
    },
  };
  await esbuild.build(options);
}
main();
