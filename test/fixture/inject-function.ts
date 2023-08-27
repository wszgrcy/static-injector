import { inject, Injectable, Injector, INJECTOR_SCOPE } from 'static-injector';
@Injectable()
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
@Injectable()
export class InjectClass {
  name = 'InjectClass';
}
@Injectable({ providedIn: 'root' })
export class RootInjectClass {
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
