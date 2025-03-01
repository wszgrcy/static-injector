/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import { EnvironmentInjector } from '../di';

/**
 * `DestroyRef` lets you set callbacks to run for any cleanup or destruction behavior.
 * The scope of this destruction depends on where `DestroyRef` is injected. If `DestroyRef`
 * is injected in a component or directive, the callbacks run when that component or
 * directive is destroyed. Otherwise the callbacks run when a corresponding injector is destroyed.
 *
 * @publicApi
 */
export abstract class DestroyRef {
  // Here the `DestroyRef` acts primarily as a DI token. There are (currently) types of objects that
  // can be returned from the injector when asking for this token:
  // - `NodeInjectorDestroyRef` when retrieved from a node injector;
  // - `EnvironmentInjector` when retrieved from an environment injector

  /**
   * Registers a destroy callback in a given lifecycle scope.  Returns a cleanup function that can
   * be invoked to unregister the callback.
   *
   * @usageNotes
   * ### Example
   * ```ts
   * const destroyRef = inject(DestroyRef);
   *
   * // register a destroy callback
   * const unregisterFn = destroyRef.onDestroy(() => doSomethingOnDestroy());
   *
   * // stop the destroy callback from executing if needed
   * unregisterFn();
   * ```
   */
  abstract onDestroy(callback: () => void): () => void;

  /**
   * @internal
   * @nocollapse
   */

  /**
   * @internal
   * @nocollapse
   */
  static __NG_ENV_ID__: (injector: EnvironmentInjector) => DestroyRef = (
    injector,
  ) => injector;
}
