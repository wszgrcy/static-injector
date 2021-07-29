import ts, { ClassDeclaration, factory, SourceFile } from 'typescript';
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
  statements;
  /** 要被移除的装饰器 */
  decorator: ts.Decorator;
}
export interface InjectableTransformFactoryOptions {
  strictCtorDeps?: boolean;
}
export function createTransform(
  program: ts.Program,
  options?: InjectableTransformFactoryOptions
) {
  let factory = new InjectableTransformFactory(program, options);
  return factory.getTransform();
}
export class InjectableTransformFactory {
  typeChecker: ts.TypeChecker;
  reflectionHost: TypeScriptReflectionHost;
  handler: InjectableDecoratorHandler;

  constructor(
    private program: ts.Program,
    private options: InjectableTransformFactoryOptions = {}
  ) {
    this.typeChecker = this.program.getTypeChecker();
    this.reflectionHost = new TypeScriptReflectionHost(this.typeChecker);
    this.handler = new InjectableDecoratorHandler(
      this.reflectionHost,
      false,
      this.options.strictCtorDeps
    );
  }
  getTransform() {
    // return;
    return (context: ts.TransformationContext) => this.transform(context);
  }
  private visit(
    node: ts.Node,
    context: ts.TransformationContext,
    map: Map<ts.ClassDeclaration, ClassMetadata>
  ) {
    return ts.visitEachChild(
      node,
      (node: ClassDeclaration) => {
        let result = map.get(node);
        if (result) {
          let decoratorList = node.decorators.filter(
            (item) => item !== result.decorator
          );
          return factory.updateClassDeclaration(
            node,
            decoratorList.length ? decoratorList : undefined,
            node.modifiers,
            node.name,
            node.typeParameters,
            node.heritageClauses,
            [
              ...node.members.map((node) => this._stripAngularDecorators(node)),
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
        node.decorators &&
        this.reflectionHost.isClass(node)
      ) {
        const decorators = this.reflectionHost.getDecoratorsOfDeclaration(node);

        let result = this.handler.detect(node, decorators);
        let analysisOutput = this.handler.analyze(node, result.metadata);
        let compileResult = this.handler.compileFull(
          node,
          analysisOutput.analysis
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
      const exprNode = translateExpression(field.initializer, importManager);

      // Create a static property declaration for the new field.
      const property = ts.createProperty(
        undefined,
        [ts.createToken(ts.SyntaxKind.StaticKeyword)],
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
    if (ts.isParameter(node)) {
      // Strip decorators from parameters (probably of the constructor).
      node = ts.updateParameter(
        node,
        this._nonCoreDecoratorsOnly(node),
        node.modifiers,
        node.dotDotDotToken,
        node.name,
        node.questionToken,
        node.type,
        node.initializer
      ) as T & ts.ParameterDeclaration;
    } else if (ts.isConstructorDeclaration(node)) {
      // For constructors, strip decorators of the parameters.
      const parameters = node.parameters.map((param) =>
        this._stripAngularDecorators(param)
      );
      node = ts.updateConstructor(
        node,
        node.decorators,
        node.modifiers,
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
    node: ts.Declaration
  ): ts.NodeArray<ts.Decorator> | undefined {
    // Shortcut if the node has no decorators.
    if (node.decorators === undefined) {
      return undefined;
    }
    // Build a Set of the decorators on this node from static-injector.
    const coreDecorators = this._angularCoreDecorators(node);

    if (coreDecorators.size === node.decorators.length) {
      // If all decorators are to be removed, return `undefined`.
      return undefined;
    } else if (coreDecorators.size === 0) {
      // If no decorators need to be removed, return the original decorators array.
      return node.decorators;
    }

    // Filter out the core decorators.
    const filtered = node.decorators.filter((dec) => !coreDecorators.has(dec));

    // If no decorators survive, return `undefined`. This can only happen if a core decorator is
    // repeated on the node.
    if (filtered.length === 0) {
      return undefined;
    }

    // Create a new `NodeArray` with the filtered decorators that sourcemaps back to the original.
    const array = ts.createNodeArray(filtered);
    (array.pos as number) = node.decorators.pos;
    (array.end as number) = node.decorators.end;
    return array;
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
