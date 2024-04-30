import { Injector } from 'static-injector';

class NoProvideError {}

describe('noProviderError', () => {
  it('main', () => {
    let injector = Injector.create({ providers: [] });
    try {
      injector.get(NoProvideError);
    } catch (error) {
      expect(true).toBe(true);
      return;
    }
    throw new Error('');
  });
});
