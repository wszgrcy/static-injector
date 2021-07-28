import ts from 'typescript';
import { createTransform } from '../../src/transform';

export function createTestTransform(
  rootNames: string[],
  options: ts.CompilerOptions = {},
  emitOptions: {
    writeFile?: ts.WriteFileCallback;
    emitOnlyDtsFiles?: boolean;
  } = {}
) {
  let program = ts.createProgram({ rootNames: rootNames, options });
  let transform = createTransform(program);
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
