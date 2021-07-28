import path from 'path';
import { createTestTransform } from './util/create-test-transform';

describe('default', () => {
  it('hello-world', () => {
    createTestTransform(
      [path.resolve(__dirname, './fixture/default.ts')],
      undefined,
      {
        writeFile: (fileName, data) => {
          console.log(data);
          expect(data).toContain(`MyClass.ɵfac`);
          expect(data).toContain(`MyClass.ɵprov`);
        },
      }
    );
  });
});
