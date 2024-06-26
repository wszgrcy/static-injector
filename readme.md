| [中文](https://github.com/wszgrcy/static-injector/blob/main/readme.zh-Hans.md) | [English](./readme.md) |
| ------------------------------------------------------------------------------ | ---------------------- |

# Introduction

- Angular dependency injection standalone version
- The usage method is completely consistent with Angular's dependency injection
- No transformer required
- 0 dependencies
- Remove Decorator
> `@Injectable()`=>`static injectOptions={}`
> `@Inject() xx`=>`xx=inject()`
> `@Optional()`=>`xx=inject(token,{optional:true})`
- `JS`/`TS` Support

# Source

- Angular 18.0.0

# Usage

- Create a first level dependency injector with `Injector.create`
```ts
import { Injector, inject } from 'static-injector';

class Main {
  child = inject(Child);
}
class Child {
  output() {
    return 'hello world';
  }
}
let injector = Injector.create({ providers: [Main, Child] });
const instance = injector.get(Main);
console.log(instance.child.output());
```

# Different from `injection-js`

- `injection-js` belongs to dynamic dependency injection and is a version used before Angular5. Currently no longer updated
- The two are basically interchangeable (the details need to be adjusted)

- Support the use of `inject` during construction

# No Decorator

- The original use of `@Injectable()` to pass parameters has been changed to `static injectOptions={}`. If there are no parameters, there is no need to set them
- Originally, `@Optional`, `@SkipSelf`, `@Self`, please use the second pass parameter of `inject` instead

# Test

- Partially conducted unit testing to ensure that most functions are functioning properly
- Because most of the code itself is extracted from Angular, stability is definitely guaranteed

# Sync

- Currently, the synchronization logic has been refactored and modified using `@code-recycle/cli` to ensure consistency with the official version of `angular`

# Examples
- [https://github.com/wszgrcy/static-injector/tree/main/test/import](https://github.com/wszgrcy/static-injector/tree/main/test/import)