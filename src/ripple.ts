
module ripple {

    type RValue = boolean | number | string | Symbol | Cons | Primitive | Lambda;
    type IValue = RValue | RValue[]; // also includes values internal to interpreter

    function grow<A, B>(initial: A, next: (x: A) => A, check: (x: A) => boolean, select: (x: A) => B): B[] {
        const result = [];

        for (let current = initial; check(current); current = next(current)) {
            result.push(select(current));
        }

        return result;
    }

    class Cons {
        head: any;
        tail: any;
        constructor(head: any, tail: any) {
            this.head = head;
            this.tail = tail;
        }
        static fromArray = (array: any[]): any => array.reduceRight((tail, head) => new Cons(head, tail), null);
        toArray = (): any[] => grow(this, x => x.tail, isCons, x => x.head);
        toString = (): string => `(${format(this.head)} ${format(this.tail)})`;
    }

    export class Symbol {
        id: string;
        constructor(id: string) {
            this.id = id;
        }
        toString = (): string => this.id;
    }

    class Special {
        id: string;
        arity: number;
        f: (exprs: any[], locals: Cons) => any;
        constructor(id: string, arity: number, f: (exprs: any[], locals: Cons) => any) {
            this.id = id;
            this.arity = arity;
            this.f = f;
        }
        toString = (): string => this.id;
    }

    class Primitive {
        id: string;
        arity: number;
        f: (args: any[]) => any;
        constructor(id: string, arity: number, f: (args: any[]) => any) {
            this.id = id;
            this.arity = arity;
            this.f = f;
        }
        toString = (): string => this.id;
    }

    class Lambda {
        params: string[];
        body: any;
        locals: Cons;
        constructor(params: string[], body: any, locals: Cons) {
            this.params = params;
            this.body = body;
            this.locals = locals;
        }
        toString = (): string => format([
            new Symbol("function"),
            this.params.map(x => new Symbol(x)),
            this.body]);
    }

    type Function = Primitive | Lambda;

    function isUndefined(x: any): boolean { return typeof x === "undefined"; }
    function isDefined(x: any): boolean { return typeof x !== "undefined"; }
    function isNull(x: any): boolean { return x === null; }
    function isBoolean(x: any): x is boolean { return typeof x === "boolean"; }
    function isTruthy(x: any): boolean { return x !== null && x !== false; }
    function isNumber(x: any): x is number { return typeof x === "number"; }
    function isString(x: any): x is string { return typeof x === "string"; }
    export function isSymbol(x: any): x is Symbol { return x instanceof Symbol; }
    function isCons(x: any): x is Cons { return x instanceof Cons; }
    function isFunction(x: any): x is Function { return x instanceof Lambda || x instanceof Primitive; }
    function isLambda(x: any): x is Lambda { return x instanceof Lambda; }
    export function isPrimitive(x: any): x is Primitive { return x instanceof Primitive; }
    export function isArray(x: any): x is [] { return Array.isArray(x); }

    export function format(value: IValue): string {
        if (isUndefined(value)) { throw new Error("Can't print undefined value"); }
        if (isNull(value)) { return "null"; }
        if (isArray(value)) { return `(${value.map(x => format(x)).join(" ")})`; }
        if (isString(value)) { return `"${value}"`; }
        return value.toString();
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
        private skipWhile(f: (x: string) => boolean): number {
            const startingPos = this.pos;

            while (!this.isDone() && f(this.current())) {
                this.skipOne();
            }

            return startingPos;
        }
        private skipWhiteSpace(): void {
            this.skipWhile(x => /\s/.test(x));
        }
        private readStringLiteral(): string {
            const startingPos = this.skipWhile(x => x !== '\"'); // TODO: does not handle escape chars
            this.skipOne(); // Skip over closing '\"'
            return this.text.substring(startingPos, this.pos - 1);
        }
        private readLiteral(): RValue {
            const startingPos = this.skipWhile(x => x !== '(' && x !== ')' && /\S/.test(x));
            const unparsedLiteral = this.text.substring(startingPos, this.pos);

            if (/^\x2D?\d/.test(unparsedLiteral)) {
                return parseFloat(unparsedLiteral);
            }

            switch (unparsedLiteral) {
                case "false": return false;
                case "true": return true;
                case "null": return null;
                default: return new Symbol(unparsedLiteral);
            }
        }
        parseOne(): IValue {
            this.skipWhiteSpace();

            if (this.isDone()) {
                throw new Error("Unexpected end of file");
            }

            switch (this.current()) {
                case '(':
                    this.skipOne(); // Skip over '('
                    return grow(this.parseOne(), _ => this.parseOne(), isDefined, x => x);
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
        parseAll(): IValue[] {
            const result = [];
            this.skipWhiteSpace();

            while (!this.isDone()) {
                result.push(this.parseOne());
            }

            return result;
        }
    }

    export function parseAllText(text: string): IValue[] {
        return new Source(text).parseAll();
    }

    export function parseOneText(text: string): IValue {
        return new Source(text).parseOne();
    }

    function assertArity(type: string, expected: number, actual: number): void {
        if (expected !== actual) {
            throw new Error(`${type} takes ${expected} args, but given ${actual}`);
        }
    }

    function symbolId(value: IValue): string {
        if (isSymbol(value)) {
            return value.id;
        }

        throw new Error("Symbol literal expected, but instead: " + format(value));
    }

    function symbolLookup(id: string, locals: Cons): RValue {
        for (; isCons(locals); locals = locals.tail) {
            if (mori.hasKey(locals.head, id)) {
                return mori.get(locals.head, id);
            }
        }

        if (defines.hasOwnProperty(id)) {
            return defines[id];
        }

        throw new Error(`Symbol "${id}" not recognized`);
    }

    function consLocals(params: string[], values: RValue[], locals: Cons): Cons {
        return params.length === 0
            ? locals
            : new Cons(mori.zipmap(params, values), locals);
    }

    function consMap(f: (x: RValue) => RValue, c: RValue): RValue {
        if (isCons(c)) {
            return new Cons(f(c.head), consMap(f, c.tail));
        }

        return c;
    }

    export var defines = {};

    function define(id: string, value: RValue): RValue {
        defines[id] = value;
        return value;
    }

    export function definePrimitive(id: string, arity: number, f: (args: RValue[]) => RValue): RValue {
        return define(id, new Primitive(id, arity, f));
    }

    function defineNumBinOp<A extends RValue>(id: string, f: (x: number, y: number) => A) {
        definePrimitive(id, 2, args => {
            const [x, y] = args;
            if (isNumber(x) && isNumber(y)) { return f(x, y); }
            else { throw new Error("Must be numbers"); }
        });
    }

    function defineNumUnOp(id: string, f: (x: number) => number) {
        definePrimitive(id, 1, args => {
            const [x] = args;
            if (isNumber(x)) { return f(x); }
            else { throw new Error("Must be a number"); }
        });
    }

    function defineTypeCheckOp(id: string, f: (x: any) => boolean) {
        definePrimitive(id, 1, args => f(args[0]));
    }

    function defineConsOp(id: string, f: (x: Cons) => RValue) {
        definePrimitive(id, 1, args => {
            const [c] = args;
            if (isCons(c)) { return f(c); }
            else { throw new Error("Must be Cons"); }
        });
    }

    definePrimitive("arity", 1, args => {
        const [f] = args;
        if (isPrimitive(f)) { return f.arity; }
        else if (isLambda(f)) { return f.params.length; }
        else { throw new Error("Must be function"); }
    });
    definePrimitive("symbol", 1, args => {
        const [s] = args;
        if (isString(s)) { return new Symbol(s); }
        else { throw new Error("Must be string"); }
    });
    definePrimitive("=", 2, args => args[0] === args[1]);
    definePrimitive("cons", 2, args => new Cons(args[0], args[1]));
    defineConsOp("head", x => x.head);
    defineConsOp("tail", x => x.tail);
    defineNumBinOp<number>("+", (x, y) => x + y);
    defineNumBinOp<number>("-", (x, y) => x - y);
    defineNumBinOp<number>("*", (x, y) => x * y);
    defineNumBinOp<number>("/", (x, y) => x / y);
    defineNumBinOp<number>("mod", (x, y) => x % y);
    defineNumBinOp<boolean>("<", (x, y) => x < y);
    defineNumBinOp<boolean>(">", (x, y) => x > y);
    defineNumBinOp<boolean>("<=", (x, y) => x <= y);
    defineNumBinOp<boolean>(">=", (x, y) => x >= y);
    defineNumUnOp("sqrt", x => Math.sqrt(x));
    defineNumUnOp("negate", x => x * -1);
    defineTypeCheckOp("boolean?", isBoolean);
    defineTypeCheckOp("string?", isString);
    defineTypeCheckOp("cons?", isCons);
    defineTypeCheckOp("number?", isNumber);
    defineTypeCheckOp("symbol?", isSymbol);
    defineTypeCheckOp("function?", isFunction);
    defineTypeCheckOp("null?", isNull);
    definePrimitive("not", 1, args => !args[0]);
    definePrimitive("concat", 2, args => (args[0] || "").toString() + (args[1] || "").toString());

    const specials = {};

    function defineSpecial(id: string, arity: number, f: (exprs: IValue[], locals: Cons) => RValue) {
        specials[id] = new Special(id, arity, f);
    }

    defineSpecial("if", 3, (exprs, locals) =>
        isTruthy(eval(exprs[0], locals)) ? eval(exprs[1], locals) : eval(exprs[2], locals)
    );
    defineSpecial("and", 2, (exprs, locals) =>
        isTruthy(eval(exprs[0], locals)) ? eval(exprs[1], locals) : false
    );
    defineSpecial("or", 2, (exprs, locals) =>
        isTruthy(eval(exprs[0], locals)) ? true : eval(exprs[1], locals)
    );
    defineSpecial("define", 2, (exprs, locals) =>
        define(symbolId(exprs[0]), eval(exprs[1], locals))
    );
    defineSpecial("let", 3, (exprs, locals) =>
        eval(exprs[2], consLocals([symbolId(exprs[0])], [eval(exprs[1], locals)], locals))
    );
    defineSpecial("function", 2, (exprs, locals) => {
        const params = exprs[0];
        if (isArray(params)) {
            return new Lambda(params.map(symbolId), exprs[1], locals);
        }

        throw new Error("Argument list expected at " + format(params));
    });

    function apply(first: RValue, rest: RValue[]): RValue {
        if (! isFunction(first)) {
            throw new Error(`First item in an application must be a function, but instead: ${format(first)}`);
        }

        if (isPrimitive(first)) {
            assertArity(`Function "${first.id}"`, first.arity, rest.length);
            return first.f(rest);
        }

        if (isLambda(first)) {
            assertArity("Function", first.params.length, rest.length);
            return eval(first.body, consLocals(first.params, rest, first.locals));
        }
    }

    export function eval(expr: IValue, locals: Cons = null): RValue {
        if (isArray(expr)) {
            if (expr.length === 0) {
                return null;
            }

            const [first, ...rest] = expr;
            if (isSymbol(first) && specials.hasOwnProperty(first.id)) {
                const special = specials[first.id];
                assertArity(`Special form "${special.id}"`, special.arity, rest.length);
                return special.f(rest, locals);
            }

            const [firstValue, ...restValues] = expr.map(x => eval(x, locals));
            return apply(firstValue, restValues);
        }
        else if (isSymbol(expr)) {
            return symbolLookup(expr.id, locals);
        }
        else {
            return expr;
        }
    }
}
