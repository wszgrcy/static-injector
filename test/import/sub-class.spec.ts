import { result } from '../fixture/sub-class';
describe('hello', () => {
  it('sub-class', () => {
    expect(result).toBe('second');
  });
});
