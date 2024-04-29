import {
  inject,
  Injectable,
  InjectionToken,
  Injector,
  INJECTOR_SCOPE,
  Optional,
  SkipSelf,
} from 'static-injector';
let token = new InjectionToken<string>('token');

export class MyClass {
  static injectOptions = { providedIn: 'root' };
  private token = inject(token);
  constructor() {}
  out() {
    return { token: this.token };
  }
}
let injector = Injector.create({
  providers: [
    { provide: token, useValue: 111 },
    { provide: INJECTOR_SCOPE, useValue: 'root' },
  ],
});
export const instance = injector.get(MyClass);
