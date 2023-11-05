import Env from "./env";
import { Expr } from "./expr";
import { Lox } from "./lox";
import { FunctionStmt, Stmt } from "./stmt";
import { Token, TokenType } from "./token";

class RuntimeError extends Error {
  constructor(public token: Token, message: string) {
    super(message);
    this.token = token;
  }
}

class Return extends RuntimeError {
  constructor(public value: any) {
    super(new Token(TokenType.NIL, "", null, 0), "");
    this.value = value;
  }
}

const isTrusty = (value: any): boolean => value !== null && value !== false;
const checkNumberOperand = (operator: Token, operand: any) => {
  if (typeof operand === "number") return;
  throw new RuntimeError(operator, "Operand must be a number.");
};

const checkNumberOperandForBinary = (
  operator: Token,
  left: any,
  right: any
) => {
  if (typeof left === "number" && typeof right === "number") return;
  throw new RuntimeError(operator, "Operands must be numbers.");
};

const print = (value: any): string => {
  if (value === null) return "nil";
  return value.toString();
};

interface Callable {
  arity: number;
  call_fn(interpreter: Interpreter, args: any[]): any;
}

class LoxFunction implements Callable {
  constructor(public declaration: FunctionStmt) {}
  get arity(): number {
    return this.declaration.params.length;
  }

  call_fn(interpreter: Interpreter, args: any[]): any {
    const env = new Env(interpreter.env);
    this.declaration.params.forEach((x, i) => {
      env.define(x.lexeme, args[i]);
    });
    try {
      interpreter.execute_block(this.declaration.body, env);
    } catch (e) {
      if (e instanceof Return) return e.value;
      throw e;
    }
    return null;
  }

  toString(): string {
    return `<fn ${this.declaration.name.lexeme}>`;
  }
}

class Interpreter {
  env: Env;
  constructor() {
    this.env = new Env();
    this.env.define("clock", () => Date.now());
  }

  interpret(expr: Expr): any {
    switch (expr.type) {
      case "Literal":
        return expr.value;
      case "Grouping":
        return this.interpret(expr.expression);
      case "Unary":
        const right_ = this.interpret(expr.right);
        switch (expr.operator.type) {
          case TokenType.MINUS:
            checkNumberOperand(expr.operator, right_);
            return -right_;
          case TokenType.BANG:
            return !isTrusty(right_);
        }
        break;
      case "Binary":
        const left = this.interpret(expr.left);
        const right = this.interpret(expr.right);
        switch (expr.operator.type) {
          case TokenType.MINUS:
            checkNumberOperandForBinary(expr.operator, left, right);
            return left - right;
          case TokenType.SLASH:
            checkNumberOperandForBinary(expr.operator, left, right);
            return left / right;
          case TokenType.STAR:
            checkNumberOperandForBinary(expr.operator, left, right);
            return left * right;
          case TokenType.PLUS:
            // TODO: check for string concatenation and number addition
            return left + right;
          case TokenType.GREATER:
            checkNumberOperandForBinary(expr.operator, left, right);
            return left > right;
          case TokenType.GREATER_EQUAL:
            checkNumberOperandForBinary(expr.operator, left, right);
            return left >= right;
          case TokenType.LESS:
            checkNumberOperandForBinary(expr.operator, left, right);
            return left < right;
          case TokenType.LESS_EQUAL:
            checkNumberOperandForBinary(expr.operator, left, right);
            return left <= right;
          case TokenType.BANG_EQUAL:
            return left !== right;
          case TokenType.EQUAL_EQUAL:
            return left === right;
        }
        break;
      case "Variable":
        return this.env.get(expr.name);
      case "Assign":
        const value = this.interpret(expr.value);
        this.env.assign(expr.name, value);
        return value;
      case "Call":
        const callee = this.interpret(expr.callee);
        const args = expr.args.map((x) => this.interpret(x));

        if (!(callee as Callable).call_fn) {
          throw new RuntimeError(expr.paren, "Can only call functions.");
        }
        if (args.length !== callee.arity) {
          throw new RuntimeError(
            expr.paren,
            `Expected ${callee.arity} arguments but got ${args.length}.`
          );
        }
        return (callee as Callable).call_fn(this, args);
      case "Logical":
        const left_ = this.interpret(expr.left);
        switch (expr.operator.type) {
          case TokenType.OR:
            if (isTrusty(left_)) return left_;
            break;
          case TokenType.AND:
            if (!isTrusty(left_)) return left_;
            break;
        }
        return this.interpret(expr.right);
    }
  }

  execute_block(statements: Stmt[], env: Env): void {
    const previous = this.env;
    try {
      this.env = env;
      statements.forEach((x) => this.execute(x));
    } finally {
      this.env = previous;
    }
  }

  execute(stmt: Stmt): void {
    switch (stmt.type) {
      case "Expression":
        this.interpret(stmt.expression);
        return;
      case "Print":
        const value0 = this.interpret(stmt.expression);
        console.log(print(value0));
        return;
      case "Declaration":
        let value = null;
        if (stmt.initializer !== null) value = this.interpret(stmt.initializer);
        this.env.define(stmt.name.lexeme, value);
        return;
      case "Block":
        this.execute_block(stmt.statements, new Env(this.env));
        return;
      case "While":
        while (isTrusty(this.interpret(stmt.condition))) {
          this.execute(stmt.body);
        }
        return;
      case "Function":
        const func = new LoxFunction(stmt);
        this.env.define(stmt.name.lexeme, func);
        return;
      case "Return":
        let value1 = null;
        if (stmt.value !== null) value1 = this.interpret(stmt.value);
        throw new Return(value1);
      case "If":
        const condition = this.interpret(stmt.condition);
        if (isTrusty(condition)) {
          this.execute(stmt.thenBranch);
        } else if (stmt.elseBranch !== null) {
          this.execute(stmt.elseBranch);
        }
        return;
    }
  }

  execute_statements(stmt: Stmt[]): void {
    try {
      stmt.forEach((x) => this.execute(x));
    } catch (e) {
      Lox.runtimeError(e as RuntimeError);
    }
  }
}

export { Interpreter, RuntimeError };
