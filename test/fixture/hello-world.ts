(global as any).ngDevMode = undefined;
import { Injectable } from "../../src/import";
import { Inject } from "../../src/import";
import { R3Injector } from "../../src/import";

@Injectable()
export class FirstClass {
  constructor() {}
}

let injector = new R3Injector(
  { name: "test" } as any,
  [{ provide: FirstClass }],
  undefined
);
let instance = injector.get(FirstClass);
console.log(instance);
