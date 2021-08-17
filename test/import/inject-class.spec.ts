import { instance } from '../fixture/inject-class';
describe('inject-class', () => {
  it('inject-class', () => {
    let out = instance.out();
    expect(out.injectClass.name).toBe('InjectClass');
    expect(out.rootInjectClass.name).toBe('RootInjectClass');
  });
});
