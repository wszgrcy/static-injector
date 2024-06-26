import { Inject, Injector, Optional, inject } from 'static-injector';

export class MyClass {
  private useClassClass = inject(UseClassClass);
  private useFactoryClass = inject(UseFactoryClass);
  private useExistingClass = inject(UseExistingClass);
  private classWithDeps = inject(ClassWithDeps);
  constructor() {}
  out() {
    return {
      useClassClass: this.useClassClass,
      useFactoryClass: this.useFactoryClass,
      useExistingClass: this.useExistingClass,
      classWithDeps: this.classWithDeps,
    };
  }
}

export class UseClassClass {
  name = 'UseClassClass';
}

export class UseFactoryClass {
  name = '';
  constructor(
    private input: string,
    public noValue: string,
    public injectValue: string,
  ) {
    this.name = input;
  }
}

export class UseExistingClass {
  name = 'noToBeUsed';
  constructor(private input: string) {}
}

export class ClassWithDeps {
  constructor(public name: string) {}
}
let injector = Injector.create({
  providers: [
    { provide: MyClass },
    { provide: UseClassClass, useClass: UseClassClass },
    {
      provide: ClassWithDeps,
      useClass: ClassWithDeps,
      deps: ['inputValueToken'],
    },
    { provide: 'inputValueToken', useValue: 'inputValue' },
    {
      provide: UseFactoryClass,
      useFactory: (value: string, noValue: string, injectValue: string) => {
        return new UseFactoryClass(value, noValue, injectValue);
      },
      deps: [
        'inputValueToken',
        [new Optional(), 'test'],
        [new Inject('inputValueToken')],
      ],
    },
    {
      provide: UseExistingClass,
      useExisting: UseFactoryClass,
    },
  ],
});
export const instance = injector.get(MyClass);
