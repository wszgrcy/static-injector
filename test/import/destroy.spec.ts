import { expect } from 'chai';
import { isDestroy } from '../fixture/destory';

describe('destroy', () => {
  it('destroy', () => {
    expect(isDestroy).eq(true);
  });
});
