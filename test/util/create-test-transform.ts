import ts from 'typescript';
import {
  createTransformer,
  InjectableTransformerFactoryOptions,
} from '../../src/transform';

export function createTestTransformer(
  rootNames: string[],
  options: ts.CompilerOptions = {},
  emitOptions: {
    writeFile?: ts.WriteFileCallback;
    emitOnlyDtsFiles?: boolean;
  } = {},
  transformerOptions: InjectableTransformerFactoryOptions = {}
) {
  let program = ts.createProgram({ rootNames: rootNames, options });
  let transformer = createTransformer(program, transformerOptions);
  program.emit(
    undefined,
    emitOptions.writeFile,
    undefined,
    emitOptions.emitOnlyDtsFiles,
    {
      before: [transformer],
    }
  );
}
