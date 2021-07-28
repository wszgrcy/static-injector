import {
  Injectable,
  R3Injector,
  InjectionToken,
  Inject,
  Optional,
  NullInjector,
  SkipSelf,
  Injector,
  InjectFlags,
  INJECTOR_SCOPE,
  Host,
} from 'static-injector';
let token = new InjectionToken('token');
let token2 = new InjectionToken('token2');
@Injectable()
export class FirstClass {
  constructor(
    @Inject(token) @Host() token: number,
    @Inject('noValue') @Optional() noValue,
    @Inject(token2) @Optional() @SkipSelf() token2,
    @Inject('factory') factory,
    secondClass: SecondClass | null,
    rootInjectClass: RootInjectClass,
    factoryClass: FactoryClass
  ) {
    console.log('输出', token);
    console.log('noValue', noValue);
    console.log(rootInjectClass);
    console.log(factory);
    console.log(secondClass);
    console.log(factoryClass);
  }
}
@Injectable()
class SecondClass {}
// todo 修改逻辑支持root
@Injectable({ providedIn: 'root' })
class RootInjectClass {}
@Injectable({
  providedIn: 'root',
  deps: [token],
  useFactory: (token) => {
    return new FactoryClass(token);
  },
})
class FactoryClass {
  constructor(token) {
    console.log('使用工厂', token);
  }
}

let injector = new R3Injector(
  { name: 'test' } as any,
  [
    { provide: INJECTOR_SCOPE, useValue: 'root' },
    { provide: FirstClass },
    { provide: SecondClass },
    { provide: token, useValue: 123 },
    {
      provide: 'factory',
      useFactory: (token) => {
        return 'isUseFactory' + token;
      },
      deps: [[new Optional(), token]],
    },
  ],
  new NullInjector()
);
let instance2 = Injector.create({
  providers: [{ provide: token, useValue: 456 }],
  parent: injector,
});
let instance = injector.get(FirstClass);
console.log(instance2.get(token, undefined, InjectFlags.SkipSelf));
console.log(instance2.get(token));
console.log(instance);
