if (!OCA.Books) {
	OCA.Books = {};
}

OCA.Books.Core = {
	init: function() {
		this.initControls();
		this.initLibrary();
	},

	initControls: function() {
		document.querySelector("#settings-item-scan").addEventListener("click", function() {
			OCA.Books.Backend.scan(document.querySelector("#path-settings").value, function(obj) {
				console.log(obj);
			});
		});
		document.querySelector("#settings-item-reset").addEventListener("click", function() {
			OCA.Books.Backend.reset(function(obj) {
				console.log(obj);
			});
		});
	},

	initLibrary: function() {
		OCA.Books.Backend.getBooks(function(obj) {
			console.log(obj);
			OCA.Books.UI.buildShelf(obj.data);
		});
	}
};

OCA.Books.UI = {
	buildShelf: function(books) {
		let frag = document.createDocumentFragment();
		let tpl = document.createElement("tr");
		tpl.innerHTML = document.querySelector("#template-shelf-item").innerHTML;

		for (let i = 0, book; book = books[i]; i++) {
			let item = tpl.cloneNode(true);
			item.dataset.id = book.id;
			item.className = "app-shelf-item";

			let fields = item.querySelectorAll(".field");
			//fields[0].firstChild.style.backgroundImage = 'url("/apps/books/img/app.svg")';
			fields[0].firstElementChild.style.backgroundColor = "#"+((1<<24)*Math.random()|0).toString(16);
			fields[0].querySelector(".placeholder").textContent = book.titles[0].substring(0,2);
			fields[1].firstElementChild.textContent = book.titles[0];
			fields[1].lastElementChild.textContent = (book.titles.length > 1) ? book.titles[1] : "";
			fields[2].textContent = "TODO";
			fields[3].textContent = "TODO";
			fields[4].textContent = book.languages[0];

			frag.appendChild(item);
		}

		let shelf = document.querySelector("#app-shelf-body");
		shelf.textContent = "";
		shelf.appendChild(frag);
	}
};

/**
 * Books.Backend communicates with the server. All public functions
 * accept a callback function and pass the JSON-parsed response as
 * the first parameter to that function.
 */
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

	getBooks: function(callback) {
		this.get(OC.generateUrl("apps/books/api/0.1/books"), function() {
			callback(JSON.parse(this.response));
		});
	},

	scan: function(dir, callback) {
		let data = `dir=${dir}`;
		this.post(OC.generateUrl("apps/books/api/0.1/scan"), data, function() {
			callback(JSON.parse(this.response));
		});
	},

	reset: function(callback) {
		this.post(OC.generateUrl("apps/books/api/0.1/reset"), "", function() {
			callback(JSON.parse(this.response));
		});
	}
};

document.addEventListener("DOMContentLoaded", function () {
	OCA.Books.Core.init();
});