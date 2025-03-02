import { expect } from 'chai';
import { computed, signal, untracked } from 'static-injector';

describe('untracked', () => {
  it('hello', () => {
    let value$ = signal(0);
    let c1$ = computed(() => untracked(() => value$()));
    expect(c1$()).eq(0)
    value$.set(1)
    expect(c1$()).eq(0)
  });
});
