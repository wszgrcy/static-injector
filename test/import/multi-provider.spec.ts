import { expect } from 'chai';
import { list } from '../fixture/multi-provider';

describe('multi-provider', () => {
  it('multi-provider', () => {
    expect(list).deep.eq([123, 456]);
  });
});
