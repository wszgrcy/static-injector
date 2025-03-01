import { expect } from 'chai';
import { computed, signal } from 'static-injector';

describe('computed', () => {
  it('hello', () => {
    let value = computed(() => 0);
    expect(value()).eq(0);
  });
  it('set', () => {
    let value = signal(0);
    let value2 = computed(() => value());
    expect(value2()).eq(0);
    value.set(1);
    expect(value2()).eq(1);
  });
  it('update', () => {
    let value = signal(0);
    let value2 = computed(() => value());
    expect(value2()).eq(0);
    value.update((value) => value + 1);
    expect(value2()).eq(1);
  });
});
