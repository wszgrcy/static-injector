import {
  Inject,
  Injectable,
  InjectionToken,
  Injector,
  Optional,
  Self,
  SkipSelf,
  inject,
} from 'static-injector';

export class MyClass {
  private token1 = inject(token1);
  private token1WithInjectorL2 = inject(token1, { skipSelf: true });
  private token1WithSelf = inject(token1, { self: true });
  constructor() {}
  out() {
    return {
      token1: this.token1,
      token1WithInjectorL2: this.token1WithInjectorL2,
      token1WithSelf: this.token1WithSelf,
    };
  }
}
let token1 = new InjectionToken('token1');
let injectorL1 = Injector.create({
  providers: [{ provide: token1, useValue: 1 }],
});
let injectorL2 = Injector.create({
  providers: [{ provide: token1, useValue: 2 }],
  parent: injectorL1,
});
let injectorL3 = Injector.create({
  providers: [{ provide: MyClass }, { provide: token1, useValue: 3 }],
  parent: injectorL2,
});
export const instance = injectorL3.get(MyClass);
