import { expect } from 'chai';
import { result } from '../fixture/sub-class';
import { ChangeDetectionScheduler, ChangeDetectionSchedulerImpl, createRootInjector, debounced, signal } from 'static-injector';
describe('hello', () => {
  it('sub-class', async () => {
    let injector = createRootInjector({
      providers: [
        {
          provide: ChangeDetectionScheduler,
          useClass: ChangeDetectionSchedulerImpl,
        },
      ],
    });
    let v1 = signal(1);
    let v2 = debounced(v1, 0, { injector: injector });
    expect(v1()).eq(1);
    expect(v2.value()).eq(1);
    v1.set(2);
    expect(v1()).eq(2);
    expect(v2.value()).eq(1);
    await new Promise((res) => setTimeout(res, 10));
    expect(v2.value()).eq(2);
  });
});
