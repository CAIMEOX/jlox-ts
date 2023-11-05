import { Token } from "./token";

type Expr =
  | BinaryExpr
  | UnaryExpr
  | LiteralExpr
  | GroupingExpr
  | VariableExpr
  | LogicalExpr
  | CallExpr
  | AssignExpr;

type LogicalExpr = {
  type: "Logical";
  left: Expr;
  operator: Token;
  right: Expr;
};

type CallExpr = {
  type: "Call";
  callee: Expr;
  paren: Token;
  args: Expr[];
};

type BinaryExpr = {
  type: "Binary";
  operator: Token;
  left: Expr;
  right: Expr;
};

type AssignExpr = {
  type: "Assign";
  name: Token;
  value: Expr;
};

type UnaryExpr = {
  type: "Unary";
  operator: Token;
  right: Expr;
};

type LiteralExpr = {
  type: "Literal";
  value: any;
};

type GroupingExpr = {
  type: "Grouping";
  expression: Expr;
};

type VariableExpr = {
  type: "Variable";
  name: Token;
};

const binaryExpr = (left: Expr, operator: Token, right: Expr): BinaryExpr => ({
  type: "Binary",
  operator,
  left,
  right,
});

const logicalExpr = (
  left: Expr,
  operator: Token,
  right: Expr
): LogicalExpr => ({
  type: "Logical",
  operator,
  left,
  right,
});

const unaryExpr = (operator: Token, right: Expr): UnaryExpr => ({
  type: "Unary",
  operator,
  right,
});

const literalExpr = (value: any): LiteralExpr => ({
  type: "Literal",
  value,
});

const groupingExpr = (expression: Expr): GroupingExpr => ({
  type: "Grouping",
  expression,
});

const variableExpr = (name: Token): VariableExpr => ({
  type: "Variable",
  name,
});

const assignExpr = (name: Token, value: Expr): AssignExpr => ({
  type: "Assign",
  name,
  value,
});

const callExpr = (callee: Expr, paren: Token, args: Expr[]): CallExpr => ({
  type: "Call",
  callee,
  paren,
  args,
});

export type {
  AssignExpr,
  BinaryExpr,
  UnaryExpr,
  LiteralExpr,
  GroupingExpr,
  VariableExpr,
  CallExpr,
  LogicalExpr,
};
export {
  assignExpr,
  binaryExpr,
  unaryExpr,
  literalExpr,
  logicalExpr,
  groupingExpr,
  variableExpr,
  callExpr,
  Expr,
  printAST,
};

// Lisp-style AST printer
const printAST = (expr: Expr): string => {
  switch (expr.type) {
    case "Binary":
      return `(${expr.operator.lexeme} ${printAST(expr.left)} ${printAST(
        expr.right
      )})`;
    case "Unary":
      return `(${expr.operator.lexeme} ${printAST(expr.right)})`;
    case "Literal":
      return expr.value.toString();
    case "Grouping":
      return `(${printAST(expr.expression)})`;
    case "Variable":
      return expr.name.lexeme;
    case "Assign":
      return `(def ${expr.name.lexeme} ${printAST(expr.value)})`;
    case "Logical":
      return `(cond (${expr.operator.lexeme}) (${printAST(
        expr.left
      )}) (${printAST(expr.right)}))`;
    default:
      return "";
  }
};
