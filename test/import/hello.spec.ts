import { instance } from '../fixture/hello';
import { instance as instance2 } from '../fixture/hello-without-provide-object';
describe('hello', () => {
  it('hello', () => {
    expect(instance.hello()).toBe('hello');
  });
  it('hello-without-provide-object', () => {
    expect(instance2.hello()).toBe('hello');
  });
});
