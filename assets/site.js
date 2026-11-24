/* QuickeR site behaviour. No dependencies besides the vendored qrcode-generator. */
(function () {
  "use strict";
  var root = document.documentElement;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Preferences ---------- */
  function loadPrefs() { try { return JSON.parse(localStorage.getItem("quicker-site") || "{}"); } catch (e) { return {}; } }
  function savePrefs(p) { try { localStorage.setItem("quicker-site", JSON.stringify(p)); } catch (e) {} }
  var prefs = loadPrefs();
  var systemDark = matchMedia("(prefers-color-scheme: dark)");

  function syncThemeColor() {
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.content = getComputedStyle(root).getPropertyValue("--surface").trim() || "#f8f9ff";
  }

  /* ---------- Theme toggle: auto → light → dark ---------- */
  var themeBtn = $("#themeBtn"), themeIcon = $("#themeIcon");
  var MODES = ["auto", "light", "dark"];
  var ICONS = { auto: "brightness_auto", light: "light_mode", dark: "dark_mode" };
  var LABELS = { auto: "Theme: follow system", light: "Theme: light", dark: "Theme: dark" };

  function applyMode(pref) {
    root.dataset.pref = pref;
    root.dataset.mode = pref === "dark" || (pref === "auto" && systemDark.matches) ? "dark" : "light";
    themeIcon.textContent = ICONS[pref];
    themeBtn.setAttribute("aria-label", LABELS[pref]);
    syncThemeColor();
  }
  applyMode(root.dataset.pref || "auto");

  function withReveal(evt, change) {
    if (!document.startViewTransition || reduceMotion) { change(); return; }
    var r = evt.currentTarget.getBoundingClientRect();
    var x = r.left + r.width / 2, y = r.top + r.height / 2;
    var end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.classList.add("theme-vt");
    var vt = document.startViewTransition(change);
    vt.ready.then(function () {
      root.animate(
        { clipPath: ["circle(0px at " + x + "px " + y + "px)", "circle(" + end + "px at " + x + "px " + y + "px)"] },
        { duration: 550, easing: "cubic-bezier(.2,0,0,1)", pseudoElement: "::view-transition-new(root)" }
      );
    });
    vt.finished.finally(function () { root.classList.remove("theme-vt"); });
  }

  themeBtn.addEventListener("click", function (e) {
    var next = MODES[(MODES.indexOf(root.dataset.pref || "auto") + 1) % 3];
    var willBeDark = next === "dark" || (next === "auto" && systemDark.matches);
    var visualChange = willBeDark !== (root.dataset.mode === "dark");
    prefs.mode = next; savePrefs(prefs);
    if (visualChange) withReveal(e, function () { applyMode(next); });
    else applyMode(next);
  });
  systemDark.addEventListener("change", function () { if ((root.dataset.pref || "auto") === "auto") applyMode("auto"); });

  /* ---------- Accent popover ---------- */
  var accentBtn = $("#accentBtn"), accentPop = $("#accentPop");
  function markAccent() {
    $$(".swatches button").forEach(function (b) { b.setAttribute("aria-checked", String(b.dataset.accent === root.dataset.accent)); });
  }
  markAccent();
  function setPop(open) {
    accentPop.hidden = !open;
    accentBtn.setAttribute("aria-expanded", String(open));
  }
  accentBtn.addEventListener("click", function (e) { e.stopPropagation(); setPop(accentPop.hidden); });
  accentPop.addEventListener("click", function (e) { e.stopPropagation(); });
  document.addEventListener("click", function () { if (!accentPop.hidden) setPop(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !accentPop.hidden) { setPop(false); accentBtn.focus(); } });
  $$(".swatches button").forEach(function (b) {
    b.addEventListener("click", function (e) {
      if (b.dataset.accent === root.dataset.accent) return;
      withReveal(e, function () {
        root.dataset.accent = b.dataset.accent;
        markAccent(); syncThemeColor();
      });
      prefs.accent = b.dataset.accent; savePrefs(prefs);
    });
  });

  /* ---------- Mobile menu ---------- */
  var menuBtn = $("#menuBtn"), sheet = $("#menuSheet");
  function setMenu(open) {
    sheet.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.firstElementChild.textContent = open ? "close" : "menu";
    if (open) { sheet.classList.remove("sheet-in"); void sheet.offsetWidth; sheet.classList.add("sheet-in"); }
  }
  menuBtn.addEventListener("click", function () { setMenu(sheet.hidden); });
  $$("a", sheet).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });

  /* ---------- Bar state + current section ---------- */
  var bar = $("#bar");
  function onScroll() { bar.classList.toggle("scrolled", scrollY > 8); }
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  if ("IntersectionObserver" in window) {
    var navLinks = $$('.nav a[href^="#"]');
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.toggle("on", a.getAttribute("href") === "#" + en.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("section[id]").forEach(function (s) { spy.observe(s); });

    if (!reduceMotion) {
      var rev = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("in"); rev.unobserve(en.target); }
        });
      }, { rootMargin: "0px 0px -8% 0px" });
      $$(".head, .feat, .shot, .play, .desk, .release, .faq details, .support, .nos-list li").forEach(function (el, i) {
        el.classList.add("reveal");
        var sib = Array.prototype.indexOf.call(el.parentNode.children, el);
        el.style.transitionDelay = Math.min(sib, 8) * 50 + "ms";
        rev.observe(el);
      });
    }
  }

  /* ---------- Desktop screen tabs ---------- */
  var deskImg = $("#deskImg"), deskCap = $("#deskCap"), deskTabs = $$(".desk-tabs button");
  var deskCurrent = deskTabs[0];
  function showDesk(btn) {
    deskCurrent = btn;
    deskTabs.forEach(function (b) { b.setAttribute("aria-selected", String(b === btn)); });
    var name = root.dataset.mode === "dark" ? btn.dataset.dark : btn.dataset.light;
    var src = "assets/shots/" + name + ".webp";
    deskCap.textContent = btn.dataset.cap;
    if (deskImg.getAttribute("src") === src) return;
    var pre = new Image();
    pre.onload = function () {
      deskImg.classList.add("swap");
      setTimeout(function () {
        deskImg.src = src;
        deskImg.alt = "QuickeR on desktop: " + btn.textContent.toLowerCase();
        deskImg.classList.remove("swap");
      }, reduceMotion ? 0 : 180);
    };
    pre.src = src;
  }
  deskTabs.forEach(function (b) { b.addEventListener("click", function () { showDesk(b); }); });
  new MutationObserver(function () { showDesk(deskCurrent); }).observe(root, { attributes: true, attributeFilter: ["data-mode"] });
  showDesk(deskCurrent);

  /* ---------- Downloads: your system + live release info ---------- */
  function detectOS() {
    var ua = navigator.userAgent || "";
    if (/Android/i.test(ua)) return "android";
    if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
    if (/Windows/i.test(ua)) return "windows";
    if (/Mac OS X|Macintosh/i.test(ua)) return navigator.maxTouchPoints > 1 ? "ios" : "mac";
    if (/Linux|X11|CrOS/i.test(ua)) return "linux";
    return "";
  }
  var os = detectOS();
  var firstLink = os && $('.os[data-os="' + os + '"] li');
  if (firstLink) firstLink.classList.add("mine");

  function fmtSize(b) { return b >= 1e9 ? (b / 1e9).toFixed(1) + " GB" : Math.round(b / 1e6) + " MB"; }
  function fmtDate(s) {
    try { return new Date(s).toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" }); } catch (e) { return s.slice(0, 10); }
  }
  var EXTRA = [
    { re: /_amd64\.deb$/, os: "linux", icon: "terminal", title: ".deb package", sub: "Debian, Ubuntu and friends" },
    { re: /\.x86_64\.rpm$/, os: "linux", icon: "terminal", title: ".rpm package", sub: "Fedora, openSUSE and friends" },
    { re: /^QuickeR-macos\.zip$/, os: "mac", icon: "folder_zip", title: "Portable .zip", sub: "App bundle without the disk image" }
  ];
  function addLink(asset, spec) {
    var ul = $('.os[data-os="' + spec.os + '"] ul');
    if (!ul || $('[data-asset="' + CSS.escape(asset.name) + '"]', ul)) return;
    var li = document.createElement("li");
    li.innerHTML = '<a><span class="ms"></span><span><b></b><small></small></span><span class="ms go">download</span></a>';
    var a = li.firstChild;
    a.href = asset.browser_download_url; a.dataset.asset = asset.name;
    a.children[0].textContent = spec.icon;
    a.querySelector("b").textContent = spec.title;
    a.querySelector("small").textContent = spec.sub;
    ul.appendChild(li);
  }
  fetch("https://api.github.com/repos/ChoiceZero/QuickeR/releases/latest", { headers: { Accept: "application/vnd.github+json" } })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
    .then(function (rel) {
      var ver = (rel.tag_name || "").replace(/^v/, "");
      if (ver) { $("#relVer").textContent = ver; $("#eyebrowVer").textContent = "v" + ver; }
      if (rel.published_at) $("#relMeta").textContent = "Released " + fmtDate(rel.published_at) + ". Free, forever. No sign-up between you and the file.";
      (rel.assets || []).forEach(function (asset) {
        EXTRA.forEach(function (spec) { if (spec.re.test(asset.name)) addLink(asset, spec); });
      });
      (rel.assets || []).forEach(function (asset) {
        var a = $('[data-asset="' + CSS.escape(asset.name) + '"]');
        if (!a) return;
        a.href = asset.browser_download_url;
        var small = $("small", a);
        if (small && !$(".size", small)) {
          var s = document.createElement("span"); s.className = "size";
          s.textContent = " · " + fmtSize(asset.size);
          small.appendChild(s);
        }
      });
    })
    .catch(function () { /* Static links already point at releases/latest. */ });

  /* ---------- Share ---------- */
  var shareBtn = $("#shareBtn");
  shareBtn.addEventListener("click", function () {
    var data = { title: "QuickeR", text: "QR codes without accounts, limits, ads or tracking.", url: location.href.split("#")[0] };
    if (navigator.share) { navigator.share(data).catch(function () {}); return; }
    var label = shareBtn.lastElementChild;
    navigator.clipboard.writeText(data.url).then(function () {
      label.textContent = "Link copied";
      setTimeout(function () { label.textContent = "Share QuickeR"; }, 2000);
    });
  });

  /* ---------- QR playground ---------- */
  var form = $("#playForm");
  if (!form || typeof qrcode !== "function") return;
  qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];
  var svg = $("#qrSvg"), frame = $("#qrFrame"), meta = $("#qrMeta");
  var warn = $("#contrastWarn"), eclHint = $("#eclHint");
  var logoInput = form.elements.logo, logoClear = $("#logoClear"), logoLabel = $("#logoLabel");
  var type = "text", logo = null, lastPayload = null;
  var SVGNS = "http://www.w3.org/2000/svg";

  function esc(s) { return String(s).replace(/([\\;,:"])/g, "\\$1"); }
  function val(n) { return (form.elements[n].value || "").trim(); }
  function payload() {
    switch (type) {
      case "wifi":
        if (!val("ssid")) return "";
        var sec = val("sec");
        return "WIFI:T:" + sec + ";S:" + esc(val("ssid")) + ";" + (sec === "nopass" ? "" : "P:" + esc(val("pass")) + ";") + ";";
      case "email":
        if (!val("to")) return "";
        var q = [];
        if (val("subject")) q.push("subject=" + encodeURIComponent(val("subject")));
        if (val("body")) q.push("body=" + encodeURIComponent(val("body")));
        return "mailto:" + val("to") + (q.length ? "?" + q.join("&") : "");
      case "phone":
        return val("tel") ? "tel:" + val("tel").replace(/[^\d+]/g, "") : "";
      case "sms":
        return val("smsto") ? "SMSTO:" + val("smsto").replace(/[^\d+]/g, "") + ":" + val("msg") : "";
      default:
        return form.elements.text.value;
    }
  }

  function lum(hex) {
    var c = [1, 3, 5].map(function (i) {
      var v = parseInt(hex.substr(i, 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }

  function render() {
    var data = payload();
    var fg = form.elements.fg.value, bg = form.elements.bg.value;
    var ecl = logo ? "H" : form.elements.ecl.value;
    form.elements.ecl.disabled = !!logo;
    eclHint.hidden = !logo;

    var ratio = contrast(fg, bg);
    var msg = "";
    if (ratio < 3) msg = "Low contrast (" + ratio.toFixed(1) + ":1). This code may be hard to scan.";
    else if (ratio < 4.5) msg = "Moderate contrast (" + ratio.toFixed(1) + ":1). Some phones may struggle with it.";
    if (!msg && lum(fg) > lum(bg)) msg = "Light modules on a dark background. Some scanners can't read inverted codes.";
    warn.hidden = !msg; if (msg) warn.lastElementChild.textContent = msg;

    if (!data) {
      svg.style.opacity = ".3";
      meta.textContent = "Fill in the fields to see your code.";
      $("#dlPng").disabled = true;
      return;
    }
    var qr;
    try { qr = qrcode(0, ecl); qr.addData(data); qr.make(); }
    catch (e) { meta.textContent = "That's too much data for one QR code."; svg.style.opacity = ".3"; $("#dlPng").disabled = true; return; }
    svg.style.opacity = "";
    $("#dlPng").disabled = false;

    var n = qr.getModuleCount(), quiet = 4, size = n + quiet * 2;
    var d = "";
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (qr.isDark(r, c)) d += "M" + (c + quiet) + " " + (r + quiet) + "h1v1h-1z";
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.setAttribute("viewBox", "0 0 " + size + " " + size);
    svg.setAttribute("shape-rendering", "crispEdges");
    var bgRect = document.createElementNS(SVGNS, "rect");
    bgRect.setAttribute("width", size); bgRect.setAttribute("height", size); bgRect.setAttribute("fill", bg);
    svg.appendChild(bgRect);
    var path = document.createElementNS(SVGNS, "path");
    path.setAttribute("d", d); path.setAttribute("fill", fg);
    svg.appendChild(path);
    if (logo) {
      var ls = Math.round(n * 0.22), lo = (size - ls) / 2, pad = 1;
      var plate = document.createElementNS(SVGNS, "rect");
      plate.setAttribute("x", lo - pad); plate.setAttribute("y", lo - pad);
      plate.setAttribute("width", ls + pad * 2); plate.setAttribute("height", ls + pad * 2);
      plate.setAttribute("rx", 1.5); plate.setAttribute("fill", bg);
      svg.appendChild(plate);
      var img = document.createElementNS(SVGNS, "image");
      img.setAttribute("href", logo); img.setAttribute("x", lo); img.setAttribute("y", lo);
      img.setAttribute("width", ls); img.setAttribute("height", ls);
      img.setAttribute("preserveAspectRatio", "xMidYMid slice");
      svg.appendChild(img);
    }
    var version = (n - 17) / 4;
    meta.textContent = "Version " + version + " · " + n + "×" + n + " modules · error correction " + ecl + " · " + new Blob([data]).size + " bytes";
    if (lastPayload !== null && lastPayload !== data && !reduceMotion) {
      frame.classList.remove("pulse"); void frame.offsetWidth; frame.classList.add("pulse");
    }
    lastPayload = data;
  }

  var raf = 0;
  function schedule() { cancelAnimationFrame(raf); raf = requestAnimationFrame(render); }
  form.addEventListener("input", schedule);
  form.addEventListener("change", schedule);

  $$(".seg[aria-label='QR type'] button").forEach(function (b) {
    b.addEventListener("click", function () {
      type = b.dataset.type;
      $$(".seg[aria-label='QR type'] button").forEach(function (x) { x.setAttribute("aria-selected", String(x === b)); });
      $$(".fields", form).forEach(function (f) { f.hidden = f.dataset.for !== type; });
      var first = $('.fields[data-for="' + type + '"] input, .fields[data-for="' + type + '"] textarea', form);
      if (first) first.focus({ preventScroll: true });
      schedule();
    });
  });

  logoInput.addEventListener("change", function () {
    var f = logoInput.files && logoInput.files[0];
    if (!f) return;
    var reader = new FileReader();
    reader.onload = function () {
      logo = reader.result;
      logoLabel.textContent = "Change logo";
      logoClear.hidden = false;
      schedule();
    };
    reader.readAsDataURL(f);
  });
  logoClear.addEventListener("click", function () {
    logo = null; logoInput.value = "";
    logoLabel.textContent = "Add a logo";
    logoClear.hidden = true;
    schedule();
  });

  $("#dlPng").addEventListener("click", function () {
    var px = 1024;
    var clone = svg.cloneNode(true);
    clone.setAttribute("xmlns", SVGNS);
    clone.setAttribute("width", px); clone.setAttribute("height", px);
    var url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" }));
    var img = new Image();
    img.onload = function () {
      var cv = document.createElement("canvas"); cv.width = cv.height = px;
      var ctx = cv.getContext("2d"); ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, px, px);
      URL.revokeObjectURL(url);
      cv.toBlob(function (blob) {
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob); a.download = "quicker-" + type + ".png";
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      }, "image/png");
    };
    img.src = url;
  });

  render();
})();
