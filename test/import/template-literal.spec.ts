import { instance } from '../fixture/template-literal';
describe('hello', () => {
  it('sub-class', () => {
    expect(instance.out().noValue).toBe(true);
  });
});
