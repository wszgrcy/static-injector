import {
  Injectable,
  R3Injector,
  InjectionToken,
  Inject,
} from 'static-injector';

@Injectable()
export class FirstClass {
  constructor(@Inject(token) token) {
    console.log('输出', token);
  }
}
let token = new InjectionToken('');
let injector = new R3Injector(
  { name: 'test' } as any,
  [{ provide: FirstClass }, { provide: token, useValue: 123 }],
  undefined
);
let instance = injector.get(FirstClass);
console.log(instance);
