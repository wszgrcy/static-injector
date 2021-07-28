/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { RuntimeError, RuntimeErrorCode } from './error_code';
import { stringifyForError } from './util/stringify_utils';

/** Throws an error when a token is not found in DI. */
export function throwProviderNotFoundError(
  token: any,
  injectorName?: string
): never {
  const injectorDetails = injectorName ? ` in ${injectorName}` : '';
  throw new RuntimeError(
    RuntimeErrorCode.PROVIDER_NOT_FOUND,
    `No provider for ${stringifyForError(token)} found${injectorDetails}`
  );
}
