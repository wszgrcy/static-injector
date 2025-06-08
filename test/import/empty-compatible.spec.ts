import { expect } from 'chai';
import { result } from '../fixture/sub-class';
import { createRootInjector, Injectable } from 'static-injector';
@Injectable()
class A {
  hello() {
    return 1;
  }
}
describe('empty-compatiable', () => {
  it('兼容之前的Injectable语法(不会报错,但是也不生效)', () => {
    let injector = createRootInjector({ providers: [A] });
    expect(injector.get(A).hello()).eq(1);
  });
});
