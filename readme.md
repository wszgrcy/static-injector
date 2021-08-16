# 简介

- 这是 Angualr 依赖注入的独立版本,初始版本逻辑为从 Angular 源码中提取出来,并修复了一些已知 bug
- 使用方法与 Angular 的依赖注入完全一致

# 使用方法

- 以`Injector.create`创建第一级依赖注入器
- 声明为依赖注入类即为`@Injectable`装饰器

# 与`injection-js`的不同

- `injection-js`属于动态依赖注入,是 Angular5 之前使用的版本,Angular5 之后转为静态依赖注入
- 理论上会比`injection-js`快一些(否则 Angular 也不会做替换...),但是没有做 Benchmark
- 需要会使用`typescript`调用转换器进行转换,或者使用 webpack 的 ts-loader 传入转换器,或者其他转换工具支持 typescript 并且支持 typescript 的自定义转换器
  > 未来会提供各个打包工具的使用方法
- 两者基本上可以互换(细节部分需要调整)

# 测试

- 做了一部分的单元测试.保证大部分功能正常使用
- 因为大部分代码本身就是从 Angular 中提取的,所以稳定性肯定也是有保证

# 模板

- [webpack 下使用](https://github.com/wszgrcy/static-injector-webpack-template)
- [rollup 下使用](https://github.com/wszgrcy/static-injector-rollup-template)
