import { Inject, Injectable, Injector, Optional } from 'static-injector';
@Injectable()
export class MyClass {
  constructor(
    private useClassClass: UseClassClass,
    private useFactoryClass: UseFactoryClass,
    private useExistingClass: UseExistingClass,
    private classWithDeps: ClassWithDeps
  ) {}
  out() {
    return {
      useClassClass: this.useClassClass,
      useFactoryClass: this.useFactoryClass,
      useExistingClass: this.useExistingClass,
      classWithDeps: this.classWithDeps,
    };
  }
}
@Injectable()
export class UseClassClass {
  name = 'UseClassClass';
}
@Injectable()
export class UseFactoryClass {
  name = '';
  constructor(
    private input: string,
    public noValue: string,
    public injectValue: string
  ) {
    this.name = input;
  }
}
@Injectable()
export class UseExistingClass {
  name = 'noToBeUsed';
  constructor(private input: string) {}
}
@Injectable()
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
