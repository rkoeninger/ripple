
var defines = {
	"+": primitiveFunction(function(args) { return numberValue(args[0].value + args[1].value); }),
	"*": primitiveFunction(function(args) { return numberValue(args[0].value * args[1].value); }),
	"-": primitiveFunction(function(args) { return numberValue(args[0].value - args[1].value); }),
	"/": primitiveFunction(function(args) { return numberValue(args[0].value / args[1].value); }),
	"not": primitiveFunction(function(args) { return booleanValue(!args[0].value); }),
	"concat": primitiveFunction(function(args) { return stringValue(args[0].value.toString() + args[1].value.toString()); }),
	"log": primitiveFunction(function(args) { console.log(args[0].value); return nullValue; })
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

function isFalsy(val) {
	return val === null || val.kind === "null" || (val.kind === "boolean" && val.value === false);
}

function isTruthy(val) {
	return !isFalsy(val);
}

function rippleEval(ast, locals) {
	if (locals === null || typeof locals === 'undefined') {
		locals = [];
	}

	if (ast === null) {
		return null;
	}

	if (Object.prototype.toString.call(ast) === "[object Array]") {
		var result, left, right, name, value, newLocals, frame;

		if (ast.length === 0) {
			return null;
		}

		if (ast[0] && ast[0].kind === "symbol")
		{
			switch (ast[0].value)
			{
				case "if":
					var condition = ast[1];
					var consequent = ast[2];
					var alternative = ast[3];
					result = isTruthy(rippleEval(condition, locals)) ? consequent : alternative
					return rippleEval(result, locals);
				case "and":
					left = ast[1];
					right = ast[2];
					result = isTruthy(rippleEval(left, locals)) ? isTruthy(rippleEval(right, locals)) : false;
					return booleanValue(result);
				case "or":
					left = ast[1];
					right = ast[2];
					result = isTruthy(rippleEval(left, locals)) ? true : isTruthy(rippleEval(right, locals));
					return booleanValue(result);
				case "define":
					name = getSymbolName(ast[1]);
					value = rippleEval(ast[2], locals);
					defines[name] = value;
					return value;
				case "let":
					name = getSymbolName(ast[1]);
					value = rippleEval(ast[2], locals);
					newLocals = locals.slice(0);
					frame = {};
					frame[name] = value;
					newLocals.push(frame);
					return rippleEval(ast[3], newLocals);
				case "function":
					var argExpr = ast[1];
					var argNames = [];
					for (var j = 0; j < ast[1].length; ++j) {
						argNames[j] = getSymbolName(argExpr[j]);
					}
					var bodyExpr = ast[2];
					return functionValue(function (args) {
						newLocals = locals.slice(0);
						frame = {};
						for (var k = 0; k < argNames.length; ++k) {
							frame[argNames[k]] = args[k];
						}
						newLocals.push(frame);
						return rippleEval(bodyExpr, newLocals);
					});
			}
		}

		var evaledF = rippleEval(ast[0], locals);
		var evaledArgs = [];

		for (var i = 1; i < ast.length; ++i) {
			evaledArgs.push(rippleEval(ast[i], locals));
		}

		if (evaledF.kind !== "function") {
			throw new Error("First element in combo must be a function");
		}

		return evaledF.value.call(null, evaledArgs);
	}

	if (ast.kind === "symbol") {
		for (var m = locals.length - 1; m >= 0; --m) {
			if (locals[m].hasOwnProperty(ast.value)) {
				return locals[m][ast.value];
			}
		}

		if (defines.hasOwnProperty(ast.value)) {
			return defines[ast.value];
		}

		throw new Error("Unrecognized symbol");
	}

	return ast;
}