import { instance } from '../fixture/inject-function';
describe('inject(xxx)', () => {
  it('inject(xxx)', () => {
    let out = instance.out();
    expect(out.injectClass.name).toBe('InjectClass');
    expect(out.rootInjectClass.name).toBe('RootInjectClass');
  });
});
