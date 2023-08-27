import ts, { ClassDeclaration, SourceFile } from 'typescript';
import { InjectableDecoratorHandler } from './compiler-cli/src/ngtsc/annotations/src/injectable';
import { NoopImportRewriter } from './compiler-cli/src/ngtsc/imports';
import {
  Decorator,
  TypeScriptReflectionHost,
} from './compiler-cli/src/ngtsc/reflection';
import { addImports, CompileResult } from './compiler-cli/src/ngtsc/transform';
import {
  ImportManager,
  translateExpression,
  translateStatement,
} from './compiler-cli/src/ngtsc/translator';

import { nodeIteration } from './node-Iteration';
const NO_DECORATORS = new Set<ts.Decorator>();
interface ClassMetadata {
  /** 要添加的静态方法 */
  members: ts.PropertyDeclaration[];
  /** 声明,未用到 */
  statements: any;
  /** 要被移除的装饰器 */
  decorator: ts.Decorator;
}
export interface InjectableTransformerFactoryOptions {
  strictCtorDeps?: boolean;
}
export function createTransformer(
  program: ts.Program,
  options?: InjectableTransformerFactoryOptions
) {
  let factory = new InjectableTransformerFactory(program, options);
  return factory.getTransform();
}
export class InjectableTransformerFactory {
  typeChecker: ts.TypeChecker;
  reflectionHost: TypeScriptReflectionHost;
  handler: InjectableDecoratorHandler;

  constructor(
    private program: ts.Program,
    private options: InjectableTransformerFactoryOptions = {}
  ) {
    this.typeChecker = this.program.getTypeChecker();
    this.reflectionHost = new TypeScriptReflectionHost(this.typeChecker);
    this.handler = new InjectableDecoratorHandler(
      this.reflectionHost,
      false,
      !!this.options.strictCtorDeps,
      false
    );
  }
  getTransform() {
    return (context: ts.TransformationContext) => this.transform(context);
  }
  private visit<T extends ts.Node>(
    node: T,
    context: ts.TransformationContext,
    map: Map<ts.ClassDeclaration, ClassMetadata>
  ): T {
    return ts.visitEachChild(
      node,
      (node) => {
        let result = map.get(node as ClassDeclaration);
        if (result) {
          const filteredDecorators =
            // Remove the decorator which triggered this compilation, leaving the others alone.
            maybeFilterDecorator(ts.getDecorators(node as ClassDeclaration), [
              result.decorator,
            ]);
          const nodeModifiers = ts.getModifiers(node as ClassDeclaration);

          let updatedModifiers: ts.ModifierLike[] | undefined;

          if (filteredDecorators?.length || nodeModifiers?.length) {
            updatedModifiers = [
              ...(filteredDecorators || []),
              ...(nodeModifiers || []),
            ];
          }
          return ts.factory.updateClassDeclaration(
            node as ClassDeclaration,
            updatedModifiers,
            (node as ClassDeclaration).name,
            (node as ClassDeclaration).typeParameters,
            (node as ClassDeclaration).heritageClauses || [],
            [
              ...(node as ClassDeclaration).members.map((node) =>
                this._stripAngularDecorators(node)
              ),
              ...result.members,
            ]
          );
        }
        return this.visit(node, context, map);
      },
      context
    );
  }

  private transform(context: ts.TransformationContext) {
    return (sf: SourceFile) => {
      let map = this.preAnalysis(sf);
      sf = this.updateStatements(sf, map.importManager);
      return this.visit(sf, context, map.classMetadataMap);
    };
  }

  private preAnalysis(sf: SourceFile) {
    let classMetadataMap = new Map<ts.ClassDeclaration, ClassMetadata>();
    let write = new NoopImportRewriter();
    let importManager = new ImportManager(write);
    nodeIteration(sf, (node) => {
      if (
        ts.isClassDeclaration(node) &&
        ts.getDecorators(node) &&
        this.reflectionHost.isClass(node)
      ) {
        const decorators =
          this.reflectionHost.getDecoratorsOfDeclaration(node) || [];

        let result = this.handler.detect(node, decorators);
        if (!result) {
          return;
        }
        let analysisOutput = this.handler.analyze(node, result.metadata);

        let compileResult = this.handler.compileFull(
          node,
          analysisOutput.analysis!
        );
        let resultNode = this.translate(compileResult, importManager);
        classMetadataMap.set(node, {
          ...resultNode,
          decorator: result.trigger as ts.Decorator,
        });
      }
    });

    // this.sourceFileMetadataMap.set(sf, {
    //   classMetadataMap,
    //   importManager: importManager,
    // });
    return { classMetadataMap, importManager };
  }
  private translate(
    compileResult: CompileResult[],
    importManager: ImportManager
  ) {
    // There is at least one field to add.
    const statements: ts.Statement[] = [];
    const members: ts.PropertyDeclaration[] = [];

    for (const field of compileResult) {
      // Translate the initializer for the field into TS nodes.
      const exprNode = translateExpression(field.initializer!, importManager);

      // Create a static property declaration for the new field.
      const property = ts.factory.createPropertyDeclaration(
        [ts.factory.createToken(ts.SyntaxKind.StaticKeyword)],
        field.name,
        undefined,
        undefined,
        exprNode
      );

      if (false) {
        // Closure compiler transforms the form `Service.ɵprov = X` into `Service$ɵprov = X`. To
        // prevent this transformation, such assignments need to be annotated with @nocollapse.
        // Note that tsickle is typically responsible for adding such annotations, however it
        // doesn't yet handle synthetic fields added during other transformations.
        ts.addSyntheticLeadingComment(
          property,
          ts.SyntaxKind.MultiLineCommentTrivia,
          '* @nocollapse ',
          /* hasTrailingNewLine */ false
        );
      }

      field.statements
        .map((stmt) => translateStatement(stmt, importManager))
        .forEach((stmt) => statements.push(stmt));
      members.push(property);
    }
    return { statements, members };
  }

  /**
   * Remove Angular decorators from a `ts.Node` in a shallow manner.
   *
   * This will remove decorators from class elements (getters, setters, properties, methods) as well
   * as parameters of constructors.
   */
  private _stripAngularDecorators<T extends ts.Node>(node: T): T {
    const modifiers = ts.canHaveModifiers(node)
      ? ts.getModifiers(node)
      : undefined;
    const nonCoreDecorators = ts.canHaveDecorators(node)
      ? this._nonCoreDecoratorsOnly(node)
      : undefined;
    const combinedModifiers = [
      ...(nonCoreDecorators || []),
      ...(modifiers || []),
    ];

    if (ts.isParameter(node)) {
      // Strip decorators from parameters (probably of the constructor).
      node = ts.factory.updateParameterDeclaration(
        node,
        combinedModifiers,
        node.dotDotDotToken,
        node.name,
        node.questionToken,
        node.type,
        node.initializer
      ) as T & ts.ParameterDeclaration;
    } else if (ts.isMethodDeclaration(node)) {
      // Strip decorators of methods.
      node = ts.factory.updateMethodDeclaration(
        node,
        combinedModifiers,
        node.asteriskToken,
        node.name,
        node.questionToken,
        node.typeParameters,
        node.parameters,
        node.type,
        node.body
      ) as T & ts.MethodDeclaration;
    } else if (ts.isPropertyDeclaration(node)) {
      // Strip decorators of properties.
      node = ts.factory.updatePropertyDeclaration(
        node,
        combinedModifiers,
        node.name,
        node.questionToken,
        node.type,
        node.initializer
      ) as T & ts.PropertyDeclaration;
    } else if (ts.isGetAccessor(node)) {
      // Strip decorators of getters.
      node = ts.factory.updateGetAccessorDeclaration(
        node,
        combinedModifiers,
        node.name,
        node.parameters,
        node.type,
        node.body
      ) as T & ts.GetAccessorDeclaration;
    } else if (ts.isSetAccessor(node)) {
      // Strip decorators of setters.
      node = ts.factory.updateSetAccessorDeclaration(
        node,
        combinedModifiers,
        node.name,
        node.parameters,
        node.body
      ) as T & ts.SetAccessorDeclaration;
    } else if (ts.isConstructorDeclaration(node)) {
      // For constructors, strip decorators of the parameters.
      const parameters = node.parameters.map((param) =>
        this._stripAngularDecorators(param)
      );
      node = ts.factory.updateConstructorDeclaration(
        node,
        modifiers,
        parameters,
        node.body
      ) as T & ts.ConstructorDeclaration;
    }
    return node;
  }
  /**
   * Return all decorators on a `Declaration` which are from static-injector, or an empty set if none
   * are.
   */
  private _angularCoreDecorators(decl: ts.Declaration): Set<ts.Decorator> {
    const decorators = this.reflectionHost.getDecoratorsOfDeclaration(decl);
    if (decorators === null) {
      return NO_DECORATORS;
    }
    const coreDecorators = decorators
      .filter((dec) => isFromAngularCore(dec))
      .map((dec) => dec.node as ts.Decorator);
    if (coreDecorators.length > 0) {
      return new Set<ts.Decorator>(coreDecorators);
    } else {
      return NO_DECORATORS;
    }
  }

  /**
   * Given a `ts.Node`, filter the decorators array and return a version containing only non-Angular
   * decorators.
   *
   * If all decorators are removed (or none existed in the first place), this method returns
   * `undefined`.
   */
  private _nonCoreDecoratorsOnly(
    node: ts.HasDecorators
  ): ts.NodeArray<ts.Decorator> | undefined {
    const decorators = ts.getDecorators(node);

    // Shortcut if the node has no decorators.
    if (decorators === undefined) {
      return undefined;
    }
    // Build a Set of the decorators on this node from @angular/core.
    const coreDecorators = this._angularCoreDecorators(node);

    if (coreDecorators.size === decorators.length) {
      // If all decorators are to be removed, return `undefined`.
      return undefined;
    } else if (coreDecorators.size === 0) {
      // If no decorators need to be removed, return the original decorators array.
      return nodeArrayFromDecoratorsArray(decorators);
    }

    // Filter out the core decorators.
    const filtered = decorators.filter((dec) => !coreDecorators.has(dec));

    // If no decorators survive, return `undefined`. This can only happen if a core decorator is
    // repeated on the node.
    if (filtered.length === 0) {
      return undefined;
    }

    // Create a new `NodeArray` with the filtered decorators that sourcemaps back to the original.
    return nodeArrayFromDecoratorsArray(filtered);
  }
  private updateStatements(node: ts.SourceFile, importManager: ImportManager) {
    return addImports(importManager, node);
  }
}
/**
 * todo 引入
 */
function isFromAngularCore(decorator: Decorator): boolean {
  return (
    decorator.import !== null && decorator.import.from === 'static-injector'
  );
}

/** Creates a `NodeArray` with the correct offsets from an array of decorators. */
function nodeArrayFromDecoratorsArray(
  decorators: readonly ts.Decorator[]
): ts.NodeArray<ts.Decorator> {
  const array = ts.factory.createNodeArray(decorators);

  if (array.length > 0) {
    (array.pos as number) = decorators[0].pos;
    (array.end as number) = decorators[decorators.length - 1].end;
  }

  return array;
}
function maybeFilterDecorator(
  decorators: readonly ts.Decorator[] | undefined,
  toRemove: ts.Decorator[]
): ts.NodeArray<ts.Decorator> | undefined {
  if (decorators === undefined) {
    return undefined;
  }
  const filtered = decorators.filter(
    (dec) =>
      toRemove.find(
        (decToRemove) => ts.getOriginalNode(dec) === decToRemove
      ) === undefined
  );
  if (filtered.length === 0) {
    return undefined;
  }
  return ts.factory.createNodeArray(filtered);
}
