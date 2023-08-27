import { Injectable, Injector } from 'static-injector';

function OtherDecorator() {
  return function (target: any) {};
}

@OtherDecorator()
export class OnlyOtherClass {
  hello() {
    return 'hello';
  }
}

export const result = new OnlyOtherClass().hello();
@OtherDecorator()
@Injectable()
export class BothClass {
  hello() {
    return 'hello';
  }
}
let injector = Injector.create({ providers: [{ provide: BothClass }] });
export const instance = injector.get(BothClass);
