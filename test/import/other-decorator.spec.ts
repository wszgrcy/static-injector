import { expect } from 'chai';
import { instance, result } from '../fixture/other-decorator';
describe('other-decorator', () => {
  it('only-other', () => {
    expect(result).eq('hello');
  });
  it('both', () => {
    expect(instance.hello()).eq('hello');
  });
});
