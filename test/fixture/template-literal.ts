import { Inject, Injectable, Injector } from 'static-injector';
@Injectable()
export class TemplateLiteralClass {
  constructor(@Inject(`valu` + 'e') private noValue: boolean) {}
  out() {
    return {
      noValue: this.noValue,
    };
  }
}

let inject = Injector.create({
  providers: [
    { provide: TemplateLiteralClass },
    { provide: `valu` + 'e', useValue: true },
  ],
});
export const instance = inject.get(TemplateLiteralClass);
