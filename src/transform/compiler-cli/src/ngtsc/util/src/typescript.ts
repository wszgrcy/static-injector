import ts from 'typescript';

export function identifierOfNode(
  decl: ts.Node & { name?: ts.Node },
): ts.Identifier | null {
  if (decl.name !== undefined && ts.isIdentifier(decl.name)) {
    return decl.name;
  } else {
    return null;
  }
}
