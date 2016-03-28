
module ui {

    export function runIt() {
        var text = $("#input-text").val();
        var asts = ripple.parseAllText(text);

        if (asts.length === 0) { return; }

        var batch = asts.map(ast => {
            var syntax = ripple.format(ast);
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
        var batch = $("<div></div>").addClass("result-batch");
        results.forEach(r => batch.append(r));
        return batch;
    }

    function resultDiv(expr: string, res: string) {
        var input = $("<div></div>")
            .addClass("input-expr")
            .text(expr);
        var output = $("<div></div>")
            .addClass("output-value")
            .text(res);
        var result = $("<div></div>")
            .addClass("result")
            .append(input)
            .append(output)
            .click(function() {
                $("#input-text").val(expr);
            });
        return result;
    }

    function errorDiv(expr: string, res: string) {
        var input = $("<div></div>")
            .addClass("input-expr")
            .text(expr);
        var output = $("<div></div>")
            .addClass("error-message")
            .text(res);
        var result = $("<div></div>")
            .addClass("error-result")
            .append(input)
            .append(output)
            .click(function() {
                $("#input-text").val(expr);
            });
        return result;
    }

    function updateDefines() {
        var definesDiv = $("#defines").empty();
        var defineIds = Object.keys(ripple.defines)
            .filter(key => ripple.defines.hasOwnProperty(key) && !(ripple.isPrimitive(ripple.defines[key])));
        defineIds.sort();
        defineIds.forEach(key => definesDiv.append(defineDiv(key, ripple.format(ripple.defines[key]))));
    }

    function defineDiv(name: string, value) {
        var nmDiv = $("<div></div>").addClass("define-name").text(name);
        var valDiv = $("<div></div>").addClass("define-value").text(value);
        var define = $("<div></div>").addClass("define").append(nmDiv).append(valDiv);
        return define;
    }

    export function buildIt() {
        var text = $("#input-text").val();
        var asts = ripple.parseAllText(text);
        var artifact = $("#artifact");
        artifact.empty();
        if (asts.length > 0) {
            var ast = asts[0];
            atomCount = 0;
            artifact.append($(build(ast, 0)));
        }
    }

    var atomCount = 0;

    function build(ast, depth: number) {
        if (ripple.isArray(ast)) {
            var d = buildDiv("combo combo-" + (depth % 4));
            ast.forEach(child => d.appendChild(build(child, depth + 1)));
            return d;
        }

        atomCount++;
        var b = buildDiv("atom atom-" + (atomCount % 4));
        b.innerHTML = ripple.format(ast);
        return b;
    }

    function buildDiv(className?: string) {
        var d = document.createElement("div");
        if (className) {
            d.className = className;
        }
        return d;
    }
}