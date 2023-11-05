# JLOX TypeScript
An implement of JLOX language in TypeScript (WIP)
## Run
```bash
bun install
```

To run REPL:

```bash
bun run index.ts
```

## Features
- JS-like grammar
- Control Flow (If, While, For)
- Functions (Supports recursion)
- Declarations and states
- Expression and statements
- Dynamically Typed

## Examples
- Fibonacci Numbers (recursion)
```js
function fib(n) {
    if (n <= 1) return n;
    return fib (n - 2) + fib (n - 1);
}

for (let i = 0; i < 20; i = i + 1) {
    print fib(i);
}
```

- Control flow
```js
for (let i = 1; a < 100000; i = temp + i) {
    print a;
    temp = a;
    a = i;
}
```

## LICENSE
MIT

