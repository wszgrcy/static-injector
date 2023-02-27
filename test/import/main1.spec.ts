import { instance } from '../fixture/main1';
describe('main1', () => {
  it('default', () => {
    expect(instance.hello()).toBe('hello');
  });
});
