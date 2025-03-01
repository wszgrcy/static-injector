import { expect } from 'chai';
import { signal } from 'static-injector';

describe('signal', () => {
  it('hello', () => {
    let value = signal(0);
    expect(value()).eq(0);
  });
  it('set', () => {
    let value = signal(0);
    value.set(1);
    expect(value()).eq(1);
  });
  it('update', () => {
    let value = signal(0);
    value.update((value) => value + 1);
    expect(value()).eq(1);
  });
});
