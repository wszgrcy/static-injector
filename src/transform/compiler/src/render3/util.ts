/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as o from '../output/output_ast';

import { Identifiers } from './r3_identifiers';

export function typeWithParameters(
  type: o.Expression,
  numParams: number,
): o.ExpressionType {
  if (numParams === 0) {
    return o.expressionType(type);
  }
  const params: o.Type[] = [];
  for (let i = 0; i < numParams; i++) {
    params.push(o.DYNAMIC_TYPE);
  }
  return o.expressionType(type, undefined, params);
}

export interface R3Reference {
  value: o.Expression;
  type: o.Expression;
}

/**
 * Result of compilation of a render3 code unit, e.g. component, directive, pipe, etc.
 */
export interface R3CompiledExpression {
  expression: o.Expression;
  type: o.Type;
  statements: o.Statement[];
}

/**
 * Describes an expression that may have been wrapped in a `forwardRef()` guard.
 *
 * This is used when describing expressions that can refer to types that may eagerly reference types
 * that have not yet been defined.
 */
export interface MaybeForwardRefExpression<
  T extends o.Expression = o.Expression,
> {
  /**
   * The unwrapped expression.
   */
  expression: T;
  /**
   * Specified whether the `expression` contains a reference to something that has not yet been
   * defined, and whether the expression is still wrapped in a `forwardRef()` call.
   *
   * If this value is `ForwardRefHandling.None` then the `expression` is safe to use as-is.
   *
   * Otherwise the `expression` was wrapped in a call to `forwardRef()` and must not be eagerly
   * evaluated. Instead it must be wrapped in a function closure that will be evaluated lazily to
   * allow the definition of the expression to be evaluated first.
   *
   * In full AOT compilation it can be safe to unwrap the `forwardRef()` call up front if the
   * expression will actually be evaluated lazily inside a function call after the value of
   * `expression` has been defined.
   *
   * But in other cases, such as partial AOT compilation or JIT compilation the expression will be
   * evaluated eagerly in top level code so will need to continue to be wrapped in a `forwardRef()`
   * call.
   *
   */
  forwardRef: ForwardRefHandling;
}

export function createMayBeForwardRefExpression<T extends o.Expression>(
  expression: T,
  forwardRef: ForwardRefHandling,
): MaybeForwardRefExpression<T> {
  return { expression, forwardRef };
}

/**
 * Convert a `MaybeForwardRefExpression` to an `Expression`, possibly wrapping its expression in a
 * `forwardRef()` call.
 *
 * If `MaybeForwardRefExpression.forwardRef` is `ForwardRefHandling.Unwrapped` then the expression
 * was originally wrapped in a `forwardRef()` call to prevent the value from being eagerly evaluated
 * in the code.
 *
 * See `packages/compiler-cli/src/ngtsc/annotations/src/injectable.ts` and
 * `packages/compiler/src/jit_compiler_facade.ts` for more information.
 */
export function convertFromMaybeForwardRefExpression({
  expression,
  forwardRef,
}: MaybeForwardRefExpression): o.Expression {
  switch (forwardRef) {
    case ForwardRefHandling.None:
    case ForwardRefHandling.Wrapped:
      return expression;
    case ForwardRefHandling.Unwrapped:
      return generateForwardRef(expression);
  }
}

/**
 * Generate an expression that has the given `expr` wrapped in the following form:
 *
 * ```
 * forwardRef(() => expr)
 * ```
 */
export function generateForwardRef(expr: o.Expression): o.Expression {
  return o.importExpr(Identifiers.forwardRef).callFn([o.arrowFn([], expr)]);
}

/**
 * Specifies how a forward ref has been handled in a MaybeForwardRefExpression
 */
export const enum ForwardRefHandling {
  /** The expression was not wrapped in a `forwardRef()` call in the first place. */
  None,
  /** The expression is still wrapped in a `forwardRef()` call. */
  Wrapped,
  /** The expression was wrapped in a `forwardRef()` call but has since been unwrapped. */
  Unwrapped,
}
