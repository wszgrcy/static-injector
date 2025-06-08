/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import { Type } from '../interface/type';

import { getClosureSafeProperty } from '../util/property';

import { ENVIRONMENT_INITIALIZER } from './initializer_token';
import { InjectorType } from './interface/defs';
import {
  ClassProvider,
  ConstructorProvider,
  EnvironmentProviders,
  ExistingProvider,
  FactoryProvider,
  ModuleWithProviders,
  Provider,
  StaticClassProvider,
  TypeProvider,
  ValueProvider,
} from './interface/provider';

/**
 * Wrap an array of `Provider`s into `EnvironmentProviders`, preventing them from being accidentally
 * referenced in `@Component` in a component injector.
 *
 * @publicApi
 */
export function makeEnvironmentProviders(providers: (Provider | EnvironmentProviders)[]): EnvironmentProviders {
  return {
    ɵproviders: providers,
  } as unknown as EnvironmentProviders;
}

/**
 * @description
 * This function is used to provide initialization functions that will be executed upon construction
 * of an environment injector.
 *
 * Note that the provided initializer is run in the injection context.
 *
 * Previously, this was achieved using the `ENVIRONMENT_INITIALIZER` token which is now deprecated.
 *
 * @see {@link ENVIRONMENT_INITIALIZER}
 *
 * @usageNotes
 * The following example illustrates how to configure an initialization function using
 * `provideEnvironmentInitializer()`
 * ```ts
 * createEnvironmentInjector(
 *   [
 *     provideEnvironmentInitializer(() => {
 *       console.log('environment initialized');
 *     }),
 *   ],
 *   parentInjector
 * );
 * ```
 *
 * @publicApi
 */
export function provideEnvironmentInitializer(initializerFn: () => void): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: initializerFn,
    },
  ]);
}

/**
 * A source of providers for the `importProvidersFrom` function.
 *
 * @publicApi
 */
export type ImportProvidersSource = Type<unknown> | ModuleWithProviders<unknown> | Array<ImportProvidersSource>;

type WalkProviderTreeVisitor = (provider: SingleProvider, container: Type<unknown> | InjectorType<unknown>) => void;

/**
 * Internal type for a single provider in a deep provider array.
 */
export type SingleProvider = TypeProvider | ValueProvider | ClassProvider | ConstructorProvider | ExistingProvider | FactoryProvider | StaticClassProvider;

export const USE_VALUE: string = getClosureSafeProperty<ValueProvider>({
  provide: String,
  useValue: getClosureSafeProperty,
});

export function isValueProvider(value: SingleProvider): value is ValueProvider {
  return value !== null && typeof value === 'object' && USE_VALUE in value;
}

export function isExistingProvider(value: SingleProvider): value is ExistingProvider {
  return !!(value && (value as ExistingProvider).useExisting);
}

export function isFactoryProvider(value: SingleProvider): value is FactoryProvider {
  return !!(value && (value as FactoryProvider).useFactory);
}

export function isTypeProvider(value: SingleProvider): value is TypeProvider {
  return typeof value === 'function';
}

export function isClassProvider(value: SingleProvider): value is ClassProvider {
  return !!(value as StaticClassProvider | ClassProvider).useClass;
}
