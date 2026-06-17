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

export { StateKey, makeStateKey, TransferState } from './transfer_state';
export { EventEmitter } from './event_emitter';
export { Type, AbstractType } from './interface/type';
export { IdleService, provideIdleServiceWith } from './defer/idle_service';
export { OnDestroy } from './change_detection/lifecycle_hooks';
export { runInInjectionContext, assertInInjectionContext } from './di/contextual';
export { APP_ID } from './application/application_tokens';
export { ForwardRefFn, forwardRef, resolveForwardRef } from './di/forward_ref';
export { OutputRefSubscription, OutputRef } from './authoring/output/output_ref';
export { TypeDecorator } from './util/decorators';
export { injectAsync, InjectAsyncOptions, PrefetchTrigger, onIdle } from './di/inject_async';
export { Signal, isSignal, ValueEqualityFn, isWritableSignal } from './render3/reactivity/api';
export { assertNotInReactiveContext } from './render3/reactivity/asserts';
export { EffectRef, CreateEffectOptions, EffectCleanupFn, EffectCleanupRegisterFn, effect } from './render3/reactivity/effect';
export { linkedSignal } from './render3/reactivity/linked_signal';
export { WritableSignal, signal } from './render3/reactivity/signal';
export { StaticProvider } from './di/interface/provider';
export { EffectScheduler } from './render3/reactivity/root_effect_scheduler';
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
