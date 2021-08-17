import { instance } from '../fixture/hello';
describe('hello', () => {
  it('hello', () => {
    expect(instance.hello()).toBe('hello');
  });
});
