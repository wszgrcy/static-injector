/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as o from "../../output/output_ast";

/**
 * Checks whether an object key contains potentially unsafe chars, thus the key should be wrapped in
 * quotes. Note: we do not wrap all keys into quotes, as it may have impact on minification and may
 * bot work in some cases when object keys are mangled by minifier.
 *
 * TODO(FW-1136): this is a temporary solution, we need to come up with a better way of working with
 * inputs that contain potentially unsafe chars.
 */
const UNSAFE_OBJECT_KEY_NAME_REGEXP = /[-.]/;

/** Name of the temporary to use during data binding */
export const TEMPORARY_NAME = "_t";

/** Name of the context parameter passed into a template function */
export const CONTEXT_NAME = "ctx";

/** Name of the RenderFlag passed into a template function */
export const RENDER_FLAGS = "rf";

/** The prefix reference variables */
export const REFERENCE_PREFIX = "_r";

/** The name of the implicit context reference */
export const IMPLICIT_REFERENCE = "$implicit";

/** Non bindable attribute name **/
export const NON_BINDABLE_ATTR = "ngNonBindable";

/** Name for the variable keeping track of the context returned by `ɵɵrestoreView`. */
export const RESTORED_VIEW_CONTEXT_NAME = "restoredCtx";

/**
 * Creates an allocator for a temporary variable.
 *
 * A variable declaration is added to the statements the first time the allocator is invoked.
 */
export function temporaryAllocator(
  statements: o.Statement[],
  name: string
): () => o.ReadVarExpr {
  let temp: o.ReadVarExpr | null = null;
  return () => {
    if (!temp) {
      statements.push(
        new o.DeclareVarStmt(TEMPORARY_NAME, undefined, o.DYNAMIC_TYPE)
      );
      temp = o.variable(name);
    }
    return temp;
  };
}

/**
 * A representation for an object literal used during codegen of definition objects. The generic
 * type `T` allows to reference a documented type of the generated structure, such that the
 * property names that are set can be resolved to their documented declaration.
 */
export class DefinitionMap<T = any> {
  values: { key: string; quoted: boolean; value: o.Expression }[] = [];

  set(key: keyof T, value: o.Expression | null): void {
    if (value) {
      this.values.push({ key: key as string, value, quoted: false });
    }
  }

  toLiteralMap(): o.LiteralMapExpr {
    return o.literalMap(this.values);
  }
}
