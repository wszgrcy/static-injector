/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as o from "../../output/output_ast";
import { Identifiers } from "../r3_identifiers";

/**
 * Generate an expression that has the given `expr` wrapped in the following form:
 *
 * ```
 * forwardRef(() => expr)
 * ```
 */
export function generateForwardRef(expr: o.Expression): o.Expression {
  return o
    .importExpr(Identifiers.forwardRef)
    .callFn([o.fn([], [new o.ReturnStatement(expr)])]);
}
