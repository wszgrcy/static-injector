import { expect } from 'chai';
import { ChangeDetectionScheduler, ChangeDetectionSchedulerImpl, createRootInjector, effect, runInInjectionContext } from 'static-injector';
describe('runInInjectionContext', () => {
  it('hello', async () => {
    let injector = createRootInjector({
      providers: [
        {
          provide: ChangeDetectionScheduler,
          useClass: ChangeDetectionSchedulerImpl,
        },
      ],
    });
    let result = await runInInjectionContext(injector, () => {
      return new Promise<1>((result) => {
        effect(() => {
          expect(true).eq(true);
          result(1);
        });
      });
    });
    expect(result).eq(1);
  });
});
