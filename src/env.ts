import { RuntimeError } from "./eval";
import { Token } from "./token";

class Env {
  values: Map<string, any>;
  enclosing: Env | null = null;
  constructor(enclosing: Env | null = null) {
    this.values = new Map();
    this.enclosing = enclosing;
  }

  define(name: string, value: any) {
    this.values.set(name, value);
  }

  assign(name: Token, value: any) {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value);
      return;
    }

    if (this.enclosing) {
      this.enclosing.assign(name, value);
      return;
    }

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }

  get(name: Token): any {
    if (this.values.has(name.lexeme)) return this.values.get(name.lexeme);
    if (this.enclosing) return this.enclosing.get(name);
    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }
}

export default Env;
