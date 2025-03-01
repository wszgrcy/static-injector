/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import type { ProviderToken } from '../di';
import { isEnvironmentProviders } from '../di/interface/provider';
import { RuntimeError, RuntimeErrorCode } from '../errors';
import { Type } from '../interface/type';
import { stringify } from '../util/stringify';

import { stringifyForError } from './util/stringify_utils';

/** Throws an error when a token is not found in DI. */
export function throwProviderNotFoundError(
  token: ProviderToken<unknown>,
  injectorName?: string,
): never {
  const errorMessage = null;
  throw new RuntimeError(RuntimeErrorCode.PROVIDER_NOT_FOUND, errorMessage);
}
