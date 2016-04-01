
module ui {

    export function inline(): void {
        const inputText = $("#input-text");
        const ast = ripple.parseOneText(inputText.val());
        sub(ast, []);
        inputText.val(ripple.format(ast));
    }

    function sub(ast, ignores: string[]) {
        if (ripple.isArray(ast)) {
            for (let i = 0; i < ast.length; ++i) {
                if (ripple.isSymbol(ast[i]) // TODO: if it's a let, add symbol to ignore list for further recursions
                    && ignores.indexOf(ast[i].id) < 0
                    && ripple.defines.hasOwnProperty(ast[i].id)) {
                    ast[i] = ripple.defines[ast[i].id];
                } else {
                    sub(ast[i], ignores);
                }
            }
        }
    }

    export var history = [];
    export var entries = [];
    export var buffer = "";

    ripple.definePrimitive("log", 1, args => { buffer += args[0] + "\r\n"; return null; });

    function shallowClone(x) {
        return jQuery.extend({}, x);
    }

    function saveHistory(): void {
        history.push({
            defines: shallowClone(ripple.defines),
            entries: entries.slice(0),
            buffer: buffer
        });
    }

    export function undo(): void {
        if (history.length > 0) {
            var previous = history.pop();
            entries = previous.entries;
            ripple.defines = previous.defines;
            buffer = previous.buffer;
        }
        updateEntries();
        updateDefines();
        updateBuffer();
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
        entries.push(batch);
        updateEntries();
        updateDefines();
        updateBuffer();
    }

    export function updateBuffer(): void {
        $("#buffer-text").val(buffer);
    }

    function updateEntries(): void {
        const results = $("#results").empty();
        entries.forEach(batch => {
            batch = batch.map(x => x.status === "success"
                ? resultDiv(x.text, x.value)
                : errorDiv(x.text, x.error.toString()));
            results.prepend(batch.length === 1 ? batch[0] : batchDiv(batch));
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
        if (ripple.isArray(ast)) {
            const d = $("<div></div").addClass("combo combo-" + (depth % 4));
            ast.forEach(child => d.append(build(child, depth + 1)));
            return d;
        }

        atomCount++;
        return $("<div></div")
            .addClass("atom atom-" + (atomCount % 4))
            .text(ripple.format(ast));
    }
}