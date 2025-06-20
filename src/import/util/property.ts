/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

export function getClosureSafeProperty<T>(objWithPropertyToExtract: T): string {
  for (const key in objWithPropertyToExtract) {
    if (objWithPropertyToExtract[key] === (getClosureSafeProperty as any)) {
      return key;
    }
  }
  // Cannot change it to `RuntimeError` because the `util` target cannot
  // circularly depend on the `core` target.
  throw Error('');
}
