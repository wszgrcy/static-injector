/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as ts from 'typescript';

import {
  ClassDeclaration,
  ClassMember,
  ClassMemberKind,
  CtorParameter,
  DeclarationNode,
  Decorator,
  Import,
  isDecoratorIdentifier,
  ReflectionHost,
} from './host';
import { typeToValue } from './type_to_value';
import { isNamedClassDeclaration } from './util';

/**
 * reflector.ts implements static reflection of declarations using the TypeScript `ts.TypeChecker`.
 */

export class TypeScriptReflectionHost implements ReflectionHost {
  constructor(protected checker: ts.TypeChecker) {}

  getDecoratorsOfDeclaration(declaration: DeclarationNode): Decorator[] | null {
    if (
      declaration.decorators === undefined ||
      declaration.decorators.length === 0
    ) {
      return null;
    }
    return declaration.decorators
      .map((decorator) => this._reflectDecorator(decorator))
      .filter((dec): dec is Decorator => dec !== null);
  }

  getMembersOfClass(clazz: ClassDeclaration): ClassMember[] {
    const tsClazz = castDeclarationToClassOrDie(clazz);
    return tsClazz.members
      .map((member) => this._reflectMember(member))
      .filter((member): member is ClassMember => member !== null);
  }

  getConstructorParameters(clazz: ClassDeclaration): CtorParameter[] | null {
    const tsClazz = castDeclarationToClassOrDie(clazz);

    const isDeclaration = tsClazz.getSourceFile().isDeclarationFile;
    // For non-declaration files, we want to find the constructor with a `body`. The constructors
    // without a `body` are overloads whereas we want the implementation since it's the one that'll
    // be executed and which can have decorators. For declaration files, we take the first one that
    // we get.
    const ctor = tsClazz.members.find(
      (member): member is ts.ConstructorDeclaration =>
        ts.isConstructorDeclaration(member) &&
        (isDeclaration || member.body !== undefined)
    );
    if (ctor === undefined) {
      return null;
    }

    return ctor.parameters.map((node) => {
      // The name of the parameter is easy.
      const name = parameterName(node.name);

      const decorators = this.getDecoratorsOfDeclaration(node);

      // It may or may not be possible to write an expression that refers to the value side of the
      // type named for the parameter.

      let originalTypeNode = node.type || null;
      let typeNode = originalTypeNode;

      // Check if we are dealing with a simple nullable union type e.g. `foo: Foo|null`
      // and extract the type. More complex union types e.g. `foo: Foo|Bar` are not supported.
      // We also don't need to support `foo: Foo|undefined` because Angular's DI injects `null` for
      // optional tokes that don't have providers.
      if (typeNode && ts.isUnionTypeNode(typeNode)) {
        let childTypeNodes = typeNode.types.filter(
          (childTypeNode) =>
            !(
              ts.isLiteralTypeNode(childTypeNode) &&
              childTypeNode.literal.kind === ts.SyntaxKind.NullKeyword
            )
        );

        if (childTypeNodes.length === 1) {
          typeNode = childTypeNodes[0];
        }
      }

      const typeValueReference = typeToValue(typeNode, this.checker);

      return {
        name,
        nameNode: node.name,
        typeValueReference,
        typeNode: originalTypeNode,
        decorators,
      };
    });
  }

  getImportOfIdentifier(id: ts.Identifier): Import | null {
    const directImport = this.getDirectImportOfIdentifier(id);
    if (directImport !== null) {
      return directImport;
    } else if (ts.isQualifiedName(id.parent) && id.parent.right === id) {
      return this.getImportOfNamespacedIdentifier(
        id,
        getQualifiedNameRoot(id.parent)
      );
    } else if (
      ts.isPropertyAccessExpression(id.parent) &&
      id.parent.name === id
    ) {
      return this.getImportOfNamespacedIdentifier(
        id,
        getFarLeftIdentifier(id.parent)
      );
    } else {
      return null;
    }
  }

  isClass(node: ts.Node): node is ClassDeclaration {
    // For our purposes, classes are "named" ts.ClassDeclarations;
    // (`node.name` can be undefined in unnamed default exports: `default export class { ... }`).
    return isNamedClassDeclaration(node);
  }

  hasBaseClass(clazz: ClassDeclaration): boolean {
    return this.getBaseClassExpression(clazz) !== null;
  }

  getBaseClassExpression(clazz: ClassDeclaration): ts.Expression | null {
    if (
      !(ts.isClassDeclaration(clazz) || ts.isClassExpression(clazz)) ||
      clazz.heritageClauses === undefined
    ) {
      return null;
    }
    const extendsClause = clazz.heritageClauses.find(
      (clause) => clause.token === ts.SyntaxKind.ExtendsKeyword
    );
    if (extendsClause === undefined) {
      return null;
    }
    const extendsType = extendsClause.types[0];
    if (extendsType === undefined) {
      return null;
    }
    return extendsType.expression;
  }

  getGenericArityOfClass(clazz: ClassDeclaration): number | null {
    if (!ts.isClassDeclaration(clazz)) {
      return null;
    }
    return clazz.typeParameters !== undefined ? clazz.typeParameters.length : 0;
  }

  getDtsDeclaration(_: ClassDeclaration): ts.Declaration | null {
    return null;
  }

  getInternalNameOfClass(clazz: ClassDeclaration): ts.Identifier {
    return clazz.name;
  }

  getAdjacentNameOfClass(clazz: ClassDeclaration): ts.Identifier {
    return clazz.name;
  }

  protected getDirectImportOfIdentifier(id: ts.Identifier): Import | null {
    const symbol = this.checker.getSymbolAtLocation(id);

    if (
      symbol === undefined ||
      symbol.declarations === undefined ||
      symbol.declarations.length !== 1
    ) {
      return null;
    }

    const decl = symbol.declarations[0];
    const importDecl = getContainingImportDeclaration(decl);

    // Ignore declarations that are defined locally (not imported).
    if (importDecl === null) {
      return null;
    }

    // The module specifier is guaranteed to be a string literal, so this should always pass.
    if (!ts.isStringLiteral(importDecl.moduleSpecifier)) {
      // Not allowed to happen in TypeScript ASTs.
      return null;
    }

    return {
      from: importDecl.moduleSpecifier.text,
      name: getExportedName(decl, id),
    };
  }

  /**
   * Try to get the import info for this identifier as though it is a namespaced import.
   *
   * For example, if the identifier is the `Directive` part of a qualified type chain like:
   *
   * ```
   * core.Directive
   * ```
   *
   * then it might be that `core` is a namespace import such as:
   *
   * ```
   * import * as core from 'tslib';
   * ```
   *
   * @param id the TypeScript identifier to find the import info for.
   * @returns The import info if this is a namespaced import or `null`.
   */
  protected getImportOfNamespacedIdentifier(
    id: ts.Identifier,
    namespaceIdentifier: ts.Identifier | null
  ): Import | null {
    if (namespaceIdentifier === null) {
      return null;
    }
    const namespaceSymbol =
      this.checker.getSymbolAtLocation(namespaceIdentifier);
    if (!namespaceSymbol || namespaceSymbol.declarations === undefined) {
      return null;
    }
    const declaration =
      namespaceSymbol.declarations.length === 1
        ? namespaceSymbol.declarations[0]
        : null;
    if (!declaration) {
      return null;
    }
    const namespaceDeclaration = ts.isNamespaceImport(declaration)
      ? declaration
      : null;
    if (!namespaceDeclaration) {
      return null;
    }

    const importDeclaration = namespaceDeclaration.parent.parent;
    if (!ts.isStringLiteral(importDeclaration.moduleSpecifier)) {
      // Should not happen as this would be invalid TypesScript
      return null;
    }

    return {
      from: importDeclaration.moduleSpecifier.text,
      name: id.text,
    };
  }

  private _reflectDecorator(node: ts.Decorator): Decorator | null {
    // Attempt to resolve the decorator expression into a reference to a concrete Identifier. The
    // expression may contain a call to a function which returns the decorator function, in which
    // case we want to return the arguments.
    let decoratorExpr: ts.Expression = node.expression;
    let args: ts.Expression[] | null = null;

    // Check for call expressions.
    if (ts.isCallExpression(decoratorExpr)) {
      args = Array.from(decoratorExpr.arguments);
      decoratorExpr = decoratorExpr.expression;
    }

    // The final resolved decorator should be a `ts.Identifier` - if it's not, then something is
    // wrong and the decorator can't be resolved statically.
    if (!isDecoratorIdentifier(decoratorExpr)) {
      return null;
    }
    const decoratorIdentifier = ts.isIdentifier(decoratorExpr)
      ? decoratorExpr
      : decoratorExpr.name;
    const importDecl = this.getImportOfIdentifier(decoratorIdentifier);

    return {
      name: decoratorIdentifier.text,
      identifier: decoratorExpr,
      import: importDecl,
      node,
      args,
    };
  }

  private _reflectMember(node: ts.ClassElement): ClassMember | null {
    let kind: ClassMemberKind | null = null;
    let value: ts.Expression | null = null;
    let name: string | null = null;
    let nameNode: ts.Identifier | ts.StringLiteral | null = null;

    if (ts.isPropertyDeclaration(node)) {
      kind = ClassMemberKind.Property;
      value = node.initializer || null;
    } else if (ts.isGetAccessorDeclaration(node)) {
      kind = ClassMemberKind.Getter;
    } else if (ts.isSetAccessorDeclaration(node)) {
      kind = ClassMemberKind.Setter;
    } else if (ts.isMethodDeclaration(node)) {
      kind = ClassMemberKind.Method;
    } else if (ts.isConstructorDeclaration(node)) {
      kind = ClassMemberKind.Constructor;
    } else {
      return null;
    }

    if (ts.isConstructorDeclaration(node)) {
      name = 'constructor';
    } else if (ts.isIdentifier(node.name)) {
      name = node.name.text;
      nameNode = node.name;
    } else if (ts.isStringLiteral(node.name)) {
      name = node.name.text;
      nameNode = node.name;
    } else {
      return null;
    }

    const decorators = this.getDecoratorsOfDeclaration(node);
    const isStatic =
      node.modifiers !== undefined &&
      node.modifiers.some((mod) => mod.kind === ts.SyntaxKind.StaticKeyword);

    return {
      node,
      implementation: node,
      kind,
      type: node.type || null,
      name,
      nameNode,
      decorators,
      value,
      isStatic,
    };
  }
}

export function reflectObjectLiteral(
  node: ts.ObjectLiteralExpression
): Map<string, ts.Expression> {
  const map = new Map<string, ts.Expression>();
  node.properties.forEach((prop) => {
    if (ts.isPropertyAssignment(prop)) {
      const name = propertyNameToString(prop.name);
      if (name === null) {
        return;
      }
      map.set(name, prop.initializer);
    } else if (ts.isShorthandPropertyAssignment(prop)) {
      map.set(prop.name.text, prop.name);
    } else {
      return;
    }
  });
  return map;
}

function castDeclarationToClassOrDie(
  declaration: ClassDeclaration
): ClassDeclaration<ts.ClassDeclaration> {
  if (!ts.isClassDeclaration(declaration)) {
    throw new Error(
      `Reflecting on a ${
        ts.SyntaxKind[declaration.kind]
      } instead of a ClassDeclaration.`
    );
  }
  return declaration;
}

function parameterName(name: ts.BindingName): string | null {
  if (ts.isIdentifier(name)) {
    return name.text;
  } else {
    return null;
  }
}

function propertyNameToString(node: ts.PropertyName): string | null {
  if (
    ts.isIdentifier(node) ||
    ts.isStringLiteral(node) ||
    ts.isNumericLiteral(node)
  ) {
    return node.text;
  } else {
    return null;
  }
}

/**
 * Compute the left most identifier in a qualified type chain. E.g. the `a` of `a.b.c.SomeType`.
 * @param qualifiedName The starting property access expression from which we want to compute
 * the left most identifier.
 * @returns the left most identifier in the chain or `null` if it is not an identifier.
 */
function getQualifiedNameRoot(
  qualifiedName: ts.QualifiedName
): ts.Identifier | null {
  while (ts.isQualifiedName(qualifiedName.left)) {
    qualifiedName = qualifiedName.left;
  }
  return ts.isIdentifier(qualifiedName.left) ? qualifiedName.left : null;
}

/**
 * Compute the left most identifier in a property access chain. E.g. the `a` of `a.b.c.d`.
 * @param propertyAccess The starting property access expression from which we want to compute
 * the left most identifier.
 * @returns the left most identifier in the chain or `null` if it is not an identifier.
 */
function getFarLeftIdentifier(
  propertyAccess: ts.PropertyAccessExpression
): ts.Identifier | null {
  while (ts.isPropertyAccessExpression(propertyAccess.expression)) {
    propertyAccess = propertyAccess.expression;
  }
  return ts.isIdentifier(propertyAccess.expression)
    ? propertyAccess.expression
    : null;
}

/**
 * Return the ImportDeclaration for the given `node` if it is either an `ImportSpecifier` or a
 * `NamespaceImport`. If not return `null`.
 */
function getContainingImportDeclaration(
  node: ts.Node
): ts.ImportDeclaration | null {
  return ts.isImportSpecifier(node)
    ? node.parent!.parent!.parent!
    : ts.isNamespaceImport(node)
    ? node.parent.parent
    : null;
}

/**
 * Compute the name by which the `decl` was exported, not imported.
 * If no such declaration can be found (e.g. it is a namespace import)
 * then fallback to the `originalId`.
 */
function getExportedName(
  decl: ts.Declaration,
  originalId: ts.Identifier
): string {
  return ts.isImportSpecifier(decl)
    ? (decl.propertyName !== undefined ? decl.propertyName : decl.name).text
    : originalId.text;
}

const LocalExportedClasses = Symbol('LocalExportedClasses');

/**
 * A `ts.SourceFile` expando which includes a cached `Set` of local `ClassDeclarations` that are
 * exported either directly (`export class ...`) or indirectly (via `export {...}`).
 *
 * This cache does not cause memory leaks as:
 *
 *  1. The only references cached here are local to the `ts.SourceFile`, and thus also available in
 *     `this.statements`.
 *
 *  2. The only way this `Set` could change is if the source file itself was changed, which would
 *     invalidate the entire `ts.SourceFile` object in favor of a new version. Thus, changing the
 *     source file also invalidates this cache.
 */
interface SourceFileWithCachedExports extends ts.SourceFile {
  /**
   * Cached `Set` of `ClassDeclaration`s which are locally declared in this file and are exported
   * either directly or indirectly.
   */
  [LocalExportedClasses]?: Set<ClassDeclaration>;
}
