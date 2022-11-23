/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { Type } from '../interface/type';
import { getClosureSafeProperty } from '../util/property';
import { stringify } from '../util/stringify';

import { resolveForwardRef } from './forward_ref';
import { injectRootLimpMode } from './inject_switch';
import { Injector } from './injector';
import {
  DecoratorFlags,
  InjectFlags,
  InjectOptions,
  InternalInjectFlags,
} from './interface/injector';
import { ValueProvider } from './interface/provider';
import { ProviderToken } from './provider_token';

const _THROW_IF_NOT_FOUND = {};
export const THROW_IF_NOT_FOUND = _THROW_IF_NOT_FOUND;

/*
 * Name of a property (that we patch onto DI decorator), which is used as an annotation of which
 * InjectFlag this decorator represents. This allows to avoid direct references to the DI decorators
 * in the code, thus making them tree-shakable.
 */
const DI_DECORATOR_FLAG = '__NG_DI_FLAG__';

export const NG_TEMP_TOKEN_PATH = 'ngTempTokenPath';
const NG_TOKEN_PATH = 'ngTokenPath';
const NEW_LINE = /\n/gm;
const NO_NEW_LINE = 'ɵ';
export const SOURCE = '__source';

export const USE_VALUE = getClosureSafeProperty<ValueProvider>({
  provide: String,
  useValue: getClosureSafeProperty,
});

/**
 * Current injector value used by `inject`.
 * - `undefined`: it is an error to call `inject`
 * - `null`: `inject` can be called but there is no injector (limp-mode).
 * - Injector instance: Use the injector for resolution.
 */
let _currentInjector: Injector | undefined | null = undefined;

export function setCurrentInjector(
  injector: Injector | null | undefined
): Injector | undefined | null {
  const former = _currentInjector;
  _currentInjector = injector;
  return former;
}

export function injectInjectorOnly<T>(token: ProviderToken<T>): T;
export function injectInjectorOnly<T>(
  token: ProviderToken<T>,
  flags?: InjectFlags
): T | null;
export function injectInjectorOnly<T>(
  token: ProviderToken<T>,
  flags = InjectFlags.Default
): T | null {
  if (_currentInjector === undefined) {
    throw new Error(`inject() must be called from an injection context`);
  } else if (_currentInjector === null) {
    return injectRootLimpMode(token, undefined, flags);
  } else {
    return _currentInjector.get(
      token,
      flags & InjectFlags.Optional ? null : undefined,
      flags
    );
  }
}

/**
 * Generated instruction: Injects a token from the currently active injector.
 *
 * Must be used in the context of a factory function such as one defined for an
 * `InjectionToken`. Throws an error if not called from such a context.
 *
 * (Additional documentation moved to `inject`, as it is the public API, and an alias for this
 * instruction)
 *
 * @see inject
 * @codeGenApi
 * @publicApi This instruction has been emitted by ViewEngine for some time and is deployed to npm.
 */
export function ɵɵinject<T>(token: ProviderToken<T>): T;
export function ɵɵinject<T>(
  token: ProviderToken<T>,
  flags?: InjectFlags
): T | null;
export function ɵɵinject<T>(
  token: ProviderToken<T>,
  flags = InjectFlags.Default
): T | null {
  return injectInjectorOnly(resolveForwardRef(token), flags);
}

/**
 * @param token A token that represents a dependency that should be injected.
 * @returns the injected value if operation is successful, `null` otherwise.
 * @throws if called outside of a supported context.
 *
 * @publicApi
 */
export function inject<T>(token: ProviderToken<T>): T;
/**
 * @param token A token that represents a dependency that should be injected.
 * @param flags Control how injection is executed. The flags correspond to injection strategies that
 *     can be specified with parameter decorators `@Host`, `@Self`, `@SkipSelf`, and `@Optional`.
 * @returns the injected value if operation is successful, `null` otherwise.
 * @throws if called outside of a supported context.
 *
 * @publicApi
 * @deprecated prefer an options object instead of `InjectFlags`
 */
export function inject<T>(
  token: ProviderToken<T>,
  flags?: InjectFlags
): T | null;
/**
 * @param token A token that represents a dependency that should be injected.
 * @param options Control how injection is executed. Options correspond to injection strategies
 *     that can be specified with parameter decorators `@Host`, `@Self`, `@SkipSelf`, and
 *     `@Optional`.
 * @returns the injected value if operation is successful.
 * @throws if called outside of a supported context, or if the token is not found.
 *
 * @publicApi
 */
export function inject<T>(
  token: ProviderToken<T>,
  options: InjectOptions & { optional?: false }
): T;
/**
 * @param token A token that represents a dependency that should be injected.
 * @param options Control how injection is executed. Options correspond to injection strategies
 *     that can be specified with parameter decorators `@Host`, `@Self`, `@SkipSelf`, and
 *     `@Optional`.
 * @returns the injected value if operation is successful,  `null` if the token is not
 *     found and optional injection has been requested.
 * @throws if called outside of a supported context, or if the token is not found and optional
 *     injection was not requested.
 *
 * @publicApi
 */
export function inject<T>(
  token: ProviderToken<T>,
  options: InjectOptions
): T | null;
/**
 * Injects a token from the currently active injector.
 * `inject` is only supported during instantiation of a dependency by the DI system. It can be used
 * during:
 * - Construction (via the `constructor`) of a class being instantiated by the DI system, such
 * as an `@Injectable` or `@Component`.
 * - In the initializer for fields of such classes.
 * - In the factory function specified for `useFactory` of a `Provider` or an `@Injectable`.
 * - In the `factory` function specified for an `InjectionToken`.
 *
 * @param token A token that represents a dependency that should be injected.
 * @param flags Optional flags that control how injection is executed.
 * The flags correspond to injection strategies that can be specified with
 * parameter decorators `@Host`, `@Self`, `@SkipSef`, and `@Optional`.
 * @returns the injected value if operation is successful, `null` otherwise.
 * @throws if called outside of a supported context.
 *
 * @usageNotes
 * In practice the `inject()` calls are allowed in a constructor, a constructor parameter and a
 * field initializer:
 *
 * ```typescript
 * @Injectable({providedIn: 'root'})
 * export class Car {
 *   radio: Radio|undefined;
 *   // OK: field initializer
 *   spareTyre = inject(Tyre);
 *
 *   constructor() {
 *     // OK: constructor body
 *     this.radio = inject(Radio);
 *   }
 * }
 * ```
 *
 * It is also legal to call `inject` from a provider's factory:
 *
 * ```typescript
 * providers: [
 *   {provide: Car, useFactory: () => {
 *     // OK: a class factory
 *     const engine = inject(Engine);
 *     return new Car(engine);
 *   }}
 * ]
 * ```
 *
 * Calls to the `inject()` function outside of the class creation context will result in error. Most
 * notably, calls to `inject()` are disallowed after a class instance was created, in methods
 * (including lifecycle hooks):
 *
 * ```typescript
 * @Component({ ... })
 * export class CarComponent {
 *   ngOnInit() {
 *     // ERROR: too late, the component instance was already created
 *     const engine = inject(Engine);
 *     engine.start();
 *   }
 * }
 * ```
 *
 * @publicApi
 */
export function inject<T>(
  token: ProviderToken<T>,
  flags: InjectFlags | InjectOptions = InjectFlags.Default
): T | null {
  return ɵɵinject(token, convertToBitFlags(flags));
}

// Converts object-based DI flags (`InjectOptions`) to bit flags (`InjectFlags`).
export function convertToBitFlags(
  flags: InjectOptions | InjectFlags | undefined
): InjectFlags | undefined {
  if (typeof flags === 'undefined' || typeof flags === 'number') {
    return flags;
  }

  // While TypeScript doesn't accept it without a cast, bitwise OR with false-y values in
  // JavaScript is a no-op. We can use that for a very codesize-efficient conversion from
  // `InjectOptions` to `InjectFlags`.
  return (InternalInjectFlags.Default | // comment to force a line break in the formatter
    ((flags.optional && InternalInjectFlags.Optional) as number) |
    ((flags.self && InternalInjectFlags.Self) as number) |
    ((flags.skipSelf &&
      InternalInjectFlags.SkipSelf) as number)) as InjectFlags;
}
export function injectArgs(types: (ProviderToken<any> | any[])[]): any[] {
  const args: any[] = [];
  for (let i = 0; i < types.length; i++) {
    const arg = resolveForwardRef(types[i]);
    if (Array.isArray(arg)) {
      if (arg.length === 0) {
        throw new Error('Arguments array must have arguments.');
      }
      let type: Type<any> | undefined = undefined;
      let flags: InjectFlags = InjectFlags.Default;

      for (let j = 0; j < arg.length; j++) {
        const meta = arg[j];
        const flag = getInjectFlag(meta);
        if (typeof flag === 'number') {
          // Special case when we handle @Inject decorator.
          if (flag === DecoratorFlags.Inject) {
            type = meta.token;
          } else {
            flags |= flag;
          }
        } else {
          type = meta;
        }
      }

      args.push(ɵɵinject(type!, flags));
    } else {
      args.push(ɵɵinject(arg));
    }
  }
  return args;
}

/**
 * Attaches a given InjectFlag to a given decorator using monkey-patching.
 * Since DI decorators can be used in providers `deps` array (when provider is configured using
 * `useFactory`) without initialization (e.g. `Host`) and as an instance (e.g. `new Host()`), we
 * attach the flag to make it available both as a static property and as a field on decorator
 * instance.
 *
 * @param decorator Provided DI decorator.
 * @param flag InjectFlag that should be applied.
 */
export function attachInjectFlag(
  decorator: any,
  flag: InternalInjectFlags | DecoratorFlags
): any {
  decorator[DI_DECORATOR_FLAG] = flag;
  decorator.prototype[DI_DECORATOR_FLAG] = flag;
  return decorator;
}

/**
 * Reads monkey-patched property that contains InjectFlag attached to a decorator.
 *
 * @param token Token that may contain monkey-patched DI flags property.
 */
export function getInjectFlag(token: any): number | undefined {
  return token[DI_DECORATOR_FLAG];
}

export function catchInjectorError(
  e: any,
  token: any,
  injectorErrorName: string,
  source: string | null
): never {
  const tokenPath: any[] = e[NG_TEMP_TOKEN_PATH];
  if (token[SOURCE]) {
    tokenPath.unshift(token[SOURCE]);
  }
  e.message = formatError(
    '\n' + e.message,
    tokenPath,
    injectorErrorName,
    source
  );
  e[NG_TOKEN_PATH] = tokenPath;
  e[NG_TEMP_TOKEN_PATH] = null;
  throw e;
}

export function formatError(
  text: string,
  obj: any,
  injectorErrorName: string,
  source: string | null = null
): string {
  text =
    text && text.charAt(0) === '\n' && text.charAt(1) == NO_NEW_LINE
      ? text.slice(2)
      : text;
  let context = stringify(obj);
  if (Array.isArray(obj)) {
    context = obj.map(stringify).join(' -> ');
  } else if (typeof obj === 'object') {
    let parts = <string[]>[];
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        let value = obj[key];
        parts.push(
          key +
            ':' +
            (typeof value === 'string'
              ? JSON.stringify(value)
              : stringify(value))
        );
      }
    }
    context = `{${parts.join(', ')}}`;
  }
  return `${injectorErrorName}${
    source ? '(' + source + ')' : ''
  }[${context}]: ${text.replace(NEW_LINE, '\n  ')}`;
}
