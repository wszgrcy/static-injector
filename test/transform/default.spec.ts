import path from 'path';
import { createTestTransformer } from '../util/create-test-transform';
describe('default', () => {
  it('hello-world', () => {
    createTestTransformer(
      [path.resolve(__dirname, '../fixture/hello.ts')],
      undefined,
      {
        writeFile: (fileName, data) => {
          expect(data).toContain(`MyClass.ɵfac`);
          expect(data).toContain(`MyClass.ɵprov`);
        },
      }
    );
  });

  it('parameters-decorator', () => {
    createTestTransformer(
      [path.resolve(__dirname, '../fixture/parameters-decorator.ts')],
      undefined,
      {
        writeFile: (fileName, data) => {
          expect(data).toContain(`MyClass.ɵfac`);
          expect(data).toContain(`MyClass.ɵprov`);
        },
      }
    );
  });
  it('inject-class', () => {
    createTestTransformer(
      [path.resolve(__dirname, '../fixture/inject-class.ts')],
      undefined,
      {
        writeFile: (fileName, data) => {
          expect(data).toContain(`MyClass.ɵfac`);
          expect(data).toContain(`MyClass.ɵprov`);
        },
      }
    );
  });
  it('provider', () => {
    createTestTransformer(
      [path.resolve(__dirname, '../fixture/provider.ts')],
      undefined,
      {
        writeFile: (fileName, data) => {
          expect(data).toContain(`MyClass.ɵfac`);
          expect(data).toContain(`MyClass.ɵprov`);
        },
      }
    );
  });
  it('injectable', () => {
    createTestTransformer(
      [path.resolve(__dirname, '../fixture/injectable.ts')],
      undefined,
      {
        writeFile: (fileName, data) => {
          expect(data).toContain(`MyClass.ɵfac`);
          expect(data).toContain(`MyClass.ɵprov`);
        },
      }
    );
  });
});
