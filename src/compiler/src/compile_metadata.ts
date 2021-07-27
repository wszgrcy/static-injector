/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { stringify } from "../../util/stringify";
import { StaticSymbol } from "./aot/static_symbol";

// group 0: "[prop] or (event) or @trigger"
// group 1: "prop" from "[prop]"
// group 2: "event" from "(event)"
// group 3: "@trigger" from "@trigger"

export function sanitizeIdentifier(name: string): string {
  return name.replace(/\W/g, "_");
}

let _anonymousTypeIndex = 0;

export function identifierName(
  compileIdentifier: CompileIdentifierMetadata | null | undefined
): string | null {
  if (!compileIdentifier || !compileIdentifier.reference) {
    return null;
  }
  const ref = compileIdentifier.reference;
  if (ref instanceof StaticSymbol) {
    return ref.name;
  }
  if (ref["__anonymousType"]) {
    return ref["__anonymousType"];
  }
  if (ref["__forward_ref__"]) {
    // We do not want to try to stringify a `forwardRef()` function because that would cause the
    // inner function to be evaluated too early, defeating the whole point of the `forwardRef`.
    return "__forward_ref__";
  }
  let identifier = stringify(ref);
  if (identifier.indexOf("(") >= 0) {
    // case: anonymous functions!
    identifier = `anonymous_${_anonymousTypeIndex++}`;
    ref["__anonymousType"] = identifier;
  } else {
    identifier = sanitizeIdentifier(identifier);
  }
  return identifier;
}

export function identifierModuleUrl(
  compileIdentifier: CompileIdentifierMetadata
): string {
  const ref = compileIdentifier.reference;
  if (ref instanceof StaticSymbol) {
    return ref.filePath;
  }
  // Runtime type
  return `./${stringify(ref)}`;
}

export interface CompileIdentifierMetadata {
  reference: any;
}
