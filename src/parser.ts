
class Source {
	text: string;
	pos: number;
	constructor(text: string) {
		this.text = text;
		this.pos = 0;
	}
}

var comboEnd = new Object();

function isDone(source: Source) {
	return source.text.length <= source.pos;
}

function current(source: Source) {
	return isDone(source) ? null : source.text.charAt(source.pos);
}

function skipOne(source: Source) {
	source.pos++;
}

function skipWhiteSpace(source: Source) {
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

	return stringValue(stringLiteral);
}

function readLiteral(source: Source) {
	var unparsedLiteral = "";

	while (current(source) && current(source) !== ')' && current(source) !== '(' && /\S/.test(current(source))) {
		unparsedLiteral = unparsedLiteral + current(source);
		skipOne(source);
	}

	if (/^\d/.test(unparsedLiteral)) {
		return numberValue(parseFloat(unparsedLiteral));
	} else if (unparsedLiteral.toLowerCase() === "false") {
		return falseValue;
	} else if (unparsedLiteral.toLowerCase() === "true") {
		return trueValue;
	} else if (unparsedLiteral.toLowerCase() === "null") {
		return nullValue;
	}

	return symbolValue(unparsedLiteral);
}

function parseOne(source: Source) {
	skipWhiteSpace(source);

	if (isDone(source)) {
		throw new Error("Unexpected end of file");
	}

	switch (current(source)) {
		case '(':
			skipOne(source); // Skip over '('
			var children = [];

			for (var child = parseOne(source); child != comboEnd; child = parseOne(source))
			{
				children.push(child);
			}

			return children;
		case ')':
			skipOne(source); // Skip over ')'
			return comboEnd;
		case '\"':
			skipOne(source); // Skip over opening '\"'
			return readStringLiteral(source);
		default:
			return readLiteral(source);
	}
}

function parseAll(text: string) {
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

function printAst(ast) {
	if (Object.prototype.toString.call(ast) === "[object Array]") {
		var result = "(";

		if (ast.length > 0) {
			result = result + printAst(ast[0]);
		}

		for (var i = 1; i < ast.length; ++i) {
			result = result + " " + printAst(ast[i]);
		}

		return result + ")";
	} else if (ast.kind === "null") {
		return "()";
	} else if (ast.kind === "boolean") {
		return ast.value.toString();
	} else if (ast.kind === "number") {
		return ast.value.toString();
	} else if (ast.kind === "string") {
		return '"' + ast.value + '"'; // TODO: need to escape chars
	} else if (ast.kind === "symbol") {
		return ast.value;
	}
}
