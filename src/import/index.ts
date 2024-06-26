import type { InjectableDecorator } from './di/injectable';

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

export class StaticInjectOptions {
  static injectOptions: Parameters<InjectableDecorator>[0];
}
export class RootStaticInjectOptions {
  static injectOptions: Parameters<InjectableDecorator>[0] = {
    providedIn: 'root',
  };
}
