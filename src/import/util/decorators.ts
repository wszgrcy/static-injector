/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import { Type } from '../interface/type';

import { noSideEffects } from './closure';

/**
 * An interface implemented by all Angular type decorators, which allows them to be used as
 * decorators as well as Angular syntax.
 *
 * ```ts
 * @ng.Component({...})
 * class MyClass {...}
 * ```
 *
 * @publicApi
 */
export interface TypeDecorator {
  /**
   * Invoke as decorator.
   */
  <T extends Type<any>>(type: T): T;

  // Make TypeDecorator assignable to built-in ParameterDecorator type.
  // ParameterDecorator is declared in lib.d.ts as a `declare type`
  // so we cannot declare this interface as a subtype.
  // see https://github.com/angular/angular/issues/3379#issuecomment-126169417
  (
    target: Object,
    propertyKey?: string | symbol,
    parameterIndex?: number,
  ): void;
  // Standard (non-experimental) Decorator signature that avoids direct usage of
  // any TS 5.0+ specific types.
  (target: unknown, context: unknown): void;
}
export const PARAMETERS = '__parameters__';

function makeMetadataCtor(props?: (...args: any[]) => any): any {
  return function ctor(this: any, ...args: any[]) {
    if (props) {
      const values = props(...args);
      for (const propName in values) {
        this[propName] = values[propName];
      }
    }
  };
}

export function makeParamDecorator(
  name: string,
  props?: (...args: any[]) => any,
  parentClass?: any,
): any {
  return noSideEffects(() => {
    const metaCtor = makeMetadataCtor(props);
    function ParamDecoratorFactory(
      this: unknown | typeof ParamDecoratorFactory,
      ...args: any[]
    ): any {
      metaCtor.apply(this, args);
      return this;
    }
    if (parentClass) {
    }

    return ParamDecoratorFactory;
  });
}
