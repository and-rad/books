!function(e){function t(t){for(var n,i,l=t[0],a=t[1],c=t[2],u=0,f=[];u<l.length;u++)i=l[u],Object.prototype.hasOwnProperty.call(r,i)&&r[i]&&f.push(r[i][0]),r[i]=0;for(n in a)Object.prototype.hasOwnProperty.call(a,n)&&(e[n]=a[n]);for(d&&d(t);f.length;)f.shift()();return s.push.apply(s,c||[]),o()}function o(){for(var e,t=0;t<s.length;t++){for(var o=s[t],n=!0,l=1;l<o.length;l++){var a=o[l];0!==r[a]&&(n=!1)}n&&(s.splice(t--,1),e=i(i.s=o[0]))}return e}var n={},r={0:0},s=[];function i(t){if(n[t])return n[t].exports;var o=n[t]={i:t,l:!1,exports:{}};return e[t].call(o.exports,o,o.exports,i),o.l=!0,o.exports}i.m=e,i.c=n,i.d=function(e,t,o){i.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:o})},i.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},i.t=function(e,t){if(1&t&&(e=i(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var o=Object.create(null);if(i.r(o),Object.defineProperty(o,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var n in e)i.d(o,n,function(t){return e[t]}.bind(null,n));return o},i.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return i.d(t,"a",t),t},i.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},i.p="/js/";var l=window.webpackJsonp=window.webpackJsonp||[],a=l.push.bind(l);l.push=t,l=l.slice();for(var c=0;c<l.length;c++)t(l[c]);var d=a;s.push([39,1]),o()}({39:function(e,o,n){"use strict";n.r(o);var r,s,i,l,a,c,d,u,f,p,m,g,h,y,C,v,k,S,b,A,O,q,L,E,B,w,x=n(2);OCA.Books||(OCA.Books={}),OCA.Books.Core=(r=[],s={},i=void 0,l=void 0,a=void 0,{init:function(){window.addEventListener("bookstylechange",(function(){i&&i.themes.default(OCA.Books.UI.Style.get())})),OCA.Books.Backend.getConfig((function(e){document.querySelector("#path-settings").value=e.library})),OCA.Books.Backend.getBooks((function(e){e.success&&(r=e.data,OCA.Books.UI.buildShelf(r),OCA.Books.UI.buildNavigation(r))})),OCA.Books.UI.init()},open:function(e,t){this.close(),OCA.Books.Backend.getLocation(e,(function(o){if(o.success){OCA.Books.UI.openReader(),OCA.Books.UI.showLoadingScreen();let n=ePub(o.data,{replacements:"blobUrl",openAs:"epub"});n.loaded.navigation.then(OCA.Books.UI.buildTOC),n.ready.then((function(){n.locations.generate(1e3).then((function(){OCA.Books.UI.hideLoadingScreen();let o=[];n.spine.each((function(e){let t=e.cfiFromElement(e.document);o.push(n.locations.percentageFromCfi(t))})),OCA.Books.UI.buildMarkers(o),(i=n.renderTo(t,{width:"100%",height:"100%"})).id=e,i.themes.default(OCA.Books.UI.Style.get()),i.display(function(e){let t=r.find(t=>t.id==e);if(t&&t.progress)return t.progress}(e)),i.on("relocated",(function(){clearTimeout(l),l=setTimeout((function(){let e=i.location.start.cfi,t=i.book.locations.percentageFromCfi(e);OCA.Books.UI.refreshProgress(t,s.href)}),250),clearTimeout(a),a=setTimeout((function(){let e=i.location.start.cfi;if(i.book.locations.percentageFromCfi(e)>0){let t=r.find(e=>e.id==i.id);OCA.Books.Backend.saveProgress(i.id,e,(function(o){if(o.success){let o=t.status;t.progress=e,t.status=t.status||1,OCA.Books.UI.refreshStatus(i.id,t.status,o)}}))}}),1e3)})),i.on("rendered",(function(e){s=e}))}))}))}}))},close:function(){i&&(i.destroy(),i=void 0,s={}),clearTimeout(a),clearTimeout(l),OCA.Books.UI.closeReader(),OCA.Books.UI.refreshProgress(0)},nextPage:function(){i&&i.next()},prevPage:function(){i&&i.prev()},nextSection:function(){i&&s&&i.display((s.next()||{}).href)},prevSection:function(){i&&s&&i.display((s.prev()||{}).href)},toSection:function(e){i&&i.display(e)},toPercent:function(e){if(i){let t=i.book.locations.cfiFromPercentage(e);i.display(t)}},getIds:function(e,t){let o=[];return"author"==e?o=r.filter(e=>void 0!==e.authors&&e.authors.some(e=>e.fileAs==t)):"series"==e?o=r.filter(e=>void 0!==e.series&&e.series.some(e=>e.fileAs==t)):"genre"==e?o=r.filter(e=>void 0!==e.genres&&e.genres.includes(t)):"status"==e?o=r.filter(e=>e.status==t):"shelf"==e&&(o=r.filter(e=>void 0!==e.shelves&&e.shelves.includes(t))),o.map(e=>e.id)},getMeta:function(e){let o=[];return"author"==e?o=r.filter(e=>void 0!==e.authors).map(e=>e.authors.map(e=>[e.fileAs,e.name])).flat():"series"==e?o=r.filter(e=>void 0!==e.series).map(e=>e.series.map(e=>[e.fileAs,e.name])).flat():"genre"==e?o=r.filter(e=>void 0!==e.genres).map(e=>e.genres.map(e=>[e,e])).flat():"status"==e?o=r.map(e=>[[e.status],t("books","status-"+e.status)]):"shelf"==e&&(o=r.filter(e=>void 0!==e.shelves).map(e=>e.shelves.map(e=>[e,e])).flat()),o}}),OCA.Books.UI=(d="author",u="title",f=!0,p=void 0,m=function(e,t){let o=t.querySelector(".more");e.length>1?(o.style.display="inline-block",o.textContent="+"+(e.length-1)):o.style.display="none"},g=function(e){let t=OCA.Books.Core.getMeta(e),o=document.createDocumentFragment(),n=document.createElement("li");n.innerHTML=document.querySelector("#template-list-item").innerHTML,t.forEach(e=>S(n,o,e[0],e[1])),C(o);let r=document.querySelector(`#category div[data-group='${e}'] > ul`);o.prepend(r.firstElementChild),r.innerHTML="",r.appendChild(o)},h=function(e,t){u=e,t&&document.querySelector(`#app-content th.${u} > span:not(.hidden)`)&&(f=!f);let o=document.querySelectorAll("#app-content th.sort");for(let e,t=0;e=o[t];t++)e.classList.contains(u)?e.firstElementChild.classList.remove("hidden"):e.firstElementChild.classList.add("hidden"),f?(e.firstElementChild.classList.remove("icon-triangle-s"),e.firstElementChild.classList.add("icon-triangle-n")):(e.firstElementChild.classList.remove("icon-triangle-n"),e.firstElementChild.classList.add("icon-triangle-s"));let n=document.documentElement.dataset.locale||"en",r=document.querySelector("#app-content tbody"),s=Array.from(r.querySelectorAll("tr"));s.sort((function(e,t){return y(e,t,n)})),s.forEach(e=>{r.appendChild(e)})},y=function(e,t,o){let n=e.querySelector("."+u).dataset.fileAs,r=t.querySelector("."+u).dataset.fileAs,s=n.localeCompare(r,o,{numeric:!0});return f||(s*=-1),s},C=function(e){let t=document.documentElement.dataset.locale||"en",o=Array.from(e.children);o.sort((e,o)=>e.dataset.id.localeCompare(o.dataset.id,t,{numeric:!0})),o.forEach(t=>e.appendChild(t))},v=function(e){document.querySelector(`#list-category > li[data-group='${d}']`).classList.remove("active"),document.querySelector(`#category > div[data-group='${d}']`).style.display="none",document.querySelector(`#list-category > li[data-group='${e}']`).classList.add("active"),document.querySelector(`#category > div[data-group='${e}']`).style.display="block",d=e,k("all")},k=function(e){let t=document.querySelectorAll("#app-content tbody tr");if("all"==e)t.forEach(e=>e.style.display="table-row");else{let o=OCA.Books.Core.getIds(d,e);for(let e,n=0;e=t[n];n++)e.style.display=o.includes(parseInt(e.dataset.id))?"table-row":"none"}let o=document.querySelectorAll(`#category > div[data-group='${d}'] li`);for(let t,n=0;t=o[n];n++)t.dataset.id==e?t.classList.add("active"):t.classList.remove("active")},S=function(e,t,o,n){let r=t.querySelector(`li[data-id='${o}']`);if(r){let e=parseInt(r.lastElementChild.textContent);r.lastElementChild.textContent=e+1}else r=e.cloneNode(!0),r.dataset.id=o,r.firstElementChild.textContent=n,r.firstElementChild.addEventListener("click",(function(e){k(e.target.parentNode.dataset.id)})),t.appendChild(r)},b=function(e){let t=document.createDocumentFragment(),o=document.createElement("li");o.innerHTML=document.querySelector("#template-toc-item").innerHTML,e.forEach((function(e){let n=o.cloneNode(!0);n.lastElementChild.textContent=e.label,n.lastElementChild.href=e.href,n.addEventListener("click",O),e.subitems.length>0&&n.appendChild(b(e.subitems)),t.appendChild(n)}));let n=document.createElement("ul");return n.appendChild(t),n},A=function(e){let t=e.target.closest("tr").dataset.id;OCA.Books.Core.open(t,"reader")},O=function(e){e.preventDefault(),OCA.Books.Core.toSection(e.target.getAttribute("href"))},q=function(e){clearTimeout(p);let t=document.querySelector("#reader-progress-bar").getBoundingClientRect().width,o=Math.min(Math.max(e.pageX-44,0),t);document.querySelector("#reader-progress-handle").style.left=o-7+"px",document.querySelector("#reader-progress-overlay").style.width=o+"px",p=setTimeout((function(){OCA.Books.Core.toPercent(o/t)}),250)},L=function(){let e=document.querySelector("#reader-progress-handle");e.removeEventListener("mousemove",q),e.removeEventListener("mouseup",L),e.removeEventListener("mouseleave",L),document.querySelector("#reader-progress-bar").classList.remove("active")},E=function(e){"ArrowLeft"==e.code||37==e.keyCode?OCA.Books.Core.prevPage():"ArrowRight"==e.code||39==e.keyCode?OCA.Books.Core.nextPage():"ArrowUp"==e.code||38==e.keyCode?OCA.Books.Core.prevSection():"ArrowDown"==e.code||40==e.keyCode?OCA.Books.Core.nextSection():"Escape"!=e.code&&27!=e.keyCode||OCA.Books.Core.close()},{stylesheet:"/apps/books/css/book.css",init:function(){this.Style.init(),document.querySelector("#settings-item-scan").addEventListener("click",(function(){OCA.Books.Backend.scan(document.querySelector("#path-settings").value,(function(e){console.log(e)}))})),document.querySelector("#settings-item-reset").addEventListener("click",(function(){OCA.Books.Backend.reset((function(e){console.log(e)}))})),document.querySelector("#reader-prev").addEventListener("click",(function(){OCA.Books.Core.prevPage()})),document.querySelector("#reader-next").addEventListener("click",(function(){OCA.Books.Core.nextPage()})),document.querySelector("#reader-close").addEventListener("click",(function(){OCA.Books.Core.close()})),document.querySelector("#reader-progress-handle").addEventListener("mousedown",(function(){OCA.Books.UI.activateSlider()})),document.querySelector("#font-settings").addEventListener("change",(function(e){OCA.Books.UI.Style.setFontSize(e.target.value)}));let e=document.querySelectorAll("#list-category > li > a");for(let t,o=0;t=e[o];o++)t.addEventListener("click",(function(e){v(e.target.parentNode.dataset.group),e.preventDefault()}));let t=document.querySelectorAll("th.sort");for(let e,o=0;e=t[o];o++)e.addEventListener("click",(function(e){OCA.Books.UI.sortShelf(e.target.dataset.sort)}))},buildNavigation:function(e){let t=document.querySelectorAll("#category li:first-child");for(let o,n=0;o=t[n];n++)o.lastElementChild.textContent=e.length,o.firstElementChild.onclick=function(e){k(e.target.parentNode.dataset.id)};g("author"),g("series"),g("genre"),g("status"),g("shelf"),v(d)},buildShelf:function(e){let o=document.createDocumentFragment(),n=document.createElement("tr");n.innerHTML=document.querySelector("#template-shelf-item").innerHTML;for(let r,s=0;r=e[s];s++){let e=n.cloneNode(!0),s=e.querySelectorAll(".field");if(e.dataset.id=r.id,e.className="app-shelf-item",0!=r.status&&(s[0].querySelector("svg.status-"+r.status).style.display="block"),r.hasCover){let e=`url("${Object(x.generateUrl)("apps/books/api/0.1/cover")}/${r.id}")`;s[0].firstElementChild.style.backgroundImage=e}else s[0].querySelector(".placeholder").textContent=r.titles[0].fileAs.substring(0,2);if(s[1].querySelector(".title-1").textContent=r.titles[0].name,s[1].dataset.fileAs=r.titles[0].fileAs,s[1].addEventListener("click",A),r.series){let e=r.series[0];s[1].dataset.fileAs=`${e.fileAs}${e.pos}`,s[1].querySelector(".title-2").textContent=`${e.name} ${e.pos}`}r.authors&&(s[0].firstElementChild.style.backgroundColor=r.authors[0].color,s[2].dataset.fileAs=r.authors[0].fileAs,s[2].querySelector(".author-1").textContent=r.authors[0].name,m(r.authors,s[2])),r.genres&&(s[3].dataset.fileAs=r.genres[0],s[3].querySelector(".genre-1").textContent=r.genres[0],m(r.genres,s[3]));let i=t("books",r.languages[0]);s[4].dataset.fileAs=i,s[4].querySelector(".lang-1").textContent=i,m(r.languages,s[4]),o.appendChild(e)}let r=document.querySelector("#app-shelf-body");r.textContent="",r.appendChild(o),h(u)},sortShelf:function(e){h(e,!0)},buildTOC:function(e){let t=document.querySelector("#app-navigation-toc");t.textContent="",t.appendChild(b(e))},buildMarkers:function(e){let t=document.createDocumentFragment();e.forEach((function(e){let o=document.createElement("div");o.className="marker",o.style.left=100*e+"%",t.appendChild(o)}));let o=document.querySelector("#reader-progress-markers");o.textContent="",o.appendChild(t)},openReader:function(){document.querySelector("#app").classList.add("reader"),window.addEventListener("keyup",E)},closeReader:function(){document.querySelector("#app").classList.remove("reader"),window.removeEventListener("keyup",E),this.hideLoadingScreen()},showLoadingScreen:function(){document.querySelector("#spinner").style.display="block"},hideLoadingScreen:function(){document.querySelector("#spinner").style.display="none"},activateSlider:function(){let e=document.querySelector("#reader-progress-handle");e.addEventListener("mousemove",q),e.addEventListener("mouseup",L),e.addEventListener("mouseleave",L),document.querySelector("#reader-progress-bar").classList.add("active")},refreshProgress:function(e,t){if(!document.querySelector("#reader-progress-bar").classList.contains("active")){e*=100;let t=document.querySelector("#reader-progress-handle"),o=document.querySelector("#reader-progress-overlay");t.style.left=`calc(${e}% - 6px)`,o.style.width=e+"%"}let o=document.querySelectorAll("#app-navigation-toc li");for(let e,n=0;e=o[n];n++)e.firstElementChild.getAttribute("href")==t?e.classList.add("active"):e.classList.remove("active")},refreshStatus:function(e,t,o){let n=document.querySelectorAll(`#app-content tr[data-id='${e}'] .cover svg`);for(let e,o=0;e=n[o];o++)e.style.display=e.classList.contains("status-"+t)?"block":"none";void 0!==o&&t!=o&&g("status")},Style:(c={html:{"font-size":"initial"},body:{"font-size":"inherit","text-align":"justify"},p:{"max-width":"32em"}},{setFontSize:function(e){c.html["font-size"]=e,window.localStorage.setItem("font-size",e),window.dispatchEvent(new Event("bookstylechange"))},get:function(){return c},init:function(){c.html["font-size"]=window.localStorage.getItem("font-size"),document.querySelector("#font-settings").value=c.html["font-size"]}})}),OCA.Books.Backend=(B=function(e,t){let o=new XMLHttpRequest;o.addEventListener("load",t),o.open("GET",e),o.setRequestHeader("requesttoken",oc_requesttoken),o.send()},w=function(e,t,o){let n=new XMLHttpRequest;n.addEventListener("load",o),n.open("POST",e),n.setRequestHeader("requesttoken",oc_requesttoken),n.setRequestHeader("Content-Type","application/x-www-form-urlencoded"),n.send(t)},{getConfig:function(e){B(Object(x.generateUrl)("apps/books/api/0.1/config"),(function(){e(JSON.parse(this.response))}))},getBooks:function(e){B(Object(x.generateUrl)("apps/books/api/0.1/books"),(function(){e(JSON.parse(this.response))}))},getLocation:function(e,t){B(Object(x.generateUrl)("apps/books/api/0.1/loc/"+e),(function(){t(JSON.parse(this.response))}))},saveProgress:function(e,t,o){let n=`id=${e}&progress=${t}`;w(Object(x.generateUrl)("apps/books/api/0.1/progress"),n,(function(){o(JSON.parse(this.response))}))},scan:function(e,t){let o="dir="+e;w(Object(x.generateUrl)("apps/books/api/0.1/scan"),o,(function(){t(JSON.parse(this.response))}))},reset:function(e){w(Object(x.generateUrl)("apps/books/api/0.1/reset"),"",(function(){e(JSON.parse(this.response))}))}}),document.addEventListener("DOMContentLoaded",(function(){OCA.Books.Core.init()}))}});