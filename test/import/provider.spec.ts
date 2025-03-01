import { expect } from 'chai';
import { instance, UseFactoryClass } from '../fixture/provider';
describe('provider', () => {
  it('provider', () => {
    let out = instance.out();
    expect(out.useClassClass.name).eq('UseClassClass');
    expect(out.useExistingClass instanceof UseFactoryClass).ok;
    expect(out.useExistingClass.name).eq('inputValue');
    expect(out.useFactoryClass.name).eq('inputValue');
    expect(out.useFactoryClass.name).eq('inputValue');
    expect(out.useFactoryClass.injectValue).eq('inputValue');
    expect(out.useFactoryClass.noValue).eq(null);
    expect(out.classWithDeps.name).eq('inputValue');
  });
});
