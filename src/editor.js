import "codemirror/lib/codemirror.css";
import "codemirror/theme/lucario.css";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/matchtags";
import "codemirror/addon/fold/xml-fold";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/hint/xml-hint";
import "codemirror/addon/selection/active-line";
import "codemirror/mode/xml/xml";

OCA.Books.Editor = (function() {
	var _cm = require("codemirror");
	var _editor = undefined;

	window.addEventListener("themechange", function(evt){
		_options.theme = evt.detail;
		if (_editor) {
			_editor.setOption("theme", evt.detail);
		}
	});

	var _completeAfter = function(ed, pred) {
		if (!pred || pred()) {
			setTimeout(function() {
				if (!ed.state.completionActive) {
					ed.showHint();
				}
			}, 100);
		}
		return _cm.Pass;
	};

	var _schemaOpf = {
		"!top": ["one"],
		one: {children: ["two","three"]},
		two: {children: []},
		three: {children: []}
	};

	var _options = {
		mode: "xml",
		lineNumbers: true,
		styleActiveLine: true,
		matchTags: true,
		autoCloseTags: true,
		extraKeys: {
			"'<'": _completeAfter,
			"Ctrl-Space": "autocomplete"
		},
		hintOptions: {
			completeSingle: false,
			schemaInfo: _schemaOpf
		},
		theme: "default"
	};

	return {
		init: function(selector) {
			if (_editor === undefined) {
				_editor = _cm.fromTextArea(document.querySelector(selector), _options);
				_editor.refresh();
			}
		},

		close: function() {
			if (_editor) {
				_editor.toTextArea();
				_editor = undefined;
			}
		},

		setValue: function(content) {
			if (_editor) {
				_editor.setValue(content);
			}
		}
	};
})();
