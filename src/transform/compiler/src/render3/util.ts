/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as o from "../output/output_ast";

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

/**
 * todo 相关判断取消或者换一个变量
 */
export function devOnlyGuardedExpression(expr: o.Expression): o.Expression {
  return guardedExpression("ngDevMode", expr);
}

export function guardedExpression(
  guard: string,
  expr: o.Expression
): o.Expression {
  const guardExpr = new o.ExternalExpr({ name: guard, moduleName: null });
  const guardNotDefined = new o.BinaryOperatorExpr(
    o.BinaryOperator.Identical,
    new o.TypeofExpr(guardExpr),
    o.literal("undefined")
  );
  const guardUndefinedOrTrue = new o.BinaryOperatorExpr(
    o.BinaryOperator.Or,
    guardNotDefined,
    guardExpr,
    /* type */ undefined,
    /* sourceSpan */ undefined,
    true
  );
  return new o.BinaryOperatorExpr(
    o.BinaryOperator.And,
    guardUndefinedOrTrue,
    expr
  );
}
