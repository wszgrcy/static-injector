import { expect } from 'chai';
import { instance } from '../fixture/injectable';
describe('injectable', () => {
  it('injectable', () => {
    let out = instance.out();
    expect(out.token).eq(111);
  });
});
