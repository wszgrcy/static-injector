/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * Injection flags for DI.
 */
export const enum InjectFlags {
  Default = 0,

  /**
   * Specifies that an injector should retrieve a dependency from any injector until reaching the
   * host element of the current component. (Only used with Element Injector)
   */
  Host = 1 << 0,
  /** Don't descend into ancestors of the node requesting injection. */
  Self = 1 << 1,
  /** Skip the node that is requesting injection. */
  SkipSelf = 1 << 2,
  /** Inject `defaultValue` instead if token not found. */
  Optional = 1 << 3,
}
