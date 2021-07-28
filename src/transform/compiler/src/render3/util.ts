/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as o from '../output/output_ast';

export function typeWithParameters(
  type: o.Expression,
  numParams: number
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
