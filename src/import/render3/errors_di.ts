/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import type { ProviderToken } from '../di';
import { RuntimeError, RuntimeErrorCode } from '../errors';
import { getClosureSafeProperty } from '../util/property';

const NG_RUNTIME_ERROR_CODE = getClosureSafeProperty({ ngErrorCode: getClosureSafeProperty });
const NG_RUNTIME_ERROR_MESSAGE = getClosureSafeProperty({ ngErrorMessage: getClosureSafeProperty });
const NG_TOKEN_PATH = getClosureSafeProperty({ ngTokenPath: getClosureSafeProperty });

/** Creates a circular dependency runtime error. */
export function cyclicDependencyError(token: string, path?: string[]): Error {
  const message = '';
  return createRuntimeError(message, RuntimeErrorCode.CYCLIC_DI_DEPENDENCY, path);
}

/** Throws an error when a token is not found in DI. */
export function throwProviderNotFoundError(token: ProviderToken<unknown>, injectorName?: string): never {
  const errorMessage = undefined as any;
  throw new RuntimeError(RuntimeErrorCode.PROVIDER_NOT_FOUND, errorMessage);
}

/**
 * Creates an initial RuntimeError instance when a problem is detected.
 * Monkey-patches extra info in the RuntimeError instance, so that it can
 * be reused later, before throwing the final error.
 */
export function createRuntimeError(message: string, code: number, path?: string[]): Error {
  // Cast to `any`, so that extra info can be monkey-patched onto this instance.
  const error = new RuntimeError(code, message) as any;

  // Monkey-patch a runtime error code and a path onto an Error instance.
  error[NG_RUNTIME_ERROR_CODE] = code;
  error[NG_RUNTIME_ERROR_MESSAGE] = message;
  if (path) {
    error[NG_TOKEN_PATH] = path;
  }
  return error;
}

/**
 * Reads monkey-patched error code from the given Error instance.
 */
export function getRuntimeErrorCode(error: any): number | undefined {
  return error[NG_RUNTIME_ERROR_CODE];
}
