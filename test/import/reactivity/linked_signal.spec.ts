import { expect } from 'chai';
import {
  ChangeDetectionScheduler,
  ChangeDetectionSchedulerImpl,
  computed,
  effect,
  inject,
  Injector,
  INJECTOR_SCOPE,
  linkedSignal,
  RootStaticInjectOptions,
  signal,
} from 'static-injector';

describe('linkedSignal', () => {
  it('hello', async () => {
    let value$ = signal(0);
    let ls = linkedSignal(() => value$());
    ls.set(1);
    expect(ls()).eq(1);
    value$.set(2);
    expect(ls()).eq(2);
    ls.set(3);
    expect(ls()).eq(3);
  });
  it('computation', () => {
    let value$ = signal({ value: 1 });
    let value2$ = signal(0);
    let ls = linkedSignal({
      source: () => value$(),
      computation: (item) => item.value + value2$(),
    });
    expect(ls()).eq(1);
    value2$.set(1);
    expect(ls()).eq(2);
    value$.set({ value: 2 });
    expect(ls()).eq(3);
  });
  it('equal', () => {
    let value$ = signal({ value: 1 });
    let ls = linkedSignal(() => value$().value, {
      equal: () => true,
    });
    expect(ls()).eq(1);
    value$.set({ value: 2 });
    expect(value$()).deep.eq({ value: 2 });
    expect(ls()).eq(1);
  });
});
