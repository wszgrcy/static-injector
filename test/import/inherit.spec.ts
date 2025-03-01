import { expect } from 'chai';
import { instance } from '../fixture/inherit';
describe('inherit', () => {
  it('inherit', () => {
    expect(instance.hello()).eq('helloparent');
  });
});
