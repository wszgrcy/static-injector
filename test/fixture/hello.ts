import { Injectable, Injector } from 'static-injector';
export class MyClass {
  hello() {
    return 'hello';
  }
}
let injector = Injector.create({ providers: [{ provide: MyClass }] });
export const instance = injector.get(MyClass);
