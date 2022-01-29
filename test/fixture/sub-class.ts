import { Injectable, Injector } from 'static-injector';

export class FirstClass {
  init() {
    @Injectable()
    class SecondClass {
      name = 'second';
    }

    return Injector.create({ providers: [{ provide: SecondClass }] }).get(
      SecondClass
    ).name;
  }
}
export const result = new FirstClass().init();
