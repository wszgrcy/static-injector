import { expect } from 'chai';
import { createRootInjector, injectAsync } from 'static-injector';

describe('inject-async', () => {
  it('hello', async () => {
    class Main {
      ac = injectAsync(() => import('../fixture/async-class'));
    }
    let injector = createRootInjector({ providers: [Main] });
    let result = await injector
      .get(Main)
      .ac()
      .then((ac) => {
        return ac.data;
      });
      expect(result).eq(1)
  });
});
