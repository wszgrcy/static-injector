import { Injectable, Injector } from 'static-injector';
import * as sub from './sub1';
@Injectable()
export class Main1Class {
  constructor(private sub: sub.Sub1Class) {}
  hello() {
    return this.sub.hello();
  }
}
let injector = Injector.create({
  providers: [{ provide: Main1Class }, { provide: sub.Sub1Class }],
});
export const instance = injector.get(Main1Class);
