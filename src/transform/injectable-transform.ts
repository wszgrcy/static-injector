import ts, {
  ClassDeclaration,
  factory,
  isClassDeclaration,
  SourceFile,
} from 'typescript';
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

export class InjectableTransformFactory {
  reflectionHost: TypeScriptReflectionHost;
  // partialEvaluator: PartialEvaluator;
  handler: InjectableDecoratorHandler;
  sfMap = new Map<
    SourceFile,
    {
      map: Map<ts.ClassDeclaration, { members; statements; decorator }>;
      imports;
      importManager;
    }
  >();
  constructor(
    private program: ts.Program,
    private typeChecker: ts.TypeChecker
  ) {
    this.reflectionHost = new TypeScriptReflectionHost(this.typeChecker);
    // this.partialEvaluator = new PartialEvaluator(this.reflectionHost, typeChecker, null);
    this.handler = new InjectableDecoratorHandler(
      this.reflectionHost,
      false,
      false
    );
  }
  getTransform(context: ts.TransformationContext) {
    return this.transform(context);
  }
  visit(
    node: ts.Node,
    context: ts.TransformationContext,
    map: Map<ts.ClassDeclaration, { members; statements; decorator }>
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
  addImportsTransform(context: ts.TransformationContext) {
    return (sf: SourceFile) => {
      let map = this.sfMap.get(ts.getOriginalNode(sf).getSourceFile());
      if (map && map.importManager && map.imports && map.imports.length) {
        return addImports(map.importManager, sf);
      }
      return sf;
    };
  }
  transform(context: ts.TransformationContext) {
    return (sf: SourceFile) => {
      let map = this.preAnalysis(sf);

      return this.visit(sf, context, map);
    };
  }

  preAnalysis(sf: SourceFile) {
    let map = new Map<
      ts.ClassDeclaration,
      { members; statements; decorator }
    >();
    let write = new NoopImportRewriter();
    let importManager = new ImportManager(write);
    nodeIteration(sf, (node) => {
      if (
        ts.isClassDeclaration(node) &&
        node.decorators &&
        this.reflectionHost.isClass(node)
      ) {
        // let list = [];
        const decorators = this.reflectionHost.getDecoratorsOfDeclaration(node);

        let result = this.handler.detect(node, decorators);
        let analysisOutput = this.handler.analyze(node, result.metadata);
        let compileResult = this.handler.compileFull(
          node,
          analysisOutput.analysis
        );
        let resultNode = this.translate(compileResult, importManager);
        // list.push(node);
        // list.push(resultNode)
        map.set(node, { ...resultNode, decorator: result.trigger });
      }
    });
    // list.forEach((item) => {
    //   let decorators = item.decorators;
    //   let decorator = decorators.find((item) => (item.expression as any).expression.getText() === "Injectable");
    //   dList.push({ classDecaration: item, decorator });
    // });
    this.sfMap.set(sf, {
      map,
      imports: importManager.getAllImports(sf.fileName),
      importManager: importManager,
    });
    return map;
  }
  private translate(
    compileResult: CompileResult[],
    importManager: ImportManager
  ) {
    // There is at least one field to add.
    const statements: ts.Statement[] = [];
    const members = [];

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
    // let imports = manager.getAllImports(sf.fileName);
    // let sfa = addImports(manager, sf);
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
    } else if (ts.isMethodDeclaration(node) && node.decorators !== undefined) {
      // Strip decorators of methods.
      node = ts.updateMethod(
        node,
        this._nonCoreDecoratorsOnly(node),
        node.modifiers,
        node.asteriskToken,
        node.name,
        node.questionToken,
        node.typeParameters,
        node.parameters,
        node.type,
        node.body
      ) as T & ts.MethodDeclaration;
    } else if (
      ts.isPropertyDeclaration(node) &&
      node.decorators !== undefined
    ) {
      // Strip decorators of properties.
      node = ts.updateProperty(
        node,
        this._nonCoreDecoratorsOnly(node),
        node.modifiers,
        node.name,
        node.questionToken,
        node.type,
        node.initializer
      ) as T & ts.PropertyDeclaration;
    } else if (ts.isGetAccessor(node)) {
      // Strip decorators of getters.
      node = ts.updateGetAccessor(
        node,
        this._nonCoreDecoratorsOnly(node),
        node.modifiers,
        node.name,
        node.parameters,
        node.type,
        node.body
      ) as T & ts.GetAccessorDeclaration;
    } else if (ts.isSetAccessor(node)) {
      // Strip decorators of setters.
      node = ts.updateSetAccessor(
        node,
        this._nonCoreDecoratorsOnly(node),
        node.modifiers,
        node.name,
        node.parameters,
        node.body
      ) as T & ts.SetAccessorDeclaration;
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
}
/**
 * todo 引入
 */
function isFromAngularCore(decorator: Decorator): boolean {
  return (
    decorator.import !== null && decorator.import.from === 'static-injector'
  );
}
