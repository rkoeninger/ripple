
module ripple {

    class Cons {
        head: any;
        tail: any;
        constructor(head: any, tail: any) {
            this.head = head;
            this.tail = tail;
        }
        toString = (): string => "(" + format(this.head) + " " + format(this.tail) + ")";
    }

    class Symbol {
        id: string;
        constructor(id: string) {
            this.id = id;
        }
        toString = (): string => this.id;
    }

    class Primitive {
        id: string;
        arity: number;
        f: (any) => any;
        constructor(id: string, arity: number, f: (any) => any) {
            this.id = id;
            this.arity = arity;
            this.f = f;
        }
        toString = (): string => this.id;
    }

    class Lambda {
        params: string[];
        body: any;
        stack: any[];
        constructor(params: string[], body: any, stack: any[]) {
            this.params = params;
            this.body = body;
            this.stack = stack;
        }
        toString = (): string => format([
            new Symbol("function"),
            this.params.map(x => new Symbol(x)),
            this.body], this.stack);
    }

    function isUndefined(x: any): boolean { return typeof x === "undefined"; }
    function isNull(x: any): boolean { return x === null; }
    function isBoolean(x: any): boolean { return typeof x === "boolean"; }
    function isTruthy(x: any): boolean { return x !== null && x !== false; }
    function isNumber(x: any): boolean { return typeof x === "number"; }
    function isString(x: any): boolean { return typeof x === "string"; }
    function isSymbol(x: any): boolean { return x instanceof Symbol; }
    function isCons(x: any): boolean { return x instanceof Cons; }
    function isLambda(x: any): boolean { return x instanceof Lambda; }
    export function isPrimitive(x: any): boolean { return x instanceof Primitive; }
    export function isArray(x: any): boolean { return Array.isArray(x); }

    export function format(ast: any, stack: any[] = []): string {
        if (isUndefined(ast)) { throw new Error("Can't print undefined value"); }
        if (isNull(ast)) { return "null"; }
        if (isArray(ast)) { return "(" + ast.map(x => format(x, stack)).join(" ") + ")"; }
        if (isString(ast)) { return "\"" + ast + "\""; }
        if (isSymbol(ast) && stack.length > 0) {
            var value = stackLookup(ast, stack);
            return isUndefined(value) ? ast.toString() : format(value);
        }
        return ast.toString();
    }

    class Source {
        private text: string;
        private pos: number;
        constructor(text: string) {
            this.text = text;
            this.pos = 0;
        }
        private isDone(): boolean {
            return this.text.length <= this.pos;
        }
        private current(): string {
            return this.isDone() ? null : this.text.charAt(this.pos);
        }
        private skipOne(): void {
            this.pos++;
        }
        private skipWhiteSpace(): void {
            while (!this.isDone() && /\s/.test(this.current())) {
                this.skipOne();
            }
        }
        private skipWhile(f: (string) => boolean): number {
            var startingPos = this.pos;
            while (f(this.current())) { this.skipOne(); }
            return startingPos;
        }
        private readStringLiteral(): string {
            var startingPos = this.skipWhile(x => x && x !== '\"');
            this.skipOne(); // Skip over closing '\"'
            return this.text.substring(startingPos, this.pos - 1);
        }
        private readLiteral(): any {
            var startingPos = this.skipWhile(x => x && x !== ')' && x !== ')' && /\S/.test(x));
            var unparsedLiteral = this.text.substring(startingPos, this.pos);

            if (/^\d/.test(unparsedLiteral)) { return parseFloat(unparsedLiteral); }

            switch (unparsedLiteral) {
                case "false": return false;
                case "true": return true;
                case "null": return null;
                default: return new Symbol(unparsedLiteral);
            }
        }
        parseOne(): any {
            this.skipWhiteSpace();

            if (this.isDone()) { throw new Error("Unexpected end of file"); }

            switch (this.current()) {
                case '(':
                    this.skipOne(); // Skip over '('
                    var children = [];

                    for (var child = this.parseOne(); !isUndefined(child); child = this.parseOne()) {
                        children.push(child);
                    }

                    return children;
                case ')':
                    this.skipOne(); // Skip over ')'
                    return undefined;
                case '\"':
                    this.skipOne(); // Skip over opening '\"'
                    return this.readStringLiteral();
                default:
                    return this.readLiteral();
            }
        }
        parseAll(): any[] {
            var result = [];
            this.skipWhiteSpace();

            while (!this.isDone()) {
                result.push(this.parseOne());
                this.skipWhiteSpace();
            }

            return result;
        }
    }

    export function parseAllText(text: string): any[] {
        return new Source(text).parseAll();
    }

    export function parseOneText(text: string): any {
        return new Source(text).parseOne();
    }

    export var defines = {};

    function define(id: string, value: any): any {
        defines[id] = value;
        return value;
    }

    function definePrimitive(id: string, arity: number, f: (any) => any): any {
        return define(id, new Primitive(id, arity, f));
    }

    definePrimitive("null?", 1, args => isNull(args[0]));
    definePrimitive("=", 2, args => args[0] === args[1]);
    definePrimitive("function?", 1, args => isLambda(args[0]) || isPrimitive(args[0]));
    definePrimitive("arity", 1, args => args[0].arity || args[0].args.length);
    definePrimitive("symbol?", 1, args => isSymbol(args[0]));
    definePrimitive("symbol", 1, args => new Symbol(args[0]));
    definePrimitive("cons?", 1, args => isCons(args[0]));
    definePrimitive("cons", 2, args => new Cons(args[0], args[1]));
    definePrimitive("head", 1, args => args[0].head);
    definePrimitive("tail", 1, args => args[0].tail);
    definePrimitive("array?", 1, args => isArray(args[0]));
    definePrimitive("array", 0, args => []);
    definePrimitive("push", 2, args => args[0].push(args[1]));
    definePrimitive("get", 2, args => args[0][args[1]]);
    definePrimitive("set", 3, args => args[0][args[1]] = args[2]);
    definePrimitive("number?", 1, args => isNumber(args[0]));
    definePrimitive("+", 2, args => args[0] + args[1]);
    definePrimitive("-", 2, args => args[0] - args[1]);
    definePrimitive("*", 2, args => args[0] * args[1]);
    definePrimitive("/", 2, args => args[0] / args[1]);
    definePrimitive("<", 2, args => args[0] < args[1]);
    definePrimitive(">", 2, args => args[0] > args[1]);
    definePrimitive("<=", 2, args => args[0] <= args[1]);
    definePrimitive(">=", 2, args => args[0] >= args[1]);
    definePrimitive("mod", 2, args => args[0] % args[1]);
    definePrimitive("sqrt", 1, args => Math.sqrt(args[0]));
    definePrimitive("negate", 1, args => args[0] * -1);
    definePrimitive("boolean?", 1, args => isBoolean(args[0]));
    definePrimitive("not", 1, args => !args[0]);
    definePrimitive("string?", 1, args => isString(args[0]));
    definePrimitive("concat", 2, args => (args[0] || "null").toString() + (args[1] || "null").toString());
    definePrimitive("log", 1, args => { console.log(args[0]); return null; });

    function assertType(typeCheck: (any) => boolean, value: any): void {
        if (!typeCheck(value)) { throw new Error("Value was not of the expected type"); }
    }

    function assertArity(type: string, expected: number, actual: number): void {
        if (expected !== actual) { throw new Error(type + " takes " + expected + " args, but given " + actual); }
    }

    function symbolId(value: any): string {
        assertType(isSymbol, value);
        return value.id;
    }

    function stackLookup(id: string, stack: any[]): any {
        for (var m = stack.length - 1; m >= 0; --m) {
            if (stack[m].hasOwnProperty(id)) { return stack[m][id]; }
        }
        return undefined;
    }

    function symbolLookup(id: string, stack: any[]): any {
        var value = stackLookup(id, stack);
        if (!isUndefined(value)) { return value; }
        if (defines.hasOwnProperty(id)) { return defines[id]; }
        throw new Error("Symbol " + id + " not recognized");
    }

    function pushLocalStack(params: string[], values: any[], stack: any[]): any[] {
        if (params.length > 0) {
            var frame = {};
            params.forEach((_, i) => frame[params[i]] = values[i]);
            var stack = stack.slice(0);
            stack.push(frame);
        }
        return stack;
    }

    function evalIf(expr: any, stack: any[]): any {
        assertArity("If expression", 3, expr.length);
        var conditionValue = isTruthy(eval(expr[0], stack));
        return eval(conditionValue ? expr[1] : expr[2], stack);
    }

    function evalAnd(expr: any, stack: any[]): any {
        assertArity("And expression", 2, expr.length);
        var leftValue = isTruthy(eval(expr[0], stack));
        return leftValue ? eval(expr[1], stack) : false;
    }

    function evalOr(expr: any, stack: any[]): any {
        assertArity("Or expression", 2, expr.length);
        var leftValue = isTruthy(eval(expr[0], stack));
        return leftValue ? true : eval(expr[1], stack);
    }

    function evalDefine(expr: any, stack: any[]): any {
        assertArity("Define expression", 2, expr.length);
        var name = symbolId(expr[0]);
        var value = eval(expr[1], stack);
        return define(name, value);
    }

    function evalLet(expr: any, stack: any[]): any {
        assertArity("Let expression", 3, expr.length);
        var name = symbolId(expr[0]);
        var value = eval(expr[1], stack);
        stack = pushLocalStack([name], [value], stack);
        return eval(expr[2], stack);
    }

    function evalFunction(expr: any, stack: any[]): any {
        assertArity("Function expression", 2, expr.length);
        return new Lambda(expr[0].map(symbolId), expr[1], stack);
    }

    function array2cons(a: any[]): any {
        var result = null;
        for (var i = a.length - 1; i >= 0; --i) {
            result = new Cons(a[i], result);
        }
        return result;
    }

    function map2cons(m: any): any {
        var result = null;
        for (var key in m) {
            result = new Cons(new Cons(key, m[key]), result);
        }
        return result;
    }

    function evalStack(stack: any[]): any {
        return array2cons(stack.map(map2cons));
    }

    function apply(first: any, rest: any[]): any {
        if (isPrimitive(first)) {
            assertArity("Function", first.arity, rest.length);
            return first.f.call(null, rest);
        }

        if (isLambda(first)) {
            assertArity("Function", first.params.length, rest.length);
            var stack = pushLocalStack(first.params, rest, first.stack);
            return eval(first.body, stack);
        }

        throw new Error("First element in combo must be a function");
    }

    export function eval(expr: any, stack: any[] = []): any {
        if (isArray(expr)) {
            if (expr.length === 0) { return null; }
            var first = expr[0];
            var rest = expr.slice(1);

            if (isSymbol(first)) {
                switch (first.id) {
                    case "if": return evalIf(rest, stack);
                    case "and": return evalAnd(rest, stack);
                    case "or": return evalOr(rest, stack);
                    case "define": return evalDefine(rest, stack);
                    case "let": return evalLet(rest, stack);
                    case "function": return evalFunction(rest, stack);
                    case "stack": return evalStack(stack);
                }
            }

            var firstValue = eval(first, stack);
            var restValues = rest.map(x => eval(x, stack));
            return apply(firstValue, restValues);
        }

        if (isSymbol(expr)) { return symbolLookup(expr.id, stack); }

        return expr;
    }
}