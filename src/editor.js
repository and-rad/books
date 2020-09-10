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

	var _completeInTag = function(ed) {
		return _completeAfter(ed, function() {
			let tok = ed.getTokenAt(ed.getCursor());
			if (tok.type == "string" && (!/['"]/.test(tok.string.charAt(tok.string.length - 1)) || tok.string.length == 1)) {
				return false;
			}
			return _cm.innerMode(ed.getMode(), tok.state).state.tagName;
		});
	};

	var _schemaOpf = {
		"!top": ["package"],
		package: {
			attrs: {
				"unique-identifier": null,
				version: ["2.0", "3.0"],
				dir: ["ltr", "rtl"],
				id: null,
				prefix: null,
				"xml:lang": null,
			},
			children: ["metadata","manifest", "spine", "guide", "collection"],
		},
		metadata: {
			children: ["dc:identifier", "dc:title", "dc:language", "dc:contributor", "dc:coverage", "dc:creator", "dc:date", "dc:description", "dc:format", "dc:publisher", "dc:relation", "dc:rights", "dc:source", "dc:subject", "dc:type", "meta", "link"],
		},
		manifest: {
			attrs: {
				id: null,
			},
			children: ["item"],
		},
		spine: {
			attrs: {
				id: null,
				"page-progression-direction": ["default", "ltr", "rtl"],
				toc: ["ncx"],
			},
			children: ["itemref"],
		},
		guide: {
			children: ["reference"],
		},
		collection: {
			attrs: {
				role: null,
				dir: ["ltr", "rtl"],
				id: null,
				"xml:lang": null,
			},
			children: ["metadata", "collection", "link"],
		},
	};

	var _options = {
		mode: "xml",
		lineNumbers: true,
		styleActiveLine: true,
		matchTags: true,
		autoCloseTags: true,
		tabSize: 2,
		extraKeys: {
			"'<'": _completeAfter,
			"' '": _completeInTag,
			"'='": _completeInTag,
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
