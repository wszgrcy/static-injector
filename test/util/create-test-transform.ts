import ts from 'typescript';
import {
  createTransform,
  InjectableTransformFactoryOptions,
} from '../../src/transform';

export function createTestTransform(
  rootNames: string[],
  options: ts.CompilerOptions = {},
  emitOptions: {
    writeFile?: ts.WriteFileCallback;
    emitOnlyDtsFiles?: boolean;
  } = {},
  transformOptions: InjectableTransformFactoryOptions = {}
) {
  let program = ts.createProgram({ rootNames: rootNames, options });
  let transform = createTransform(program, transformOptions);
  program.emit(
    undefined,
    emitOptions.writeFile,
    undefined,
    emitOptions.emitOnlyDtsFiles,
    {
      before: [transform],
    }
  );
}
