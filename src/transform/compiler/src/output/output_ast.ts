/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { ParseSourceSpan } from '../parse_util';

//// Types
export enum TypeModifier {
  Const,
}

export abstract class Type {
  constructor(public modifiers: TypeModifier[] = []) {}
  abstract visitType(visitor: TypeVisitor, context: any): any;

  hasModifier(modifier: TypeModifier): boolean {
    return this.modifiers.indexOf(modifier) !== -1;
  }
}

export enum BuiltinTypeName {
  Dynamic,
  Bool,
  String,
  Int,
  Number,
  Function,
  Inferred,
  None,
}

export class BuiltinType extends Type {
  constructor(public name: BuiltinTypeName, modifiers?: TypeModifier[]) {
    super(modifiers);
  }
  override visitType(visitor: TypeVisitor, context: any): any {
    return visitor.visitBuiltinType(this, context);
  }
}

export class ExpressionType extends Type {
  constructor(
    public value: Expression,
    modifiers?: TypeModifier[],
    public typeParams: Type[] | null = null
  ) {
    super(modifiers);
  }
  override visitType(visitor: TypeVisitor, context: any): any {
    return visitor.visitExpressionType(this, context);
  }
}

export class ArrayType extends Type {
  constructor(public of: Type, modifiers?: TypeModifier[]) {
    super(modifiers);
  }
  override visitType(visitor: TypeVisitor, context: any): any {
    return visitor.visitArrayType(this, context);
  }
}

export class MapType extends Type {
  public valueType: Type | null;
  constructor(valueType: Type | null | undefined, modifiers?: TypeModifier[]) {
    super(modifiers);
    this.valueType = valueType || null;
  }
  override visitType(visitor: TypeVisitor, context: any): any {
    return visitor.visitMapType(this, context);
  }
}

export const DYNAMIC_TYPE = new BuiltinType(BuiltinTypeName.Dynamic);
export const INFERRED_TYPE = new BuiltinType(BuiltinTypeName.Inferred);
export const BOOL_TYPE = new BuiltinType(BuiltinTypeName.Bool);
export const INT_TYPE = new BuiltinType(BuiltinTypeName.Int);
export const NUMBER_TYPE = new BuiltinType(BuiltinTypeName.Number);
export const STRING_TYPE = new BuiltinType(BuiltinTypeName.String);
export const FUNCTION_TYPE = new BuiltinType(BuiltinTypeName.Function);
export const NONE_TYPE = new BuiltinType(BuiltinTypeName.None);

export interface TypeVisitor {
  visitBuiltinType(type: BuiltinType, context: any): any;
  visitExpressionType(type: ExpressionType, context: any): any;
  visitArrayType(type: ArrayType, context: any): any;
  visitMapType(type: MapType, context: any): any;
}

///// Expressions

export enum UnaryOperator {
  Minus,
  Plus,
}

export enum BinaryOperator {
  Equals,
  NotEquals,
  Identical,
  NotIdentical,
  Minus,
  Plus,
  Divide,
  Multiply,
  Modulo,
  And,
  Or,
  BitwiseAnd,
  Lower,
  LowerEquals,
  Bigger,
  BiggerEquals,
  NullishCoalesce,
}

export function nullSafeIsEquivalent<
  T extends { isEquivalent(other: T): boolean }
>(base: T | null, other: T | null) {
  if (base == null || other == null) {
    return base == other;
  }
  return base.isEquivalent(other);
}

function areAllEquivalentPredicate<T>(
  base: T[],
  other: T[],
  equivalentPredicate: (baseElement: T, otherElement: T) => boolean
) {
  const len = base.length;
  if (len !== other.length) {
    return false;
  }
  for (let i = 0; i < len; i++) {
    if (!equivalentPredicate(base[i], other[i])) {
      return false;
    }
  }
  return true;
}

export function areAllEquivalent<T extends { isEquivalent(other: T): boolean }>(
  base: T[],
  other: T[]
) {
  return areAllEquivalentPredicate(
    base,
    other,
    (baseElement: T, otherElement: T) => baseElement.isEquivalent(otherElement)
  );
}

export abstract class Expression {
  public type: Type | null;
  public sourceSpan: ParseSourceSpan | null;

  constructor(
    type: Type | null | undefined,
    sourceSpan?: ParseSourceSpan | null
  ) {
    this.type = type || null;
    this.sourceSpan = sourceSpan || null;
  }

  abstract visitExpression(visitor: ExpressionVisitor, context: any): any;

  /**
   * Calculates whether this expression produces the same value as the given expression.
   * Note: We don't check Types nor ParseSourceSpans nor function arguments.
   */
  abstract isEquivalent(e: Expression): boolean;

  /**
   * Return true if the expression is constant.
   */
  abstract isConstant(): boolean;

  prop(name: string, sourceSpan?: ParseSourceSpan | null): ReadPropExpr {
    return new ReadPropExpr(this, name, null, sourceSpan);
  }

  callMethod(
    name: string | BuiltinMethod,
    params: Expression[],
    sourceSpan?: ParseSourceSpan | null
  ): InvokeMethodExpr {
    return new InvokeMethodExpr(this, name, params, null, sourceSpan);
  }

  callFn(
    params: Expression[],
    sourceSpan?: ParseSourceSpan | null,
    pure?: boolean
  ): InvokeFunctionExpr {
    return new InvokeFunctionExpr(this, params, null, sourceSpan, pure);
  }

  toStmt(): Statement {
    return new ExpressionStatement(this, null);
  }
}

export enum BuiltinVar {
  This,
  Super,
  CatchError,
  CatchStack,
}

export class ReadVarExpr extends Expression {
  public name: string | null;
  public builtin: BuiltinVar | null;

  constructor(
    name: string | BuiltinVar,
    type?: Type | null,
    sourceSpan?: ParseSourceSpan | null
  ) {
    super(type, sourceSpan);
    if (typeof name === 'string') {
      this.name = name;
      this.builtin = null;
    } else {
      this.name = null;
      this.builtin = name;
    }
  }

  override isEquivalent(e: Expression): boolean {
    return (
      e instanceof ReadVarExpr &&
      this.name === e.name &&
      this.builtin === e.builtin
    );
  }

  override isConstant() {
    return false;
  }

  override visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitReadVarExpr(this, context);
  }

  set(value: Expression): WriteVarExpr {
    if (!this.name) {
      throw new Error(
        `Built in variable ${this.builtin} can not be assigned to.`
      );
    }
    return new WriteVarExpr(this.name, value, null, this.sourceSpan);
  }
}

export class TypeofExpr extends Expression {
  constructor(
    public expr: Expression,
    type?: Type | null,
    sourceSpan?: ParseSourceSpan | null
  ) {
    super(type, sourceSpan);
  }

  override visitExpression(visitor: ExpressionVisitor, context: any) {
    return visitor.visitTypeofExpr(this, context);
  }

  override isEquivalent(e: Expression): boolean {
    return e instanceof TypeofExpr && e.expr.isEquivalent(this.expr);
  }

  override isConstant(): boolean {
    return this.expr.isConstant();
  }
}

export class WrappedNodeExpr<T> extends Expression {
  constructor(
    public node: T,
    type?: Type | null,
    sourceSpan?: ParseSourceSpan | null
  ) {
    super(type, sourceSpan);
  }

  override isEquivalent(e: Expression): boolean {
    return e instanceof WrappedNodeExpr && this.node === e.node;
  }

  override isConstant() {
    return false;
  }

  override visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitWrappedNodeExpr(this, context);
  }
}

export class WriteVarExpr extends Expression {
  public value: Expression;
  constructor(
    public name: string,
    value: Expression,
    type?: Type | null,
    sourceSpan?: ParseSourceSpan | null
  ) {
    super(type || value.type, sourceSpan);
    this.value = value;
  }

  override isEquivalent(e: Expression): boolean {
    return (
      e instanceof WriteVarExpr &&
      this.name === e.name &&
      this.value.isEquivalent(e.value)
    );
  }

  override isConstant() {
    return false;
  }

  override visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitWriteVarExpr(this, context);
  }

  toDeclStmt(type?: Type | null, modifiers?: StmtModifier[]): DeclareVarStmt {
    return new DeclareVarStmt(
      this.name,
      this.value,
      type,
      modifiers,
      this.sourceSpan
    );
  }

  toConstDecl(): DeclareVarStmt {
    return this.toDeclStmt(INFERRED_TYPE, [StmtModifier.Final]);
  }
}

export class WriteKeyExpr extends Expression {
  public value: Expression;
  constructor(
    public receiver: Expression,
    public index: Expression,
    value: Expression,
    type?: Type | null,
    sourceSpan?: ParseSourceSpan | null
  ) {
    super(type || value.type, sourceSpan);
    this.value = value;
  }

  override isEquivalent(e: Expression): boolean {
    return (
      e instanceof WriteKeyExpr &&
      this.receiver.isEquivalent(e.receiver) &&
      this.index.isEquivalent(e.index) &&
      this.value.isEquivalent(e.value)
    );
  }

  override isConstant() {
    return false;
  }

  override visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitWriteKeyExpr(this, context);
  }
}

export class WritePropExpr extends Expression {
  public value: Expression;
  constructor(
    public receiver: Expression,
    public name: string,
    value: Expression,
    type?: Type | null,
    sourceSpan?: ParseSourceSpan | null
  ) {
    super(type || value.type, sourceSpan);
    this.value = value;
  }

  override isEquivalent(e: Expression): boolean {
    return (
      e instanceof WritePropExpr &&
      this.receiver.isEquivalent(e.receiver) &&
      this.name === e.name &&
      this.value.isEquivalent(e.value)
    );
  }

  override isConstant() {
    return false;
  }

  override visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitWritePropExpr(this, context);
  }
}

export enum BuiltinMethod {
  ConcatArray,
  SubscribeObservable,
  Bind,
}

export class InvokeMethodExpr extends Expression {
  public name: string | null;
  public builtin: BuiltinMethod | null;
  constructor(
    public receiver: Expression,
    method: string | BuiltinMethod,
    public args: Expression[],
    type?: Type | null,
    sourceSpan?: ParseSourceSpan | null
  ) {
    super(type, sourceSpan);
    if (typeof method === 'string') {
      this.name = method;
      this.builtin = null;
    } else {
      this.name = null;
      this.builtin = <BuiltinMethod>method;
    }
  }

  override isEquivalent(e: Expression): boolean {
    return (
      e instanceof InvokeMethodExpr &&
      this.receiver.isEquivalent(e.receiver) &&
      this.name === e.name &&
      this.builtin === e.builtin &&
      areAllEquivalent(this.args, e.args)
    );
  }

  override isConstant() {
    return false;
  }

  override visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitInvokeMethodExpr(this, context);
  }
}

export class InvokeFunctionExpr extends Expression {
  constructor(
    public fn: Expression,
    public args: Expression[],
    type?: Type | null,
    sourceSpan?: ParseSourceSpan | null,
    public pure = false
  ) {
    super(type, sourceSpan);
  }

  override isEquivalent(e: Expression): boolean {
    return (
      e instanceof InvokeFunctionExpr &&
      this.fn.isEquivalent(e.fn) &&
      areAllEquivalent(this.args, e.args) &&
      this.pure === e.pure
    );
  }

  override isConstant() {
    return false;
  }

  override visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitInvokeFunctionExpr(this, context);
  }
}

export class InstantiateExpr extends Expression {
  constructor(
    public classExpr: Expression,
    public args: Expression[],
    type?: Type | null,
    sourceSpan?: ParseSourceSpan | null
  ) {
    super(type, sourceSpan);
  }

  override isEquivalent(e: Expression): boolean {
    return (
      e instanceof InstantiateExpr &&
      this.classExpr.isEquivalent(e.classExpr) &&
      areAllEquivalent(this.args, e.args)
    );
  }

  override isConstant() {
    return false;
  }

  override visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitInstantiateExpr(this, context);
  }
}

export class LiteralExpr extends Expression {
  constructor(
    public value: number | string | boolean | null | undefined,
    type?: Type | null,
    sourceSpan?: ParseSourceSpan | null
  ) {
    super(type, sourceSpan);
  }

  override isEquivalent(e: Expression): boolean {
    return e instanceof LiteralExpr && this.value === e.value;
  }

  override isConstant() {
    return true;
  }

  override visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitLiteralExpr(this, context);
  }
}

export class TemplateLiteral {
  constructor(
    public elements: TemplateLiteralElement[],
    public expressions: Expression[]
  ) {}
}
export class TemplateLiteralElement {
  rawText: string;
  constructor(
    public text: string,
    public sourceSpan?: ParseSourceSpan,
    rawText?: string
  ) {
    // If `rawText` is not provided, try to extract the raw string from its
    // associated `sourceSpan`. If that is also not available, "fake" the raw
    // string instead by escaping the following control sequences:
    // - "\" would otherwise indicate that the next character is a control character.
    // - "`" and "${" are template string control sequences that would otherwise prematurely
    // indicate the end of the template literal element.
    this.rawText =
      rawText ??
      sourceSpan?.toString() ??
      escapeForTemplateLiteral(escapeSlashes(text));
  }
}

export abstract class MessagePiece {
  constructor(public text: string, public sourceSpan: ParseSourceSpan) {}
}
export class LiteralPiece extends MessagePiece {}
export class PlaceholderPiece extends MessagePiece {}

/**
 * A structure to hold the cooked and raw strings of a template literal element, along with its
 * source-span range.
 */
export interface CookedRawString {
  cooked: string;
  raw: string;
  range: ParseSourceSpan | null;
}

const escapeSlashes = (str: string): string => str.replace(/\\/g, '\\\\');
const escapeStartingColon = (str: string): string => str.replace(/^:/, '\\:');
const escapeColons = (str: string): string => str.replace(/:/g, '\\:');
const escapeForTemplateLiteral = (str: string): string =>
  str.replace(/`/g, '\\`').replace(/\${/g, '$\\{');

export class ExternalExpr extends Expression {
  constructor(
    public value: ExternalReference,
    type?: Type | null,
    public typeParams: Type[] | null = null,
    sourceSpan?: ParseSourceSpan | null
  ) {
    super(type, sourceSpan);
  }

  override isEquivalent(e: Expression): boolean {
    return (
      e instanceof ExternalExpr &&
      this.value.name === e.value.name &&
      this.value.moduleName === e.value.moduleName &&
      this.value.runtime === e.value.runtime
    );
  }

  override isConstant() {
    return false;
  }

  override visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitExternalExpr(this, context);
  }
}

export class ExternalReference {
  constructor(
    public moduleName: string | null,
    public name: string | null,
    public runtime?: any | null
  ) {}
  // Note: no isEquivalent method here as we use this as an interface too.
}

export class ConditionalExpr extends Expression {
  public trueCase: Expression;

  constructor(
    public condition: Expression,
    trueCase: Expression,
    public falseCase: Expression | null = null,
    type?: Type | null,
    sourceSpan?: ParseSourceSpan | null
  ) {
    super(type || trueCase.type, sourceSpan);
    this.trueCase = trueCase;
  }

  override isEquivalent(e: Expression): boolean {
    return (
      e instanceof ConditionalExpr &&
      this.condition.isEquivalent(e.condition) &&
      this.trueCase.isEquivalent(e.trueCase) &&
      nullSafeIsEquivalent(this.falseCase, e.falseCase)
    );
  }

  override isConstant() {
    return false;
  }

  override visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitConditionalExpr(this, context);
  }
}

export class NotExpr extends Expression {
  constructor(
    public condition: Expression,
    sourceSpan?: ParseSourceSpan | null
  ) {
    super(BOOL_TYPE, sourceSpan);
  }

  override isEquivalent(e: Expression): boolean {
    return e instanceof NotExpr && this.condition.isEquivalent(e.condition);
  }

  override isConstant() {
    return false;
  }

  override visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitNotExpr(this, context);
  }
}

export class AssertNotNull extends Expression {
  constructor(
    public condition: Expression,
    sourceSpan?: ParseSourceSpan | null
  ) {
    super(condition.type, sourceSpan);
  }

  override isEquivalent(e: Expression): boolean {
    return (
      e instanceof AssertNotNull && this.condition.isEquivalent(e.condition)
    );
  }

  override isConstant() {
    return false;
  }

  override visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitAssertNotNullExpr(this, context);
  }
}

export class CastExpr extends Expression {
  constructor(
    public value: Expression,
    type?: Type | null,
    sourceSpan?: ParseSourceSpan | null
  ) {
    super(type, sourceSpan);
  }

  override isEquivalent(e: Expression): boolean {
    return e instanceof CastExpr && this.value.isEquivalent(e.value);
  }

  override isConstant() {
    return false;
  }

  override visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitCastExpr(this, context);
  }
}

export class FnParam {
  constructor(public name: string, public type: Type | null = null) {}

  isEquivalent(param: FnParam): boolean {
    return this.name === param.name;
  }
}

export class FunctionExpr extends Expression {
  constructor(
    public params: FnParam[],
    public statements: Statement[],
    type?: Type | null,
    sourceSpan?: ParseSourceSpan | null,
    public name?: string | null
  ) {
    super(type, sourceSpan);
  }

  override isEquivalent(e: Expression): boolean {
    return (
      e instanceof FunctionExpr &&
      areAllEquivalent(this.params, e.params) &&
      areAllEquivalent(this.statements, e.statements)
    );
  }

  override isConstant() {
    return false;
  }

  override visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitFunctionExpr(this, context);
  }

  toDeclStmt(name: string, modifiers?: StmtModifier[]): DeclareFunctionStmt {
    return new DeclareFunctionStmt(
      name,
      this.params,
      this.statements,
      this.type,
      modifiers,
      this.sourceSpan
    );
  }
}

export class UnaryOperatorExpr extends Expression {
  constructor(
    public operator: UnaryOperator,
    public expr: Expression,
    type?: Type | null,
    sourceSpan?: ParseSourceSpan | null,
    public parens: boolean = true
  ) {
    super(type || NUMBER_TYPE, sourceSpan);
  }

  override isEquivalent(e: Expression): boolean {
    return (
      e instanceof UnaryOperatorExpr &&
      this.operator === e.operator &&
      this.expr.isEquivalent(e.expr)
    );
  }

  override isConstant() {
    return false;
  }

  override visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitUnaryOperatorExpr(this, context);
  }
}

export class BinaryOperatorExpr extends Expression {
  public lhs: Expression;
  constructor(
    public operator: BinaryOperator,
    lhs: Expression,
    public rhs: Expression,
    type?: Type | null,
    sourceSpan?: ParseSourceSpan | null,
    public parens: boolean = true
  ) {
    super(type || lhs.type, sourceSpan);
    this.lhs = lhs;
  }

  override isEquivalent(e: Expression): boolean {
    return (
      e instanceof BinaryOperatorExpr &&
      this.operator === e.operator &&
      this.lhs.isEquivalent(e.lhs) &&
      this.rhs.isEquivalent(e.rhs)
    );
  }

  override isConstant() {
    return false;
  }

  override visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitBinaryOperatorExpr(this, context);
  }
}

export class ReadPropExpr extends Expression {
  constructor(
    public receiver: Expression,
    public name: string,
    type?: Type | null,
    sourceSpan?: ParseSourceSpan | null
  ) {
    super(type, sourceSpan);
  }

  override isEquivalent(e: Expression): boolean {
    return (
      e instanceof ReadPropExpr &&
      this.receiver.isEquivalent(e.receiver) &&
      this.name === e.name
    );
  }

  override isConstant() {
    return false;
  }

  override visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitReadPropExpr(this, context);
  }

  set(value: Expression): WritePropExpr {
    return new WritePropExpr(
      this.receiver,
      this.name,
      value,
      null,
      this.sourceSpan
    );
  }
}

export class ReadKeyExpr extends Expression {
  constructor(
    public receiver: Expression,
    public index: Expression,
    type?: Type | null,
    sourceSpan?: ParseSourceSpan | null
  ) {
    super(type, sourceSpan);
  }

  override isEquivalent(e: Expression): boolean {
    return (
      e instanceof ReadKeyExpr &&
      this.receiver.isEquivalent(e.receiver) &&
      this.index.isEquivalent(e.index)
    );
  }

  override isConstant() {
    return false;
  }

  override visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitReadKeyExpr(this, context);
  }

  set(value: Expression): WriteKeyExpr {
    return new WriteKeyExpr(
      this.receiver,
      this.index,
      value,
      null,
      this.sourceSpan
    );
  }
}

export class LiteralArrayExpr extends Expression {
  public entries: Expression[];
  constructor(
    entries: Expression[],
    type?: Type | null,
    sourceSpan?: ParseSourceSpan | null
  ) {
    super(type, sourceSpan);
    this.entries = entries;
  }

  override isConstant() {
    return this.entries.every((e) => e.isConstant());
  }

  override isEquivalent(e: Expression): boolean {
    return (
      e instanceof LiteralArrayExpr && areAllEquivalent(this.entries, e.entries)
    );
  }
  override visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitLiteralArrayExpr(this, context);
  }
}

export class LiteralMapEntry {
  constructor(
    public key: string,
    public value: Expression,
    public quoted: boolean
  ) {}
  isEquivalent(e: LiteralMapEntry): boolean {
    return this.key === e.key && this.value.isEquivalent(e.value);
  }
}

export class LiteralMapExpr extends Expression {
  public valueType: Type | null = null;
  constructor(
    public entries: LiteralMapEntry[],
    type?: MapType | null,
    sourceSpan?: ParseSourceSpan | null
  ) {
    super(type, sourceSpan);
    if (type) {
      this.valueType = type.valueType;
    }
  }

  override isEquivalent(e: Expression): boolean {
    return (
      e instanceof LiteralMapExpr && areAllEquivalent(this.entries, e.entries)
    );
  }

  override isConstant() {
    return this.entries.every((e) => e.value.isConstant());
  }

  override visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitLiteralMapExpr(this, context);
  }
}

export class CommaExpr extends Expression {
  constructor(public parts: Expression[], sourceSpan?: ParseSourceSpan | null) {
    super(parts[parts.length - 1].type, sourceSpan);
  }

  override isEquivalent(e: Expression): boolean {
    return e instanceof CommaExpr && areAllEquivalent(this.parts, e.parts);
  }

  override isConstant() {
    return false;
  }

  override visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitCommaExpr(this, context);
  }
}

export interface ExpressionVisitor {
  visitReadVarExpr(ast: ReadVarExpr, context: any): any;
  visitWriteVarExpr(expr: WriteVarExpr, context: any): any;
  visitWriteKeyExpr(expr: WriteKeyExpr, context: any): any;
  visitWritePropExpr(expr: WritePropExpr, context: any): any;
  visitInvokeMethodExpr(ast: InvokeMethodExpr, context: any): any;
  visitInvokeFunctionExpr(ast: InvokeFunctionExpr, context: any): any;

  visitInstantiateExpr(ast: InstantiateExpr, context: any): any;
  visitLiteralExpr(ast: LiteralExpr, context: any): any;
  visitExternalExpr(ast: ExternalExpr, context: any): any;
  visitConditionalExpr(ast: ConditionalExpr, context: any): any;
  visitNotExpr(ast: NotExpr, context: any): any;
  visitAssertNotNullExpr(ast: AssertNotNull, context: any): any;
  visitCastExpr(ast: CastExpr, context: any): any;
  visitFunctionExpr(ast: FunctionExpr, context: any): any;
  visitUnaryOperatorExpr(ast: UnaryOperatorExpr, context: any): any;
  visitBinaryOperatorExpr(ast: BinaryOperatorExpr, context: any): any;
  visitReadPropExpr(ast: ReadPropExpr, context: any): any;
  visitReadKeyExpr(ast: ReadKeyExpr, context: any): any;
  visitLiteralArrayExpr(ast: LiteralArrayExpr, context: any): any;
  visitLiteralMapExpr(ast: LiteralMapExpr, context: any): any;
  visitCommaExpr(ast: CommaExpr, context: any): any;
  visitWrappedNodeExpr(ast: WrappedNodeExpr<any>, context: any): any;
  visitTypeofExpr(ast: TypeofExpr, context: any): any;
}

export const THIS_EXPR = new ReadVarExpr(BuiltinVar.This, null, null);
export const SUPER_EXPR = new ReadVarExpr(BuiltinVar.Super, null, null);
export const CATCH_ERROR_VAR = new ReadVarExpr(
  BuiltinVar.CatchError,
  null,
  null
);
export const CATCH_STACK_VAR = new ReadVarExpr(
  BuiltinVar.CatchStack,
  null,
  null
);
export const NULL_EXPR = new LiteralExpr(null, null, null);
export const TYPED_NULL_EXPR = new LiteralExpr(null, INFERRED_TYPE, null);

//// Statements
export enum StmtModifier {
  Final,
  Private,
  Exported,
  Static,
}

export class LeadingComment {
  constructor(
    public text: string,
    public multiline: boolean,
    public trailingNewline: boolean
  ) {}
  toString() {
    return this.multiline ? ` ${this.text} ` : this.text;
  }
}
export class JSDocComment extends LeadingComment {
  constructor(public tags: JSDocTag[]) {
    super('', /* multiline */ true, /* trailingNewline */ true);
  }
  override toString(): string {
    return serializeTags(this.tags);
  }
}

export abstract class Statement {
  constructor(
    public modifiers: StmtModifier[] = [],
    public sourceSpan: ParseSourceSpan | null = null,
    public leadingComments?: LeadingComment[]
  ) {}
  /**
   * Calculates whether this statement produces the same value as the given statement.
   * Note: We don't check Types nor ParseSourceSpans nor function arguments.
   */
  abstract isEquivalent(stmt: Statement): boolean;

  abstract visitStatement(visitor: StatementVisitor, context: any): any;

  hasModifier(modifier: StmtModifier): boolean {
    return this.modifiers.indexOf(modifier) !== -1;
  }

  addLeadingComment(leadingComment: LeadingComment): void {
    this.leadingComments = this.leadingComments ?? [];
    this.leadingComments.push(leadingComment);
  }
}

export class DeclareVarStmt extends Statement {
  public type: Type | null;
  constructor(
    public name: string,
    public value?: Expression,
    type?: Type | null,
    modifiers?: StmtModifier[],
    sourceSpan?: ParseSourceSpan | null,
    leadingComments?: LeadingComment[]
  ) {
    super(modifiers, sourceSpan, leadingComments);
    this.type = type || (value && value.type) || null;
  }
  override isEquivalent(stmt: Statement): boolean {
    return (
      stmt instanceof DeclareVarStmt &&
      this.name === stmt.name &&
      (this.value
        ? !!stmt.value && this.value.isEquivalent(stmt.value)
        : !stmt.value)
    );
  }
  override visitStatement(visitor: StatementVisitor, context: any): any {
    return visitor.visitDeclareVarStmt(this, context);
  }
}

export class DeclareFunctionStmt extends Statement {
  public type: Type | null;
  constructor(
    public name: string,
    public params: FnParam[],
    public statements: Statement[],
    type?: Type | null,
    modifiers?: StmtModifier[],
    sourceSpan?: ParseSourceSpan | null,
    leadingComments?: LeadingComment[]
  ) {
    super(modifiers, sourceSpan, leadingComments);
    this.type = type || null;
  }
  override isEquivalent(stmt: Statement): boolean {
    return (
      stmt instanceof DeclareFunctionStmt &&
      areAllEquivalent(this.params, stmt.params) &&
      areAllEquivalent(this.statements, stmt.statements)
    );
  }
  override visitStatement(visitor: StatementVisitor, context: any): any {
    return visitor.visitDeclareFunctionStmt(this, context);
  }
}

export class ExpressionStatement extends Statement {
  constructor(
    public expr: Expression,
    sourceSpan?: ParseSourceSpan | null,
    leadingComments?: LeadingComment[]
  ) {
    super([], sourceSpan, leadingComments);
  }
  override isEquivalent(stmt: Statement): boolean {
    return (
      stmt instanceof ExpressionStatement && this.expr.isEquivalent(stmt.expr)
    );
  }
  override visitStatement(visitor: StatementVisitor, context: any): any {
    return visitor.visitExpressionStmt(this, context);
  }
}

export class ReturnStatement extends Statement {
  constructor(
    public value: Expression,
    sourceSpan: ParseSourceSpan | null = null,
    leadingComments?: LeadingComment[]
  ) {
    super([], sourceSpan, leadingComments);
  }
  override isEquivalent(stmt: Statement): boolean {
    return (
      stmt instanceof ReturnStatement && this.value.isEquivalent(stmt.value)
    );
  }
  override visitStatement(visitor: StatementVisitor, context: any): any {
    return visitor.visitReturnStmt(this, context);
  }
}

export class AbstractClassPart {
  constructor(
    public type: Type | null = null,
    public modifiers: StmtModifier[] = []
  ) {}
  hasModifier(modifier: StmtModifier): boolean {
    return this.modifiers.indexOf(modifier) !== -1;
  }
}

export class ClassField extends AbstractClassPart {
  constructor(
    public name: string,
    type?: Type | null,
    modifiers?: StmtModifier[],
    public initializer?: Expression
  ) {
    super(type, modifiers);
  }
  isEquivalent(f: ClassField) {
    return this.name === f.name;
  }
}

export class ClassMethod extends AbstractClassPart {
  constructor(
    public name: string | null,
    public params: FnParam[],
    public body: Statement[],
    type?: Type | null,
    modifiers?: StmtModifier[]
  ) {
    super(type, modifiers);
  }
  isEquivalent(m: ClassMethod) {
    return this.name === m.name && areAllEquivalent(this.body, m.body);
  }
}

export class ClassGetter extends AbstractClassPart {
  constructor(
    public name: string,
    public body: Statement[],
    type?: Type | null,
    modifiers?: StmtModifier[]
  ) {
    super(type, modifiers);
  }
  isEquivalent(m: ClassGetter) {
    return this.name === m.name && areAllEquivalent(this.body, m.body);
  }
}

export class ClassStmt extends Statement {
  constructor(
    public name: string,
    public parent: Expression | null,
    public fields: ClassField[],
    public getters: ClassGetter[],
    public constructorMethod: ClassMethod,
    public methods: ClassMethod[],
    modifiers?: StmtModifier[],
    sourceSpan?: ParseSourceSpan | null,
    leadingComments?: LeadingComment[]
  ) {
    super(modifiers, sourceSpan, leadingComments);
  }
  override isEquivalent(stmt: Statement): boolean {
    return (
      stmt instanceof ClassStmt &&
      this.name === stmt.name &&
      nullSafeIsEquivalent(this.parent, stmt.parent) &&
      areAllEquivalent(this.fields, stmt.fields) &&
      areAllEquivalent(this.getters, stmt.getters) &&
      this.constructorMethod.isEquivalent(stmt.constructorMethod) &&
      areAllEquivalent(this.methods, stmt.methods)
    );
  }
  override visitStatement(visitor: StatementVisitor, context: any): any {
    return visitor.visitDeclareClassStmt(this, context);
  }
}

export class IfStmt extends Statement {
  constructor(
    public condition: Expression,
    public trueCase: Statement[],
    public falseCase: Statement[] = [],
    sourceSpan?: ParseSourceSpan | null,
    leadingComments?: LeadingComment[]
  ) {
    super([], sourceSpan, leadingComments);
  }
  override isEquivalent(stmt: Statement): boolean {
    return (
      stmt instanceof IfStmt &&
      this.condition.isEquivalent(stmt.condition) &&
      areAllEquivalent(this.trueCase, stmt.trueCase) &&
      areAllEquivalent(this.falseCase, stmt.falseCase)
    );
  }
  override visitStatement(visitor: StatementVisitor, context: any): any {
    return visitor.visitIfStmt(this, context);
  }
}

export interface StatementVisitor {
  visitDeclareVarStmt(stmt: DeclareVarStmt, context: any): any;
  visitDeclareFunctionStmt(stmt: DeclareFunctionStmt, context: any): any;
  visitExpressionStmt(stmt: ExpressionStatement, context: any): any;
  visitReturnStmt(stmt: ReturnStatement, context: any): any;
  visitDeclareClassStmt(stmt: ClassStmt, context: any): any;
  visitIfStmt(stmt: IfStmt, context: any): any;
}

export function variable(
  name: string,
  type?: Type | null,
  sourceSpan?: ParseSourceSpan | null
): ReadVarExpr {
  return new ReadVarExpr(name, type, sourceSpan);
}

export function importExpr(
  id: ExternalReference,
  typeParams: Type[] | null = null,
  sourceSpan?: ParseSourceSpan | null
): ExternalExpr {
  return new ExternalExpr(id, null, typeParams, sourceSpan);
}

export function expressionType(
  expr: Expression,
  typeModifiers?: TypeModifier[],
  typeParams?: Type[] | null
): ExpressionType {
  return new ExpressionType(expr, typeModifiers, typeParams);
}

export function typeofExpr(expr: Expression) {
  return new TypeofExpr(expr);
}

export function literalArr(
  values: Expression[],
  type?: Type | null,
  sourceSpan?: ParseSourceSpan | null
): LiteralArrayExpr {
  return new LiteralArrayExpr(values, type, sourceSpan);
}

export function literalMap(
  values: { key: string; quoted: boolean; value: Expression }[],
  type: MapType | null = null
): LiteralMapExpr {
  return new LiteralMapExpr(
    values.map((e) => new LiteralMapEntry(e.key, e.value, e.quoted)),
    type,
    null
  );
}

export function unary(
  operator: UnaryOperator,
  expr: Expression,
  type?: Type,
  sourceSpan?: ParseSourceSpan | null
): UnaryOperatorExpr {
  return new UnaryOperatorExpr(operator, expr, type, sourceSpan);
}

export function not(
  expr: Expression,
  sourceSpan?: ParseSourceSpan | null
): NotExpr {
  return new NotExpr(expr, sourceSpan);
}

export function assertNotNull(
  expr: Expression,
  sourceSpan?: ParseSourceSpan | null
): AssertNotNull {
  return new AssertNotNull(expr, sourceSpan);
}

export function fn(
  params: FnParam[],
  body: Statement[],
  type?: Type | null,
  sourceSpan?: ParseSourceSpan | null,
  name?: string | null
): FunctionExpr {
  return new FunctionExpr(params, body, type, sourceSpan, name);
}

export function ifStmt(
  condition: Expression,
  thenClause: Statement[],
  elseClause?: Statement[],
  sourceSpan?: ParseSourceSpan,
  leadingComments?: LeadingComment[]
) {
  return new IfStmt(
    condition,
    thenClause,
    elseClause,
    sourceSpan,
    leadingComments
  );
}

export function literal(
  value: any,
  type?: Type | null,
  sourceSpan?: ParseSourceSpan | null
): LiteralExpr {
  return new LiteralExpr(value, type, sourceSpan);
}

export function isNull(exp: Expression): boolean {
  return exp instanceof LiteralExpr && exp.value === null;
}

// The list of JSDoc tags that we currently support. Extend it if needed.
export const enum JSDocTagName {
  Desc = 'desc',
  Id = 'id',
  Meaning = 'meaning',
}

/*
 * TypeScript has an API for JSDoc already, but it's not exposed.
 * https://github.com/Microsoft/TypeScript/issues/7393
 * For now we create types that are similar to theirs so that migrating
 * to their API will be easier. See e.g. `ts.JSDocTag` and `ts.JSDocComment`.
 */
export type JSDocTag =
  | {
      // `tagName` is e.g. "param" in an `@param` declaration
      tagName: JSDocTagName | string;
      // Any remaining text on the tag, e.g. the description
      text?: string;
    }
  | {
      // no `tagName` for plain text documentation that occurs before any `@param` lines
      tagName?: undefined;
      text: string;
    };

/*
 * Serializes a `Tag` into a string.
 * Returns a string like " @foo {bar} baz" (note the leading whitespace before `@foo`).
 */
function tagToString(tag: JSDocTag): string {
  let out = '';
  if (tag.tagName) {
    out += ` @${tag.tagName}`;
  }
  if (tag.text) {
    if (tag.text.match(/\/\*|\*\//)) {
      throw new Error('JSDoc text cannot contain "/*" and "*/"');
    }
    out += ' ' + tag.text.replace(/@/g, '\\@');
  }
  return out;
}

function serializeTags(tags: JSDocTag[]): string {
  if (tags.length === 0) return '';

  if (tags.length === 1 && tags[0].tagName && !tags[0].text) {
    // The JSDOC comment is a single simple tag: e.g `/** @tagname */`.
    return `*${tagToString(tags[0])} `;
  }

  let out = '*\n';
  for (const tag of tags) {
    out += ' *';
    // If the tagToString is multi-line, insert " * " prefixes on lines.
    out += tagToString(tag).replace(/\n/g, '\n * ');
    out += '\n';
  }
  out += ' ';
  return out;
}
