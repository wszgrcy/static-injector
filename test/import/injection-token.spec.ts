import { expect } from 'chai';
import { tokenToString, value } from '../fixture/injection-token';
describe('injection-token', () => {
  it('injection-token', () => {
    expect(value).eq('myToken');
    expect(tokenToString).eq('InjectionToken token');
  });
});
