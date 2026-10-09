1:"$Sreact.fragment"
d:"/khalij-digital-platform/_next/static/chunks/27gjg8e11zukd.js"
e:I[68027,["$d"],"default",1]
:HL["/khalij-digital-platform/_next/static/chunks/2irz1d4-4hcrx.css","style"]
2:T108e,(function () {
  if (window.__khalijBridge) return;
  window.__khalijBridge = true;
  var API_URL = "https://base44.app/api/apps/6a74dc8dc6a9c9d7bc3ef6d1/functions/khalijApi";
  var TOKEN_KEY = "khalij_token";
  window.khalijGetToken = function () {
    try { return window.localStorage.getItem(TOKEN_KEY) || ""; } catch (e) { return ""; }
  };
  function clearToken() {
    try { window.localStorage.removeItem(TOKEN_KEY); } catch (e) {}
  }
  function headerValue(headers, name) {
    if (!headers) return "";
    try {
      if (headers instanceof Headers) return headers.get(name) || "";
      if (Array.isArray(headers)) {
        for (var i = 0; i < headers.length; i++) {
          if (String(headers[i][0]).toLowerCase() === name.toLowerCase()) return String(headers[i][1]);
        }
        return "";
      }
      if (typeof headers === "object") {
        for (var k in headers) {
          if (k.toLowerCase() === name.toLowerCase()) return String(headers[k]);
        }
      }
    } catch (e) {}
    return "";
  }
  var origFetch = window.fetch.bind(window);
  window.fetch = async function (input, init) {
    var url = "";
    if (typeof input === "string") url = input;
    else if (input && input instanceof URL) url = input.toString();
    else if (input && typeof input.url === "string") url = input.url;
    if (url.indexOf("/api/") !== 0) return origFetch(input, init);
    var method = ((init && init.method) || "GET").toUpperCase();
    var u = new URL(url, "https://khalij.local");
    var path = u.pathname;
    var query = u.search ? u.search.slice(1) : "";
    var body = {};
    if (init && typeof init.body === "string") {
      try { body = JSON.parse(init.body); } catch (e) { body = {}; }
    }
    var adminKey = "";
    var auth = headerValue(init && init.headers, "authorization") || headerValue(init && init.headers, "x-admin-key");
    if (auth && auth.toLowerCase().indexOf("bearer ") === 0) adminKey = auth.slice(7);
    else if (auth) adminKey = auth;
    var res = await origFetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: path,
        query: query,
        method: method,
        body: body,
        token: window.khalijGetToken(),
        adminKey: adminKey,
      }),
    });
    var data = {};
    try { data = await res.json(); } catch (e) { data = {}; }
    if (data && typeof data.token === "string") {
      try { window.localStorage.setItem(TOKEN_KEY, data.token); } catch (e) {}
    }
    if (path === "/api/auth/logout") clearToken();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  };
  window.apiDownload = async function (apiPath) {
    try {
      var res = await window.fetch(apiPath);
      var data = {};
      try { data = await res.json(); } catch (e) {}
      if (!res.ok) { alert((data && data.error) || "تعذر تحميل المنتج"); return; }
      if (data.url) { window.open(data.url, "_blank", "noopener,noreferrer"); return; }
      if (data.contentBase64) {
        var bin = atob(data.contentBase64);
        var bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        var blob = new Blob([bytes], { type: data.contentType || "application/octet-stream" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = data.fileName || "khalij-product";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
        return;
      }
      if (data.content) {
        var blob2 = new Blob([data.content], { type: (data.contentType || "text/plain") + ";charset=utf-8" });
        var a2 = document.createElement("a");
        a2.href = URL.createObjectURL(blob2);
        a2.download = data.fileName || "khalij-product.md";
        document.body.appendChild(a2);
        a2.click();
        a2.remove();
        URL.revokeObjectURL(a2.href);
        return;
      }
      alert("لا يوجد ملف متاح لهذا المنتج");
    } catch (e) { alert("تعذر تحميل المنتج"); }
  };
})();9:X
a:[["children",{"s":"__PAGE__","h":512,"d":{"r":"$Lb","p":false,"v":null}}]]
7:[["children",{"s":"sell","h":512,"d":{"r":"$L8","p":false,"v":"$9"},"c":"$Qa"}]]
0:{"P":null,"c":["","sell",""],"q":"","i":false,"t":{"t":{"s":"","h":528,"d":{"r":["$","$1","c",{"children":[[["$","link","0",{"rel":"stylesheet","href":"/khalij-digital-platform/_next/static/chunks/2irz1d4-4hcrx.css","precedence":"next","crossOrigin":"$undefined","nonce":"$undefined"}],["$","script","script-0",{"src":"/khalij-digital-platform/_next/static/chunks/27gjg8e11zukd.js","async":true,"nonce":"$undefined"}]],["$","html",null,{"lang":"ar","dir":"rtl","children":["$","body",null,{"className":"min-h-screen bg-slate-950 text-slate-100 antialiased","children":[["$","script",null,{"dangerouslySetInnerHTML":{"__html":"$2"}}],"$L3","$L4","$L5","$L6"]}]}]]}],"p":false,"v":null},"c":"$Q7"},"h":{"r":"$Lc","p":false,"v":null}},"m":"$undefined","G":["$e",["$Lf"]],"S":true,"r":"$undefined","s":"$undefined","a":"$undefined","l":"$undefined","p":"$undefined","d":"$undefined","b":"ZppN1W6-iC0Rzq-EXM3d2"}
11:I[22016,["$d"],""]
12:I[39756,["$d"],"default"]
13:"/khalij-digital-platform/_next/static/chunks/3ubgqh20klx6d.js"
14:I[58298,["$d","$13"],"default"]
15:I[37457,["$d"],"default"]
16:I[47257,["$d"],"ClientPageRoot"]
17:"/khalij-digital-platform/_next/static/chunks/05ck6tpoj4i1x.js"
18:I[5857,["$d","$17"],"default"]
1b:I[97367,["$d"],"OutletBoundary"]
1c:"$Sreact.suspense"
1e:"ViewportBoundary"
1f:I[97367,["$d"],"$1e"]
21:"MetadataBoundary"
22:I[97367,["$d"],"$21"]
10:T63c,
window.addEventListener("error", function (e) {
  var t = "JSERR: " + (e.message || "").slice(0, 150) + " @" + (e.filename || "").split("/").pop() + ":" + e.lineno;
  document.title = t;
  try { var d = document.createElement("div"); d.id = "diag"; d.style.cssText = "position:fixed;top:0;right:0;left:0;background:red;color:#fff;z-index:99999;padding:8px;font-size:12px"; d.textContent = t; document.body.appendChild(d); } catch (err) {}
});
window.addEventListener("unhandledrejection", function (e) {
  var t = "REJECT: " + String(e.reason).slice(0, 150);
  document.title = t;
  try { var d = document.createElement("div"); d.id = "diag2"; d.style.cssText = "position:fixed;top:30px;right:0;left:0;background:darkred;color:#fff;z-index:99999;padding:8px;font-size:12px"; d.textContent = t; document.body.appendChild(d); } catch (err) {}
});
setTimeout(function () {
  if (!window.__khalijBridge) {
    var t = "NO BRIDGE INSTALLED";
    document.title = t;
    try { var d = document.createElement("div"); d.id = "diag3"; d.style.cssText = "position:fixed;top:60px;right:0;left:0;background:orange;color:#000;z-index:99999;padding:8px;font-size:12px"; d.textContent = t; document.body.appendChild(d); } catch (err) {}
  } else {
    var t2 = "BRIDGE OK, fetch=" + (typeof window.fetch);
    document.title = t2;
    try { var d2 = document.createElement("div"); d2.id = "diag4"; d2.style.cssText = "position:fixed;top:60px;right:0;left:0;background:teal;color:#fff;z-index:99999;padding:8px;font-size:12px"; d2.textContent = t2; document.body.appendChild(d2); } catch (err) {}
  }
}, 4000);
3:["$","script",null,{"dangerouslySetInnerHTML":{"__html":"$10"}}]
4:["$","header",null,{"className":"sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur","children":["$","div",null,{"className":"mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3","children":[["$","$L11",null,{"href":"/","className":"flex shrink-0 items-center gap-2 text-xl font-extrabold","children":[["$","span",null,{"className":"flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 font-bold","children":"خ"}],["$","span",null,{"children":["منصة",["$","span",null,{"className":"text-amber-400","children":"الخليج"}]]}]]}],["$","nav",null,{"className":"flex max-w-full items-center gap-1 overflow-x-auto whitespace-nowrap pb-1 text-sm font-medium sm:gap-2 sm:pb-0","children":[["$","$L11",null,{"href":"/","className":"rounded-lg px-3 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white","children":"المتجر"}],["$","$L11",null,{"href":"/dashboard","className":"rounded-lg px-3 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white","children":"لوحة البائع"}],["$","$L11",null,{"href":"/register","className":"rounded-lg px-3 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white","children":"حساب بائع"}],["$","$L11",null,{"href":"/sell","className":"rounded-lg bg-gradient-to-l from-amber-400 to-orange-500 px-4 py-2 font-bold text-slate-950 transition hover:opacity-90","children":"+ ابدأ البيع"}]]}]]}]}]
5:["$","$L12",null,{"parallelRouterKey":"children","error":"$14","errorStyles":[],"errorScripts":[["$","script","script-0",{"src":"/khalij-digital-platform/_next/static/chunks/3ubgqh20klx6d.js","async":true,"nonce":"$undefined"}]],"template":["$","$L15",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[[["$","title",null,{"children":"404: This page could not be found."}],["$","div",null,{"style":{"fontFamily":"system-ui,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\"","height":"100vh","textAlign":"center","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center"},"children":["$","div",null,{"children":[["$","style",null,{"dangerouslySetInnerHTML":{"__html":"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}"}}],["$","h1",null,{"className":"next-error-h1","style":{"display":"inline-block","margin":"0 20px 0 0","padding":"0 23px 0 0","fontSize":24,"fontWeight":500,"verticalAlign":"top","lineHeight":"49px"},"children":404}],["$","div",null,{"style":{"display":"inline-block"},"children":["$","h2",null,{"style":{"fontSize":14,"fontWeight":400,"lineHeight":"49px","margin":0},"children":"This page could not be found."}]}]]}]}]],[]],"forbidden":"$undefined","unauthorized":"$undefined"}]
6:["$","footer",null,{"className":"border-t border-white/10 py-8 text-center text-sm text-slate-500","children":["$","p",null,{"children":"منصة الخليج للمنتجات الرقمية — بيع أعمالك الرقمية واستقبل أرباحك مباشرة بـ PayPal والعملات الرقمية"}]}]
8:["$","$1","c",{"children":[null,["$","$L12",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L15",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":"$undefined","forbidden":"$undefined","unauthorized":"$undefined"}]]}]
b:["$","$1","c",{"children":[["$","$L16",null,{"Component":"$18","serverProvidedParams":{"searchParams":{},"params":{},"promises":["$@19","$@1a"]}}],[["$","script","script-0",{"src":"/khalij-digital-platform/_next/static/chunks/05ck6tpoj4i1x.js","async":true,"nonce":"$undefined"}]],["$","$L1b",null,{"children":["$","$1c",null,{"name":"Next.MetadataOutlet","children":"$@1d"}]}]]}]
c:["$","$1","h",{"children":[null,["$","$L1f",null,{"children":"$L20"}],["$","$L22",null,{"children":[["$","div",null,{"hidden":true,"children":["$","$1c",null,{"name":"Next.Metadata","children":"$L23"}]}],null]}],null]}]
f:["$","link","0",{"rel":"stylesheet","href":"/khalij-digital-platform/_next/static/chunks/2irz1d4-4hcrx.css","precedence":"next","crossOrigin":"$undefined","nonce":"$undefined"}]
9:C
19:{}
1a:"$b:props:children:0:props:serverProvidedParams:params"
20:[["$","meta","0",{"charSet":"utf-8"}],["$","meta","1",{"name":"viewport","content":"width=device-width, initial-scale=1"}]]
1d:null
23:[["$","title","0",{"children":"منصة الخليج للمنتجات الرقمية"}],["$","meta","1",{"name":"description","content":"منصة عربية لبيع المنتجات الرقمية مع قبول PayPal والعملات الرقمية ومشاركة المتاجر والمنتجات بسهولة."}],["$","meta","2",{"property":"og:title","content":"منصة الخليج للمنتجات الرقمية"}],["$","meta","3",{"property":"og:description","content":"اكتشف وشارك أفضل المنتجات الرقمية من البائعين العرب."}],["$","meta","4",{"property":"og:site_name","content":"منصة الخليج للمنتجات الرقمية"}],["$","meta","5",{"property":"og:locale","content":"ar_AR"}],["$","meta","6",{"property":"og:type","content":"website"}],["$","meta","7",{"name":"twitter:card","content":"summary_large_image"}],["$","meta","8",{"name":"twitter:title","content":"منصة الخليج للمنتجات الرقمية"}],["$","meta","9",{"name":"twitter:description","content":"اكتشف وشارك أفضل المنتجات الرقمية من البائعين العرب."}]]
