import { Injectable, Injector } from 'static-injector';
@Injectable()
export class MyClass {
  constructor(
    private useClassClass: UseClassClass,
    private useFactoryClass: UseFactoryClass,
    private useExistingClass: UseExistingClass
  ) {}
  out() {
    return {
      useClassClass: this.useClassClass,
      useFactoryClass: this.useFactoryClass,
      useExistingClass: this.useExistingClass,
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
  constructor(private input) {
    this.name = input;
  }
}
@Injectable()
export class UseExistingClass {
  name = 'noToBeUsed';
  constructor(private input) {}
}

let injector = Injector.create({
  providers: [
    { provide: MyClass },
    { provide: UseClassClass, useClass: UseClassClass },
    { provide: 'inputValueToken', useValue: 'inputValue' },
    {
      provide: UseFactoryClass,
      useFactory: (value) => {
        return new UseFactoryClass(value);
      },
      deps: ['inputValueToken'],
    },
    {
      provide: UseExistingClass,
      useExisting: UseFactoryClass,
    },
  ],
});
export const instance = injector.get(MyClass);
