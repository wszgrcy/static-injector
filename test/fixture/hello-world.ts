import {
  Injectable,
  R3Injector,
  InjectionToken,
  Inject,
  Optional,
} from 'static-injector';
import { NullInjector } from '../../src/import/di/null_injector';

@Injectable()
export class FirstClass {
  constructor(@Inject(token) token, @Inject('noValue') @Optional() noValue) {
    console.log('输出', token);
    console.log('noValue', noValue);
  }
}
let token = new InjectionToken('');
let injector = new R3Injector(
  { name: 'test' } as any,
  [{ provide: FirstClass }, { provide: token, useValue: 123 }],
  new NullInjector()
);
let instance = injector.get(FirstClass);
console.log(instance);
