if (!OCA.Books) {
	OCA.Books = {};
}

OCA.Books.Core = (function() {
	var _rendition = undefined;
	var _updateHandle = undefined;

	var _close = function() {
		if (_rendition) {
			_rendition.destroy();
		}
		OCA.Books.UI.closeReader();
		OCA.Books.UI.refreshProgress(0);
	};

	var _nextPage = function() {
		if (_rendition) {
			_rendition.next().then(function(){ _updateProgress(); });
		}
	};

	var _previousPage = function() {
		if (_rendition) {
			_rendition.prev().then(function(){ _updateProgress(); });
		}
	};

	var _updateProgress = function() {
		clearTimeout(_updateHandle);

		_updateHandle = setTimeout(function() {
			let cfi = _rendition.location.start.cfi;
			let progress = _rendition.book.locations.percentageFromCfi(cfi);
			OCA.Books.UI.refreshProgress(progress);
		}, 500);
	};

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

			document.querySelector("#reader-prev").addEventListener("click", function(){
				_previousPage();
			});

			document.querySelector("#reader-next").addEventListener("click", function(){
				_nextPage();
			});

			document.querySelector("#reader-close").addEventListener("click", function(){
				_close();
			});

			let cols = document.querySelectorAll("th.sort");
			for (let i = 0, col; col = cols[i]; i++) {
				col.addEventListener("click", function(evt) {
					OCA.Books.UI.sortShelf(evt.target.dataset.sort);
				});
			}
		},

		initLibrary: function() {
			OCA.Books.Backend.getConfig(function(obj) {
				document.querySelector("#path-settings").value = obj.library;
			});
			OCA.Books.Backend.getBooks(function(obj) {
				if (obj.success) {
					OCA.Books.UI.buildShelf(obj.data);
				}
			});
		},

		open: function(id, elem) {
			_close();
			OCA.Books.Backend.getLocation(id, function(obj) {
				if (obj.success) {
					_book = ePub(obj.data, { replacements: "blobUrl", openAs: "epub" });
					_book.ready.then(function(){
						_book.locations.generate(1000);
						_rendition = _book.renderTo(elem, { width: "100%", height: "100%" });
						_rendition.display();
						OCA.Books.UI.openReader();
					});
				}
			});
		}
	};
})();

OCA.Books.UI = (function() {
	var _sortBy = "title";
	var _sortAsc = true;

	var _refreshMore = function(objs, field) {
		let more = field.querySelector(".more");
		if (objs.length > 1) {
			more.style.display = "inline-block";
			more.textContent = `+${objs.length-1}`;
		} else {
			more.style.display = "none";
		}
	};

	var _sortShelf = function(cat, toggle) {
		_sortBy = cat;

		if (toggle) {
			if (document.querySelector(`#app-content th.${_sortBy} > span:not(.hidden)`)) {
				_sortAsc = !_sortAsc;
			}
		}

		let heads = document.querySelectorAll("#app-content th.sort");
		for (let i = 0, head; head = heads[i]; i++) {
			if (head.classList.contains(_sortBy)) {
				head.firstElementChild.classList.remove("hidden");
			} else {
				head.firstElementChild.classList.add("hidden");
			}

			if (_sortAsc) {
				head.firstElementChild.classList.remove("icon-triangle-s");
				head.firstElementChild.classList.add("icon-triangle-n");
			} else {
				head.firstElementChild.classList.remove("icon-triangle-n");
				head.firstElementChild.classList.add("icon-triangle-s");
			}
		}

		let locale = document.documentElement.dataset.locale || "en";
		let body = document.querySelector("#app-content tbody");
		let tr = Array.from(body.querySelectorAll('tr'));
		tr.sort(function(a, b){ return _sort(a, b, locale); });
		tr.forEach(t => {body.appendChild(t)});
	};

	var _sort = function(tr1, tr2, loc) {
		let text1 = tr1.querySelector(`.${_sortBy}`).dataset.fileAs;
		let text2 = tr2.querySelector(`.${_sortBy}`).dataset.fileAs;
		let out = text1.localeCompare(text2, loc, {numeric: true});
		if (!_sortAsc) out *= -1;
		return out;
	};

	var _onItemClicked = function(evt) {
		let id = evt.target.closest("tr").dataset.id;
		OCA.Books.Core.open(id, "reader");
	};

	return {
		buildShelf: function(books) {
			let frag = document.createDocumentFragment();
			let tpl = document.createElement("tr");
			tpl.innerHTML = document.querySelector("#template-shelf-item").innerHTML;

			for (let i = 0, book; book = books[i]; i++) {
				let item = tpl.cloneNode(true);
				let fields = item.querySelectorAll(".field");
				item.dataset.id = book.id;
				item.className = "app-shelf-item";

				if (book.hasCover) {
					let url = `url("${OC.generateUrl("apps/books/api/0.1/cover")}/${book.id}")`;
					fields[0].firstElementChild.style.backgroundImage = url;
				} else {
					fields[0].querySelector(".placeholder").textContent = book.titles[0].fileAs.substring(0,2);
				}

				fields[1].querySelector(".title-1").textContent = book.titles[0].name;
				fields[1].dataset.fileAs = book.titles[0].fileAs;
				fields[1].addEventListener("click", _onItemClicked);
				if (book.series) {
					let series = book.series[0];
					fields[1].dataset.fileAs = `${series.fileAs}${series.pos}`;
					fields[1].querySelector(".title-2").textContent = `${series.name} ${series.pos}`;
				}

				if (book.authors) {
					fields[0].firstElementChild.style.backgroundColor = book.authors[0].color;
					fields[2].dataset.fileAs = book.authors[0].fileAs;
					fields[2].querySelector(".author-1").textContent = book.authors[0].name;
					_refreshMore(book.authors,fields[2]);
				}

				if (book.genres) {
					fields[3].dataset.fileAs = book.genres[0];
					fields[3].querySelector(".genre-1").textContent = book.genres[0];
					_refreshMore(book.genres,fields[3]);
				}

				let lang = t("books", book.languages[0]);
				fields[4].dataset.fileAs = lang;
				fields[4].querySelector(".lang-1").textContent = lang;
				_refreshMore(book.languages, fields[4]);

				frag.appendChild(item);
			}

			let shelf = document.querySelector("#app-shelf-body");
			shelf.textContent = "";
			shelf.appendChild(frag);
			_sortShelf(_sortBy);
		},

		sortShelf: function(category) {
			_sortShelf(category, true);
		},

		openReader: function() {
			document.querySelector("#app").classList.add("reader");
		},

		closeReader: function() {
			document.querySelector("#app").classList.remove("reader");
		},

		refreshProgress: function(val) {
			val *= 100;
			let handle = document.querySelector("#reader-progress-handle");
			let overlay = document.querySelector("#reader-progress-overlay");
			handle.style.left = `calc(${val}% - 6px)`;
			overlay.style.width = `${val}%`;
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

		getLocation: function(id, callback) {
			this.get(OC.generateUrl("apps/books/api/0.1/loc/"+id), function() {
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