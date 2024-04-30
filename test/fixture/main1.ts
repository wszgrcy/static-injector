import { Injectable, Injector, inject } from 'static-injector';
import * as sub from './sub1';

export class Main1Class {
  private sub = inject(sub.Sub1Class);
  constructor() {}
  hello() {
    return this.sub.hello();
  }
}
let injector = Injector.create({
  providers: [{ provide: Main1Class }, { provide: sub.Sub1Class }],
});
export const instance = injector.get(Main1Class);
