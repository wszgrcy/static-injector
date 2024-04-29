import { Injectable, Injector } from 'static-injector';
export class Parent {
  name = 'parent';
  hello() {
    return '';
  }
}
export class MyClass extends Parent {
  hello() {
    return 'hello' + this.name;
  }
}
let injector = Injector.create({ providers: [{ provide: MyClass }] });
export const instance = injector.get(MyClass);
