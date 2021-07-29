import { Injectable, Injector } from 'static-injector';
@Injectable()
export class MyClass {
  constructor(a: number | string) {}
}
let injector = Injector.create({ providers: [{ provide: MyClass }] });
export const instance = injector.get(MyClass);
