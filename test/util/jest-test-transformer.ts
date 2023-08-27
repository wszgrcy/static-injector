import {
  SourceFile,
  TransformationContext,
  TransformerFactory,
} from 'typescript';
import { createTransformer } from '../../src/transform';
import type { TsCompilerInstance } from 'ts-jest/dist/types';
export const version = Math.random();
export const name = 'import-transformer';
export function factory(
  compilerInstance: TsCompilerInstance
): TransformerFactory<SourceFile> {
  let transformer = createTransformer(compilerInstance.program!);
  return (ctx: TransformationContext) => {
    let fn = transformer(ctx);
    return (sf: SourceFile) => {
      return fn(sf);
    };
  };
}
