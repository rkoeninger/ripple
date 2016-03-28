
module ui {

    export function parseIt() {
        var text = $("#input-text").val();
        console.log(ripple.parseAllText(text));
    }

    export function runIt() {
        var text = $("#input-text").val();
        var asts = ripple.parseAllText(text);
        var batch = [];
        for (var i = 0; i < asts.length; ++i) {
            var result;
            try {
                result = resultDiv(ripple.formatAst(asts[i]), ripple.formatAst(ripple.rippleEval(asts[i])));
            } catch (e) {
                result = errorDiv(ripple.formatAst(asts[i]), e.toString());
            }
            batch.push(result);
        }
        if (batch.length === 1) {
            $("#results").prepend(batch[0]);
        } else if (batch.length > 0) {
            $("#results").prepend(batchDiv(batch));
        }
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
        var defineIds = [];

        for (var key in ripple.defines) {
            if (ripple.defines.hasOwnProperty(key) && !(ripple.isPrimitive(ripple.defines[key]))) {
                defineIds.push(key);
            }
        }

        defineIds.sort();
        defineIds.forEach(key => definesDiv.append(defineDiv(key, ripple.formatAst(ripple.defines[key]))));
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

            for (var i = 0; i < ast.length; ++i) {
                d.appendChild(build(ast[i], depth + 1));
            }

            return d;
        }

        atomCount++;
        var b = buildDiv("atom atom-" + (atomCount % 4));
        b.innerHTML = ripple.formatAst(ast);
        return b;
    }

    function buildDiv(className: string) {
        var d = document.createElement("div");
        if (className) {
            d.className = className;
        }
        return d;
    }
}