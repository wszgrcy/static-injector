import { expect } from 'chai';
import { instance } from '../fixture/inject-class';
describe('inject-class', () => {
  it('inject-class', () => {
    let out = instance.out();
    expect(out.injectClass.name).eq('InjectClass');
    expect(out.rootInjectClass.name).eq('RootInjectClass');
  });
});
