import { expect } from 'chai';
import { instance } from '../fixture/parameters-decorator';
describe('parameters-decorator', () => {
  it('parameters-decorator', () => {
    let out = instance.out();
    expect(out.token1).eq(3);
    expect(out.token1WithInjectorL2).eq(2);
    expect(out.token1WithSelf).eq(3);
  });
});
