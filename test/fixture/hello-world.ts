(global as any).ngDevMode = undefined;
import { Injectable } from "../../src/decorator/injectable";
import { Inject } from "../../src/di/metadata";
import { R3Injector } from "../../src/di/r3_injector";

@Injectable({ providedIn: "root" })
export class FirstClass {
  constructor(@Inject("aaa") test) {}
}

let injector = new R3Injector(
  { name: "test" } as any,
  [{ provide: FirstClass }],
  undefined
);
let instance = injector.get(FirstClass);
console.log(instance);
