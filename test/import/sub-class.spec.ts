import { expect } from 'chai';
import { result } from '../fixture/sub-class';
describe('hello', () => {
  it('sub-class', () => {
    expect(result).eq('second');
  });
});
