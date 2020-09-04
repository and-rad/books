if (!OCA.Books) {
	OCA.Books = {};
}

OCA.Books.Core = (function() {
	var _books = [];
	var _section = {};
	var _rendition = undefined;
	var _updateHandle = undefined;
	var _saveHandle = undefined;

	var _progress = function(id) {
		let book = _books.find(elem => elem.id == id);
		if (book && book.progress) {
			return book.progress;
		}
		return undefined;
	};

	var _updateProgressUI = function() {
		clearTimeout(_updateHandle);

		_updateHandle = setTimeout(function() {
			let cfi = _rendition.location.start.cfi;
			let progress = _rendition.book.locations.percentageFromCfi(cfi);
			OCA.Books.UI.refreshProgress(progress, _section.href);
		}, 250);
	};

	var _saveProgress = function() {
		clearTimeout(_saveHandle);

		_saveHandle = setTimeout(function() {
			let cfi = _rendition.location.start.cfi;
			if (_rendition.book.locations.percentageFromCfi(cfi) > 0) {
				let book = _books.find(elem => elem.id == _rendition.id);
				OCA.Books.Backend.saveProgress(_rendition.id, cfi, function(obj){
					if (obj.success) {
						let status = book.status;
						book.progress = cfi;
						book.status = book.status || 1;
						OCA.Books.UI.refreshStatus(_rendition.id, book.status, status);
					}
				});
			}
		}, 1000);
	};

	return {
		init: function() {
			window.addEventListener("bookstylechange", function(){
				if (_rendition) {
					_rendition.themes.default(OCA.Books.UI.Style.get());
				}
			});

			OCA.Books.Backend.getConfig(function(obj) {
				document.querySelector("#path-settings").value = obj.library;
			});
			OCA.Books.Backend.getBooks(function(obj) {
				if (obj.success) {
					_books = obj.data;
					OCA.Books.UI.buildShelf(_books);
					OCA.Books.UI.buildNavigation(_books);
				}
			});
			OCA.Books.UI.init();
		},

		open: function(id, elem) {
			this.close();
			OCA.Books.Backend.getLocation(id, function(obj) {
				if (obj.success) {
					OCA.Books.UI.openReader();
					OCA.Books.UI.showLoadingScreen();
					let book = ePub(obj.data, { replacements: "blobUrl", openAs: "epub" });
					book.loaded.navigation.then(OCA.Books.UI.buildTOC);
					book.ready.then(function(){
						book.locations.generate(1000).then(function(){
							OCA.Books.UI.hideLoadingScreen();

							let markers = [];
							book.spine.each(function(elem){
								let cfi = elem.cfiFromElement(elem.document);
								markers.push(book.locations.percentageFromCfi(cfi));
							});
							OCA.Books.UI.buildMarkers(markers);

							_rendition = book.renderTo(elem, { width: "100%", height: "100%" });
							_rendition.id = id;
							_rendition.themes.default(OCA.Books.UI.Style.get());
							_rendition.display(_progress(id));
							_rendition.on("relocated", function(){
								_updateProgressUI();
								_saveProgress();
							});
							_rendition.on("rendered", function(section){
								_section = section;
							});
						});
					});
				}
			});
		},

		close: function() {
			if (_rendition) {
				_rendition.destroy();
				_rendition = undefined;
				_section = {};
			}
			clearTimeout(_saveHandle);
			clearTimeout(_updateHandle);
			OCA.Books.UI.closeReader();
			OCA.Books.UI.refreshProgress(0);
		},

		nextPage: function() {
			if (_rendition) {
				_rendition.next();
			}
		},

		prevPage: function() {
			if (_rendition) {
				_rendition.prev();
			}
		},

		nextSection: function() {
			if (_rendition && _section) {
				_rendition.display((_section.next() || {}).href);
			}
		},

		prevSection: function() {
			if (_rendition && _section) {
				_rendition.display((_section.prev() || {}).href);
			}
		},

		toSection: function(href) {
			if (_rendition) {
				_rendition.display(href);
			}
		},

		toPercent: function(val) {
			if (_rendition) {
				let cfi = _rendition.book.locations.cfiFromPercentage(val);
				_rendition.display(cfi);
			}
		},

		getIds: function(key, value) {
			let match = [];

			if (key == "author") {
				match = _books.filter(b => b.authors !== undefined && b.authors.some(a => a.fileAs == value));
			} else if (key == "series") {
				match = _books.filter(b => b.series !== undefined && b.series.some(s => s.fileAs == value));
			} else if (key == "genre") {
				match = _books.filter(b => b.genres !== undefined && b.genres.includes(value));
			} else if (key == "status") {
				match = _books.filter(b => b.status == value);
			} else if (key == "shelf") {
				match = _books.filter(b => b.shelves !== undefined && b.shelves.includes(value));
			}

			return match.map(m => m.id);
		},

		getMeta: function(key) {
			let meta = [];

			if (key == "author") {
				meta = _books.filter(b => b.authors !== undefined).map(b => b.authors.map(a => [a.fileAs, a.name])).flat();
			} else if (key == "series") {
				meta = _books.filter(b => b.series !== undefined).map(b => b.series.map(s => [s.fileAs, s.name])).flat();
			} else if (key == "genre") {
				meta = _books.filter(b => b.genres !== undefined).map(b => b.genres.map(g => [g, g])).flat();
			} else if (key == "status") {
				meta = _books.map(b => [[b.status], t("books", `status-${b.status}`)]);
			} else if (key == "shelf") {
				meta = _books.filter(b => b.shelves !== undefined).map(b => b.shelves.map(s => [s, s])).flat();
			}

			return meta;
		}
	};
})();

document.addEventListener("DOMContentLoaded", function () {
	OCA.Books.Core.init();
});