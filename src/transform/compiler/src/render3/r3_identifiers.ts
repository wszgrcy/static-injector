/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as o from '../output/output_ast';

const CORE = 'static-injector';

export class Identifiers {
  static inject: o.ExternalReference = { name: 'ɵɵinject', moduleName: CORE };

  static directiveInject: o.ExternalReference = {
    name: 'ɵɵdirectiveInject',
    moduleName: CORE,
  };
  static invalidFactory: o.ExternalReference = {
    name: 'ɵɵinvalidFactory',
    moduleName: CORE,
  };
  static invalidFactoryDep: o.ExternalReference = {
    name: 'ɵɵinvalidFactoryDep',
    moduleName: CORE,
  };

  static forwardRef: o.ExternalReference = {
    name: 'forwardRef',
    moduleName: CORE,
  };
  static resolveForwardRef: o.ExternalReference = {
    name: 'resolveForwardRef',
    moduleName: CORE,
  };

  static ɵɵdefineInjectable: o.ExternalReference = {
    name: 'ɵɵdefineInjectable',
    moduleName: CORE,
  };
  static InjectableDeclaration: o.ExternalReference = {
    name: 'ɵɵInjectableDeclaration',
    moduleName: CORE,
  };

  static FactoryDeclaration: o.ExternalReference = {
    name: 'ɵɵFactoryDeclaration',
    moduleName: CORE,
  };

  static getInheritedFactory: o.ExternalReference = {
    name: 'ɵɵgetInheritedFactory',
    moduleName: CORE,
  };
}
