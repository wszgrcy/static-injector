import { Injectable, Injector, R3Injector } from 'static-injector';
let isDestroy = false;
@Injectable()
export class MyClass {
  ngOnDestroy(): void {
    isDestroy = true;
  }
}

let injector = Injector.create({
  providers: [{ provide: MyClass }],
}) as R3Injector;
injector.get(MyClass);
injector.destroy();
export { isDestroy };
