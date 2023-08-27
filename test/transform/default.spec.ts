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
          // expect(data).toContain(`MyClass.ɵprov`);
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
          // expect(data).toContain(`MyClass.ɵprov`);
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
          // expect(data).toContain(`MyClass.ɵprov`);
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
          // expect(data).toContain(`MyClass.ɵprov`);
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
          // expect(data).toContain(`MyClass.ɵprov`);
        },
      }
    );
  });
  it('other-decorator', () => {
    createTestTransformer(
      [path.resolve(__dirname, '../fixture/other-decorator.ts')],
      undefined,
      {
        writeFile: (fileName, data) => {
          expect(data).not.toContain(`OnlyOtherClass.ɵfac`);
          expect(data).not.toContain(`OnlyOtherClass.ɵprov`);
          expect(data).toContain(`BothClass.ɵfac`);
          // expect(data).toContain(`BothClass.ɵprov`);
        },
      }
    );
  });
  it('sub-class', () => {
    createTestTransformer(
      [path.resolve(__dirname, '../fixture/sub-class.ts')],
      undefined,
      {
        writeFile: (fileName, data) => {
          expect(data).not.toContain(`FirstClass.ɵfac`);
          expect(data).not.toContain(`FirstClass.ɵprov`);
          expect(data).toContain(`SecondClass.ɵfac`);
          // expect(data).toContain(`SecondClass.ɵprov`);
        },
      }
    );
  });
  it('template-literal', () => {
    createTestTransformer(
      [path.resolve(__dirname, '../fixture/template-literal.ts')],
      undefined,
      {
        writeFile: (fileName, data) => {
          expect(data).toContain(`TemplateLiteralClass.ɵfac`);
          // expect(data).toContain(`TemplateLiteralClass.ɵprov`);
        },
      }
    );
  });
  it('main1', () => {
    createTestTransformer(
      [path.resolve(__dirname, '../fixture/main1.ts')],
      undefined,
      {
        writeFile: (fileName, data) => {
          expect(data).toContain(`ɵfac`);
          expect(data).toContain(`ɵprov`);
        },
      }
    );
  });
  it('inject(xxx)',() => {
    createTestTransformer(
      [path.resolve(__dirname, '../fixture/inject-function.ts')],
      undefined,
      {
        writeFile: (fileName, data) => {
          // expect(data).toContain(`ɵfac`);
          // expect(data).toContain(`ɵprov`);
        },
      }
    );
  })
});
