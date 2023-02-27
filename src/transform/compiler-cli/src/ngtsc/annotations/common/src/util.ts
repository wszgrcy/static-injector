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
  FactoryTarget,
  ParseLocation,
  ParseSourceFile,
  ParseSourceSpan,
  R3CompiledExpression,
  R3FactoryMetadata,
  R3Reference,
  ReadPropExpr,
  Statement,
  WrappedNodeExpr,
} from 'static-injector/transform/compiler';
import ts from 'typescript';

import { attachDefaultImportDeclaration } from '../../../imports/src/default';

import {
  ClassDeclaration,
  Decorator,
  Import,
  ImportedTypeValueReference,
  isNamedClassDeclaration,
  LocalTypeValueReference,
  ReflectionHost,
  TypeValueReference,
  TypeValueReferenceKind,
} from '../../../reflection';

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
      return ts.factory.createParenthesizedExpression(visited);
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
