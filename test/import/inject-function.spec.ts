import { expect } from 'chai';
import { instance } from '../fixture/inject-function';
describe('inject(xxx)', () => {
  it('inject(xxx)', () => {
    let out = instance.out();
    expect(out.injectClass.name).eq('InjectClass');
    expect(out.rootInjectClass.name).eq('RootInjectClass');
  });
});
