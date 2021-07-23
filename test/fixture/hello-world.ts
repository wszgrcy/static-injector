(global as any).ngDevMode = undefined;
import { Injectable } from '../../src/decorator/injectable';
import { R3Injector } from '../../src/di/r3_injector';

@Injectable()
export class FirstClass {}

let injector = new R3Injector({name:"test"} as any, [{ provide: FirstClass }], undefined);
let instance = injector.get(FirstClass);
console.log(instance);
