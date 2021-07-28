import * as ts from 'typescript';
import * as path from 'path';
import { InjectableTransformFactory } from '../src/transform';
describe('main', () => {
  it('run', () => {
    let program = ts.createProgram({
      rootNames: [path.resolve(__dirname, './fixture/hello-world.ts')],
      options: {},
    });
    let transformFactory = new InjectableTransformFactory(program);
    program.emit(undefined, undefined, undefined, undefined, {
      before: [transformFactory.getTransform()],
    });
  });
});
