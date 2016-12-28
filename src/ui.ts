
module ui {

    export function dump() {
        console.log(Object.keys(ripple.defines)
            .filter(x => ! ripple.isPrimitive(ripple.defines[x]))
            .map(x => ripple.format(ripple.Cons.of(new ripple.Symbol("def"), new ripple.Symbol(x), ripple.defines[x])))
            .join("\r\n\r\n"));
    }

    function repeatS(ch, n) {
        var s = "";
        for (let i = 0; i < n; ++i) {
            s += ch;
        }
        return s;
    }

    export function closeParens(): void {
        const inputText = $("#input-text");
        const text = inputText.val();

        var count = 0;

        for (let i = 0; i < text.length; ++i) {
            if (text[i] === '(') { count++; }
            else if (text[i] === ')') { count--; }
        }

        inputText.val(text + repeatS(')', count));
    }

    export function inline(): void {
        const inputText = $("#input-text");
        const ast = ripple.parseOneText(inputText.val());
        const inlinedAst = subExpr(ast, []);
        inputText.val(ripple.format(inlinedAst));
    }

    function subExpr(ast: ripple.RValue, ignores: string[]): ripple.RValue {
        if (ripple.isCons(ast)) {
            return ripple.Cons.map(ast, x => subExpr(x, ignores));
        } else if (ripple.isSymbol(ast)) {
            if (!(ast.id == "if" || ast.id == "def" || ast.id == "fn" || ast.id == "let")
               && ignores.indexOf(ast.id) < 0
               && ripple.defines.hasOwnProperty(ast.id)) {
                const val = ripple.defines[ast.id];
                if (! ripple.isPrimitive(val)) {
                    return val;
                }
            }
        }

        return ast;
    }

    export var files = {};
    export var history = [];
    export var entries = [];
    export var buffer = "";

    ripple.definePrimitive("log", 1, ([s]) => { buffer += s + "\r\n"; return null; });
    ripple.definePrimitive("slurp", 1, ([name]) => {
        if (ripple.isString(name)){
            if (files.hasOwnProperty(name)) {
                return files[name];
            }
    
            throw new Error("File not found");
        }

        throw new Error("Name must be a string");
    });
    ripple.definePrimitive("spit", 2, ([name, text]) => {
        if (ripple.isString(name)) {
            files[name] = text;
            return null;
        }

        throw new Error("Name must be a string");
    });

    function shallowClone(x) {
        return jQuery.extend({}, x);
    }

    function saveHistory(): void {
        history.push({
            defines: shallowClone(ripple.defines),
            entries: entries.slice(0),
            buffer: buffer,
            text: $("#input-text").val(),
            files: shallowClone(files)
        });
    }

    export function undo(): void {
        if (history.length > 0) {
            var previous = history.pop();
            entries = previous.entries;
            ripple.defines = previous.defines;
            buffer = previous.buffer;
            files = previous.files;
            $("#input-text").val(previous.text);
            updateEntries();
            updateDefines();
            updateBuffer();
            updateFiles();
        }
    }

    export function runIt(): void {
        saveHistory();
        const text = $("#input-text").val();
        const asts = ripple.parseAllText(text);

        if (asts.length === 0) {
            return;
        }

        const batch = asts.map(ast => {
            const syntax = ripple.format(ast);
            try {
                return { status: "success", text: syntax, value: ripple.format(ripple.eval(ast)) };
            } catch (e) {
                console.error(e);
                return { status: "error", text: syntax, error: e };
            }
        });
        entries.push({ results: batch, text: text });
        updateEntries();
        updateDefines();
        updateBuffer();
        updateFiles();
    }

    export function showFile(): void {
        const file = $("#file-select").val();
        $("#file-content").val(files[file]);
    }

    function updateFiles(): void {
        const selection = $("#file-select").val();
        const select = $("#file-select").empty();

        $.each(files, (name, content) => {
            select.append($("<option></option>").attr("value", name).text(name));
        });

        select.val(selection);
        $("#file-content").val(files[selection] ? files[selection] : "");
    }

    function updateBuffer(): void {
        $("#buffer-text").val(buffer);
    }

    function updateEntries(): void {
        const resultsDiv = $("#results").empty();
        entries.forEach(({results, text}) => {
            results = results.map(x => x.status === "success"
                ? resultDiv(x.text, x.value)
                : errorDiv(x.text, x.error.toString()));
            resultsDiv.prepend(results.length === 1 ? results[0] : batchDiv(results));
        });
    }

    function batchDiv(results): JQuery {
        const batch = $("<div></div>").addClass("result-batch");
        results.forEach(r => batch.append(r));
        return batch;
    }

    function resultDiv(expr: string, res: string): JQuery {
        return $("<div></div>")
            .addClass("result")
            .append($("<div></div>").addClass("input-expr").text(expr))
            .append($("<div></div>").addClass("output-value").text(res))
            .click(() => $("#input-text").val(expr));
    }

    function errorDiv(expr: string, res: string): JQuery {
        return $("<div></div>")
            .addClass("error-result")
            .append($("<div></div>").addClass("input-expr").text(expr))
            .append($("<div></div>").addClass("error-message").text(res))
            .click(() => $("#input-text").val(expr));
    }

    function updateDefines(): void {
        const definesDiv = $("#defines").empty();
        const defineIds = Object.keys(ripple.defines)
            .filter(key => ripple.defines.hasOwnProperty(key) && !(ripple.isPrimitive(ripple.defines[key])))
            .sort()
            .forEach(key => definesDiv.append(defineDiv(key, ripple.format(ripple.defines[key]))));
    }

    function defineDiv(name: string, value: string): JQuery {
        return $("<div></div>").addClass("define")
            .append($("<div></div>").addClass("define-name").text(name))
            .append($("<div></div>").addClass("define-value").text(value));
    }

    export function buildIt(): void {
        const text = $("#input-text").val();
        const asts = ripple.parseAllText(text);
        const artifact = $("#artifact");
        artifact.empty();
        if (asts.length > 0) {
            const ast = asts[0];
            atomCount = 0;
            artifact.append($(build(ast, 0)));
        }
    }

    var atomCount = 0;

    function build(ast: any, depth: number): JQuery {
        if (ripple.isCons(ast)) {
            const d = $("<div></div").addClass("combo combo-" + (depth % 4));
            ripple.Cons.toArray(ast).forEach(child => d.append(build(child, depth + 1)));
            return d;
        }

        atomCount++;
        return $("<div></div")
            .addClass("atom atom-" + (atomCount % 4))
            .text(ripple.format(ast));
    }
}