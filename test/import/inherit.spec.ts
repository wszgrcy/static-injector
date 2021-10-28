import { instance } from '../fixture/inherit';
describe('inherit', () => {
  it('inherit', () => {
    expect(instance.hello()).toBe('helloparent');
  });
});
