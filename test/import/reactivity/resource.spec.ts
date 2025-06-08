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
  it('set', async () => {
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
    expect(res1$$.hasValue()).eq(false);
    res1$$.set(5);
    expect(res1$$.isLoading()).eq(false);
    expect(res1$$.hasValue()).eq(true);
    expect(res1$$.status()).eq('local');
  });
  it('reload', async () => {
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
    res1$$.set(5);
    expect(res1$$.reload()).eq(true);
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
  it('destroy', async () => {
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
    res1$$.destroy();
    expect(res1$$.status()).eq('idle');
  });
});
