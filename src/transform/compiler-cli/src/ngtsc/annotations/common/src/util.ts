/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  Expression,
  ExternalExpr,
  R3DependencyMetadata,
  R3Reference,
  ReadPropExpr,
  WrappedNodeExpr,
} from 'static-injector/transform/compiler';
import { R3FactoryMetadata } from '../../../../../../compiler';
import { FactoryTarget } from '../../../../../../compiler/src/render3/partial/api';
import * as ts from 'typescript';

import {
  ErrorCode,
  FatalDiagnosticError,
  makeRelatedInformation,
} from '../../../diagnostics';
import {
  ClassDeclaration,
  CtorParameter,
  Decorator,
  Import,
  ImportedTypeValueReference,
  isNamedClassDeclaration,
  LocalTypeValueReference,
  ReflectionHost,
  TypeValueReference,
  TypeValueReferenceKind,
  UnavailableValue,
  ValueUnavailableKind,
} from '../../../reflection';

export type ConstructorDeps =
  | {
      deps: R3DependencyMetadata[];
    }
  | {
      deps: null;
      errors: ConstructorDepError[];
    };

export interface ConstructorDepError {
  index: number;
  param: CtorParameter;
  reason: UnavailableValue;
}

export function getConstructorDependencies(
  clazz: ClassDeclaration,
  reflector: ReflectionHost,
  isCore: boolean
): ConstructorDeps | null {
  const deps: R3DependencyMetadata[] = [];
  const errors: ConstructorDepError[] = [];
  let ctorParams = reflector.getConstructorParameters(clazz);
  if (ctorParams === null) {
    if (reflector.hasBaseClass(clazz)) {
      return null;
    } else {
      ctorParams = [];
    }
  }
  ctorParams.forEach((param, idx) => {
    let token = valueReferenceToExpression(param.typeValueReference);
    let attributeNameType: Expression | null = null;
    let optional = false,
      self = false,
      skipSelf = false;

    (param.decorators || [])
      .filter((dec) => isCore || isAngularCore(dec))
      .forEach((dec) => {
        const name =
          isCore || dec.import === null ? dec.name : dec.import!.name;
        if (name === 'Inject') {
          if (dec.args === null || dec.args.length !== 1) {
            throw new FatalDiagnosticError(
              ErrorCode.DECORATOR_ARITY_WRONG,
              Decorator.nodeForError(dec),
              `Unexpected number of arguments to @Inject().`
            );
          }
          token = new WrappedNodeExpr(dec.args[0]);
        } else if (name === 'Optional') {
          optional = true;
        } else if (name === 'SkipSelf') {
          skipSelf = true;
        } else if (name === 'Self') {
          self = true;
        } else {
          throw new FatalDiagnosticError(
            ErrorCode.DECORATOR_UNEXPECTED,
            Decorator.nodeForError(dec),
            `Unexpected decorator ${name} on parameter.`
          );
        }
      });

    if (token === null) {
      if (
        param.typeValueReference.kind !== TypeValueReferenceKind.UNAVAILABLE
      ) {
        throw new Error(
          'Illegal state: expected value reference to be unavailable if no token is present'
        );
      }
      errors.push({
        index: idx,
        param,
        reason: param.typeValueReference.reason,
      });
    } else {
      deps.push({ token, attributeNameType, optional, self, skipSelf });
    }
  });
  if (errors.length === 0) {
    return { deps };
  } else {
    return { deps: null, errors };
  }
}

/**
 * Convert a `TypeValueReference` to an `Expression` which refers to the type as a value.
 *
 * Local references are converted to a `WrappedNodeExpr` of the TypeScript expression, and non-local
 * references are converted to an `ExternalExpr`. Note that this is only valid in the context of the
 * file in which the `TypeValueReference` originated.
 */
export function valueReferenceToExpression(
  valueRef: LocalTypeValueReference | ImportedTypeValueReference
): Expression;
export function valueReferenceToExpression(
  valueRef: TypeValueReference
): Expression | null;
export function valueReferenceToExpression(
  valueRef: TypeValueReference
): Expression | null {
  if (valueRef.kind === TypeValueReferenceKind.UNAVAILABLE) {
    return null;
  } else if (valueRef.kind === TypeValueReferenceKind.LOCAL) {
    const expr = new WrappedNodeExpr(valueRef.expression);

    return expr;
  } else {
    let importExpr: Expression = new ExternalExpr({
      moduleName: valueRef.moduleName,
      name: valueRef.importedName,
    });
    if (valueRef.nestedPath !== null) {
      for (const property of valueRef.nestedPath) {
        importExpr = new ReadPropExpr(importExpr, property);
      }
    }
    return importExpr;
  }
}

/**
 * Convert `ConstructorDeps` into the `R3DependencyMetadata` array for those deps if they're valid,
 * or into an `'invalid'` signal if they're not.
 *
 * This is a companion function to `validateConstructorDependencies` which accepts invalid deps.
 */
export function unwrapConstructorDependencies(
  deps: ConstructorDeps | null
): R3DependencyMetadata[] | 'invalid' | null {
  if (deps === null) {
    return null;
  } else if (deps.deps !== null) {
    // These constructor dependencies are valid.
    return deps.deps;
  } else {
    // These deps are invalid.
    return 'invalid';
  }
}

export function getValidConstructorDependencies(
  clazz: ClassDeclaration,
  reflector: ReflectionHost,
  isCore: boolean
): R3DependencyMetadata[] | null {
  return validateConstructorDependencies(
    clazz,
    getConstructorDependencies(clazz, reflector, isCore)
  );
}

/**
 * Validate that `ConstructorDeps` does not have any invalid dependencies and convert them into the
 * `R3DependencyMetadata` array if so, or raise a diagnostic if some deps are invalid.
 *
 * This is a companion function to `unwrapConstructorDependencies` which does not accept invalid
 * deps.
 */
export function validateConstructorDependencies(
  clazz: ClassDeclaration,
  deps: ConstructorDeps | null
): R3DependencyMetadata[] | null {
  if (deps === null) {
    return null;
  } else if (deps.deps !== null) {
    return deps.deps;
  } else {
    // TODO(alxhub): this cast is necessary because the g3 typescript version doesn't narrow here.
    // There is at least one error.
    const error = (deps as { errors: ConstructorDepError[] }).errors[0];
    throw createUnsuitableInjectionTokenError(clazz, error);
  }
}

/**
 * Creates a fatal error with diagnostic for an invalid injection token.
 * @param clazz The class for which the injection token was unavailable.
 * @param error The reason why no valid injection token is available.
 */
function createUnsuitableInjectionTokenError(
  clazz: ClassDeclaration,
  error: ConstructorDepError
): FatalDiagnosticError {
  const { param, index, reason } = error;
  let chainMessage: string | undefined = undefined;
  let hints: ts.DiagnosticRelatedInformation[] | undefined = undefined;
  switch (reason.kind) {
    case ValueUnavailableKind.UNSUPPORTED:
      chainMessage =
        'Consider using the @Inject decorator to specify an injection token.';
      hints = [
        makeRelatedInformation(
          reason.typeNode,
          'This type is not supported as injection token.'
        ),
      ];
      break;
    case ValueUnavailableKind.NO_VALUE_DECLARATION:
      chainMessage =
        'Consider using the @Inject decorator to specify an injection token.';
      hints = [
        makeRelatedInformation(
          reason.typeNode,
          'This type does not have a value, so it cannot be used as injection token.'
        ),
      ];
      if (reason.decl !== null) {
        hints.push(
          makeRelatedInformation(reason.decl, 'The type is declared here.')
        );
      }
      break;
    case ValueUnavailableKind.TYPE_ONLY_IMPORT:
      chainMessage =
        'Consider changing the type-only import to a regular import, or use the @Inject decorator to specify an injection token.';
      hints = [
        makeRelatedInformation(
          reason.typeNode,
          'This type is imported using a type-only import, which prevents it from being usable as an injection token.'
        ),
        makeRelatedInformation(
          reason.node,
          'The type-only import occurs here.'
        ),
      ];
      break;
    case ValueUnavailableKind.NAMESPACE:
      chainMessage =
        'Consider using the @Inject decorator to specify an injection token.';
      hints = [
        makeRelatedInformation(
          reason.typeNode,
          'This type corresponds with a namespace, which cannot be used as injection token.'
        ),
        makeRelatedInformation(
          reason.importClause,
          'The namespace import occurs here.'
        ),
      ];
      break;
    case ValueUnavailableKind.UNKNOWN_REFERENCE:
      chainMessage = 'The type should reference a known declaration.';
      hints = [
        makeRelatedInformation(
          reason.typeNode,
          'This type could not be resolved.'
        ),
      ];
      break;
    case ValueUnavailableKind.MISSING_TYPE:
      chainMessage =
        'Consider adding a type to the parameter or use the @Inject decorator to specify an injection token.';
      break;
  }

  const chain: ts.DiagnosticMessageChain = {
    messageText: `No suitable injection token for parameter '${
      param.name || index
    }' of class '${clazz.name.text}'.`,
    category: ts.DiagnosticCategory.Error,
    code: 0,
    next: [
      {
        messageText: chainMessage,
        category: ts.DiagnosticCategory.Message,
        code: 0,
      },
    ],
  };

  return new FatalDiagnosticError(
    ErrorCode.PARAM_MISSING_TOKEN,
    param.nameNode,
    chain,
    hints
  );
}

/** todo 需要改成自己的依赖包 */
export function isAngularCore(
  decorator: Decorator
): decorator is Decorator & { import: Import } {
  return (
    decorator.import !== null && decorator.import.from === 'static-injector'
  );
}

export function findAngularDecorator(
  decorators: Decorator[],
  name: string,
  isCore: boolean
): Decorator | undefined {
  return decorators.find((decorator) =>
    isAngularDecorator(decorator, name, isCore)
  );
}

export function isAngularDecorator(
  decorator: Decorator,
  name: string,
  isCore: boolean
): boolean {
  if (isCore) {
    return decorator.name === name;
  } else if (isAngularCore(decorator)) {
    return decorator.import.name === name;
  }
  return false;
}

/**
 * Unwrap a `ts.Expression`, removing outer type-casts or parentheses until the expression is in its
 * lowest level form.
 *
 * For example, the expression "(foo as Type)" unwraps to "foo".
 */
export function unwrapExpression(node: ts.Expression): ts.Expression {
  while (ts.isAsExpression(node) || ts.isParenthesizedExpression(node)) {
    node = node.expression;
  }
  return node;
}

function expandForwardRef(arg: ts.Expression): ts.Expression | null {
  arg = unwrapExpression(arg);
  if (!ts.isArrowFunction(arg) && !ts.isFunctionExpression(arg)) {
    return null;
  }

  const body = arg.body;
  // Either the body is a ts.Expression directly, or a block with a single return statement.
  if (ts.isBlock(body)) {
    // Block body - look for a single return statement.
    if (body.statements.length !== 1) {
      return null;
    }
    const stmt = body.statements[0];
    if (!ts.isReturnStatement(stmt) || stmt.expression === undefined) {
      return null;
    }
    return stmt.expression;
  } else {
    // Shorthand body - return as an expression.
    return body;
  }
}

/**
 * If the given `node` is a forwardRef() expression then resolve its inner value, otherwise return
 * `null`.
 *
 * @param node the forwardRef() expression to resolve
 * @param reflector a ReflectionHost
 * @returns the resolved expression, if the original expression was a forwardRef(), or `null`
 *     otherwise.
 */
export function tryUnwrapForwardRef(
  node: ts.Expression,
  reflector: ReflectionHost
): ts.Expression | null {
  node = unwrapExpression(node);
  if (!ts.isCallExpression(node) || node.arguments.length !== 1) {
    return null;
  }

  const fn = ts.isPropertyAccessExpression(node.expression)
    ? node.expression.name
    : node.expression;
  if (!ts.isIdentifier(fn)) {
    return null;
  }

  const expr = expandForwardRef(node.arguments[0]);
  if (expr === null) {
    return null;
  }

  const imp = reflector.getImportOfIdentifier(fn);
  //todo 更换包名
  if (
    imp === null ||
    imp.from !== 'static-injector' ||
    imp.name !== 'forwardRef'
  ) {
    return null;
  }

  return expr;
}

const parensWrapperTransformerFactory: ts.TransformerFactory<ts.Expression> = (
  context: ts.TransformationContext
) => {
  const visitor: ts.Visitor = (node: ts.Node): ts.Node => {
    const visited = ts.visitEachChild(node, visitor, context);
    if (ts.isArrowFunction(visited) || ts.isFunctionExpression(visited)) {
      return ts.createParen(visited);
    }
    return visited;
  };
  return (node: ts.Expression) => ts.visitEachChild(node, visitor, context);
};

/**
 * Wraps all functions in a given expression in parentheses. This is needed to avoid problems
 * where Tsickle annotations added between analyse and transform phases in Angular may trigger
 * automatic semicolon insertion, e.g. if a function is the expression in a `return` statement.
 * More
 * info can be found in Tsickle source code here:
 * https://github.com/angular/tsickle/blob/d7974262571c8a17d684e5ba07680e1b1993afdd/src/jsdoc_transformer.ts#L1021
 *
 * @param expression Expression where functions should be wrapped in parentheses
 */
export function wrapFunctionExpressionsInParens(
  expression: ts.Expression
): ts.Expression {
  return ts.transform(expression, [parensWrapperTransformerFactory])
    .transformed[0];
}

/**
 * Create an R3Reference for a class.
 *
 * The `value` is the exported declaration of the class from its source file.
 * The `type` is an expression that would be used by ngcc in the typings (.d.ts) files.
 */
export function wrapTypeReference(
  reflector: ReflectionHost,
  clazz: ClassDeclaration
): R3Reference {
  const dtsClass = reflector.getDtsDeclaration(clazz);
  const value = new WrappedNodeExpr(clazz.name);
  const type =
    dtsClass !== null && isNamedClassDeclaration(dtsClass)
      ? new WrappedNodeExpr(dtsClass.name)
      : value;
  return { value, type };
}

export function toFactoryMetadata(
  meta: Omit<R3FactoryMetadata, 'target'>,
  target: FactoryTarget
): R3FactoryMetadata {
  return {
    name: meta.name,
    type: meta.type,
    internalType: meta.internalType,
    typeArgumentCount: meta.typeArgumentCount,
    deps: meta.deps,
    target,
  };
}

export function isAbstractClassDeclaration(clazz: ClassDeclaration): boolean {
  return (
    clazz.modifiers !== undefined &&
    clazz.modifiers.some((mod) => mod.kind === ts.SyntaxKind.AbstractKeyword)
  );
}
