/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { throwProviderNotFoundError } from "../render3/errors_di";
import { stringify } from "../util/stringify";

import { getInjectableDef, ɵɵInjectableDeclaration } from "./interface/defs";
import { InjectFlags } from "./interface/injector";
import { ProviderToken } from "./provider_token";

/**
 * Injects `root` tokens in limp mode.
 *
 * If no injector exists, we can still inject tree-shakable providers which have `providedIn` set to
 * `"root"`. This is known as the limp mode injection. In such case the value is stored in the
 * injectable definition.
 */
export function injectRootLimpMode<T>(
  token: ProviderToken<T>,
  notFoundValue: T | undefined,
  flags: InjectFlags
): T | null {
  const injectableDef: ɵɵInjectableDeclaration<T> | null =
    getInjectableDef(token);
  if (injectableDef && injectableDef.providedIn == "root") {
    return injectableDef.value === undefined
      ? (injectableDef.value = injectableDef.factory())
      : injectableDef.value;
  }
  if (flags & InjectFlags.Optional) return null;
  if (notFoundValue !== undefined) return notFoundValue;
  throwProviderNotFoundError(stringify(token), "Injector");
}
