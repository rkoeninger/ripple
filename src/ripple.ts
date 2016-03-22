
class RipSymbol {
	id: string;
	constructor(id: string) {
		this.id = id;
	}
	toString() {
		return this.id;
	}
}

class RipLambda {
	args: string[];
	body: any;
	constructor(args: string[], body: any) {
		this.args = args;
		this.body = body;
	}
	toString() {
		var fullAst = [
			new RipSymbol("function"),
			this.args.map(x => new RipSymbol(x)),
			this.body
		];
		return formatAst(fullAst);
	}
}

class RipPrimitive {
	arity: number;
	f: (any) => any;
	constructor(arity: number, f: (any) => any) {
		this.arity = arity;
		this.f = f;
	}
	toString() {
		return "<Primitive/" + this.arity + ">";
	}
}

function isUndefined(x) {
	return typeof x === "undefined";
}

function isNull(x) {
	return typeof x === null;
}

function isBoolean(x) {
	return typeof x === "boolean";
}

function isFalsy(val) {
	return val === null || val.value === false;
}

function isTruthy(val) {
	return !isFalsy(val);
}

function isNumber(x) {
	return typeof x === "number"
}

function isString(x) {
	return typeof x === "string"
}

function isSymbol(x) {
	return x instanceof RipSymbol;
}

function isPrimitive(x) {
	return x instanceof RipPrimitive;
}

function isLambda(x) {
	return x instanceof RipLambda;
}

function isArray(x) {
	return Object.prototype.toString.call(x) === "[object Array]";
}

class Source {
	text: string;
	pos: number;
	constructor(text: string) {
		this.text = text;
		this.pos = 0;
	}
}

function isDone(source: Source): boolean {
	return source.text.length <= source.pos;
}

function current(source: Source): any {
	return isDone(source) ? null : source.text.charAt(source.pos);
}

function skipOne(source: Source): void {
	source.pos++;
}

function skipWhiteSpace(source: Source): void {
	while (!isDone(source) && /\s/.test(current(source))) {
		skipOne(source);
	}
}

function readStringLiteral(source: Source) {
	var stringLiteral = "";

	while (current(source) && current(source) !== '\"') {
		// TODO: does not handle escape chars
		stringLiteral = stringLiteral + current(source);
		skipOne(source);
	}

	skipOne(source); // Skip over closing '\"'

	return stringLiteral;
}

function readLiteral(source: Source): any {
	var unparsedLiteral = "";

	while (current(source) && current(source) !== ')' && current(source) !== '(' && /\S/.test(current(source))) {
		unparsedLiteral = unparsedLiteral + current(source);
		skipOne(source);
	}

	if (/^\d/.test(unparsedLiteral)) {
		return parseFloat(unparsedLiteral);
	} else if (unparsedLiteral.toLowerCase() === "false") {
		return false;
	} else if (unparsedLiteral.toLowerCase() === "true") {
		return true;
	} else if (unparsedLiteral.toLowerCase() === "null") {
		return null;
	}

	return new RipSymbol(unparsedLiteral);
}

function parseOne(source: Source): any {
	skipWhiteSpace(source);

	if (isDone(source)) {
		throw new Error("Unexpected end of file");
	}

	switch (current(source)) {
		case '(':
			skipOne(source); // Skip over '('
			var children = [];

			for (var child = parseOne(source); ! isUndefined(child); child = parseOne(source)) {
				children.push(child);
			}

			return children;
		case ')':
			skipOne(source); // Skip over ')'
			return undefined;
		case '\"':
			skipOne(source); // Skip over opening '\"'
			return readStringLiteral(source);
		default:
			return readLiteral(source);
	}
}

function parseAll(text: string): any {
	var source = new Source(text);
	var result = [];

	while (true) {
		skipWhiteSpace(source);

		if (isDone(source)) {
			return result;
		}

		result.push(parseOne(source));
	}
}

function formatAst(ast: any): any {
	if (isArray(ast)) {
		return "(" + ast.map(formatAst).join(" ") + ")";
	} else if (isNull(ast)) {
		return "()";
	} else {
		return ast.toString();
	}
}

var defines = {};

function define(id: string, value: any) {
	defines[id] = value;
}

function definePrimitive(id: string, arity: number, f: (any) => any) {
	define(id, new RipPrimitive(arity, f));
}

definePrimitive("+", 2, args => args[0] + args[1]);
definePrimitive("-", 2, args => args[0] - args[1]);
definePrimitive("*", 2, args => args[0] * args[1]);
definePrimitive("/", 2, args => args[0] / args[1]);
definePrimitive("<", 2, args => args[0] < args[1]);
definePrimitive(">", 2, args => args[0] > args[1]);
definePrimitive("<=", 2, args => args[0] <= args[1]);
definePrimitive(">=", 2, args => args[0] >= args[1]);
definePrimitive("not", 1, args => !args[0]);
definePrimitive("concat", 2, args => (args[0] || "null").toString() + (args[1] || "null").toString());
definePrimitive("log", 1, args => console.log(args[0]));

function getSymbolName(val) {
	if (isSymbol(val)) {
		return val.id;
	}

	throw new Error("Not a symbol");
}

function stackLookup(id, stack) {
	for (var m = stack.length - 1; m >= 0; --m) {
		if (stack[m].hasOwnProperty(id)) {
			return stack[m][id];
		}
	}

	if (defines.hasOwnProperty(id)) {
		return defines[id];
	}

	throw new Error("Unrecognized symbol");
}

function ripEvalIf(expr, stack) {
	var conditionResult = isTruthy(rippleEval(expr, stack));
	var consequent = conditionResult ? expr[2] : expr[3];
	return rippleEval(consequent, stack);
}

function ripEvalAnd(expr, stack) {
	var leftResult = isTruthy(rippleEval(expr[1], stack));
	return leftResult ? rippleEval(expr[2], stack) : false;
}

function ripEvalOr(expr, stack) {
	var leftResult = isTruthy(rippleEval(expr[1], stack));
	return leftResult ? true : rippleEval(expr[2], stack);
}

function ripEvalDefine(expr, stack) {
	var id = getSymbolName(expr[1]);
	var value = rippleEval(expr[2], stack);
	define(id, value);
	return value;
}

function ripEvalLet(expr, stack) {
	var name = getSymbolName(expr[1]);
	var value = rippleEval(expr[2], stack);
	var newLocals = stack.slice(0);
	var frame = {};
	frame[name] = value;
	newLocals.push(frame);
	return rippleEval(expr[3], newLocals);
}

function ripEvalFunction(expr, stack) {
	var argExpr = expr[1];
	var argNames = [];
	for (var j = 0; j < expr[1].length; ++j) {
		argNames[j] = getSymbolName(argExpr[j]);
	}
	var bodyExpr = expr[2];
	return new RipLambda(argNames, bodyExpr);
}

function specialForm(id: string) {
	switch (id) {
		case "if":       return ripEvalIf;
		case "and":      return ripEvalAnd;
		case "or":       return ripEvalOr;
		case "define":   return ripEvalDefine;
		case "let":      return ripEvalLet;
		case "function": return ripEvalFunction;
		default:         return undefined;
	}
}

function ripApply(ast, stack) {
	var evaledF = rippleEval(ast[0], stack);
	var evaledArgs = [];

	for (var i = 1; i < ast.length; ++i) {
		evaledArgs.push(rippleEval(ast[i], stack));
	}

	if (isPrimitive(evaledF)) {
		if (evaledArgs.length !== evaledF.arity) {
			throw new Error("function takes " + evaledF.arity + " args, but given " + evaledArgs.length);
		}

		return evaledF.f.call(null, evaledArgs);
	}
	else if (isLambda(evaledF)) {
		if (evaledArgs.length !== evaledF.args.length) {
			throw new Error("function takes " + evaledF.args.length + " args, but given " + evaledArgs.length);
		}

		var argNames = evaledF.args;
		var newLocals = stack.slice(0);
		var frame = {};
		for (var k = 0; k < argNames.length; ++k) {
			frame[argNames[k]] = evaledArgs[k];
		}
		newLocals.push(frame);
		return rippleEval(evaledF.body, newLocals);
	} else {
		throw new Error("First element in combo must be a function");
	}
}

function rippleEval(expr: any, stack: any[]): any {
	if (isNull(stack) || isUndefined(stack)) { stack = []; }

	if (isNull(expr)) { return null; }

	if (isArray(expr)) {
		if (expr.length === 0) { return null; }

		if (isSymbol(expr[0])) {
			var evalSpecial = specialForm(expr[0].id);

			if (! isUndefined(evalSpecial)) { return evalSpecial(expr, stack); }
		}

		return ripApply(expr, stack);
	}

	if (isSymbol(expr)) { return stackLookup(expr.id, stack); }

	return expr;
}
