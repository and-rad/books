if (!OCA.Books) {
	OCA.Books = {};
}

OCA.Books.Core = (function() {
	return {
		init: function() {
			this.initLibrary();
			this.initControls();
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
			OCA.Books.Backend.getConfig(function(obj) {
				document.querySelector("#path-settings").value = obj.library;
			});
			OCA.Books.Backend.getBooks(function(obj) {
				console.log(obj);
				OCA.Books.UI.buildShelf(obj.data);
			});
		}
	};
})();

OCA.Books.UI = (function() {
	return {
		buildShelf: function(books) {
			let frag = document.createDocumentFragment();
			let tpl = document.createElement("tr");
			tpl.innerHTML = document.querySelector("#template-shelf-item").innerHTML;

			for (let i = 0, book; book = books[i]; i++) {
				let item = tpl.cloneNode(true);
				item.dataset.id = book.id;
				item.className = "app-shelf-item";

				let fields = item.querySelectorAll(".field");
				fields[1].querySelector(".title-1").textContent = book.titles[0];
				fields[4].querySelector(".lang-1").textContent = t("books", book.languages[0]);

				if (book.hasCover) {
					let url = `url("${OC.generateUrl("apps/books/api/0.1/cover")}/${book.id}")`;
					fields[0].firstElementChild.style.backgroundImage = url;
				} else {
					fields[0].querySelector(".placeholder").textContent = book.titles[0].substring(0,2);
				}

				if (book.authors) {
					fields[0].firstElementChild.style.backgroundColor = book.authors[0].color;
					fields[2].querySelector(".author-1").textContent = book.authors[0].name;
				}

				if (book.series) {
					let series = book.series[0];
					fields[1].querySelector(".title-2").textContent = `${series.name} ${series.pos}`;
				}

				if (book.genres) {
					fields[3].querySelector(".genre-1").textContent = book.genres[0];
				}

				frag.appendChild(item);
			}

			let shelf = document.querySelector("#app-shelf-body");
			shelf.textContent = "";
			shelf.appendChild(frag);
		}
	};
})();

/**
 * Books.Backend communicates with the server. All public functions
 * accept a callback function and pass the JSON-parsed response as
 * the first parameter to that function.
 */
OCA.Books.Backend = (function() {
	return {
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

		getConfig: function(callback) {
			this.get(OC.generateUrl("apps/books/api/0.1/config"), function() {
				callback(JSON.parse(this.response));
			});
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
})();

document.addEventListener("DOMContentLoaded", function () {
	OCA.Books.Core.init();
});