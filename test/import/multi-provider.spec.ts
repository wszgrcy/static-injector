import { list } from '../fixture/multi-provider';

describe('multi-provider', () => {
  it('multi-provider', () => {
    expect(list).toEqual([123, 456]);
  });
});
