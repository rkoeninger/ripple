
var defines = {
	"+": functionValue(function (args) { return numberValue(args[0].value + args[1].value); }),
	"log": functionValue(function(args) { console.log(args[0].value); return nullValue; })
};

function equalsSymbol(val, sym) {
	return val && val.kind === "symbol" && val.value === sym;
}

function getSymbolName(val) {
	if (val && val.kind === "symbol") {
		return val.value;
	}

	throw new Error("Not a symbol");
}

function isTruthy(val) {
	return !(val === null || val.kind === "null" || (val.kind === "boolean" && val.value === false));
}

function rippleEval(ast) {
	if (ast === null) {
		return null;
	}

	if (Object.prototype.toString.call(ast) === "[object Array]") {
		if (ast.length === 0) {
			return null;
		}

		if (equalsSymbol(ast[0], "if")) {
			var condition = ast[1];
			var consequent = ast[2];
			var alternative = ast[3];
			var result = isTruthy(rippleEval(condition)) ? consequent : alternative
			return rippleEval(result);
		} else if (equalsSymbol(ast[0], "define")) {
			var name = getSymbolName(ast[1]);
			var value = rippleEval(ast[2])
			defines[name] = value;
			return value;
		}

		var evaledF = rippleEval(ast[0]);
		var evaledArgs = [];

		for (var i = 1; i < ast.length; ++i) {
			evaledArgs.push(rippleEval(ast[i]));
		}

		if (evaledF.kind !== "function") {
			throw new Error("First element in combo must be a function");
		}

		return evaledF.value.call(null, evaledArgs);
	}

	if (ast.kind === "symbol") {
		if (defines.hasOwnProperty(ast.value)) {
			return defines[ast.value];
		}

		throw new Error("Unrecognized symbol");
	}

	return ast;
}