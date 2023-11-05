import { Lox } from "./lox";
import { Token, TokenType } from "./token";

const isDigit = (c: string): boolean => c >= "0" && c <= "9";
const isAlpha = (c: string): boolean =>
  (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c == "_";

class Scanner {
  private readonly source: string;
  private readonly tokens: Token[] = [];
  static keywords: Map<string, TokenType> = new Map([
    ["and", TokenType.AND],
    ["class", TokenType.CLASS],
    ["else", TokenType.ELSE],
    ["false", TokenType.FALSE],
    ["for", TokenType.FOR],
    ["function", TokenType.FUN],
    ["if", TokenType.IF],
    ["nil", TokenType.NIL],
    ["or", TokenType.OR],
    ["print", TokenType.PRINT],
    ["return", TokenType.RETURN],
    ["super", TokenType.SUPER],
    ["this", TokenType.THIS],
    ["true", TokenType.TRUE],
    ["let", TokenType.LET],
    ["while", TokenType.WHILE],
  ]);

  start: number = 0;
  current: number = 0;
  line: number = 1;

  constructor(source: string) {
    this.source = source;
  }

  scanTokens(): Token[] {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }
    this.tokens.push(new Token(TokenType.EOF, "", null, this.line));
    return this.tokens;
  }

  isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  addToken(type: TokenType, literal: any = null): void {
    const text = this.source.substring(this.start, this.current);
    this.tokens.push(new Token(type, text, literal, this.line));
  }

  advance(): string {
    this.current++;
    return this.source.charAt(this.current - 1);
  }

  // lookahead without consuming the character
  peek(): string {
    if (this.isAtEnd()) return "\0";
    return this.source.charAt(this.current);
  }

  peekNext(): string {
    if (this.current + 1 >= this.source.length) return "\0";
    return this.source.charAt(this.current + 1);
  }

  // consume a character if it matches the expected character
  match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source.charAt(this.current) != expected) return false;
    this.current++;
    return true;
  }

  private handle_number() {
    while (isDigit(this.peek())) this.advance();
    if (this.peek() == "." && isDigit(this.peekNext())) {
      this.advance();
      while (isDigit(this.peek())) this.advance();
    }
    this.addToken(
      TokenType.NUMBER,
      parseFloat(this.source.substring(this.start, this.current))
    );
  }

  private handle_identifier() {
    while (isAlpha(this.peek()) || isDigit(this.peek())) this.advance();
    const text = this.source.substring(this.start, this.current);
    const type = Scanner.keywords.get(text) || TokenType.IDENTIFIER;
    this.addToken(type);
  }

  private scanToken() {
    const c = this.advance();
    switch (c) {
      case "(":
        this.addToken(TokenType.LEFT_PAREN);
        break;
      case ")":
        this.addToken(TokenType.RIGHT_PAREN);
        break;
      case "{":
        this.addToken(TokenType.LEFT_BRACE);
        break;
      case "}":
        this.addToken(TokenType.RIGHT_BRACE);
        break;
      case ",":
        this.addToken(TokenType.COMMA);
        break;
      case ".":
        this.addToken(TokenType.DOT);
        break;
      case "-":
        this.addToken(TokenType.MINUS);
        break;
      case "+":
        this.addToken(TokenType.PLUS);
        break;
      case ";":
        this.addToken(TokenType.SEMICOLON);
        break;
      case "*":
        this.addToken(TokenType.STAR);
        break;
      case "!":
        this.addToken(this.match("=") ? TokenType.BANG_EQUAL : TokenType.BANG);
        break;
      case "=":
        this.addToken(
          this.match("=") ? TokenType.EQUAL_EQUAL : TokenType.EQUAL
        );
        break;
      case "<":
        this.addToken(this.match("=") ? TokenType.LESS_EQUAL : TokenType.LESS);
        break;
      case ">":
        this.addToken(
          this.match("=") ? TokenType.GREATER_EQUAL : TokenType.GREATER
        );
        break;
      case "/":
        if (this.match("/")) {
          while (this.peek() != "\n" && !this.isAtEnd()) this.advance();
        } else {
          this.addToken(TokenType.SLASH);
        }
        break;
      case " ":
      case "\r":
      case "\t":
        break;
      case "\n":
        this.line++;
        break;
      case '"':
        // allows multiline strings
        while (this.peek() != '"' && !this.isAtEnd()) {
          if (this.peek() == "\n") this.line++;
          this.advance();
        }
        if (this.isAtEnd()) {
          Lox.error(this.line, "Unterminated string.");
          return;
        }
        this.advance();
        const value = this.source.substring(this.start + 1, this.current - 1);
        this.addToken(TokenType.STRING, value);
        break;
      default:
        if (isDigit(c)) {
          this.handle_number();
        } else if (isAlpha(c)) {
          this.handle_identifier();
        } else {
          Lox.error(this.line, "Unexpected character: " + c);
        }
    }
  }
}

export { Scanner };
