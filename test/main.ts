import * as ts from 'typescript';
import * as path from 'path';
import { InjectableTransformFactory } from '../src/transform/injectable-transform';
let program = ts.createProgram({ rootNames: [path.resolve(__dirname, './test.ts')], options: {} });
let typeChecker = program.getTypeChecker();
let transformFactory = new InjectableTransformFactory(program, typeChecker);
program.emit(undefined, undefined, undefined, undefined, {
  before: [(context) => transformFactory.getTransform(context)],
});
