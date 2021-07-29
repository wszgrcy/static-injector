import {
  Injectable,
  InjectionToken,
  Injector,
  INJECTOR_SCOPE,
  Optional,
  SkipSelf,
} from 'static-injector';
let token = new InjectionToken('token');
@Injectable({
  providedIn: 'root',
  useFactory: (token) => new MyClass(token),
  deps: [
    [new Optional(), token],
    [new Optional(), 'aaa'],
  ],
})
export class MyClass {
  constructor(private token) {}
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
