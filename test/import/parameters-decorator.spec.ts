import { instance } from '../fixture/parameters-decorator';
describe('parameters-decorator', () => {
  it('parameters-decorator', () => {
    let out = instance.out();
    expect(out.token1).toBe(3);
    expect(out.token1WithInjectorL2).toBe(2);
    expect(out.token1WithSelf).toBe(3);
  });
});
