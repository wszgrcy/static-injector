import { Injectable, Injector } from 'static-injector';

export class MyClass {
  constructor(a) {}
}
let injector = Injector.create({ providers: [{ provide: MyClass }] });
export const instance = injector.get(MyClass);
