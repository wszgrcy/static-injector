| [中文](./readme-zh-Hans.md) | [English](./readme.md) |
|-|-|

# Introduction

- Angular dependency injection standalone version
- The usage method is completely consistent with Angular's dependency injection

# Source
- Angular 17.3.1

# dependency
- ts 5.4.2

# Usage

- Create a first level dependency injector with `Injector.create`
- Declare as a dependency injection class using the `@Injectable` decorator

# Different from `injection js`

- `injection-js` belongs to dynamic dependency injection and is a version used before Angular5. After Angular5, it has been converted to static dependency injection
- In theory, it would be faster than `injection-js` (otherwise Angular wouldn't do the replacement...), but there was no benchmark done
- Need to use `typescript` to call the transformer for conversion/use webpack's ts loader to pass in the converter/roll up/ts node/other conversion tools support typescript and custom converters that support typescript
- The two are basically interchangeable (the details need to be adjusted)

- Support the use of `inject` during construction

# Test

- Partially conducted unit testing to ensure that most functions are functioning properly
- Because most of the code itself is extracted from Angular, stability is definitely guaranteed

# Sync
- Currently, the synchronization logic has been refactored and modified using `@code recycle/cli` to ensure consistency with the official version of `angular`

# Template

- [Used under typescript (using Typescript Compiler API)](https://github.com/wszgrcy/static-injector-typescript-template)
- [Used under webpack](https://github.com/wszgrcy/static-injector-webpack-template)
- [Using Rollup](https://github.com/wszgrcy/static-injector-rollup-template)
