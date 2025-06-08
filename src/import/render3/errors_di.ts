/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import type { ProviderToken } from '../di';
import { RuntimeError, RuntimeErrorCode } from '../errors';

/** Called when directives inject each other (creating a circular dependency) */
export function throwCyclicDependencyError(token: string, path?: string[]): never {
  throw new RuntimeError(RuntimeErrorCode.CYCLIC_DI_DEPENDENCY, token);
}

/** Throws an error when a token is not found in DI. */
export function throwProviderNotFoundError(token: ProviderToken<unknown>, injectorName?: string): never {
  const errorMessage = undefined as any;
  throw new RuntimeError(RuntimeErrorCode.PROVIDER_NOT_FOUND, errorMessage);
}
