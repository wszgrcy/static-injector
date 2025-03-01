import {
  ChangeDetectionScheduler,
  ChangeDetectionSchedulerImpl,
  effect,
  inject,
  Injector,
  INJECTOR_SCOPE,
  signal,
} from 'static-injector';

describe('effect', () => {
  it('hello', async () => {
    let inejctor = Injector.create({
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
    let p = new Promise<void>((resolve) => {
      effect(
        () => {
          resolve();
        },
        { injector: inejctor },
      );
    });
    await p;
  });
  it('hello', async () => {
    let inejctor = Injector.create({
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
    let value1$ = signal(0);
    let p = new Promise<void>((resolve) => {
      effect(
        () => {
          let value1 = value1$();
          if (value1 === 1) {
            resolve();
          }
        },
        { injector: inejctor },
      );
    });
    setTimeout(() => {
      value1$.set(1);
    }, 0);
    await p;
  });
});
