
function equalsSymbol(val, sym) {
	return val && val.kind === "symbol" && val.value === sym;
}

function rippleEval(ast) {
	if (Object.prototype.toString.call(ast) === "[object Array]") {
		if (equalsSymbol(ast[0], "if")) {
			return "special form";
		}

		if (equalsSymbol(ast[0], "+")) {
			return "builtin function";
		}

		return "user function";
	}

	return ast;
}