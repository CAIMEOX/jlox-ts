import { Expr } from "./expr";
import { Token } from "./token";

type Stmt =
  | ExpressionStmt
  | PrintStmt
  | BlockStmt
  | DeclarationStmt
  | IfStmt
  | FunctionStmt
  | ReturnStmt
  | WhileStmt;

type ExpressionStmt = {
  type: "Expression";
  expression: Expr;
};

type ReturnStmt = {
  type: "Return";
  keyword: Token;
  value: Expr | null;
};

type FunctionStmt = {
  type: "Function";
  name: Token;
  params: Token[];
  body: Stmt[];
};

type WhileStmt = {
  type: "While";
  condition: Expr;
  body: Stmt;
};

type IfStmt = {
  type: "If";
  condition: Expr;
  thenBranch: Stmt;
  elseBranch: Stmt | null;
};

type BlockStmt = {
  type: "Block";
  statements: Stmt[];
};

type PrintStmt = {
  type: "Print";
  expression: Expr;
};

type DeclarationStmt = {
  type: "Declaration";
  name: Token;
  initializer: Expr;
};

const expressionStmt = (expression: Expr): ExpressionStmt => ({
  type: "Expression",
  expression,
});

const printStmt = (expression: Expr): PrintStmt => ({
  type: "Print",
  expression,
});

const returnStmt = (keyword: Token, value: Expr | null): ReturnStmt => ({
  type: "Return",
  keyword,
  value,
});

const declarationStmt = (token: Token, initializer: Expr): DeclarationStmt => ({
  type: "Declaration",
  name: token,
  initializer,
});

const blockStmt = (statements: Stmt[]): BlockStmt => ({
  type: "Block",
  statements,
});

const funcStmt = (
  name: Token,
  params: Token[],
  body: Stmt[]
): FunctionStmt => ({
  type: "Function",
  name,
  params,
  body,
});

const ifStmt = (
  condition: Expr,
  thenBranch: Stmt,
  elseBranch: Stmt | null
): IfStmt => ({
  type: "If",
  condition,
  thenBranch,
  elseBranch,
});

const whileStmt = (condition: Expr, body: Stmt): WhileStmt => ({
  type: "While",
  condition,
  body,
});

export type {
  Stmt,
  ExpressionStmt,
  PrintStmt,
  BlockStmt,
  DeclarationStmt,
  ReturnStmt,
  IfStmt,
  FunctionStmt,
  WhileStmt,
};
export {
  expressionStmt,
  printStmt,
  declarationStmt,
  blockStmt,
  returnStmt,
  ifStmt,
  funcStmt,
  whileStmt,
};
