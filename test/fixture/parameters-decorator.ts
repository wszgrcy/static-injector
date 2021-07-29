import {
  Inject,
  Injectable,
  InjectionToken,
  Injector,
  Optional,
  Self,
  SkipSelf,
} from 'static-injector';
@Injectable()
export class MyClass {
  constructor(
    @Inject(token1) private token1,
    @Inject('noValue') @Optional() private noValue,
    @Inject(token1) @SkipSelf() private token1WithInjectorL2,
    @Inject(token1) @Self() private token1WithSelf
  ) {}
  out() {
    return {
      token1: this.token1,
      noValue: this.noValue,
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
