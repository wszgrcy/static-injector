import { InjectionToken, Injector } from 'static-injector';
let token = new InjectionToken('token');
let injector = Injector.create({
  providers: [
    { provide: token, useValue: 123, multi: true },
    { provide: token, useValue: 456, multi: true },
  ],
});

let list = injector.get(token);
export { list };
