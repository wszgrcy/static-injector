import { inject, Injectable, Injector, INJECTOR_SCOPE } from 'static-injector';
export class MyClass {
  private injectClass = inject(InjectClass);
  private rootInjectClass = inject(RootInjectClass);

  constructor() {}
  out() {
    return {
      injectClass: this.injectClass,
      rootInjectClass: this.rootInjectClass,
    };
  }
}
export class InjectClass {
  name = 'InjectClass';
}

export class RootInjectClass {
  static injectOptions = { providedIn: 'root' };
  name = 'RootInjectClass';
}

let injector = Injector.create({
  providers: [
    { provide: MyClass },
    { provide: InjectClass },
    {
      provide: INJECTOR_SCOPE,
      useValue: 'root',
    },
  ],
});
export const instance = injector.get(MyClass);
