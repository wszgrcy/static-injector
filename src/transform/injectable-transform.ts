import ts, { ClassDeclaration, factory, SourceFile } from 'typescript';
import { nodeIteration } from './node-Iteration';

export class InjectableTransformFactory {
  constructor(private program: ts.Program, private typeChecker: ts.TypeChecker) {}
  getTransform(context: ts.TransformationContext) {
    return this.transform(context);
  }
  visit(node: ts.Node, context: ts.TransformationContext, list) {
    return ts.visitEachChild(
      node,
      (node: ClassDeclaration) => {
        let result = list.find((item) => item.classDecaration === node);
        if (result) {
            let name=node.name.getText()
          return factory.updateClassDeclaration(
            node,
            node.decorators.filter((item) => item !== result.decorator),
            node.modifiers,
            node.name,
            node.typeParameters,
            node.heritageClauses,
            [
              ...node.members,
              ...[
                factory.createMethodDeclaration(
                  undefined,
                  [factory.createModifier(ts.SyntaxKind.StaticKeyword)],
                  undefined,
                  factory.createIdentifier('ɵfac'),
                  undefined,
                  undefined,
                  [
                    factory.createParameterDeclaration(
                      undefined,
                      undefined,
                      undefined,
                      factory.createIdentifier('t'),
                      undefined,
                      undefined,
                      undefined
                    ),
                  ],
                  undefined,
                  factory.createBlock(
                    [
                      factory.createReturnStatement(
                        factory.createNewExpression(
                          factory.createParenthesizedExpression(
                            factory.createBinaryExpression(
                              factory.createIdentifier('t'),
                              factory.createToken(ts.SyntaxKind.BarBarToken),
                              factory.createIdentifier(name)
                            )
                          ),
                          undefined,
                          []
                        )
                      ),
                    ],
                    true
                  )
                ),
                factory.createPropertyDeclaration(
                  undefined,
                  [factory.createModifier(ts.SyntaxKind.StaticKeyword)],
                  factory.createIdentifier('ɵprov'),
                  undefined,
                  undefined,
                  factory.createObjectLiteralExpression(
                    [
                      factory.createPropertyAssignment(factory.createIdentifier('token'), factory.createIdentifier(name)),
                      factory.createPropertyAssignment(factory.createIdentifier('providedIn'), factory.createNull()),
                      factory.createPropertyAssignment(
                        factory.createIdentifier('factory'),
                        factory.createPropertyAccessExpression(factory.createIdentifier(name), factory.createIdentifier('ɵfac'))
                      ),
                      factory.createPropertyAssignment(factory.createIdentifier('value'), factory.createIdentifier('undefined')),
                    ],
                    true
                  )
                ),
              ],
            ]
          );
        }
        return this.visit(node, context, list);
      },
      context
    );
  }
  transform(context: ts.TransformationContext) {
    return (sf: SourceFile) => {
      let list = this.preAnalysis(sf);

      return this.visit(sf, context, list);
    };
  }

  preAnalysis(sf: SourceFile) {
    let list: ts.ClassDeclaration[] = [];

    nodeIteration(sf, (node) => {
      if (ts.isClassDeclaration(node) && node.decorators) {
        list.push(node);
      }
    });
    let dList = [];
    list.forEach((item) => {
      let decorators = item.decorators;
      let decorator = decorators.find((item) => (item.expression as any).expression.getText() === 'Injectable');
      dList.push({ classDecaration: item, decorator });
    });
    return dList;
  }
}
/**
 * AService.ɵfac = function AService_Factory(t) { return new (t || AService)(); };
AService.ɵprov = _angular_core__WEBPACK_IMPORTED_MODULE_0__["ɵɵdefineInjectable"]({ token: AService, factory: AService.ɵfac, providedIn: 'root' });
 */
