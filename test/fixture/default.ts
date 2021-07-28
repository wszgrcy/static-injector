import { Injectable, Injector } from 'static-injector';
@Injectable()
class MyClass {}
let injector = Injector.create({ providers: [{ provide: MyClass }] });
injector.get(MyClass);
