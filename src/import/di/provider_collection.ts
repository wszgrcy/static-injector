/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { Type } from '../interface/type';

import { getClosureSafeProperty } from '../util/property';

import { resolveForwardRef } from './forward_ref';

import { InjectorTypeWithProviders } from './interface/defs';
import {
  ClassProvider,
  ConstructorProvider,
  ExistingProvider,
  FactoryProvider,
  StaticClassProvider,
  TypeProvider,
  ValueProvider,
} from './interface/provider';

/**
 * Internal type for a single provider in a deep provider array.
 */
export type SingleProvider =
  | TypeProvider
  | ValueProvider
  | ClassProvider
  | ConstructorProvider
  | ExistingProvider
  | FactoryProvider
  | StaticClassProvider;

/**
 * The logic visits an `InjectorType`, an `InjectorTypeWithProviders`, or a standalone
 * `ComponentType`, and all of its transitive providers and collects providers.
 *
 * If an `InjectorTypeWithProviders` that declares providers besides the type is specified,
 * the function will return "true" to indicate that the providers of the type definition need
 * to be processed. This allows us to process providers of injector types after all imports of
 * an injector definition are processed. (following View Engine semantics: see FW-1349)
 */
export function walkProviderTree(
  container: Type<unknown> | InjectorTypeWithProviders<unknown>,
  providersOut: SingleProvider[],
  parents: Type<unknown>[],
  dedup: Set<Type<unknown>>
): container is InjectorTypeWithProviders<unknown> {
  container = resolveForwardRef(container);
  if (!container) return false;

  // The actual type which had the definition. Usually `container`, but may be an unwrapped type
  // from `InjectorTypeWithProviders`.
  let defType: Type<unknown> | null = null;

  defType = container as Type<unknown>;

  // Check for multiple imports of the same module

  return (
    defType !== container &&
    (container as InjectorTypeWithProviders<any>).providers !== undefined
  );
}

export const USE_VALUE = getClosureSafeProperty<ValueProvider>({
  provide: String,
  useValue: getClosureSafeProperty,
});

export function isValueProvider(value: SingleProvider): value is ValueProvider {
  return value !== null && typeof value == 'object' && USE_VALUE in value;
}

export function isExistingProvider(
  value: SingleProvider
): value is ExistingProvider {
  return !!(value && (value as ExistingProvider).useExisting);
}

export function isFactoryProvider(
  value: SingleProvider
): value is FactoryProvider {
  return !!(value && (value as FactoryProvider).useFactory);
}

export function isTypeProvider(value: SingleProvider): value is TypeProvider {
  return typeof value === 'function';
}

export function isClassProvider(value: SingleProvider): value is ClassProvider {
  return !!(value as StaticClassProvider | ClassProvider).useClass;
}
