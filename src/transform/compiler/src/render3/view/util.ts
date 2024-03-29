/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { InputFlags } from '../../core';

import * as o from '../../output/output_ast';

/** Special value representing a direct access to a template's context. */
export const DIRECT_CONTEXT_REFERENCE = '#context';

/**
 * A representation for an object literal used during codegen of definition objects. The generic
 * type `T` allows to reference a documented type of the generated structure, such that the
 * property names that are set can be resolved to their documented declaration.
 */
export class DefinitionMap<T = any> {
  values: { key: string; quoted: boolean; value: o.Expression }[] = [];

  set(key: keyof T, value: o.Expression | null): void {
    if (value) {
      const existing = this.values.find((value) => value.key === key);

      if (existing) {
        existing.value = value;
      } else {
        this.values.push({ key: key as string, value, quoted: false });
      }
    }
  }

  toLiteralMap(): o.LiteralMapExpr {
    return o.literalMap(this.values);
  }
}
