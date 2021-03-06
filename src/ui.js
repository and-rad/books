import { showMessage, showSuccess, showError } from "@nextcloud/dialogs";
import "@nextcloud/dialogs/styles/toast.scss";

OCA.Books.UI = (function() {
	var _groupBy = "author";
	var _sortBy = "title";
	var _sortAsc = true;
	var _timeoutHandleSlider = undefined;

	var _refreshMore = function(objs, field) {
		let more = field.querySelector(".more");
		if (objs.length > 1) {
			more.style.display = "inline-block";
			more.textContent = `+${objs.length-1}`;
		} else {
			more.style.display = "none";
		}
	};

	var _refreshCategory = function(cat) {
		let vals = OCA.Books.Core.getMeta(cat);

		let frag = document.createDocumentFragment();
		let tpl = document.createElement("li");
		tpl.innerHTML = document.querySelector("#template-list-item").innerHTML;
		vals.forEach(v => _buildNavigationItem(tpl, frag, v[0], v[1]));
		_sortCategoryFragment(frag);

		let list = document.querySelector(`#category div[data-group="${cat}"] > ul`);
		frag.prepend(list.firstElementChild);
		list.innerHTML = "";
		list.appendChild(frag);
	}

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

	var _sortCategoryFragment = function(frag) {
		let loc = document.documentElement.dataset.locale || "en";
		let all = Array.from(frag.children);
		all.sort((a, b) => a.dataset.id.localeCompare(b.dataset.id, loc, {numeric: true}));
		all.forEach(c => frag.appendChild(c));
	};

	var _showCategory = function(cat) {
		document.querySelector(`#list-category > li[data-group="${_groupBy}"]`).classList.remove("active");
		document.querySelector(`#category > div[data-group="${_groupBy}"]`).style.display = "none";
		document.querySelector(`#list-category > li[data-group="${cat}"]`).classList.add("active");
		document.querySelector(`#category > div[data-group="${cat}"]`).style.display = "block";
		_groupBy = cat;
		_showGroup("all");
	};

	var _showGroup = function(id) {
		let rows = document.querySelectorAll("#app-content tbody tr");
		if (id == "all") {
			rows.forEach(r => r.style.display = "table-row");
		} else {
			let ids = OCA.Books.Core.getIds(_groupBy, id);
			for (let i = 0, row; row = rows[i]; i++) {
				row.style.display = ids.includes(parseInt(row.dataset.id)) ? "table-row" : "none";
			}
		}

		let items = document.querySelectorAll(`#category > div[data-group="${_groupBy}"] li`);
		for (let i = 0, item; item = items[i]; i++) {
			if (item.dataset.id == id) {
				item.classList.add("active");
			} else {
				item.classList.remove("active");
			}
		}
	};

	var _buildNavigationItem = function(tpl, frag, id, name) {
		let item = frag.querySelector(`li[data-id="${id}"]`);
		if (item) {
			let num = parseInt(item.lastElementChild.textContent);
			item.lastElementChild.textContent = num + 1;
		} else {
			item = tpl.cloneNode(true);
			item.dataset.id = id;
			item.firstElementChild.textContent = name;
			item.firstElementChild.addEventListener("click", function(evt){
				evt.preventDefault();
				_showGroup(evt.target.parentNode.dataset.id);
			});
			frag.appendChild(item);
		}
	};

	var _buildTOC = function(toc) {
		let frag = document.createDocumentFragment();
		let tpl = document.createElement("li");
		tpl.innerHTML = document.querySelector("#template-toc-item").innerHTML;

		toc.forEach(function(chapter) {
			let item = tpl.cloneNode(true);
			item.lastElementChild.textContent = chapter.label;
			item.lastElementChild.href = chapter.href;
			item.addEventListener("click", _onTOCItemClicked);

			if (chapter.subitems.length > 0) {
				item.appendChild(_buildTOC(chapter.subitems));
			}

			frag.appendChild(item);
		});

		let list = document.createElement("ul");
		list.appendChild(frag);

		return list;
	};

	var _openSidebar = function(id) {
		let sidebar = document.querySelector("#app-sidebar");
		sidebar.dataset.id = id;

		if (sidebar.classList.contains("hidden")) {
			_showSidebarSection(0);
		} else {
			let tabs = sidebar.querySelector(".tabbar");
			let tab = sidebar.querySelector(".tabbar > .active");
			_showSidebarSection(Array.from(tabs.children).indexOf(tab));
		}

		let data = OCA.Books.Core.getBook(id);
		let details = sidebar.querySelector("#app-sidebar-details");
		details.querySelector(".description").innerHTML = data.description;
		details.querySelector(".title").textContent = data.titles ? data.titles[0].name : "";
		details.querySelector(".author").textContent = data.authors ? data.authors[0].name : "";
		details.querySelector(".status").value = data.status;
		details.querySelector(".location").value = data.filename;
		details.querySelector(".shelves").setSelection(data.shelves || []);

		let cover = details.querySelector("figure > img");
		cover.src = OCA.Books.Backend.coverPath(id, true);
		cover.style.display = data.hasCover ? "block" : "none";

		OCA.Books.Editor.init("#app-sidebar-raw textarea");
		sidebar.classList.remove("hidden");
	};

	var _closeSidebar = function() {
		let sidebar = document.querySelector("#app-sidebar");
		sidebar.classList.add("hidden");
		sidebar.classList.remove("wide");
		sidebar.querySelector("#app-sidebar-raw").dataset.id = undefined;
		sidebar.querySelector("#app-sidebar-details figure > img").src = "";
		OCA.Books.Editor.close();
	};

	var _showSidebarSection = function(idx) {
		let tabs = document.querySelectorAll("#app-sidebar header nav > a");
		for (let i = 0, tab; tab = tabs[i]; i++) {
			i == idx ? tab.classList.add("active") : tab.classList.remove("active");
		}
		let secs = document.querySelectorAll("#app-sidebar .tabcontent > div");
		for (let i = 0, sec; sec = secs[i]; i++) {
			i == idx ? sec.classList.remove("hidden") : sec.classList.add("hidden");
		}

		let sidebar = document.querySelector("#app-sidebar");
		let raw = sidebar.querySelector("#app-sidebar-raw");
		if (idx == 2 && raw.dataset.id != sidebar.dataset.id) {
			OCA.Books.Core.getOPF(sidebar.dataset.id, function(data){
				raw.dataset.id = sidebar.dataset.id;
				OCA.Books.Editor.setValue(data);
			});
		}
	};

	var _onItemClicked = function(evt) {
		let id = evt.target.closest("tr").dataset.id;
		OCA.Books.Core.open(id, "reader");
		_closeSidebar();
	};

	var _onItemActionClicked = function(evt) {
		evt.preventDefault();
		evt.stopPropagation();
		_openSidebar(evt.target.closest("tr").dataset.id);
	};

	var _onTOCItemClicked = function(evt) {
		evt.preventDefault();
		OCA.Books.Core.toSection(evt.target.getAttribute("href"));
	};

	var _onProgressHandleMoved = function(evt) {
		clearTimeout(_timeoutHandleSlider);

		let width = document.querySelector("#reader-progress-bar").getBoundingClientRect().width;
		let pos = Math.min(Math.max((evt.pageX || evt.changedTouches[0].pageX) - 44, 0), width);
		document.querySelector("#reader-progress-handle").style.left = (pos - 7) + "px";
		document.querySelector("#reader-progress-overlay").style.width = pos + "px" ;

		_timeoutHandleSlider = setTimeout(function(){
			OCA.Books.Core.toPercent(pos / width);
		}, 250);
	};

	var _onProgressHandleReleased = function() {
		let handle = document.querySelector("#reader-progress-handle");
		handle.removeEventListener("mousemove", _onProgressHandleMoved);
		handle.removeEventListener("touchmove", _onProgressHandleMoved);
		handle.removeEventListener("mouseup", _onProgressHandleReleased);
		handle.removeEventListener("touchend", _onProgressHandleReleased);
		handle.removeEventListener("mouseleave", _onProgressHandleReleased);
		handle.removeEventListener("touchcancel", _onProgressHandleReleased);
		document.querySelector("#reader-progress-bar").classList.remove("active");
	}

	var _onKeyUp = function(evt) {
		if (evt.code == "ArrowLeft" || evt.keyCode == 37) {
			OCA.Books.Core.prevPage();
		} else if (evt.code == "ArrowRight" || evt.keyCode == 39) {
			OCA.Books.Core.nextPage();
		} else if (evt.code == "ArrowUp" || evt.keyCode == 38) {
			OCA.Books.Core.prevSection();
		} else if (evt.code == "ArrowDown" || evt.keyCode == 40) {
			OCA.Books.Core.nextSection();
		} else if (evt.code == "Escape" || evt.keyCode == 27) {
			OCA.Books.Core.close();
		}
	};

	return {
		init: function() {
			this.Style.init();
			this.Multiselect.init();

			document.querySelector("#font-settings").addEventListener("change", function(evt){
				OCA.Books.UI.Style.setFontSize(evt.target.value);
			});
			document.querySelector("#color-settings").addEventListener("change", function(evt){
				OCA.Books.UI.Style.setTheme(evt.target.value);
			});
			document.querySelector("#settings-item-scan").addEventListener("click", function() {
				OCA.Books.UI.showLoadingScreen();
				OCA.Books.Backend.scan(document.querySelector("#path-settings").value, (function(){
					var bar = document.querySelector("#spinner > svg circle");
					return {
						updateFunc: function(obj){
							let progress = (obj.done / obj.total) * 700;
							bar.style.strokeDasharray = `${progress} 710`;
						},
						doneFunc: function(obj){
							OCA.Books.UI.toast(obj.message, true);
							bar.style.strokeDasharray = `705 710`;
							setTimeout(OCA.Books.UI.hideLoadingScreen, 1000);
						},
						errorFunc: function(obj){
							OCA.Books.UI.toast(obj.message, false);
							setTimeout(OCA.Books.UI.hideLoadingScreen, 1000);
						}
					};
				})());
			});
			document.querySelector("#settings-item-reset").addEventListener("click", function() {
				OC.dialogs.confirm(t("books","msg-reset"), t("books", "head-reset"), function(ok){
					if (ok) {
						OCA.Books.Backend.reset(function(obj) {
							OCA.Books.UI.toast(obj.message, obj.success);
						});
					}
				}, true);
			});

			document.querySelector("#reader-prev").addEventListener("click", function(){
				OCA.Books.Core.prevPage();
			});
			document.querySelector("#reader-next").addEventListener("click", function(){
				OCA.Books.Core.nextPage();
			});
			document.querySelector("#reader-close").addEventListener("click", function(){
				OCA.Books.Core.close();
			});
			let handle = document.querySelector("#reader-progress-handle");
			handle.addEventListener("mousedown", OCA.Books.UI.activateSlider);
			handle.addEventListener("touchstart", OCA.Books.UI.activateSlider);

			document.querySelector("#app-sidebar > header > a").addEventListener("click", function(evt){
				evt.preventDefault();
				_closeSidebar();
			});
			document.querySelector("#app-sidebar-raw .icon-fullscreen").addEventListener("click", function(evt){
				evt.preventDefault();
				document.querySelector("#app-sidebar").classList.toggle("wide");
			});
			document.querySelector("#app-sidebar-details .status").addEventListener("change", function(evt){
				let id = parseInt(document.querySelector("#app-sidebar").dataset.id);
				let now = parseInt(evt.target.value);
				let old = OCA.Books.Core.getBook(id).status;
				OCA.Books.Backend.saveStatus(id, now, function(obj){
					if (obj.success) {
						OCA.Books.Core.getBook(id).status = now;
						OCA.Books.UI.refreshStatus(id, now, old);
					}
				});
			});

			let shelves = document.querySelector("#app-sidebar-details .shelves");
			shelves.setOptions(OCA.Books.Core.getMeta("shelf").map(s => ({value:s[0],text:s[1]})));
			shelves.addEventListener("changed", function(evt){
				let id = parseInt(document.querySelector("#app-sidebar").dataset.id);
				OCA.Books.Backend.saveShelves(id, evt.detail, function(obj){
					if (obj.success) {
						OCA.Books.Core.getBook(id).shelves = evt.detail;
						_refreshCategory("shelf");
					}
				});
			});

			let cats = document.querySelectorAll("#list-category > li > a");
			for (let i = 0, cat; cat = cats[i]; i++) {
				cat.addEventListener("click", function(evt){
					_showCategory(evt.target.parentNode.dataset.group);
					evt.preventDefault();
				});
			}

			let tabs = document.querySelectorAll("#app-sidebar header nav > a");
			for (let i = 0, tab; tab = tabs[i]; i++) {
				tab.addEventListener("click", function(evt){
					evt.preventDefault();
					_showSidebarSection(Array.from(tab.parentNode.children).indexOf(evt.target));
				});
			}

			let cols = document.querySelectorAll("th.sort");
			for (let i = 0, col; col = cols[i]; i++) {
				col.addEventListener("click", function(evt) {
					OCA.Books.UI.sortShelf(evt.target.dataset.sort);
				});
			}
		},

		buildNavigation: function(books) {
			let all = document.querySelectorAll("#category li:first-child");
			for (let i = 0, a; a = all[i]; i++) {
				a.lastElementChild.textContent = books.length;
				a.firstElementChild.onclick = function(evt) {
					_showGroup(evt.target.parentNode.dataset.id);
				};
			}

			_refreshCategory("author");
			_refreshCategory("series");
			_refreshCategory("genre");
			_refreshCategory("status");
			_refreshCategory("shelf");
			_showCategory(_groupBy);
		},

		buildShelf: function(books) {
			let frag = document.createDocumentFragment();
			let tpl = document.createElement("tr");
			tpl.innerHTML = document.querySelector("#template-shelf-item").innerHTML;

			for (let i = 0, book; book = books[i]; i++) {
				let item = tpl.cloneNode(true);
				let fields = item.querySelectorAll(".field");
				item.dataset.id = book.id;
				item.className = "app-shelf-item";

				if (book.status != 0) {
					fields[0].querySelector(`.status-${book.status}`).style.display = "block";
				}
				if (book.hasCover) {
					fields[0].firstElementChild.style.backgroundImage = OCA.Books.Backend.coverUrl(book.id);
				} else {
					fields[0].querySelector(".placeholder").textContent = book.titles[0].fileAs.substring(0,2);
				}

				fields[1].querySelector(".title-1").textContent = book.titles[0].name;
				fields[1].dataset.fileAs = book.titles[0].fileAs;
				fields[1].addEventListener("click", _onItemClicked);
				fields[1].querySelector("a.action").addEventListener("click", _onItemActionClicked);
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

		buildTOC: function(toc) {
			let elem = document.querySelector("#app-navigation-toc");
			elem.textContent = "";
			elem.appendChild(_buildTOC(toc));
		},

		buildMarkers: function(positions) {
			let frag = document.createDocumentFragment();

			positions.forEach(function(pos){
				let marker = document.createElement("div");
				marker.className = "marker";
				marker.style.left = `${pos * 100}%`;
				frag.appendChild(marker);
			});

			let panel = document.querySelector("#reader-progress-markers");
			panel.textContent = "";
			panel.appendChild(frag);
		},

		openReader: function() {
			document.querySelector("#app").classList.add("reader");
			window.addEventListener("keyup", _onKeyUp);
		},

		closeReader: function() {
			document.querySelector("#app").classList.remove("reader");
			window.removeEventListener("keyup", _onKeyUp);
			this.hideLoadingScreen();
		},

		showLoadingScreen: function() {
			document.querySelector("#spinner").style.display = "block";
		},

		hideLoadingScreen: function() {
			document.querySelector("#spinner").style.display = "none";
			document.querySelector("#spinner svg circle").style.strokeDasharray = "0 710";
		},

		activateSlider: function() {
			let handle = document.querySelector("#reader-progress-handle");
			handle.addEventListener("mousemove", _onProgressHandleMoved);
			handle.addEventListener("touchmove", _onProgressHandleMoved);
			handle.addEventListener("mouseup", _onProgressHandleReleased);
			handle.addEventListener("touchend", _onProgressHandleReleased);
			handle.addEventListener("mouseleave", _onProgressHandleReleased);
			handle.addEventListener("touchcancel", _onProgressHandleReleased);
			document.querySelector("#reader-progress-bar").classList.add("active");
		},

		refreshProgress: function(percent, section) {
			if (!document.querySelector("#reader-progress-bar").classList.contains("active")) {
				percent *= 100;
				let handle = document.querySelector("#reader-progress-handle");
				let overlay = document.querySelector("#reader-progress-overlay");
				handle.style.left = `calc(${percent}% - 6px)`;
				overlay.style.width = `${percent}%`;
			}

			let toc = document.querySelectorAll("#app-navigation-toc li");
			for (let i = 0, item; item = toc[i]; i++) {
				if (item.firstElementChild.getAttribute("href") == section) {
					item.classList.add("active");
				} else {
					item.classList.remove("active");
				}
			}
		},

		refreshStatus: function(id, statusNew, statusOld) {
			let icons = document.querySelectorAll(`#app-content tr[data-id="${id}"] .cover .icon`);
			for (let i = 0, icon; icon = icons[i]; i++) {
				icon.style.display = (icon.classList.contains(`status-${statusNew}`)) ? "block" : "none";
			}

			if (statusOld !== undefined && statusNew != statusOld) {
				_refreshCategory("status");
			}
		},

		toast: function(msg, ok) {
			if (ok === undefined) {
				showMessage(msg);
			} else if (ok) {
				showSuccess(msg);
			} else {
				showError(msg);
			}
		},

		Style: (function(){
			var _style = {
				html: {
					"font-size": "initial"
				},
				body: {
					"font-size": "inherit",
					"text-align": "justify"
				},
				p: {
					"max-width": "32em"
				}
			};

			var _setFontSize = function(val) {
				_style.html["font-size"] = val;
				window.dispatchEvent(new Event("bookstylechange"));
			};

			var _setTheme = function(val) {
				window.dispatchEvent(new CustomEvent("themechange", {detail: val}));
			}

			return {
				setFontSize: function(val) {
					window.localStorage.setItem("font-size", val);
					_setFontSize(val);
				},

				setTheme: function(val) {
					window.localStorage.setItem("theme", val);
					_setTheme(val);
				},

				get: function() {
					return _style;
				},

				init: function() {
					let fontSize = window.localStorage.getItem("font-size") || "initial";
					let theme = window.localStorage.getItem("theme") || "default";
					document.querySelector("#font-settings").value = fontSize;
					document.querySelector("#color-settings").value = theme;
					_setFontSize(fontSize);
					_setTheme(theme);
				}
			};
		})(),

		Multiselect: (function(){
			var _tpl = `<ul><li tabindex='0'></li></ul><input type='text' placeholder='${t("books","hint-ms")}'><div class='selected'></div>`;

			var _changeEvent = function(ul) {
				let vals = Array.from(ul.querySelectorAll(".selected")).map(c => c.dataset.value);
				return new CustomEvent("changed", {detail: vals});
			};

			let _createOption = function(val, text, isSelected) {
				let elem = document.createElement("li");
				elem.dataset.value = val;
				elem.textContent = text;
				elem.tabIndex = 0;
				elem.className = isSelected ? "selected" : "";
				elem.addEventListener("click", function(evt){
					evt.target.classList.toggle("selected");
					let sel = evt.target.closest("multiselect");
					sel.dispatchEvent(_changeEvent(sel.querySelector("ul")));
					sel.querySelector("div.selected").refresh();
					let input = sel.querySelector("input");
					input.focus();
					input.reset();
				});
				return elem;
			};

			var _init = function(sel) {
				sel.innerHTML = _tpl;
				let list = sel.querySelector("ul");
				let selected = sel.querySelector("div.selected");
				let input = sel.querySelector("input");

				/**
				 * @param {Array} options a list of option pairs {value,text}
				 */
				sel.setOptions = function(options) {
					let locale = document.documentElement.dataset.locale || "en";
					options = options.filter((o, i, self) => self.findIndex(t => t.value === o.value) === i);
					options.sort((a,b) => a.text.localeCompare(b.text, locale, {numeric: true}));
					let frag = document.createDocumentFragment();
					options.forEach(item => frag.appendChild(_createOption(item.value, item.text)));
					frag.appendChild(list.lastElementChild);
					list.innerHTML = "";
					list.appendChild(frag);
					list.refresh();
					selected.refresh();
				};

				/**
				 * @param {string} val unique option identifier
				 * @param {string} text option's display text
				 * @param {boolean} isSelected true if selected by default
				 */
				sel.addOption = function(val, text, isSelected) {
					let last = list.lastElementChild;
					list.appendChild(_createOption(val, text, isSelected));
					let locale = document.documentElement.dataset.locale || "en";
					let opts = Array.from(list.children);
					opts.sort((a,b) => a.textContent.localeCompare(b.textContent, locale, {numeric: true}));
					opts.forEach(o => list.appendChild(o));
					list.appendChild(last);
					list.refresh();
					selected.refresh();
				};

				/**
				 * @param {Array} selection a list of option ids
				 */
				sel.setSelection = function(selection) {
					list.children.forEach(c => {
						if (selection.includes(c.dataset.value)) {
							c.classList.add("selected")
						} else {
							c.classList.remove("selected");
						}
					});
					selected.refresh();
				};

				sel.addEventListener("focusout", function(evt){
					if (sel.contains(evt.relatedTarget)) {
						evt.preventDefault();
					} else {
						selected.style.display = "block";
						input.style.display = "none";
						list.style.display = "none";
						input.reset();
					}
				});

				list.reset = function() {
					list.lastElementChild.textContent = "";
					list.refresh();
				};

				list.refresh = function() {
					let val = list.lastElementChild.textContent.toLowerCase();
					let items = list.querySelectorAll("li:not(:last-child");
					items.forEach(c => {
						c.style.display = c.textContent.toLowerCase().includes(val) ? "list-item" : "none";
					});

					let visible = false;
					if (val == "") {
						visible = false;
					} else if (list.children.length < 2) {
						visible = true;
					} else {
						let match = Array.from(items).filter(c => c.textContent.toLowerCase() == val);
						visible = (match.length == 0);
					}

					list.lastElementChild.style.display = visible ? "list-item" : "none";
					list.style.top = `-${list.clientHeight + 2}px`;
				};

				list.lastElementChild.addEventListener("click", function(){
					let val = list.lastElementChild.textContent;
					input.focus();
					sel.addOption(val, val, true);
					sel.dispatchEvent(_changeEvent(list));
					input.reset();
				});

				selected.refresh = function() {
					let all = Array.from(list.querySelectorAll(".selected"));
					selected.innerHTML = all.map(c => `<span>${c.textContent}</span>`).join("");
				};

				selected.addEventListener("click", function(){
					selected.style.display = "none";
					list.style.display = "block";
					list.style.top = `-${list.clientHeight + 2}px`;
					input.style.display = "block";
					input.focus();
				});

				input.reset = function() {
					input.value = "";
					list.reset();
				};

				input.addEventListener("input", function(){
					list.lastElementChild.textContent = input.value;
					list.refresh();
				});
			};

			return {
				init: function() {
					let all = document.querySelectorAll("#app-sidebar multiselect");
					for (let i = 0, sel; sel = all[i]; i++) {
						if (sel.children.length == 0) {
							_init(sel);
						}
					}
				}
			};
		})()
	};
})();
