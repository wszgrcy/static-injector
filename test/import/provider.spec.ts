import { instance, UseFactoryClass } from '../fixture/provider';
describe('provider', () => {
  it('provider', () => {
    let out = instance.out();
    expect(out.useClassClass.name).toBe('UseClassClass');
    expect(out.useExistingClass instanceof UseFactoryClass).toBeTruthy();
    expect(out.useExistingClass.name).toBe('inputValue');
    expect(out.useFactoryClass.name).toBe('inputValue');
    expect(out.useFactoryClass.name).toBe('inputValue');
    expect(out.useFactoryClass.injectValue).toBe('inputValue');
    expect(out.useFactoryClass.noValue).toBe(null);
    expect(out.classWithDeps.name).toBe('inputValue');
  });
});
