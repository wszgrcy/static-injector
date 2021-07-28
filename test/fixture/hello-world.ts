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
} from 'static-injector';

@Injectable()
export class FirstClass {
  constructor(
    @Inject(token) token: number,
    @Inject('noValue') @Optional() noValue,
    @Inject(token2) @Optional() @SkipSelf() token2,
    @Inject('factory') factory,
    secondClass: SecondClass | null,
    rootInjectClass: RootInjectClass
  ) {
    console.log('输出', token);
    console.log('noValue', noValue);
    console.log(rootInjectClass);
    console.log(factory);
    console.log(secondClass);
  }
}
@Injectable()
class SecondClass {}
// todo 修改逻辑支持root
@Injectable({ providedIn: 'root' })
class RootInjectClass {}

let token = new InjectionToken('token');
let token2 = new InjectionToken('token2');

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
