import { Injector, inject } from 'static-injector';

class Main {
  child = inject(Child);
}
class Child {
  output() {
    return 'hello world';
  }
}
let injector = Injector.create({ providers: [Main, Child] });
const instance = injector.get(Main);
console.log(instance.child.output());
