if (!OCA.Books) {
	OCA.Books = {};
}

OCA.Books.Core = {
	init: function() {
		this.initControls();
	},

	initControls: function() {
		document.querySelector("#settings-item-scan").addEventListener("click", function() {
			OCA.Books.Backend.scan(document.querySelector("#path-settings").value);
		});
		document.querySelector("#settings-item-reset").addEventListener("click", function() {
			OCA.Books.Backend.reset();
		});
	}
};

OCA.Books.Backend = {
	get: function(uri, callback) {
		let xhr = new XMLHttpRequest();
		xhr.addEventListener("load", callback);
		xhr.open("GET", uri);
		xhr.setRequestHeader("requesttoken", OC.requestToken);
		xhr.send();
	},

	post: function(uri, data, callback) {
		let xhr = new XMLHttpRequest();
		xhr.addEventListener("load", callback);
		xhr.open("POST", uri);
		xhr.setRequestHeader("requesttoken", OC.requestToken);
		xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xhr.send(data);
	},

	scan: function(dir) {
		let data = `dir=${dir}`;
		this.post(OC.generateUrl("apps/books/api/0.1/scan"), data, function() {
			console.log(JSON.parse(this.response));
		});
	},

	reset: function() {
		this.post(OC.generateUrl("apps/books/api/0.1/reset"), "", function() {
			console.log(JSON.parse(this.response));
		});
	}
};

document.addEventListener('DOMContentLoaded', function () {
	OCA.Books.Core.init();
});