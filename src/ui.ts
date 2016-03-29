
module ui {

    export function runIt() {
        const text = $("#input-text").val();
        const asts = ripple.parseAllText(text);

        if (asts.length === 0) {
            return;
        }

        const batch = asts.map(ast => {
            const syntax = ripple.format(ast);
            try {
                return resultDiv(syntax, ripple.format(ripple.eval(ast)));
            } catch (e) {
                console.error(e);
                return errorDiv(syntax, e.toString());
            }
        });
        $("#results").prepend(batch.length === 1 ? batch[0] : batchDiv(batch));
        updateDefines();
    }

    function batchDiv(results) {
        const batch = $("<div></div>").addClass("result-batch");
        results.forEach(r => batch.append(r));
        return batch;
    }

    function resultDiv(expr: string, res: string) {
        return $("<div></div>")
            .addClass("result")
            .append($("<div></div>").addClass("input-expr").text(expr))
            .append($("<div></div>").addClass("output-value").text(res))
            .click(() => $("#input-text").val(expr));
    }

    function errorDiv(expr: string, res: string) {
        return $("<div></div>")
            .addClass("error-result")
            .append($("<div></div>").addClass("input-expr").text(expr))
            .append($("<div></div>").addClass("error-message").text(res))
            .click(() => $("#input-text").val(expr));
    }

    function updateDefines() {
        const definesDiv = $("#defines").empty();
        const defineIds = Object.keys(ripple.defines)
            .filter(key => ripple.defines.hasOwnProperty(key) && !(ripple.isPrimitive(ripple.defines[key])))
            .sort()
            .forEach(key => definesDiv.append(defineDiv(key, ripple.format(ripple.defines[key]))));
    }

    function defineDiv(name: string, value: string) {
        return $("<div></div>").addClass("define")
            .append($("<div></div>").addClass("define-name").text(name))
            .append($("<div></div>").addClass("define-value").text(value));
    }

    export function buildIt() {
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

    function build(ast: any, depth: number) {
        if (ripple.isArray(ast)) {
            const d = buildDiv("combo combo-" + (depth % 4));
            ast.forEach(child => d.append(build(child, depth + 1)));
            return d;
        }

        atomCount++;
        return buildDiv("atom atom-" + (atomCount % 4))
            .text(ripple.format(ast));
    }

    function buildDiv(className?: string) {
        return $("<div></div").addClass(className);
    }
}