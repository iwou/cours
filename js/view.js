var db;
var currjson;
var modal = document.getElementById("Loading");
if ((!window.indexedDB) || !('fetch' in window) || !('serviceWorker' in navigator)) {
    location.href = "Unsupported.html";
}
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
function getComments(elem) {
    var children = elem.childNodes;
    var comments = [];
    for (var i = 0, len = children.length; i < len; i++) {
        if (children[i].nodeType == Node.COMMENT_NODE) {
            comments.push(children[i]);
        }
    }
    return comments;
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
function loadpagejson(data,push) {
    document.getElementById("off").disabled = false;
    currjson = data;
    if(!push){
        var stateObj = { url: data["Path"] };
        history.pushState(stateObj, "", '?' + data["Path"]);
    }
    document.title = document.getElementById("Htext").innerText = document.getElementById("Ttext").innerText = data["Title"] ? data["Title"] : "Untitled";
    document.getElementsByTagName("html")[0].setAttribute("lang",data["Lang"]);
    setmetaattr("desc", data["Description"]);
    setmetaattr("desc1", data["Description"]);
    setmetaattr("desc2", data["Description"]);
    setmetaattr("keyw", data["Keywords"]);
    setmetaattr("title1", data["Title"]);
    setmetaattr("title2", data["Title"]);
    setmetaattr("img1", data["Img"]);
    setmetaattr("img2", data["Img"]);
    document.getElementById("content").innerHTML = "";
    document.getElementById("content").appendChild(parse_content(data["Content"]));
    var Udate = new Date(data["Updated"]);
    document.getElementById("Mtext").innerText = " - Updated " + Udate.getDate() + '/' + Udate.getMonth() + '/' + Udate.getFullYear() + ' ' + pad(Udate.getHours(), 2) + ':' + pad(Udate.getMinutes(), 2);
    modal.className = "modal modal-hidden";
}
function savetocache(data,quiet){
    if(db){
        var transaction = db.transaction(["Cours"], "readwrite");
        transaction.oncomplete = function(event) {
           if(!quiet){
              showmsg("Saved Successfully");
          }
        };

        transaction.onerror = function(event) {
            if(!quiet){
              showmsg("Save Failed");
            }
        };

        var objectStore = transaction.objectStore("Cours");
          var request = objectStore.add(data);
          request.onsuccess = function(event) {

          };
    }
}
function clearccard(t){
    del_cached(t.parentElement.getAttribute('data-url'));
    t.parentElement.remove();
}
function list_cached(){
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
              var d = make(["div", { class: "card", "data-url": cursor.value.Path},
                                   ["a", { class: "container link", "href": '?' + cursor.value.Path},
                                       ["h4",["b",cursor.value.Title]],
                                       ["p",cursor.value.Description]
                                   ],
                                   ["span",{class: "closebtn",onclick: "clearccard(this)"},"×"]
                                   ]);
            document.getElementById("content").appendChild(d);
            cursor.continue();
          }
          else {

          }
        };
    }
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
function load_cached(url, push, redirect) {
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
function update_from_net(url){
    fetch((url.slice(-1) !== "/" ? url : "/index") + '.json')
        .then(function (response){
            if ((response.status !== 200) || (response.headers.get("content-type").indexOf("application/json")) == -1) {
                return 0;
            }else{
                response.json().then(function (data) {
                    if (currjson["Updated"] !== data["Updated"]){
                        del_cached(url,true);
                        savetocache(data,true);
                        loadpagejson(data);
                    }
                }); 
            }
        })
}
function load_page(url, push) {
    if(url == "/Cached"){
        var stateObj = { url: "/Cached" };
        history.pushState(stateObj, "", "/?/Cached");
        list_cached();
        modal.className = "modal modal-hidden";
    }else if(url == "/404"){
        neterror();
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
              fromnet(url,push);
          }
        };
    }else{
        fromnet(url,push);
    }}
}
function neterror(statusc){
    document.getElementById("off").disabled = true;
    var stateObj = { url: "/404"};
    history.pushState(stateObj, "", "?/404");
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
    var Udate = new Date(Date.now());
    document.getElementById("Mtext").innerText = " - Updated " + Udate.getDate() + '/' + Udate.getMonth() + '/' + Udate.getFullYear() + ' ' + pad(Udate.getHours(), 2) + ':' + pad(Udate.getMinutes(), 2);
    modal.className = "modal modal-hidden";
    var statuscode = document.createElement('meta');
    statuscode.setAttribute('name', 'prerender-status-code');
    statuscode.setAttribute('content', statusc ? statusc : "404");
    document.getElementsByTagName('head')[0].appendChild(statuscode);
    return;
}
function fromnet(url,push,redirect){
    modal.className = "modal modal-visible";
    fetch((url.slice(-1) !== "/" ? url : "/index") + '.json')
        .then(function (reponse) {
        if ((reponse.status !== 200) || (reponse.headers.get("content-type").indexOf("application/json")) == -1) {
               neterror(reponse.status.toString());
        } else {
            reponse.json().then(function (data) {
                loadpagejson(data, push);
            });
        }
    }).catch(neterror);
}
window.onpopstate = function (e) {
    if (e.state) {
        load_page(e.state.url,true);
    }
};
document.addEventListener('click', function (e) {
    var tag = e.target;
    if (tag.tagName == 'A' && tag.href && e.button == 0) {
        if (tag.origin == document.location.origin) {
            var newPath = tag.search.substring(1).split("&")[0];
            if (tag.pathname == location.pathname) {
                e.preventDefault();
                load_page(newPath);
            }
        }
    }
});
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

var query = window.location.search.substring(1);

request.onerror = function (event) {
    showmsg("Why didn't you allow my web app to use IndexedDB?!");
    if (script.hasAttribute('data-autostart')) {
        loaddom();
        document.getElementById("offswitch").style.visibility = "hidden";
    }
};
function loaddom(){
    var q = location.search.substring(1).split("&")[0];
    var href = location.href;
    if(q == ""){ 
        q = '/';
        href = href + '/?/';
    }
    var stateObj = { url: q };
    history.replaceState(stateObj, "", location.href);
    load_page(q, true, true);
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
