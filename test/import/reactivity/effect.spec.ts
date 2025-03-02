import {
  ChangeDetectionScheduler,
  ChangeDetectionSchedulerImpl,
  computed,
  effect,
  inject,
  Injector,
  INJECTOR_SCOPE,
  RootStaticInjectOptions,
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
  it('等待值变更', async () => {
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
  it('等待值变更2', async () => {
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
    let value2$ = signal(0);
    let c1$$ = computed(() => {
      return value1$() + value2$();
    });
    let p = new Promise<void>((resolve) => {
      effect(
        () => {
          let value1 = c1$$();
          if (value1 === 2) {
            resolve();
          }
        },
        { injector: inejctor },
      );
    });
    setTimeout(() => {
      value1$.set(1);
    }, 0);
    setTimeout(() => {
      value1$.set(2);
    }, 0);
    await p;
  });
  it('类内构造', async () => {
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
    let resolve: any;
    let p = new Promise((res) => {
      resolve = res;
    });
    class Test1 extends RootStaticInjectOptions {
      value1$ = signal(0);
      value2$ = signal(0);
      c1$$ = computed(() => {
        return this.value1$() + this.value2$();
      });
      constructor() {
        super();
        effect(() => {
          let value1 = this.c1$$();
          if (value1 === 2) {
            resolve();
          }
        });
        setTimeout(() => {
          this.value1$.set(1);
        }, 0);
        setTimeout(() => {
          this.value1$.set(2);
        }, 0);
      }
    }
    inejctor.get(Test1);
    await p;
  });
});
