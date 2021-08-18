import { tokenToString, value } from '../fixture/injection-token';
describe('injection-token', () => {
  it('injection-token', () => {
    expect(value).toBe('myToken');
    expect(tokenToString).toBe('InjectionToken token');
  });
});
