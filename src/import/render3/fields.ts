/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import { getClosureSafeProperty } from '../util/property';
export const NG_FACTORY_DEF: string = getClosureSafeProperty({ ɵfac: getClosureSafeProperty });

/**
 * The `NG_ENV_ID` field on a DI token indicates special processing in the `EnvironmentInjector`:
 * getting such tokens from the `EnvironmentInjector` will bypass the standard DI resolution
 * strategy and instead will return implementation produced by the `NG_ENV_ID` factory function.
 *
 * This particular retrieval of DI tokens is mostly done to eliminate circular dependencies and
 * improve tree-shaking.
 */
export const NG_ENV_ID: string = getClosureSafeProperty({ __NG_ENV_ID__: getClosureSafeProperty });
