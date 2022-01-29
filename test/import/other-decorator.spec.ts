import { instance, result } from '../fixture/other-decorator';
describe('other-decorator', () => {
  it('only-other', () => {
    expect(result).toBe('hello');
  });
  it('both', () => {
    expect(instance.hello()).toBe('hello');
  });
});
