import { expect } from 'chai';
import {
  ChangeDetectionScheduler,
  ChangeDetectionSchedulerImpl,
  effect,
  inject,
  Injector,
  INJECTOR_SCOPE,
  resource,
  signal,
} from 'static-injector';

describe('resource', () => {
  it.only('hello', async () => {
    let injector = Injector.create({
      providers: [
        {
          provide: ChangeDetectionScheduler,
          useClass: ChangeDetectionSchedulerImpl,
        },
        {
          provide: INJECTOR_SCOPE,
          useValue: 'root',
        },
      ],
    });
    let value$ = signal(0);
    let res1$$ = resource({
      request: () => value$(),
      loader: async ({ request, abortSignal }) => {
        return request + 1;
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
