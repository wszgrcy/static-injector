/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as o from '../../output/output_ast';

export interface R3PartialDeclaration {
  /**
   * The minimum version of the compiler that can process this partial declaration.
   */
  minVersion: string;

  /**
   * Version number of the Angular compiler that was used to compile this declaration. The linker
   * will be able to detect which version a library is using and interpret its metadata accordingly.
   */
  version: string;

  /**
   * A reference to the `@angular/core` ES module, which allows access
   * to all Angular exports, including Ivy instructions.
   */
  ngImport: o.Expression;

  /**
   * Reference to the decorated class, which is subject to this partial declaration.
   */
  type: o.Expression;
}

// TODO(legacy-partial-output-inputs): Remove in v18.
// https://github.com/angular/angular/blob/d4b423690210872b5c32a322a6090beda30b05a3/packages/core/src/compiler/compiler_facade_interface.ts#L197-L199
export type LegacyInputPartialMapping =
  | string
  | [
      bindingPropertyName: string,
      classPropertyName: string,
      transformFunction?: o.Expression,
    ];

/**
 * Describes the shape of the objects that the `ɵɵngDeclareInjector()` accepts.
 */
export interface R3DeclareInjectorMetadata extends R3PartialDeclaration {
  /**
   * The list of providers provided by the injector.
   */
  providers?: o.Expression;
  /**
   * The list of imports into the injector.
   */
  imports?: o.Expression[];
}

/**
 * Describes the shape of the object that the `ɵɵngDeclareFactory()` function accepts.
 *
 * This interface serves primarily as documentation, as conformance to this interface is not
 * enforced during linking.
 */
export interface R3DeclareFactoryMetadata extends R3PartialDeclaration {
  /**
   * A collection of dependencies that this factory relies upon.
   *
   * If this is `null`, then the type's constructor is nonexistent and will be inherited from an
   * ancestor of the type.
   *
   * If this is `'invalid'`, then one or more of the parameters wasn't resolvable and any attempt to
   * use these deps will result in a runtime error.
   */
  deps: R3DeclareDependencyMetadata[] | 'invalid' | null;

  /**
   * Type of the target being created by the factory.
   */
  target: FactoryTarget;
}

export enum FactoryTarget {
  Directive = 0,
  Component = 1,
  Injectable = 2,
  Pipe = 3,
  NgModule = 4,
}

/**
 * Describes the shape of the object that the `ɵɵngDeclareInjectable()` function accepts.
 *
 * This interface serves primarily as documentation, as conformance to this interface is not
 * enforced during linking.
 */
export interface R3DeclareInjectableMetadata extends R3PartialDeclaration {
  /**
   * If provided, specifies that the declared injectable belongs to a particular injector:
   * - `InjectorType` such as `NgModule`,
   * - `'root'` the root injector
   * - `'any'` all injectors.
   * If not provided, then it does not belong to any injector. Must be explicitly listed in the
   * providers of an injector.
   */
  providedIn?: o.Expression;

  /**
   * If provided, an expression that evaluates to a class to use when creating an instance of this
   * injectable.
   */
  useClass?: o.Expression;

  /**
   * If provided, an expression that evaluates to a function to use when creating an instance of
   * this injectable.
   */
  useFactory?: o.Expression;

  /**
   * If provided, an expression that evaluates to a token of another injectable that this injectable
   * aliases.
   */
  useExisting?: o.Expression;

  /**
   * If provided, an expression that evaluates to the value of the instance of this injectable.
   */
  useValue?: o.Expression;

  /**
   * An array of dependencies to support instantiating this injectable via `useClass` or
   * `useFactory`.
   */
  deps?: R3DeclareDependencyMetadata[];
}

/**
 * Metadata indicating how a dependency should be injected into a factory.
 */
export interface R3DeclareDependencyMetadata {
  /**
   * An expression representing the token or value to be injected, or `null` if the dependency is
   * not valid.
   *
   * If this dependency is due to the `@Attribute()` decorator, then this is an expression
   * evaluating to the name of the attribute.
   */
  token: o.Expression | null;

  /**
   * Whether the dependency is injecting an attribute value.
   * Default: false.
   */
  attribute?: boolean;

  /**
   * Whether the dependency has an @Optional qualifier.
   * Default: false,
   */
  optional?: boolean;

  /**
   * Whether the dependency has an @Self qualifier.
   * Default: false,
   */
  self?: boolean;

  /**
   * Whether the dependency has an @SkipSelf qualifier.
   * Default: false,
   */
  skipSelf?: boolean;
}

/**
 * Describes the shape of the object that the `ɵɵngDeclareClassMetadata()` function accepts.
 *
 * This interface serves primarily as documentation, as conformance to this interface is not
 * enforced during linking.
 */
export interface R3DeclareClassMetadata extends R3PartialDeclaration {
  /**
   * The Angular decorators of the class.
   */
  decorators: o.Expression;

  /**
   * Optionally specifies the constructor parameters, their types and the Angular decorators of each
   * parameter. This property is omitted if the class does not have a constructor.
   */
  ctorParameters?: o.Expression;

  /**
   * Optionally specifies the Angular decorators applied to the class properties. This property is
   * omitted if no properties have any decorators.
   */
  propDecorators?: o.Expression;
}
