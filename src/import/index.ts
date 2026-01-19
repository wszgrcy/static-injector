import type { InjectableDecorator } from './di/injectable';
import { Injector } from './di/injector';
import { EnvironmentProviders, Provider } from './di/interface/provider';
export { EnvironmentProviders, Provider } from './di/interface/provider';
import { getNullInjector, R3Injector } from './di/r3_injector';
import { INJECTOR_SCOPE, InjectorScope } from './di/scope';

export * from './di/injectable';
export * from './di/metadata';
export * from './di/r3_injector';
export * from './di/interface/defs';
export * from './di/injector_compatibility';
export * from './di/injection_token';
export * from './di/null_injector';
export * from './di/injector';
export * from './di/interface/injector';
export * from './di/scope';
export * from './render3/instructions/di';

export * from './core_reactivity_export_internal';
export * from './change_detection/scheduling/zoneless_scheduling';
export * from './change_detection/scheduling/zoneless_scheduling_impl';

export * from './resource';
export * from './di/provider_token';
export * from './error_handler';
export * from './pending_tasks';
export * from './linker/destroy_ref';
export { StaticProvider } from './di/interface/provider';
export function Injectable(args?: any) {
  return (constructor: Function) => {};
}
export class StaticInjectOptions {
  static injectOptions: Parameters<InjectableDecorator>[0];
}
export class RootStaticInjectOptions {
  static injectOptions: Parameters<InjectableDecorator>[0] = {
    providedIn: 'root',
  };
}

export function createInjector(options: { providers: Array<Provider | EnvironmentProviders>; parent: Injector; name?: string; scopes?: Set<InjectorScope> }) {
  return new R3Injector(options.providers, options.parent ?? getNullInjector(), options.name ?? '', options.scopes ?? new Set([]));
}
export function createRootInjector(options: { providers: Array<Provider | EnvironmentProviders>; name?: string; scopes?: Set<InjectorScope> }) {
  return new R3Injector(
    [
      ...options.providers,
      {
        provide: INJECTOR_SCOPE,
        useValue: 'root',
      },
    ],
    getNullInjector(),
    options.name ?? '',
    options.scopes ?? new Set(['environment']),
  );
}
