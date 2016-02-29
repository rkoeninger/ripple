
class Value {
	kind: string;
	value;
	constructor(kind: string, value) {
		this.kind = kind;
		this.value = value;
	}
}

var nullValue = new Value("null", null);

function stringValue(s: string) {
	return new Value("string", s);
}

var trueValue = new Value("boolean", true);
var falseValue = new Value("boolean", false);

function booleanValue(b: boolean) {
	return b ? trueValue : falseValue;
}

function numberValue(n: number) {
	return new Value("number", n);
}

function symbolValue(s: string) {
	return new Value("symbol", s);
}

function functionValue(f) {
	return new Value("function", f);
}

function asString(v) {
	if (v.kind === "null") {
		return "null";
	} else if (v.kind === "string") {
		return v.value;
	} else if (v.kind === "number") {
		return v.value.toString();
	} else if (v.kind === "boolean") {
		return '"' + v.value.toString() + '"';
	} else if (v.kind === "symbol") {
		return v.value;
	} else if (v.kind === "function") {
		return "<function>";
	}

	return "unknown";
}
