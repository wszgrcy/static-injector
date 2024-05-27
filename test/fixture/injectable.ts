import {
  inject,
  Injectable,
  InjectionToken,
  Injector,
  INJECTOR_SCOPE,
  RootStaticInjectOptions
} from 'static-injector';
let token = new InjectionToken<string>('token');

export class MyClass extends RootStaticInjectOptions{
  private token = inject(token);
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
