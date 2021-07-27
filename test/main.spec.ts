import * as ts from "typescript";
import * as path from "path";
import { InjectableTransformFactory } from "../src/transform";
describe("main", () => {
  it("run", () => {
    let program = ts.createProgram({
      rootNames: [path.resolve(__dirname, "./fixture/hello-world.ts")],
      options: {},
    });
    let typeChecker = program.getTypeChecker();
    let transformFactory = new InjectableTransformFactory(program, typeChecker);
    program.emit(undefined, undefined, undefined, undefined, {
      before: [
        (context) => transformFactory.getTransform(context),
        (context) => transformFactory.addImportsTransform(context),
      ],
    });
  });
  console.log("允许");
  ts.factory.updateConstructorDeclaration;
});
