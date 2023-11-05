import { RuntimeError, Interpreter } from "./eval";
import { Parser } from "./parser";
import { Scanner } from "./scanner";
import { Token, TokenType } from "./token";

const fs = require("fs");
const readline = require("readline");

class Lox {
  static hadError: boolean;
  static hadRuntimeError: boolean;
  static main(args: string[]): void {
    if (args.length > 1) {
      console.log("Usage: lox [script]");
    } else if (args.length == 1) {
      Lox.runFile(args[0]);
    } else {
      Lox.runPrompt();
    }
  }

  private static run(source: string): void {
    const scanner = new Scanner(source);
    const tokens = scanner.scanTokens();
    const parser = new Parser(tokens);
    const statements = parser.parse();
    const interpreter = new Interpreter();
    if (this.hadError) return;
    if (statements) {
      interpreter.execute_statements(statements);
    }
  }

  static error(line: number, message: string): void {
    Lox.reportError(line, "", message);
  }

  static runtimeError(error: RuntimeError): void {
    console.log(`${error.message}\n[line ${error.token.line}]`);
    this.hadRuntimeError = true;
  }

  private static reportError(
    line: number,
    where: string,
    message: string
  ): void {
    console.log(`[line ${line}] Error${where}: ${message}`);
    this.hadError = true;
  }

  static tokenError(token: Token, message: string) {
    if (token.type == TokenType.EOF) {
      Lox.reportError(token.line, " at end", message);
    } else {
      Lox.reportError(token.line, ` at '${token.lexeme}'`, message);
    }
  }

  private static runFile(path: string): void {
    const data = fs.readFileSync(path, "utf8");
    Lox.run(data);
    if (Lox.hadError) process.exit(65);
    if (Lox.hadRuntimeError) process.exit(70);
  }

  private static runPrompt(): void {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: "> ",
    });

    rl.prompt();
    rl.on("line", (line: string) => {
      Lox.run(line);
      if (Lox.hadError) process.exit(65);
      if (Lox.hadRuntimeError) process.exit(70);
      rl.prompt();
    }).on("close", () => {
      console.log("\nHave a great day!");
      process.exit(0);
    });
  }
}

export { Lox };
