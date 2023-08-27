/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { RuntimeError, RuntimeErrorCode } from '../errors';
import { Type } from '../interface/type';

import { getFactoryDef } from '../render3/definition_factory';

import { stringifyForError } from '../render3/util/stringify_utils';
import { deepForEach } from '../util/array_utils';
import { EMPTY_ARRAY } from '../util/empty';
import { getClosureSafeProperty } from '../util/property';
import { stringify } from '../util/stringify';

import { resolveForwardRef } from './forward_ref';
import { ENVIRONMENT_INITIALIZER } from './initializer_token';
import { ɵɵinject as inject } from './injector_compatibility';
import {
  getInjectorDef,
  InjectorType,
  InjectorTypeWithProviders,
} from './interface/defs';
import {
  ClassProvider,
  ConstructorProvider,
  EnvironmentProviders,
  ExistingProvider,
  FactoryProvider,
  ImportedNgModuleProviders,
  InternalEnvironmentProviders,
  isEnvironmentProviders,
  ModuleWithProviders,
  Provider,
  StaticClassProvider,
  TypeProvider,
  ValueProvider,
} from './interface/provider';
import { INJECTOR_DEF_TYPES } from './internal_tokens';

/**
 * Wrap an array of `Provider`s into `EnvironmentProviders`, preventing them from being accidentally
 * referenced in `@Component` in a component injector.
 */
export function makeEnvironmentProviders(
  providers: (Provider | EnvironmentProviders)[]
): EnvironmentProviders {
  return {
    ɵproviders: providers,
  } as unknown as EnvironmentProviders;
}

/**
 * A source of providers for the `importProvidersFrom` function.
 *
 * @publicApi
 */
export type ImportProvidersSource =
  | Type<unknown>
  | ModuleWithProviders<unknown>
  | Array<ImportProvidersSource>;

type WalkProviderTreeVisitor = (
  provider: SingleProvider,
  container: Type<unknown> | InjectorType<unknown>
) => void;

/**
 * Collects providers from all NgModules and standalone components, including transitively imported
 * ones.
 *
 * Providers extracted via `importProvidersFrom` are only usable in an application injector or
 * another environment injector (such as a route injector). They should not be used in component
 * providers.
 *
 * More information about standalone components can be found in [this
 * guide](guide/standalone-components).
 *
 * @usageNotes
 * The results of the `importProvidersFrom` call can be used in the `bootstrapApplication` call:
 *
 * ```typescript
 * await bootstrapApplication(RootComponent, {
 *   providers: [
 *     importProvidersFrom(NgModuleOne, NgModuleTwo)
 *   ]
 * });
 * ```
 *
 * You can also use the `importProvidersFrom` results in the `providers` field of a route, when a
 * standalone component is used:
 *
 * ```typescript
 * export const ROUTES: Route[] = [
 *   {
 *     path: 'foo',
 *     providers: [
 *       importProvidersFrom(NgModuleOne, NgModuleTwo)
 *     ],
 *     component: YourStandaloneComponent
 *   }
 * ];
 * ```
 *
 * @returns Collected providers from the specified list of types.
 * @publicApi
 */
export function importProvidersFrom(
  ...sources: ImportProvidersSource[]
): EnvironmentProviders {
  return {
    ɵproviders: internalImportProvidersFrom(true, sources),
    ɵfromNgModule: true,
  } as InternalEnvironmentProviders;
}

export function internalImportProvidersFrom(
  checkForStandaloneCmp: boolean,
  ...sources: ImportProvidersSource[]
): Provider[] {
  const providersOut: SingleProvider[] = [];
  const dedup = new Set<Type<unknown>>(); // already seen types
  let injectorTypesWithProviders:
    | InjectorTypeWithProviders<unknown>[]
    | undefined;

  const collectProviders: WalkProviderTreeVisitor = (provider) => {
    providersOut.push(provider);
  };

  // Collect all providers from `ModuleWithProviders` types.
  if (injectorTypesWithProviders !== undefined) {
    processInjectorTypesWithProviders(
      injectorTypesWithProviders,
      collectProviders
    );
  }

  return providersOut;
}

/**
 * Collects all providers from the list of `ModuleWithProviders` and appends them to the provided
 * array.
 */
function processInjectorTypesWithProviders(
  typesWithProviders: InjectorTypeWithProviders<unknown>[],
  visitor: WalkProviderTreeVisitor
): void {
  for (let i = 0; i < typesWithProviders.length; i++) {
    const { ngModule, providers } = typesWithProviders[i];
  }
}

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
