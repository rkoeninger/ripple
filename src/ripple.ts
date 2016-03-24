
class RipSymbol {
	id: string;
	constructor(id: string) {
		this.id = id;
	}
	toString = (): string => this.id;
}

class RipPrimitive {
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

class RipLambda {
	args: string[];
	body: any;
	stack: any[];
	constructor(args: string[], body: any, stack: any[]) {
		this.args = args;
		this.body = body;
		this.stack = stack;
	}
	toString = (): string => formatAst([
		new RipSymbol("function"),
		this.args.map(x => new RipSymbol(x)),
		this.body]);
}

function isUndefined(x: any): boolean { return typeof x === "undefined"; }
function isNull     (x: any): boolean { return x === null; }
function isBoolean  (x: any): boolean { return typeof x === "boolean"; }
function isTruthy   (x: any): boolean { return x !== null && x !== false; }
function isNumber   (x: any): boolean { return typeof x === "number"; }
function isString   (x: any): boolean { return typeof x === "string"; }
function isSymbol   (x: any): boolean { return x instanceof RipSymbol; }
function isPrimitive(x: any): boolean { return x instanceof RipPrimitive; }
function isLambda   (x: any): boolean { return x instanceof RipLambda; }
function isArray    (x: any): boolean { return Array.isArray(x); }

class Source {
	text: string;
	pos: number;
	constructor(text: string) {
		this.text = text;
		this.pos = 0;
	}
	isDone(): boolean {
		return this.text.length <= this.pos;
	}
	current(): string {
		return this.isDone() ? null : this.text.charAt(this.pos);
	}
	skipOne(): void {
		this.pos++;
	}
	skipWhiteSpace(): void {
		while (!this.isDone() && /\s/.test(this.current())) {
			this.skipOne();
		}
	}
	readStringLiteral(): string {
		var startingPos = this.pos;

		while (this.current() && this.current() !== '\"') {
			// TODO: does not handle escape chars
			this.skipOne();
		}

		this.skipOne(); // Skip over closing '\"'
		return this.text.substring(startingPos, this.pos - 1);
	}
	readLiteral(): any {
		var unparsedLiteral = "";

		while (this.current() && this.current() !== ')' && this.current() !== '(' && /\S/.test(this.current())) {
			unparsedLiteral = unparsedLiteral + this.current();
			this.skipOne();
		}

		if (/^\d/.test(unparsedLiteral)) { return parseFloat(unparsedLiteral); }

		switch (unparsedLiteral) {
			case "false": return false;
			case "true":  return true;
			case "null":  return null;
			default:      return new RipSymbol(unparsedLiteral);
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

		while (! this.isDone()) {
			result.push(this.parseOne());
			this.skipWhiteSpace();
		}

		return result;
	}
}

function parseAllText(text: string): any[] {
	return new Source(text).parseAll();
}

function parseOneText(text: string): any {
	return new Source(text).parseOne();
}

function formatAst(ast: any): string {
	if (isNull(ast)) { return "null"; }
	if (isArray(ast)) { return "(" + ast.map(formatAst).join(" ") + ")"; }
	if (isString(ast)) { return "\"" + ast + "\""; }
	return ast.toString(); 
}

var defines = {};

function define(id: string, value: any): any {
	defines[id] = value;
	return value;
}

function definePrimitive(id: string, arity: number, f: (any) => any): any {
	return define(id, new RipPrimitive(id, arity, f));
}

definePrimitive("number?", 1, args => isNumber(args[0]));
definePrimitive("string?", 1, args => isString(args[0]));
definePrimitive("boolean?", 1, args => isBoolean(args[0]));
definePrimitive("symbol?", 1, args => isSymbol(args[0]));
definePrimitive("function?", 1, args => isLambda(args[0]) || isPrimitive(args[0]));
definePrimitive("array?", 1, args => isArray(args[0]));
definePrimitive("null?", 1, args => isNull(args[0]));
definePrimitive("arity", 1, args => args[0].arity || args[0].args.length);
definePrimitive("symbol", 1, args => new RipSymbol(args[0]));
definePrimitive("array", 0, args => []);
definePrimitive("push", 2, args => args[0].push(args[1]));
definePrimitive("get", 2, args => args[0][args[1]]);
definePrimitive("set", 3, args => args[0][args[1]] = args[2]);
definePrimitive("+", 2, args => args[0] + args[1]);
definePrimitive("-", 2, args => args[0] - args[1]);
definePrimitive("*", 2, args => args[0] * args[1]);
definePrimitive("/", 2, args => args[0] / args[1]);
definePrimitive("<", 2, args => args[0] < args[1]);
definePrimitive(">", 2, args => args[0] > args[1]);
definePrimitive("<=", 2, args => args[0] <= args[1]);
definePrimitive(">=", 2, args => args[0] >= args[1]);
definePrimitive("=", 2, args => args[0] === args[1]);
definePrimitive("mod", 2, args => args[0] % args[1]);
definePrimitive("negate", 1, args => args[0] * -1);
definePrimitive("not", 1, args => !args[0]);
definePrimitive("concat", 2, args => (args[0] || "null").toString() + (args[1] || "null").toString());
definePrimitive("log", 1, args => console.log(args[0]));

function assertType(typeCheck: (any) => boolean, value: any): void {
	if (! typeCheck(value)) { throw new Error("Value was not of the expected type"); }
}

function assertArity(type: string, expected: number, actual: number): void {
	if (expected !== actual) { throw new Error(type + " takes " + expected + " args, but given " + actual); }
}

function getSymbolName(value: any): string {
	assertType(isSymbol, value);
	return value.id;
}

function stackLookup(id: string, stack: any[]): any {
	for (var m = stack.length - 1; m >= 0; --m) {
		if (stack[m].hasOwnProperty(id)) {
			return stack[m][id];
		}
	}

	if (defines.hasOwnProperty(id)) { return defines[id]; }

	throw new Error("Symbol " + id + " not recognized");
}

function pushStackFrame(params: string[], values: any[], stack: any[]): any[] {
	if (params.length > 0) {
		var frame = {};
		params.forEach((_, i) => frame[params[i]] = values[i]);
		var stack = stack.slice(0);
		stack.push(frame);
	}
	return stack;
}

function ripEvalIf(expr: any, stack: any[]): any {
	assertArity("If expression", 3, expr.length);
	var conditionValue = isTruthy(rippleEval(expr[0], stack));
	return rippleEval(conditionValue ? expr[1] : expr[2], stack);
}

function ripEvalAnd(expr: any, stack: any[]): any {
	assertArity("And expression", 2, expr.length);
	var leftValue = isTruthy(rippleEval(expr[0], stack));
	return leftValue ? rippleEval(expr[1], stack) : false;
}

function ripEvalOr(expr: any, stack: any[]): any {
	assertArity("Or expression", 2, expr.length);
	var leftValue = isTruthy(rippleEval(expr[0], stack));
	return leftValue ? true : rippleEval(expr[1], stack);
}

function ripEvalDefine(expr: any, stack: any[]): any {
	assertArity("Define expression", 2, expr.length);
	var name = getSymbolName(expr[0]);
	var value = rippleEval(expr[1], stack);
	return define(name, value);
}

function ripEvalLet(expr: any, stack: any[]): any {
	assertArity("Let expression", 3, expr.length);
	var name = getSymbolName(expr[0]);
	var value = rippleEval(expr[1], stack);
	stack = pushStackFrame([name], [value], stack);
	return rippleEval(expr[2], stack);
}

function ripEvalFunction(expr: any, stack: any[]): any {
	assertArity("Function expression", 2, expr.length);
	return new RipLambda(expr[0].map(getSymbolName), expr[1], stack);
}

function ripApply(ast: any, stack: any[]): any {
	var all = ast.map(x => rippleEval(x, stack));
	var first = all[0];
	var rest = all.slice(1);

	if (isPrimitive(first)) {
		assertArity("Function", first.arity, rest.length);
		return first.f.call(null, rest);
	}

	if (isLambda(first)) {
		assertArity("Function", rest.length, first.args.length);
		stack = pushStackFrame(first.args, rest, stack);
		return rippleEval(first.body, stack);
	}

	throw new Error("First element in combo must be a function");
}

function rippleEval(expr: any, stack: any[] = []): any {
	if (isNull(expr)) { return null; }

	if (isArray(expr)) {
		if (expr.length === 0) { return null; }

		if (isSymbol(expr[0])) {
			var rest = expr.slice(1);

			switch (expr[0].id) {
				case "if":       return ripEvalIf      (rest, stack);
				case "and":      return ripEvalAnd     (rest, stack);
				case "or":       return ripEvalOr      (rest, stack);
				case "define":   return ripEvalDefine  (rest, stack);
				case "let":      return ripEvalLet     (rest, stack);
				case "function": return ripEvalFunction(rest, stack);
			}
		}

		return ripApply(expr, stack);
	}

	if (isSymbol(expr)) { return stackLookup(expr.id, stack); }

	return expr;
}
