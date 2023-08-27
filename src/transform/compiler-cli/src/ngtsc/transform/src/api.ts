/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  Expression,
  Statement,
  Type,
} from 'static-injector/transform/compiler';
import ts from 'typescript';

import { ClassDeclaration, Decorator, ReflectionHost } from '../../reflection';

/**
 * Provides the interface between a decorator compiler from @angular/compiler and the Typescript
 * compiler/transform.
 *
 * The decorator compilers in @angular/compiler do not depend on Typescript. The handler is
 * responsible for extracting the information required to perform compilation from the decorators
 * and Typescript source, invoking the decorator compiler, and returning the result.
 *
 * @param `D` The type of decorator metadata produced by `detect`.
 * @param `A` The type of analysis metadata produced by `analyze`.
 * @param `R` The type of resolution metadata produced by `resolve`.
 */
export interface DecoratorHandler<D, A, R> {
  /**
   * Scan a set of reflected decorators and determine if this handler is responsible for compilation
   * of one of them.
   */
  detect(
    node: ClassDeclaration,
    decorators: Decorator[] | null
  ): DetectResult<D> | undefined;

  /**
   * Asynchronously perform pre-analysis on the decorator/class combination.
   *
   * `preanalyze` is optional and is not guaranteed to be called through all compilation flows. It
   * will only be called if asynchronicity is supported in the CompilerHost.
   */
  preanalyze?(
    node: ClassDeclaration,
    metadata: Readonly<D>
  ): Promise<void> | undefined;

  /**
   * Perform analysis on the decorator/class combination, extracting information from the class
   * required for compilation.
   *
   * Returns analyzed metadata if successful, or an array of diagnostic messages if the analysis
   * fails or the decorator isn't valid.
   *
   * Analysis should always be a "pure" operation, with no side effects. This is because the
   * detect/analysis steps might be skipped for files which have not changed during incremental
   * builds. Any side effects required for compilation (e.g. registration of metadata) should happen
   * in the `register` phase, which is guaranteed to run even for incremental builds.
   */
  analyze(node: ClassDeclaration, metadata: Readonly<D>): AnalysisOutput<A>;

  /**
   * Generate a description of the field which should be added to the class, including any
   * initialization code to be generated.
   *
   * If the compilation mode is configured as other than full but an implementation of the
   * corresponding method is not provided, then this method is called as a fallback.
   */
  compileFull(
    node: ClassDeclaration,
    analysis: Readonly<A>
  ): CompileResult | CompileResult[];
}

/**
 * The output of detecting a trait for a declaration as the result of the first phase of the
 * compilation pipeline.
 */
export interface DetectResult<M> {
  /**
   * The node that triggered the match, which is typically a decorator.
   */
  trigger: ts.Node | null;

  /**
   * Refers to the decorator that was recognized for this detection, if any. This can be a concrete
   * decorator that is actually present in a file, or a synthetic decorator as inserted
   * programmatically.
   */
  decorator: Decorator | null;

  /**
   * An arbitrary object to carry over from the detection phase into the analysis phase.
   */
  metadata: Readonly<M>;
}

/**
 * The output of an analysis operation, consisting of possibly an arbitrary analysis object (used as
 * the input to code generation) and potentially diagnostics if there were errors uncovered during
 * analysis.
 */
export interface AnalysisOutput<A> {
  analysis?: Readonly<A>;
  diagnostics?: ts.Diagnostic[];
}

/**
 * A description of the static field to add to a class, including an initialization expression
 * and a type for the .d.ts file.
 */
export interface CompileResult {
  name: string;
  initializer: Expression | null;
  statements: Statement[];
  type: Type;
  deferrableImports: Set<ts.ImportDeclaration> | null;
}
