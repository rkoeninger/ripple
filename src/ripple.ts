
module ripple {

    type RValue = boolean | number | string | Symbol | Cons | Primitive | Lambda;

    function grow<A, B>(initial: A, next: (x: A) => A, check: (x: A) => boolean, select: (x: A) => B): B[] {
        const result = [];

        for (let current = initial; check(current); current = next(current)) {
            result.push(select(current));
        }

        return result;
    }

    class Arity {
        min: number;
        max: number;
        constructor(min: number, max: number = min) {
            this.min = min;
            this.max = max;
        }
    }

    // TODO: create separate Stack class for locals
    // typechecks only because mori uses 'any' for everything

    export class Cons {
        head: RValue;
        tail: RValue;
        constructor(head: RValue, tail: RValue) {
            this.head = head;
            this.tail = tail;
        }
        static of = (...args: RValue[]): RValue => Cons.fromArray(args);
        static fromArray = (array: RValue[]): RValue => array.reduceRight((tail, head) => new Cons(head, tail), null);
        static toArray = (c: Cons): RValue[] => grow(c, x => x.tail, isCons, x => x.head);
        toString = (): string => `(${format(this.head)} ${format(this.tail)})`;
        static map = (c: RValue, f: (x: RValue) => RValue): RValue => {
            if (isCons(c)) {
                return new Cons(f(c.head), Cons.map(c.tail, f));
            } else {
                return c;
            }
        };
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
        arity: Arity;
        f: (exprs: any[], locals: Cons) => any;
        constructor(id: string, arity: Arity, f: (exprs: any[], locals: Cons) => any) {
            this.id = id;
            this.arity = arity;
            this.f = f;
        }
        toString = (): string => this.id;
    }

    class Primitive {
        id: string;
        arity: Arity;
        f: (args: any[]) => any;
        constructor(id: string, arity: Arity, f: (args: any[]) => any) {
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
        toString = (): string => format(
            mori.reduce(
                (acc, frame) => mori.reduce(
                    (acc, key) => Cons.of(new Symbol("let"), new Symbol(key), mori.get(frame, key), acc),
                    acc,
                    mori.keys(frame)),
                Cons.of(new Symbol("fn"), Cons.fromArray(this.params.map(x => new Symbol(x))), this.body),
                Cons.toArray(this.locals)));
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
    export function isCons(x: any): x is Cons { return x instanceof Cons; }
    function isFunction(x: any): x is Function { return x instanceof Lambda || x instanceof Primitive; }
    function isLambda(x: any): x is Lambda { return x instanceof Lambda; }
    export function isPrimitive(x: any): x is Primitive { return x instanceof Primitive; }
    //export function isArray(x: any): x is [] { return Array.isArray(x); }

    export function format(value: RValue): string {
        if (isUndefined(value)) { throw new Error("Can't print undefined value"); }
        if (isNull(value)) { return "null"; }
        if (isCons(value)) { return `(${Cons.toArray(value).map(x => format(x)).join(" ")})`; }
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
        parseOne(): RValue {
            this.skipWhiteSpace();

            if (this.isDone()) {
                throw new Error("Unexpected end of file");
            }

            switch (this.current()) {
                case '(':
                    this.skipOne(); // Skip over '('
                    return Cons.fromArray(grow(this.parseOne(), _ => this.parseOne(), isDefined, x => x));
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
        parseAll(): RValue[] {
            const result = [];
            this.skipWhiteSpace();

            while (!this.isDone()) {
                result.push(this.parseOne());
            }

            return result;
        }
    }

    export function parseAllText(text: string): RValue[] {
        return new Source(text).parseAll();
    }

    export function parseOneText(text: string): RValue {
        return new Source(text).parseOne();
    }

    function assertArity(type: string, expected: number | Arity, actual: number): void {
        if (isNumber(expected)) {
            if (expected !== actual) {
                throw new Error(`${type} takes ${expected} args, but given ${actual}`);
            }
        } else {
            if (actual < expected.min || actual > expected.max) {
                throw new Error(`${type} takes between ${expected.min} and ${expected.max} args, but given ${actual}`);
            }
        }
    }

    function symbolId(value: RValue): string {
        if (isSymbol(value)) {
            return value.id;
        }

        throw new Error("Symbol literal expected, but instead: " + format(value));
    }

    function symbolLookup(id: string, locals: Cons): RValue {
        for (let current: any = locals; isCons(current); current = current.tail) {
            if (mori.hasKey(current.head, id)) {
                return mori.get(current.head, id);
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

    export function definePrimitive(id: string, arity: number | Arity, f: (args: RValue[]) => RValue): RValue {
        return define(id, new Primitive(id, isNumber(arity) ? new Arity(arity) : arity, f));
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

    /*definePrimitive("arity", new Arity(1), args => {
        const [f] = args;
        if (isPrimitive(f)) { return f.arity; }
        else if (isLambda(f)) { return f.params.length; }
        else { throw new Error("Must be function"); }
    });*/
    definePrimitive("symbol", 1, ([s]) => {
        if (isString(s)) { return new Symbol(s); }
        else { throw new Error("Must be string"); }
    });
    definePrimitive("=", 2, ([x, y]) => x === y);
    definePrimitive("cons", 2, ([x, y]) => new Cons(x, y));
    defineConsOp("head", x => x.head);
    defineConsOp("tail", x => x.tail);
    definePrimitive("+", new Arity(0, 1024), args => {
        if (! args.every(isNumber)) {
            throw new Error("args must be numbers");
        } else {
            return mori.reduce(mori.sum, args);
        }
    });
    definePrimitive("*", new Arity(0, 1024), args => {
        if (!args.every(isNumber)) {
            throw new Error("args must be numbers");
        } else {
            return mori.reduce((x, y) => x * y, args);
        }
    });
    defineNumBinOp<number>("-", (x, y) => x - y);
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
    defineTypeCheckOp("fn?", isFunction);
    defineTypeCheckOp("null?", isNull);
    definePrimitive("not", 1, ([b]) => !b);
    definePrimitive("str", new Arity(0, 1024), args => {
        return args.reduce((x, y) => (x || "").toString() + (y || "").toString(), "");
    });
    definePrimitive("eval", 1, ([expr]) => eval(expr));

    const specials = {};

    function defineSpecial(id: string, arity: Arity, f: (exprs: RValue[], locals: Cons) => RValue) {
        specials[id] = new Special(id, arity, f);
    }

    defineSpecial("if", new Arity(2, 3), (exprs, locals) =>
        isTruthy(eval(exprs[0], locals))
            ? eval(exprs[1], locals)
            : (exprs.length === 3 ? eval(exprs[2], locals) : null)
    );
    defineSpecial("and", new Arity(2, 1024), (exprs, locals) =>
        exprs.every(x => isTruthy(eval(x, locals)))
    );
    defineSpecial("or", new Arity(2, 1024), (exprs, locals) =>
        exprs.some(x => isTruthy(eval(x, locals)))
    );
    defineSpecial("def", new Arity(2), (exprs, locals) =>
        define(symbolId(exprs[0]), eval(exprs[1], locals))
    );
    defineSpecial("let", new Arity(3), (exprs, locals) =>
        eval(exprs[2], consLocals([symbolId(exprs[0])], [eval(exprs[1], locals)], locals))
    );
    defineSpecial("fn", new Arity(2), (exprs, locals) => {
        const params = exprs[0];
        if (isCons(params)) {
            return new Lambda(Cons.toArray(params).map(symbolId), exprs[1], locals);
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

    export function eval(expr: RValue, locals: Cons = null): RValue {
        if (isCons(expr)) {
            let array = Cons.toArray(expr);
            if (array.length === 0) {
                return null;
            }

            const [first, ...rest] = array;
            if (isSymbol(first) && specials.hasOwnProperty(first.id)) {
                const special = specials[first.id];
                assertArity(`Special form "${special.id}"`, special.arity, rest.length);
                return special.f(rest, locals);
            }

            const [firstValue, ...restValues] = array.map(x => eval(x, locals));
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
