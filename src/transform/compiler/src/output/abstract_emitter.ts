/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as o from "./output_ast";

const _SINGLE_QUOTE_ESCAPE_STRING_RE = /'|\\|\n|\r|\$/g;
const _LEGAL_IDENTIFIER_RE = /^[$A-Z_][0-9A-Z_$]*$/i;
const _INDENT_WITH = "  ";
export const CATCH_ERROR_VAR = o.variable("error", null, null);
export const CATCH_STACK_VAR = o.variable("stack", null, null);

export interface OutputEmitter {
  emitStatements(
    genFilePath: string,
    stmts: o.Statement[],
    preamble?: string | null
  ): string;
}
