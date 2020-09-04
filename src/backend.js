import { generateUrl } from "@nextcloud/router";

/**
 * Books.Backend communicates with the server. All public functions
 * accept a callback function and pass the JSON-parsed response as
 * the first parameter to that function.
 */
OCA.Books.Backend = (function() {
	var _get = function(uri, callback) {
		let xhr = new XMLHttpRequest();
		xhr.addEventListener("load", callback);
		xhr.open("GET", uri);
		xhr.setRequestHeader("requesttoken", oc_requesttoken);
		xhr.send();
	};

	var _post = function(uri, data, callback) {
		let xhr = new XMLHttpRequest();
		xhr.addEventListener("load", callback);
		xhr.open("POST", uri);
		xhr.setRequestHeader("requesttoken", oc_requesttoken);
		xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xhr.send(data);
	};

	return {
		getConfig: function(callback) {
			_get(generateUrl("apps/books/api/0.1/config"), function() {
				callback(JSON.parse(this.response));
			});
		},

		getBooks: function(callback) {
			_get(generateUrl("apps/books/api/0.1/books"), function() {
				callback(JSON.parse(this.response));
			});
		},

		getLocation: function(id, callback) {
			_get(generateUrl("apps/books/api/0.1/loc/"+id), function() {
				callback(JSON.parse(this.response));
			});
		},

		saveProgress: function(id, value, callback) {
			let data = `id=${id}&progress=${value}`;
			_post(generateUrl("apps/books/api/0.1/progress"), data, function() {
				callback(JSON.parse(this.response));
			});
		},

		scan: function(dir, callback) {
			let data = `dir=${dir}`;
			_post(generateUrl("apps/books/api/0.1/scan"), data, function() {
				callback(JSON.parse(this.response));
			});
		},

		reset: function(callback) {
			_post(generateUrl("apps/books/api/0.1/reset"), "", function() {
				callback(JSON.parse(this.response));
			});
		},

		coverUrl: function(id) {
			return `url("${generateUrl("apps/books/api/0.1/cover")}/${id}")`;
		}
	};
})();