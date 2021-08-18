import { InjectionToken, Injector, INJECTOR_SCOPE } from 'static-injector';

let token = new InjectionToken('token', {
  providedIn: 'root',
  factory: () => 'myToken',
});
let injector = Injector.create({
  providers: [{ provide: INJECTOR_SCOPE, useValue: 'root' }],
});
let value = injector.get(token);
let tokenToString = token.toString();
export { value, tokenToString };
