import {
  Expr,
  assignExpr,
  binaryExpr,
  callExpr,
  groupingExpr,
  literalExpr,
  logicalExpr,
  unaryExpr,
  variableExpr,
} from "./expr";
import { Lox } from "./lox";
import { Token, TokenType } from "./token";
import {
  Stmt,
  blockStmt,
  declarationStmt,
  expressionStmt,
  funcStmt,
  ifStmt,
  printStmt,
  returnStmt,
  whileStmt,
} from "./stmt";

const MAX_ARGS = 255;
class ParseError extends Error {}
class Parser {
  readonly tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): Stmt[] {
    let statements = [];
    while (!this.isAtEnd()) {
      statements.push(this.declaration());
    }
    return statements;
  }

  private assignment(): Expr {
    const expr = this.or();
    if (this.match(TokenType.EQUAL)) {
      const equals = this.previous();
      const value = this.assignment();
      if (expr.type == "Variable") {
        const name = expr.name;
        return assignExpr(name, value);
      }
      this.error(equals, "Invalid assignment target.");
    }
    return expr;
  }

  private or(): Expr {
    let expr = this.and();

    while (this.match(TokenType.OR)) {
      const operator = this.previous();
      const right = this.and();
      expr = logicalExpr(expr, operator, right);
    }

    return expr;
  }

  private and(): Expr {
    let expr = this.equality();

    while (this.match(TokenType.AND)) {
      const operator = this.previous();
      const right = this.equality();
      expr = logicalExpr(expr, operator, right);
    }

    return expr;
  }

  private declaration(): Stmt {
    try {
      if (this.match(TokenType.FUN)) return this.func("function");
      if (this.match(TokenType.LET)) return this.letDeclaration();
      return this.statement();
    } catch (error) {
      this.synchronize();
      return expressionStmt(literalExpr(null));
    }
  }

  private func(kind: string) {
    const name = this.consume(TokenType.IDENTIFIER, `Expect ${kind} name.`);
    this.consume(TokenType.LEFT_PAREN, `Expect '(' after ${kind} name.`);
    const params = [];
    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        if (params.length >= MAX_ARGS) {
          this.error(
            this.peek(),
            `Can't have more than ${MAX_ARGS} parameters.`
          );
        }

        params.push(
          this.consume(TokenType.IDENTIFIER, "Expect parameter name.")
        );
      } while (this.match(TokenType.COMMA));
    }
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after parameters.");
    this.consume(TokenType.LEFT_BRACE, `Expect '{' before ${kind} body.`);
    const body = this.block();
    return funcStmt(name, params, body);
  }

  private letDeclaration(): Stmt {
    const name = this.consume(TokenType.IDENTIFIER, "Expect variable name.");

    let initializer = null;
    if (this.match(TokenType.EQUAL)) {
      initializer = this.expression();
    }

    this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");
    return declarationStmt(name, initializer || literalExpr(null));
  }

  private statement(): Stmt {
    if (this.match(TokenType.FOR)) return this.forStatement();
    if (this.match(TokenType.IF)) return this.ifStatement();
    if (this.match(TokenType.RETURN)) return this.returnStatement();
    if (this.match(TokenType.PRINT)) return this.printStatement();
    if (this.match(TokenType.WHILE)) return this.whileStatement();
    if (this.match(TokenType.LEFT_BRACE)) return blockStmt(this.block());
    return this.expressionStatement();
  }

  private returnStatement(): Stmt {
    const keyword = this.previous();
    let value = null;
    if (!this.check(TokenType.SEMICOLON)) {
      value = this.expression();
    }
    this.consume(TokenType.SEMICOLON, "Expect ';' after return value.");
    return returnStmt(keyword, value);
  }

  // desugar for statement to while statement
  private forStatement(): Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'for'.");

    let initializer;
    if (this.match(TokenType.SEMICOLON)) {
      initializer = null;
    } else if (this.match(TokenType.LET)) {
      initializer = this.letDeclaration();
    } else {
      initializer = this.expressionStatement();
    }

    let condition = null;
    if (!this.check(TokenType.SEMICOLON)) {
      condition = this.expression();
    }
    this.consume(TokenType.SEMICOLON, "Expect ';' after loop condition.");

    let increment = null;
    if (!this.check(TokenType.RIGHT_PAREN)) {
      increment = this.expression();
    }
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after for clauses.");

    let body = this.statement();

    if (increment != null) body = blockStmt([body, expressionStmt(increment)]);

    if (condition == null) condition = literalExpr(true);
    body = whileStmt(condition, body);

    if (initializer != null) body = blockStmt([initializer, body]);

    return body;
  }

  private whileStatement(): Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'while'.");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after condition.");
    const body = this.statement();

    return whileStmt(condition, body);
  }

  private ifStatement(): Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'if'.");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after if condition.");

    const thenBranch = this.statement();
    let elseBranch = null;
    if (this.match(TokenType.ELSE)) {
      elseBranch = this.statement();
    }

    return ifStmt(condition, thenBranch, elseBranch);
  }

  private block(): Stmt[] {
    const statements = [];

    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      statements.push(this.declaration());
    }

    this.consume(TokenType.RIGHT_BRACE, "Expect '}' after block.");
    return statements;
  }

  private printStatement(): Stmt {
    const value = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after value.");
    return printStmt(value);
  }

  private expressionStatement(): Stmt {
    const expr = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after expression.");
    return expressionStmt(expr);
  }

  private expression(): Expr {
    return this.assignment();
  }

  private equality(): Expr {
    let expr = this.comparison();

    while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      const operator = this.previous();
      const right = this.comparison();
      expr = binaryExpr(expr, operator, right);
    }

    return expr;
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type == type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type == TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private comparison(): Expr {
    let expr = this.term();

    while (
      this.match(
        TokenType.GREATER,
        TokenType.GREATER_EQUAL,
        TokenType.LESS,
        TokenType.LESS_EQUAL
      )
    ) {
      const operator = this.previous();
      const right = this.term();
      expr = binaryExpr(expr, operator, right);
    }

    return expr;
  }

  private term(): Expr {
    let expr = this.factor();

    while (this.match(TokenType.MINUS, TokenType.PLUS)) {
      const operator = this.previous();
      const right = this.factor();
      expr = binaryExpr(expr, operator, right);
    }

    return expr;
  }

  private factor(): Expr {
    let expr = this.unary();

    while (this.match(TokenType.SLASH, TokenType.STAR)) {
      const operator = this.previous();
      const right = this.unary();
      expr = binaryExpr(expr, operator, right);
    }

    return expr;
  }

  private call(): Expr {
    let expr = this.primary();

    while (true) {
      if (this.match(TokenType.LEFT_PAREN)) {
        expr = this.finishCall(expr);
      } else {
        break;
      }
    }

    return expr;
  }

  private finishCall(callee: Expr): Expr {
    const args = [];
    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        if (args.length >= MAX_ARGS) {
          this.error(
            this.peek(),
            `Can't have more than ${MAX_ARGS} arguments.`
          );
        }
        args.push(this.expression());
      } while (this.match(TokenType.COMMA));
    }

    const paren = this.consume(
      TokenType.RIGHT_PAREN,
      "Expect ')' after arguments."
    );

    return callExpr(callee, paren, args);
  }

  private unary(): Expr {
    if (this.match(TokenType.BANG, TokenType.MINUS)) {
      const operator = this.previous();
      const right = this.unary();
      return unaryExpr(operator, right);
    }

    return this.call();
  }

  private primary(): Expr {
    if (this.match(TokenType.FALSE)) return literalExpr(false);
    if (this.match(TokenType.TRUE)) return literalExpr(true);
    if (this.match(TokenType.NIL)) return literalExpr(null);
    if (this.match(TokenType.NUMBER, TokenType.STRING)) {
      return literalExpr(this.previous().literal);
    }
    if (this.match(TokenType.IDENTIFIER)) {
      return variableExpr(this.previous());
    }

    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
      return groupingExpr(expr);
    }
    // never reach
    throw new ParseError("Expected expression");
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw this.error(this.peek(), message);
  }

  private error(token: Token, message: string): ParseError {
    Lox.tokenError(token, message);
    return new ParseError();
  }

  private synchronize(): void {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type == TokenType.SEMICOLON) return;

      switch (this.peek().type) {
        case TokenType.CLASS:
        case TokenType.FUN:
        case TokenType.LET:
        case TokenType.FOR:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.PRINT:
        case TokenType.RETURN:
          return;
      }

      this.advance();
    }
  }
}

export { Parser };
