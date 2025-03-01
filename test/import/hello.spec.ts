import { expect } from 'chai';
import { instance } from '../fixture/hello';
import { instance as instance2 } from '../fixture/hello-without-provide-object';
describe('hello', () => {
  it('hello', () => {
    expect(instance.hello()).eq('hello');
  });
  it('hello-without-provide-object', () => {
    expect(instance2.hello()).eq('hello');
  });
});
