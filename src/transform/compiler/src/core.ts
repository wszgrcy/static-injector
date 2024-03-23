/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// Attention:
// This file duplicates types and values from @angular/core
// so that we are able to make @angular/compiler independent of @angular/core.
// This is important to prevent a build cycle, as @angular/core needs to
// be compiled with the compiler.

/**
 * Injection flags for DI.
 */
export const enum InjectFlags {
  Default = 0,

  /** Don't descend into ancestors of the node requesting injection. */
  Self = 1 << 1,
  /** Skip the node that is requesting injection. */
  SkipSelf = 1 << 2,
  /** Inject `defaultValue` instead if token not found. */
  Optional = 1 << 3,
}
