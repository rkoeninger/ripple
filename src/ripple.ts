
module ripple {

    type RValue = boolean | number | string | Symbol | Cons | Primitive | Lambda;

    function grow<A, B>(initial: A, next: (x: A) => A, check: (x: A) => boolean, select: (x: A) => B): B[] {
        const result = [];

        for (let current = initial; check(current); current = next(current)) {
            result.push(select(current));
        }

        return result;
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
        static toArray = (c: RValue): RValue[] => grow(c, x => x.tail, isCons, x => x.head);
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

    type PrimitiveFn = (args: RValue[]) => RValue;

    class Primitive {
        id: string;
        arity: number;
        f: PrimitiveFn;
        constructor(id: string, arity: number, f: PrimitiveFn) {
            this.id = id;
            this.arity = arity;
            this.f = f;
        }
        toString = (): string => this.id;
    }

    type SpecialFn = (exprs: RValue[], locals: Cons) => RValue;

    class Special {
        id: string;
        arity: number;
        f: SpecialFn;
        constructor(id: string, arity: number, f: SpecialFn) {
            this.id = id;
            this.arity = arity;
            this.f = f;
        }
        toString = (): string => this.id;
    }

    class Lambda {
        id = "Function";
        params: string[];
        body: RValue;
        locals: Cons;
        constructor(params: string[], body: RValue, locals: Cons) {
            this.params = params;
            this.body = body;
            this.locals = locals;
        }
        get arity() {
            return this.params.length;
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
    export function isString(x: any): x is string { return typeof x === "string"; }
    export function isSymbol(x: any): x is Symbol { return x instanceof Symbol; }
    export function isCons(x: any): x is Cons { return x instanceof Cons; }
    function isFunction(x: any): x is Function { return x instanceof Lambda || x instanceof Primitive; }
    function isLambda(x: any): x is Lambda { return x instanceof Lambda; }
    export function isPrimitive(x: any): x is Primitive { return x instanceof Primitive; }

    export function format(value: RValue): string {
        if (isUndefined(value)) { throw new Error("Can't print undefined value"); }
        if (isNull(value)) { return "()"; }
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

    interface Defines {
        [key: string]: RValue;
    }

    export var defines: Defines = {};

    function define(id: string, value: RValue): RValue {
        defines[id] = value;
        return value;
    }

    export function definePrimitive(id: string, arity: number, f: PrimitiveFn): RValue {
        return define(id, new Primitive(id, arity, f));
    }

    function defineNumBinOp<A extends RValue>(id: string, f: (x: number, y: number) => A) {
        definePrimitive(id, 2, ([x, y]) => {
            if (isNumber(x) && isNumber(y)) { return f(x, y); }
            else { throw new Error("Must be numbers"); }
        });
    }

    function defineNumUnOp(id: string, f: (x: number) => number) {
        definePrimitive(id, 1, ([x]) => {
            if (isNumber(x)) { return f(x); }
            else { throw new Error("Must be a number"); }
        });
    }

    function defineTypeCheckOp(id: string, f: (x: any) => boolean) {
        definePrimitive(id, 1, ([x]) => f(x));
    }

    function defineConsOp(id: string, f: (x: Cons) => RValue) {
        definePrimitive(id, 1, ([c]) => {
            if (isCons(c)) { return f(c); }
            else { throw new Error("Must be Cons"); }
        });
    }

    definePrimitive("symbol", 1, ([s]) => {
        if (isString(s)) { return new Symbol(s); }
        else { throw new Error("Must be string"); }
    });
    definePrimitive("=", 2, ([x, y]) => x === y);
    definePrimitive("cons", 2, ([x, y]) => new Cons(x, y));
    defineConsOp("head", x => x.head);
    defineConsOp("tail", x => x.tail);
    defineNumBinOp<number>("+", (x, y) => x + y);
    defineNumBinOp<number>("*", (x, y) => x * y);
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
    definePrimitive("str", 2, ([x, y]) => (x || "").toString() + (y || "").toString());
    definePrimitive("eval", 1, ([expr]) => eval(expr));

    interface Specials {
        [key: string]: Special;
    }

    var specials: Specials = {};

    function defineSpecial(id: string, arity: number, f: SpecialFn) {
        specials[id] = new Special(id, arity, f);
    }

    defineSpecial("if", 3, ([condition, ifTrue, ifFalse], locals) =>
        isTruthy(eval(condition, locals)) ? eval(ifTrue, locals) : eval(ifFalse, locals)
    );
    defineSpecial("def", 2, ([sym, value], locals) =>
        define(symbolId(sym), eval(value, locals))
    );
    defineSpecial("let", 3, ([sym, value, body], locals) =>
        eval(body, consLocals([symbolId(sym)], [eval(value, locals)], locals))
    );
    defineSpecial("fn", 2, ([params, body], locals) => {
        if (isCons(params)) {
            return new Lambda(Cons.toArray(params).map(symbolId), body, locals);
        } else if (isNull(params)) {
            return new Lambda([], body, locals);
        }

        throw new Error("Argument list expected at " + format(params));
    });

    function apply(operator: RValue, operands: RValue[], locals: Cons = null): RValue {
        if (isPrimitive(operator)) {
            if (operator.arity !== operands.length) {
                throw new Error(`${operator.id} expected ${operator.arity} arguments but was given ${operands.length}`);
            }
            return operator.f(operands);
        }
        else if (isLambda(operator)) {
            if (operator.arity !== operands.length) {
                throw new Error(`${operator.id} expected ${operator.arity} arguments but was given ${operands.length}`);
            }
            return eval(operator.body, consLocals(operator.params, operands, operator.locals));
        }

        throw new Error(`First item in an application must be a function, but instead: ${format(operator)}`);
    }

    export function eval(expr: RValue, locals: Cons = null): RValue {
        if (isCons(expr)) {
            const head = expr.head;
            if (isSymbol(head) && specials.hasOwnProperty(symbolId(head))) {
                const special = specials[head.id];
                const operands = Cons.toArray(expr.tail);
                if (special.arity !== operands.length) {
                    throw new Error(`${special.id} form expected ${special.arity} arguments but was given ${operands.length}`);
                }
                return special.f(operands, locals);
            }

            const [operator, ...operands] = Cons.toArray(expr).map(x => eval(x, locals));
            return apply(operator, operands, locals);
        }
        else if (isSymbol(expr)) {
            return symbolLookup(expr.id, locals);
        }
        else {
            return expr;
        }
    }
}
