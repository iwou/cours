if ((!window.indexedDB) || !('fetch' in window) || !('serviceWorker' in navigator)) {
    location.href = "Unsupported.html";
}
var db,currjson;
var modal = document.getElementById("Loading");
function isArray(a) {
    return Object.prototype.toString.call(a) === "[object Array]";
}
function make(desc) {
    if (!isArray(desc)) {
        return make.call(this, Array.prototype.slice.call(arguments));
    }
    var name = desc[0];
    var attributes = desc[1];
    var el = document.createElement(name);
    var start = 1;
    if (typeof attributes === "object" && attributes !== null && !isArray(attributes)) {
        for (var attr in attributes) {
            el.setAttribute(attr, attributes[attr]);
        }
        start = 2;
    }
    for (var i = start; i < desc.length; i++) {
        if (isArray(desc[i])) {
            el.appendChild(make(desc[i]));
        }
        else {
            el.appendChild(document.createTextNode(desc[i]));
        }
    }
    return el;
}
function createcard(arr) {
    var d = make(["div", { class: "card" }, ["div", { class: "container markdown-body cnt" }]]);
    for (var i = 0; i < arr.length; i++) {
        d.firstElementChild.appendChild(make(arr[i]));
    }
    return d;
}
function parse_content(arr) {
    var ret = document.createDocumentFragment();
    for (var i = 0; i < arr.length; i++) {
        ret.appendChild(createcard(arr[i]));
    }
    return ret;
}
function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) {
            return pair[1];
        }
    }
    return (false);
}
function pushH(data,url) {
	if(data){
		var stateObj = { url: data["Path"] , json: data};
 		history.pushState(stateObj, "",  data["Path"]);
 	}else{
 		var stateObj = { url: url};
 		history.pushState(stateObj, "",  url);
 	}  
}
function pad(str, num) {
    return str.toString().padStart(num, '0');
}
function setmetaattr(id, content) {
    document.getElementById(id).setAttribute("content", content ? content : "");
}
function showmsg(msg) {
    var x = document.getElementById("snackbar");
    x.innerText = msg;
    x.className = "show";
    setTimeout(function () { x.className = x.className.replace("show", ""); }, 3000);
}
function loadpagejson(data) {
    document.getElementById("off").disabled = false;
    currjson = data;
    document.title = document.getElementById("Htext").innerText = document.getElementById("Ttext").innerText = data["Title"] ? data["Title"] : "Untitled";
    document.getElementsByTagName("html")[0].setAttribute("lang",data["Lang"] !== "" ? data["Lang"] : "en");
    setmetaattr("desc", data["Description"]);
    setmetaattr("desc1", data["Description"]);
    setmetaattr("desc2", data["Description"]);
    setmetaattr("keyw", data["Keywords"]);
    setmetaattr("title1", data["Title"]);
    setmetaattr("title2", data["Title"]);
    
    setmetaattr("img1", location.hostname + (data["Image"] !== "" ? data["Image"] : "/images/social-banner.jpg"));
    setmetaattr("img2", location.hostname + (data["Image"] !== "" ? data["Image"] : "/images/social-banner.jpg"));
    document.getElementById("content").innerHTML = "";
    document.getElementById("content").appendChild(parse_content(data["Content"]));
    var Udate = new Date(data["Updated"]);
    document.getElementById("Mtext").innerText = " - Updated " + Udate.getDate() + '/' + Udate.getMonth() + '/' + Udate.getFullYear() + ' ' + pad(Udate.getHours(), 2) + ':' + pad(Udate.getMinutes(), 2);
    modal.className = "modal modal-hidden";
}
function savetocache(data,quiet){
    if(db){
        var transaction = db.transaction(["Cours"], "readwrite");
        transaction.oncomplete = function(event) {if(!quiet){showmsg("Saved Successfully");}};
        transaction.onerror = function(event) {showmsg("Save Failed");};
        var objectStore = transaction.objectStore("Cours");
        var request = objectStore.add(data);
    }
}
function clearccard(t){
    del_cached(t.parentElement.getAttribute('data-url'));
    t.parentElement.remove();
}
function list_cached(){
	currjson = null;
    document.title = document.getElementById("Htext").innerText = document.getElementById("Ttext").innerText = "Cached Articles";
    var Udate = new Date(Date.now());
    document.getElementById("Mtext").innerText = " - Updated " + Udate.getDate() + '/' + Udate.getMonth() + '/' + Udate.getFullYear() + ' ' + pad(Udate.getHours(), 2) + ':' + pad(Udate.getMinutes(), 2);
    document.getElementById("off").disabled = true;
    if(db){
        var objectStore = db.transaction("Cours").objectStore("Cours");
        document.getElementById("content").innerHTML = "";
        objectStore.openCursor().onsuccess = function(event) {
        var cursor = event.target.result;
          if (cursor) {
          document.getElementById("content").appendChild(make(["div", { class: "card", "data-url": cursor.value.Path, "onclick" : "gotourl('" +  cursor.value.Path + "');"},
                                   ["div", { class: "container"},
                                       ["h4",["b",cursor.value.Title]],
                                       ["p",cursor.value.Description]
                                   ],
                                   ["span",{class: "closebtn",onclick: "clearccard(this)"},"×"]
                                   ]));
           cursor.continue();
          }
        };
    }
}
function gotourl(url,e) {
	load_page(url);
	pushH(currjson,url);
	if(e){
		e.preventDefault();
	}
}
function list_cached2() {
    var stateObj = { url: "/Cached" };
    history.pushState(stateObj, "", "/Cached");
    list_cached();
}
function del_cached(url,quiet) {
     if(db){
        var transaction = db.transaction(["Cours"]);
        var objectStore = transaction.objectStore("Cours");
        var index = objectStore.index("Path");
        index.get(url).onsuccess = function(event) {
          if(!event.target.result){
              return 0;
          }else{
              var request = db.transaction(["Cours"], "readwrite")
                .objectStore("Cours")
                .delete(event.target.result.id);
                request.onsuccess = function(event) {
                    if(!quiet){
                        showmsg("Deleted Successfully");
                    } 
                };
          }
        };
    }
}
function load_cached(url) {
    if(db){
        var transaction = db.transaction(["Cours"]);
        var objectStore = transaction.objectStore("Cours");
        var index = objectStore.index("Path");
        index.get(url).onsuccess = function(event) {
          if(!event.target.result){
              return 0;
          }else{
              loadpagejson(event.target.result);
          }
        };
    }
}
function resolvejson(url,ok,err){
	fetch(url + (url.slice(-1) !== "/" ? "" : "index") + '.json')
		.then(function (response){if (response.status !== 200) {err(response.status.toString());}else{response.json().then(ok);}})
		.catch(function(){err(null);});
}
function update_from_net(url){
	resolvejson(url,function (data) {
                    if (currjson["Updated"] !== data["Updated"]){
                        del_cached(url,true);
                        savetocache(data,true);
                        loadpagejson(data);
                    }},function() {return ;});
}
function load_page(url) {
	var query = window.location.search.substring(1);
	if((url == '/') && (query.charAt(0) == '/')){
		//if(confirm("Do You Want To Load Unverified Content? It Can Steal And Control Your Data!")){
			loadpagejson(JSON.parse(atob(query.substring(1))));
			document.getElementById("off").disabled = true;
			modal.className = "modal modal-hidden";
		//}
	}else if(url == "/Cached"){
        list_cached();
        modal.className = "modal modal-hidden";
    }else{
     if(db){
        var transaction = db.transaction(["Cours"]);
        var objectStore = transaction.objectStore("Cours");
        var index = objectStore.index("Path");
        index.get(url).onsuccess = function(event) {
          if(event.target.result){
              document.getElementById("off").checked = true;
              load_cached(url);
              update_from_net(url);
          }else{
              document.getElementById("off").checked = false;
              fromnet(url);
          }
        };
    }else{
        fromnet(url);
    }}
}
function neterror(statusc){
    document.getElementById("off").disabled = true;
    document.title = document.getElementById("Htext").innerText = document.getElementById("Ttext").innerText = "Page Not Found";
    setmetaattr("desc", "Page Not Found");
    setmetaattr("desc1", "Page Not Found");
    setmetaattr("desc2", "Page Not Found");
    setmetaattr("keyw", "Page Not Found");
    setmetaattr("title1", "Page Not Found");
    setmetaattr("title2", "Page Not Found");
    setmetaattr("img1", "");
    setmetaattr("img2", "");
    document.getElementById("content").innerHTML = "";
    document.getElementById("content").appendChild(parse_content(
        [[
            ["p","Page Not Found"]
        ]]
    ));
    currjson = null;
    var Udate = new Date(Date.now());
    document.getElementById("Mtext").innerText = " - Updated " + Udate.getDate() + '/' + Udate.getMonth() + '/' + Udate.getFullYear() + ' ' + pad(Udate.getHours(), 2) + ':' + pad(Udate.getMinutes(), 2);
    modal.className = "modal modal-hidden";
    var statuscode = document.createElement('meta');
    statuscode.setAttribute('name', 'prerender-status-code');
    statuscode.setAttribute('content', statusc ? statusc : "404");
    document.getElementsByTagName('head')[0].appendChild(statuscode);
    return;
}
function fromnet(url){
    modal.className = "modal modal-visible";
    resolvejson(url,function (data) {
        loadpagejson(data);
    },neterror);
}
window.onpopstate = function (e) {
    if(e.state.json){
        loadpagejson(e.state.json);  
    }else{
    	load_page(location.pathname);
    }
};

document.addEventListener('click', function (e) {
    var tag = e.target;
    if (tag.tagName == 'A' && tag.href && e.button == 0) {
        if (tag.origin == location.origin) {
            var newPath = tag.pathname;
            load_page(newPath);
            pushH(currjson,newPath);
            e.preventDefault();
        }
    }
});

function copyStringToClipboard (str) {
   var el = document.createElement('textarea');
   el.value = str;
   el.setAttribute('readonly', '');
   el.style = {position: 'absolute', left: '-9999px'};
   document.body.appendChild(el);
   el.select();
   document.execCommand('copy');
   document.body.removeChild(el);
}

function share() {
	if (navigator.share !== undefined) {
    navigator.share({
      title: document.title,
      url: location.href
    }).catch(function() {
      	copyStringToClipboard(location.href);
	  	showmsg("Copied To The ClipBoard");
      });
  } else {
    copyStringToClipboard(location.href);
  	showmsg("Copied To The ClipBoard");
  }
}

function tourl() {
	if(currjson){
	var durl = location.host + '/?/' + btoa(JSON.stringify(currjson));
	if (navigator.share !== undefined) {
    navigator.share({
      title: document.title,
      url: durl
    }).catch(function() {
      	copyStringToClipboard(durl);
	  	showmsg("Copied To The ClipBoard");
      });
	  } else {
	    copyStringToClipboard(durl);
	  	showmsg("Copied To The ClipBoard");
	  }
  }
}

document.getElementById("toggle-box-checkbox").addEventListener("change", function () {
    if (this.checked) {
        document.body.classList.add('night');
        localStorage.setItem('theme', 'dark');
    }
    else {
        document.body.classList.remove('night');
        localStorage.setItem('theme', 'light');
    }
});
document.getElementById("off").addEventListener("change", function () {
    if (this.checked) {
        savetocache(currjson);
    }
    else {
        del_cached(currjson.Path);
    }
});
window.addEventListener('storage', function (e) {
    if (localStorage.getItem('theme') == "light") {
        document.getElementById("toggle-box-checkbox").checked = false;
        document.body.classList.remove('night');
    }
    else {
        document.getElementById("toggle-box-checkbox").checked = true;
        document.body.classList.add('night');
    }
});
var script = document.currentScript || (function () {
    var scripts = document.getElementsByTagName("script");
    return scripts[scripts.length - 1];
})();

var request = indexedDB.open("Cache",2);

request.onerror = function (event) {
    showmsg("Why didn't you allow my web app to use IndexedDB?!");
    if (script.hasAttribute('data-autostart')) {
        loaddom();
        document.getElementById("offswitch").style.visibility = "hidden";
    }
};
function loaddom(){
    load_page(location.pathname);
    var stateObj = { url: location.pathname , json: currjson };
    history.replaceState(stateObj, "", location.href);
    window.prerenderReady = false;
}
request.onsuccess = function (event) {
db = event.target.result;
if (script.hasAttribute('data-autostart')) {
    loaddom();
}

db.onerror = function(event) {
  showmsg("Database error: " + event.target.errorCode);
};

};
request.onupgradeneeded = function(event) {  
  db = event.target.result;
  var objectStore = db.createObjectStore("Cours", { keyPath: "id" });
  objectStore.createIndex("Title", "Title", { unique: false });
  objectStore.createIndex("Path", "Path", { unique: true });
};

window.addEventListener('load', function() {
navigator.serviceWorker.register('/sw.js').then(function(registration) {
}, function(err) {
  showmsg("Install Failed");
});
});
navigator.serviceWorker.addEventListener('message', function(event) {
	if(event.data["func"] == "msg"){
		showmsg(event.data["msg"]);
	}
});
window.onscroll = function() {
  var winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  var scrolled = (winScroll / height) * 100;
  document.getElementById("myBar").style.width = scrolled + "%";
}
