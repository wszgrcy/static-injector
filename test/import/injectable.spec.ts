import { instance } from '../fixture/injectable';
describe('injectable', () => {
  it('injectable', () => {
    let out = instance.out();
    expect(out.token).toBe(111);
  });
});
