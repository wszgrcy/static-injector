import { expect } from 'chai';
import { ChangeDetectionScheduler, ChangeDetectionSchedulerImpl, createRootInjector, ErrorHandler, PendingTasks } from 'static-injector';

describe('PendingTasks', () => {
  it('正常', async () => {
    let injector = createRootInjector({
      providers: [
        {
          provide: ChangeDetectionScheduler,
          useClass: ChangeDetectionSchedulerImpl,
        },
      ],
    });
    let resolve: any;
    let fn = new Promise((res) => {
      resolve = res;
    });
    injector.get(PendingTasks).run(async () => {
      resolve(1);
    });
    expect(await fn).eq(1);
  });
  it('error', async () => {
    let resolve: any;
    let fn = new Promise((res) => {
      resolve = res;
    });
    let injector = createRootInjector({
      providers: [
        {
          provide: ChangeDetectionScheduler,
          useClass: ChangeDetectionSchedulerImpl,
        },
        {
          provide: ErrorHandler,
          useValue: {
            handleError: (e: any) => {
              if (e instanceof Error) {
                expect(e.message).eq('throw value');
              }
              resolve(1);
            },
          },
        },
      ],
    });

    injector.get(PendingTasks).run(async () => {
      throw new Error('throw value');
    });
    expect(await fn).eq(1);
  });
});
