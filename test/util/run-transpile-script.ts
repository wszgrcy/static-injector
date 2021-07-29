import * as vm from 'vm';
export function runTranspileScript(script: string): Record<string, any> {
  let context = {};
  vm.runInNewContext(script, { require, exports: context });
  return context;
}
