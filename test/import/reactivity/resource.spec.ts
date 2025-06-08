import { expect } from 'chai';
import { ChangeDetectionScheduler, ChangeDetectionSchedulerImpl, createRootInjector, effect, inject, Injector, INJECTOR_SCOPE, resource, signal } from 'static-injector';

describe('resource', () => {
  it('hello', async () => {
    let injector = createRootInjector({
      providers: [
        {
          provide: ChangeDetectionScheduler,
          useClass: ChangeDetectionSchedulerImpl,
        },
      
      ],
    });
    let value$ = signal(0);
    let res1$$ = resource({
      params: () => value$(),
      loader: async ({ params, abortSignal }) => {
        return params + 1;
      },
      injector: injector,
    });
    expect(res1$$.isLoading()).eq(true);
    await new Promise<void>((res) => {
      effect(
        () => {
          let isLoading = res1$$.isLoading();
          if (!isLoading) {
            expect(res1$$.value()).eq(1);
            res();
          }
        },
        { injector: injector },
      );
    });
  });
});
