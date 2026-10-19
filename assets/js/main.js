/* Portfolio Lucas Boles
   Tout le contenu est lisible sans ce script : il ajoute la navigation mobile,
   les animations, le radar et la démonstration ferroviaire. */
(function () {
  "use strict";

  // Mesure d'audience GoatCounter (sans cookie). Laisser vide pour la désactiver.
  // Exemple : "lucasboles" pour https://lucasboles.goatcounter.com
  var GOATCOUNTER_CODE = "";

  var EN = document.documentElement.lang === "en";
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Analytics ------------------------------------------------------------ */
  if (GOATCOUNTER_CODE && location.hostname !== "localhost" && location.protocol === "https:") {
    var gc = document.createElement("script");
    gc.async = true;
    gc.src = "https://gc.zgo.at/count.js";
    gc.dataset.goatcounter = "https://" + GOATCOUNTER_CODE + ".goatcounter.com/count";
    document.head.appendChild(gc);
  }

  /* --- En-tête : menu mobile, masquage au défilement, lien actif --------------- */
  var header = document.querySelector(".site-header");
  var menuButton = document.querySelector(".menu-button");

  if (header && menuButton) {
    var setMenu = function (open) {
      header.classList.toggle("is-open", open);
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.textContent = open ? (EN ? "Close" : "Fermer") : "Menu";
    };
    menuButton.addEventListener("click", function () {
      setMenu(!header.classList.contains("is-open"));
    });
    header.querySelectorAll(".nav-links a").forEach(function (link) {
      link.addEventListener("click", function () { setMenu(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && header.classList.contains("is-open")) {
        setMenu(false);
        menuButton.focus();
      }
    });

    var lastY = window.scrollY;
    window.addEventListener("scroll", function () {
      var y = window.scrollY;
      // un grand saut (clic sur un lien d'ancre) ne masque pas l'en-tête
      var hide = y > lastY && y - lastY < 400 && y > 300 && !header.classList.contains("is-open");
      header.classList.toggle("is-hidden", hide);
      lastY = y;
    }, { passive: true });
    header.addEventListener("focusin", function () { header.classList.remove("is-hidden"); });
  }

  var navLinks = document.querySelectorAll(".nav-links a[href^='#']");
  if (navLinks.length && "IntersectionObserver" in window) {
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = byId[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.forEach(function (a) { a.removeAttribute("aria-current"); });
          link.setAttribute("aria-current", "true");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(byId).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) spy.observe(section);
    });
  }

  /* --- Radar : balayage lent (un tour en 10 s environ) ---------------------- */
  function radar(canvas) {
    var ctx = canvas.getContext("2d");
    var green = "127, 209, 174";
    var targets = [
      { r: 0.32, a: 0.6, v: 0.004 }, { r: 0.55, a: 2.1, v: -0.002 },
      { r: 0.72, a: 3.4, v: 0.0015 }, { r: 0.44, a: 4.6, v: 0.003 },
      { r: 0.83, a: 5.5, v: -0.001 }
    ];
    targets.forEach(function (t) { t.glow = 0; });
    var size = 0, dpr = 1, sweep = 0, last = 0, running = false;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = canvas.clientWidth;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
    }

    function draw() {
      var c = size / 2, R = c * 0.94;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      ctx.strokeStyle = "rgba(" + green + ", 0.25)";
      ctx.lineWidth = 1;
      for (var i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(c, c, (R * i) / 4, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (var k = 0; k < 12; k++) {
        ctx.beginPath();
        ctx.moveTo(c, c);
        ctx.lineTo(c + Math.cos(k * Math.PI / 6) * R, c + Math.sin(k * Math.PI / 6) * R);
        ctx.stroke();
      }
      // traînée du balayage : secteurs de plus en plus transparents
      for (var s = 0; s < 24; s++) {
        ctx.beginPath();
        ctx.moveTo(c, c);
        ctx.arc(c, c, R, sweep - (s + 1) * 0.03, sweep - s * 0.03);
        ctx.closePath();
        ctx.fillStyle = "rgba(" + green + ", " + (0.2 * (1 - s / 24)).toFixed(3) + ")";
        ctx.fill();
      }
      ctx.strokeStyle = "rgb(" + green + ")";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(c, c);
      ctx.lineTo(c + Math.cos(sweep) * R, c + Math.sin(sweep) * R);
      ctx.stroke();
      targets.forEach(function (t) {
        if (t.glow < 0.02) return;
        var x = c + Math.cos(t.a) * t.r * R, y = c + Math.sin(t.a) * t.r * R;
        ctx.fillStyle = "rgba(" + green + ", " + t.glow.toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function step(now) {
      if (!running) return;
      var dt = Math.min(now - (last || now), 50);
      last = now;
      var prev = sweep;
      sweep = (sweep + dt * 0.0006) % (Math.PI * 2);
      targets.forEach(function (t) {
        t.a = (t.a + t.v * dt * 0.02 + Math.PI * 2) % (Math.PI * 2);
        var crossed = prev <= sweep ? t.a > prev && t.a <= sweep : t.a > prev || t.a <= sweep;
        t.glow = crossed ? 1 : t.glow * Math.pow(0.99975, dt);
      });
      draw();
      requestAnimationFrame(step);
    }

    resize();
    window.addEventListener("resize", function () { resize(); draw(); });
    if (reducedMotion) {
      sweep = 5.9;
      targets.forEach(function (t) { t.glow = 0.8; });
      draw();
      return;
    }
    // l'animation ne tourne que lorsque le radar est à l'écran
    new IntersectionObserver(function (entries) {
      var visible = entries[0].isIntersecting;
      if (visible && !running) {
        running = true;
        last = 0;
        requestAnimationFrame(step);
      } else if (!visible) {
        running = false;
      }
    }).observe(canvas);
  }

  var radarCanvas = document.querySelector(".radar-canvas");
  if (radarCanvas && radarCanvas.getContext) radar(radarCanvas);

  /* --- Démo ferroviaire : plus court chemin (Dijkstra) et aiguillages ------- */
  function railDemo(root) {
    var SVG = "http://www.w3.org/2000/svg";
    var nodes = {
      depot: { x: 70, y: 170, label: EN ? "Depot" : "Dépôt", station: true },
      j1: { x: 190, y: 170 },
      nord: { x: 340, y: 64, label: EN ? "North" : "Nord", station: true },
      sud: { x: 340, y: 276, label: EN ? "South" : "Sud", station: true },
      centre: { x: 540, y: 170, label: "Centre", station: true },
      est: { x: 730, y: 170, label: EN ? "East" : "Est", station: true }
    };
    var edges = [
      { a: "depot", b: "j1", w: 4 },
      { a: "j1", b: "nord", w: 5 },
      { a: "j1", b: "sud", w: 3 },
      { a: "nord", b: "centre", w: 4 },
      { a: "sud", b: "centre", w: 5 },
      { a: "nord", b: "est", w: 9, via: [[640, 64]] },
      { a: "centre", b: "est", w: 3 },
      { a: "sud", b: "est", w: 10, via: [[640, 276]] }
    ];
    var adj = {};
    Object.keys(nodes).forEach(function (id) { adj[id] = []; });
    edges.forEach(function (e, i) {
      adj[e.a].push({ to: e.b, w: e.w, edge: i });
      adj[e.b].push({ to: e.a, w: e.w, edge: i });
    });

    function dijkstra(from, to) {
      var dist = {}, prev = {}, done = {};
      Object.keys(nodes).forEach(function (id) { dist[id] = Infinity; });
      dist[from] = 0;
      for (;;) {
        var u = null;
        Object.keys(nodes).forEach(function (id) {
          if (!done[id] && dist[id] < Infinity && (u === null || dist[id] < dist[u])) u = id;
        });
        if (u === null || u === to) break;
        done[u] = true;
        adj[u].forEach(function (n) {
          if (dist[u] + n.w < dist[n.to]) {
            dist[n.to] = dist[u] + n.w;
            prev[n.to] = { node: u, edge: n.edge };
          }
        });
      }
      var path = [to], used = [];
      for (var cur = to; cur !== from; cur = prev[cur].node) {
        used.unshift(prev[cur].edge);
        path.unshift(prev[cur].node);
      }
      return { path: path, edges: used, length: dist[to] };
    }

    function el(name, attrs, parent) {
      var n = document.createElementNS(SVG, name);
      Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
      if (parent) parent.appendChild(n);
      return n;
    }

    function points(e, reverse) {
      var pts = [[nodes[e.a].x, nodes[e.a].y]].concat(e.via || [], [[nodes[e.b].x, nodes[e.b].y]]);
      return reverse ? pts.reverse() : pts;
    }

    var svg = root.querySelector("svg");
    var gTracks = svg.querySelector(".tracks");
    var gSwitches = svg.querySelector(".switches");
    var gStations = svg.querySelector(".stations");
    var train = svg.querySelector(".train");

    var trackEls = edges.map(function (e) {
      var pts = points(e);
      var line = el("polyline", { class: "track", points: pts.map(function (p) { return p.join(","); }).join(" ") }, gTracks);
      var mid = pts.length > 2 ? pts[1] : [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2];
      var lbl = el("text", { class: "weight", x: mid[0], y: mid[1] - 12, "text-anchor": "middle" }, gTracks);
      lbl.textContent = e.w;
      return line;
    });

    // un aiguillage partout où plus de deux voies se rejoignent
    var switchEls = {};
    Object.keys(nodes).forEach(function (id) {
      if (adj[id].length < 3) return;
      // en gare, l'aiguillage est dessiné sur la voie, juste à côté du quai
      var x = nodes[id].x + (nodes[id].station ? (id === "est" ? -30 : 30) : 0);
      var y = nodes[id].y;
      switchEls[id] = el("rect", {
        class: "switch", x: x - 7, y: y - 7, width: 14, height: 14,
        transform: "rotate(45 " + x + " " + y + ")"
      }, gSwitches);
    });

    var stationEls = {};
    Object.keys(nodes).forEach(function (id) {
      var n = nodes[id];
      if (!n.station) return;
      var g = el("g", { class: "station" }, gStations);
      el("circle", { cx: n.x, cy: n.y, r: 15 }, g);
      var below = n.y > 200 || id === "depot" || id === "centre" || id === "est";
      var t = el("text", { x: n.x, y: below ? n.y + 42 : n.y - 28, "text-anchor": "middle" }, g);
      t.textContent = n.label;
      stationEls[id] = g;
    });

    var position = "depot";
    train.setAttribute("cx", nodes.depot.x);
    train.setAttribute("cy", nodes.depot.y);

    var controls = root.querySelector(".rail-controls");
    var buttonsBox = root.querySelector(".rail-buttons");
    var log = root.querySelector(".rail-log");
    var buttons = {};
    var moving = false;

    function refreshButtons() {
      Object.keys(buttons).forEach(function (id) {
        buttons[id].disabled = moving || id === position;
      });
    }

    function animateTrain(polyline, done) {
      if (reducedMotion) {
        var end = polyline[polyline.length - 1];
        train.setAttribute("cx", end[0]);
        train.setAttribute("cy", end[1]);
        done();
        return;
      }
      var segs = [], total = 0;
      for (var i = 1; i < polyline.length; i++) {
        var len = Math.hypot(polyline[i][0] - polyline[i - 1][0], polyline[i][1] - polyline[i - 1][1]);
        segs.push({ from: polyline[i - 1], to: polyline[i], len: len });
        total += len;
      }
      var duration = Math.max(900, total * 2.4);
      var start = null;
      function frame(now) {
        if (start === null) start = now;
        var t = Math.min((now - start) / duration, 1);
        var eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        var d = eased * total;
        for (var k = 0; k < segs.length; k++) {
          if (d <= segs[k].len || k === segs.length - 1) {
            var r = segs[k].len ? Math.min(d / segs[k].len, 1) : 1;
            train.setAttribute("cx", segs[k].from[0] + (segs[k].to[0] - segs[k].from[0]) * r);
            train.setAttribute("cy", segs[k].from[1] + (segs[k].to[1] - segs[k].from[1]) * r);
            break;
          }
          d -= segs[k].len;
        }
        if (t < 1) requestAnimationFrame(frame); else done();
      }
      requestAnimationFrame(frame);
    }

    function go(target) {
      if (moving || target === position) return;
      var res = dijkstra(position, target);
      trackEls.forEach(function (t, i) { t.classList.toggle("is-route", res.edges.indexOf(i) !== -1); });
      Object.keys(switchEls).forEach(function (id) { switchEls[id].classList.remove("is-set"); });
      var switched = 0;
      res.path.slice(0, -1).forEach(function (id) {
        if (switchEls[id]) { switchEls[id].classList.add("is-set"); switched++; }
      });
      Object.keys(stationEls).forEach(function (id) { stationEls[id].classList.toggle("is-target", id === target); });
      Object.keys(buttons).forEach(function (id) { buttons[id].setAttribute("aria-pressed", String(id === target)); });

      var names = res.path.filter(function (id) { return nodes[id].station; }).map(function (id) { return nodes[id].label; });
      log.textContent = EN
        ? "Route: " + names.join(", ") + ". Length " + res.length + ", " + switched + " switch" + (switched > 1 ? "es" : "") + " set."
        : "Itinéraire : " + names.join(", ") + ". Longueur " + res.length + ", " + switched + " aiguillage" + (switched > 1 ? "s" : "") + " commandé" + (switched > 1 ? "s" : "") + ".";

      var poly = [];
      res.edges.forEach(function (ei, k) {
        var e = edges[ei];
        var pts = points(e, e.a !== res.path[k]);
        poly = poly.concat(k ? pts.slice(1) : pts);
      });
      moving = true;
      refreshButtons();
      animateTrain(poly, function () {
        position = target;
        moving = false;
        refreshButtons();
      });
    }

    Object.keys(nodes).forEach(function (id) {
      if (!nodes[id].station) return;
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = nodes[id].label;
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () { go(id); });
      buttons[id] = b;
      buttonsBox.appendChild(b);
    });
    refreshButtons();
    log.textContent = EN ? "The train is waiting at the depot." : "Le train attend au dépôt.";
    controls.hidden = false;
  }

  var railRoot = document.querySelector("[data-rail]");
  if (railRoot) railDemo(railRoot);

  /* --- Animations (GSAP + ScrollTrigger) ------------------------------------- */
  if (reducedMotion || !window.gsap || !window.ScrollTrigger) return;
  var gsap = window.gsap;
  gsap.registerPlugin(window.ScrollTrigger);
  var ease = "expo.out";

  // Accueil : le nom monte depuis un masque, puis le texte, puis la photo
  if (document.querySelector(".hero-name")) {
    gsap.from(".hero-name .line > span", { yPercent: 105, duration: 1.15, ease: ease, stagger: 0.09 });
    gsap.from(".hero-body > *", { y: 24, opacity: 0, duration: 0.9, ease: ease, stagger: 0.08, delay: 0.35 });
    gsap.fromTo(".hero-photo img", { scale: 1.3, opacity: 0 }, { scale: 1.08, opacity: 1, duration: 1.5, ease: ease, delay: 0.15 });
    gsap.fromTo(".hero-photo img", { yPercent: -3 }, {
      yPercent: 4, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
    });
  }

  // Titres de section
  gsap.utils.toArray(".section-title").forEach(function (title) {
    gsap.from(title, {
      y: 48, opacity: 0, duration: 1.1, ease: ease,
      scrollTrigger: { trigger: title, start: "top 90%", once: true }
    });
  });

  // Entrées par section, dans l'ordre de lecture
  var parts = gsap.utils.toArray(
    ".project-head, .prose > *, .points li, .tool-list, .radar-links, .rail-demo, figure, .robot-main, .robot-side, " +
    ".path-col h3, .path-list li, .skills > div, .contact .lead, .contact-mail, .contact-actions, .contact-list li"
  ).filter(function (n) { return !n.closest(".hero"); });
  gsap.set(parts, { y: 28, opacity: 0 });
  window.ScrollTrigger.batch(parts, {
    start: "top 92%",
    once: true,
    onEnter: function (batch) {
      gsap.to(batch, { y: 0, opacity: 1, duration: 0.9, ease: ease, stagger: 0.07, overwrite: true, clearProps: "transform" });
    }
  });

  // Photos : légère mise au point à l'entrée
  gsap.utils.toArray(".media img").forEach(function (img) {
    if (img.closest(".hero-photo, .now-figure, .outside-hero")) return;
    gsap.from(img, {
      scale: 1.14, duration: 1.4, ease: ease, clearProps: "transform",
      scrollTrigger: { trigger: img.parentNode, start: "top 92%", once: true }
    });
  });

  // Grandes images liées au défilement
  [".now-figure img", ".outside-hero img"].forEach(function (sel) {
    var img = document.querySelector(sel);
    if (!img) return;
    gsap.fromTo(img, { yPercent: -6, scale: 1.12 }, {
      yPercent: 6, scale: 1.12, ease: "none",
      scrollTrigger: { trigger: img.parentNode, start: "top bottom", end: "bottom top", scrub: true }
    });
  });

  // Filet de sécurité : si une animation n'a pas pu se jouer (onglet en arrière-plan,
  // navigateur lent), tout ce qui est déjà à l'écran ou au-dessus est rendu visible.
  window.setTimeout(function () {
    var hero = gsap.utils.toArray(".hero-name .line > span, .hero-body > *, .hero-photo img");
    gsap.utils.toArray(".section-title").concat(parts, hero).forEach(function (n) {
      if (n.getBoundingClientRect().top < window.innerHeight && parseFloat(getComputedStyle(n).opacity) < 1) {
        gsap.killTweensOf(n);
        gsap.set(n,{ opacity: 1, y: 0, yPercent: 0, clearProps: "transform" });
      }
    });
  }, 2500);

  // Le nom du pied de page glisse en place
  var footerName = document.querySelector(".footer-name");
  if (footerName) {
    gsap.from(footerName, {
      xPercent: 12, ease: "none",
      scrollTrigger: { trigger: ".site-footer", start: "top bottom", end: "bottom bottom", scrub: true }
    });
  }
})();
