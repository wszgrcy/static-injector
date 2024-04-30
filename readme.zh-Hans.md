| [中文](https://github.com/wszgrcy/static-injector/blob/main/readme.zh-Hans.md) | [English](./readme.md) |
|-|-|
# 简介

- Angular 依赖注入的独立版本
- 使用方法与 Angular 的依赖注入完全一致
- 不需要任何转换器,引入即可使用
- 0依赖
- 移除装饰器
> `@Injectable()`=>`static injectOptions={}`
> `@Inject() xx`=>`xx=inject()`
> `@Optional()`=>`xx=inject(token,{optional:true})`
- `JS`/`TS`支持
# 来源
- Angular 17.3.6

# 使用方法

- 以`Injector.create`创建第一级依赖注入器

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

# 与`injection-js`的不同

- `injection-js`属于动态依赖注入,是 Angular5 之前使用的版本,目前已经不再更新
- 两者基本上可以互换(细节部分需要调整)

- 支持构造时期使用`inject`

# 无装饰器
- 原来使用`@Injectable()`传参改为`static injectOptions={}`.如果没有参数即不需要设置
- 原来`@Optional`,`@SkipSelf`,`@Self`,请使用`inject`的第二个传参代替


# 测试

- 做了一部分的单元测试.保证大部分功能正常使用
- 因为大部分代码本身就是从 Angular 中提取的,所以稳定性肯定也是有保证

# 同步
- 目前重构了同步逻辑,使用`@code-recycle/cli`进行修改,保证与`angular`官方版本一致

# 实例
- [https://github.com/wszgrcy/static-injector/tree/main/test/import](https://github.com/wszgrcy/static-injector/tree/main/test/import)