/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { WrappedNodeExpr } from 'static-injector/transform/compiler';
import ts from 'typescript';

const DefaultImportDeclaration = Symbol('DefaultImportDeclaration');

interface WithDefaultImportDeclaration {
  [DefaultImportDeclaration]?: ts.ImportDeclaration;
}

/**
 * Attaches a default import declaration to `expr` to indicate the dependency of `expr` on the
 * default import.
 */
export function attachDefaultImportDeclaration(
  expr: WrappedNodeExpr<unknown>,
  importDecl: ts.ImportDeclaration
): void {
  (expr as WithDefaultImportDeclaration)[DefaultImportDeclaration] = importDecl;
}

/**
 * Obtains the default import declaration that `expr` depends on, or `null` if there is no such
 * dependency.
 */
export function getDefaultImportDeclaration(
  expr: WrappedNodeExpr<unknown>
): ts.ImportDeclaration | null {
  return (
    (expr as WithDefaultImportDeclaration)[DefaultImportDeclaration] ?? null
  );
}
