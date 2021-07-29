import { Injectable, Injector } from 'static-injector';
interface A {}
@Injectable()
export class MyClass {
  constructor(a: A) {}
}
let injector = Injector.create({ providers: [{ provide: MyClass }] });
export const instance = injector.get(MyClass);
