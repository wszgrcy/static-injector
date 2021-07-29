import * as path from 'path';
import { FatalDiagnosticError } from '../src/transform/compiler-cli/src/ngtsc/diagnostics/error';
import { createTestTransform } from './util/create-test-transform';
describe('error', () => {
  it('strict-constructor-deps', () => {
    try {
      createTestTransform(
        [path.resolve(__dirname, './fixture/error/strict-constructor-deps.ts')],
        undefined,
        {
          writeFile: (fileName, data) => {
            throw 'can not emit';
          },
        },
        { strictCtorDeps: true }
      );
    } catch (error) {
      expect(error instanceof FatalDiagnosticError).toBe(true);
    }
  });
  it('strict-constructor-union-type-dep', () => {
    try {
      createTestTransform(
        [
          path.resolve(
            __dirname,
            './fixture/error/strict-constructor-union-type-dep.ts'
          ),
        ],
        undefined,
        {
          writeFile: (fileName, data) => {
            throw 'can not emit';
          },
        },
        { strictCtorDeps: true }
      );
    } catch (error) {
      expect(error instanceof FatalDiagnosticError).toBe(true);
    }
  });
  it('strict-constructor-interface-type-dep', () => {
    try {
      createTestTransform(
        [
          path.resolve(
            __dirname,
            './fixture/error/strict-constructor-interface-type-dep.ts'
          ),
        ],
        undefined,
        {
          writeFile: (fileName, data) => {
            throw 'can not emit';
          },
        },
        { strictCtorDeps: true }
      );
    } catch (error) {
      expect(error instanceof FatalDiagnosticError).toBe(true);
    }
  });
});
