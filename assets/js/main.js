/* Portfolio Lucas Boles
   Tout le contenu est lisible sans ce script : il ajoute la navigation mobile,
   les animations, la simulation radar et la démonstration ferroviaire. */
(function () {
  "use strict";

  // Mesure d'audience GoatCounter (sans cookie). Laisser vide pour la désactiver.
  // Exemple : "lucasboles" pour https://lucasboles.goatcounter.com
  var GOATCOUNTER_CODE = "lucasboles";

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
          link.setAttribute("aria-current", "location");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(byId).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) spy.observe(section);
    });
  }

  /* --- Veille 3D : simulation lente de la pièce et des cibles --------------
     Reprend la maquette du projet radar (pièce de 6 x 4 x 2,6 m, capteur sur
     trépied à 1,20 m, meubles qui masquent ce qui est derrière eux), dessinée
     en Canvas 2D pour ne pas charger de bibliothèque 3D. Unités : millimètres. */
  function roomSim(canvas) {
    var ctx = canvas.getContext("2d");
    var RX = 3000, RZ = 2000, RY = 2600, SENSOR_H = 1200, STEP = 120;
    var SLOW = 0.35;            // vitesse des cibles par rapport à la maquette
    var SWAY = 0.3, SWAY_SPEED = 0.05; // la caméra oscille de ±17° autour de la vue de la maquette
    var FRAME_MS = 1000 / 30;

    var furniture = [
      { x: -2300, z: 900, w: 1800, h: 800, d: 800 },
      { x: 1400, z: -1000, w: 1400, h: 750, d: 800 },
      { x: 2750, z: 600, w: 420, h: 1900, d: 1600 },
      { x: -600, z: -1750, w: 900, h: 1100, d: 420 }
    ];
    var boxes = furniture.map(function (m) {
      return { x0: m.x - m.w / 2, x1: m.x + m.w / 2, y1: m.h, z0: m.z - m.d / 2, z1: m.z + m.d / 2 };
    });

    // un point n'est gardé que si le rayon capteur -> point ne traverse aucun meuble
    function seen(px, py, pz) {
      for (var i = 1; i < 40; i++) {
        var t = i / 40, x = px * t, y = SENSOR_H + (py - SENSOR_H) * t, z = pz * t;
        for (var b = 0; b < boxes.length; b++) {
          var k = boxes[b];
          if (x > k.x0 && x < k.x1 && y > 0 && y < k.y1 && z > k.z0 && z < k.z1) return false;
        }
      }
      return true;
    }

    // nuage rangé par tranche de hauteur : une couleur par tranche
    var BANDS = 8, cloud = [], n;
    for (n = 0; n < BANDS; n++) cloud.push([]);
    function q(v) { return Math.round(v / 78) * 78; }
    function add(x, y, z) {
      if (!seen(x, y, z)) return;
      cloud[Math.min(BANDS - 1, Math.floor((y / RY) * BANDS))].push(q(x), q(y), q(z));
    }
    var x, y, z, f, d;
    for (x = -RX; x <= RX; x += STEP) for (y = 0; y <= RY; y += STEP) {
      if (!(x > 700 && x < 1600 && y < 2050)) add(x, y, -RZ); // porte ouverte : pas d'écho
      add(x, y, RZ);
    }
    for (z = -RZ; z <= RZ; z += STEP) for (y = 0; y <= RY; y += STEP) { add(-RX, y, z); add(RX, y, z); }
    for (x = -RX; x <= RX; x += STEP * 1.7) for (z = -RZ; z <= RZ; z += STEP * 1.7) add(x, 0, z);
    furniture.forEach(function (m) {
      var s = STEP * 0.8;
      for (d = -m.w / 2; d <= m.w / 2; d += s) for (y = 0; y <= m.h; y += s) { add(m.x + d, y, m.z - m.d / 2); add(m.x + d, y, m.z + m.d / 2); }
      for (d = -m.d / 2; d <= m.d / 2; d += s) for (y = 0; y <= m.h; y += s) { add(m.x - m.w / 2, y, m.z + d); add(m.x + m.w / 2, y, m.z + d); }
      for (d = -m.w / 2; d <= m.w / 2; d += s) for (f = -m.d / 2; f <= m.d / 2; f += s) add(m.x + d, m.h, m.z + f);
    });
    // dégradé de hauteur de la maquette : vert sombre au sol, vert clair au plafond
    var bandColors = [];
    for (n = 0; n < BANDS; n++) {
      var t = n / (BANDS - 1);
      bandColors.push("rgb(" + Math.round(20 + t * 122) + "," + Math.round(82 + t * 163) + "," + Math.round(60 + t * 140) + ")");
    }

    var targets = [
      { id: "T01", x: -1800, z: 1200, y: 950, vx: 620, vz: -430, hist: [] },
      { id: "T02", x: 1900, z: -300, y: 980, vx: -480, vz: 560, hist: [] },
      { id: "T03", x: 200, z: 1700, y: 1450, vx: 540, vz: 380, hist: [] }
    ];
    function move(dt) {
      targets.forEach(function (p) {
        p.x += p.vx * SLOW * dt;
        p.z += p.vz * SLOW * dt;
        if (p.x < -RX + 300 || p.x > RX - 300) p.vx *= -1;
        if (p.z < -RZ + 300 || p.z > RZ - 300) p.vz *= -1;
        p.hist.push(p.x, p.z);
        if (p.hist.length > 240) p.hist.splice(0, 2);
      });
    }
    // quelques secondes d'avance pour que les traînées existent dès le départ
    for (n = 0; n < 120; n++) move(1 / 30);

    var w = 0, h = 0, dpr = 1, focal = 1, azi = 0.85, clock = 0, ELE = 0.42, DIST = 6800;
    var cam = {}, right = {}, up = {}, fwd = {};
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      focal = (h / 2) / Math.tan((58 / 2) * Math.PI / 180);
    }
    function placeCamera() {
      cam.x = DIST * Math.cos(ELE) * Math.sin(azi);
      cam.y = 900 + DIST * Math.sin(ELE);
      cam.z = DIST * Math.cos(ELE) * Math.cos(azi);
      var fx = -cam.x, fy = 900 - cam.y, fz = -cam.z, fl = Math.hypot(fx, fy, fz);
      fwd.x = fx / fl; fwd.y = fy / fl; fwd.z = fz / fl;
      var rl = Math.hypot(fwd.z, fwd.x);
      right.x = -fwd.z / rl; right.y = 0; right.z = fwd.x / rl;
      up.x = right.y * fwd.z - right.z * fwd.y;
      up.y = right.z * fwd.x - right.x * fwd.z;
      up.z = right.x * fwd.y - right.y * fwd.x;
    }
    var P = [0, 0, 0];
    function project(px, py, pz) {
      var dx = px - cam.x, dy = py - cam.y, dz = pz - cam.z;
      var zc = dx * fwd.x + dy * fwd.y + dz * fwd.z;
      if (zc < 100) return false;
      P[0] = w / 2 + (dx * right.x + dy * right.y + dz * right.z) * focal / zc;
      P[1] = h / 2 - (dx * up.x + dy * up.y + dz * up.z) * focal / zc;
      P[2] = zc;
      return true;
    }
    function line(x0, y0, z0, x1, y1, z1) {
      if (!project(x0, y0, z0)) return;
      var a = P[0], b = P[1];
      if (!project(x1, y1, z1)) return;
      ctx.moveTo(a, b);
      ctx.lineTo(P[0], P[1]);
    }

    function draw() {
      placeCamera();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#06100c";
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "#11271f";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (var g = -4000; g <= 4000; g += 500) { line(g, 0, -4000, g, 0, 4000); line(-4000, 0, g, 4000, 0, g); }
      ctx.stroke();

      for (var bnd = 0; bnd < BANDS; bnd++) {
        var pts = cloud[bnd];
        ctx.fillStyle = bandColors[bnd];
        for (var i = 0; i < pts.length; i += 3) {
          if (!project(pts[i], pts[i + 1], pts[i + 2])) continue;
          var s = Math.max(1.6, 32 * (h / 2) / P[2]);
          ctx.fillRect(P[0] - s / 2, P[1] - s / 2, s, s);
        }
      }

      // le capteur sur son trépied
      ctx.strokeStyle = "#1c3a2e";
      ctx.lineWidth = 2;
      ctx.beginPath();
      line(0, 0, 0, 0, SENSOR_H, 0);
      ctx.stroke();
      if (project(0, SENSOR_H, 0)) {
        ctx.fillStyle = "#ff5d3b";
        ctx.beginPath();
        ctx.arc(P[0], P[1], Math.max(3, 85 * focal / P[2]), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.font = "600 11px " + getComputedStyle(document.body).fontFamily;
      ctx.textAlign = "center";
      targets.forEach(function (p) {
        // traînée
        ctx.strokeStyle = "#1f7a5a";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (var k = 2; k < p.hist.length; k += 2) line(p.hist[k - 2], p.y, p.hist[k - 1], p.hist[k], p.y, p.hist[k + 1]);
        ctx.stroke();
        if (!project(p.x, p.y, p.z)) return;
        var sx = P[0], sy = P[1], r = Math.max(4, 130 * focal / P[2]);
        // flèche de vitesse
        var vl = Math.hypot(p.vx, p.vz), len = Math.min(1400, vl * 1.6);
        if (project(p.x + (p.vx / vl) * len, p.y, p.z + (p.vz / vl) * len)) {
          var ax = P[0] - sx, ay = P[1] - sy, al = Math.hypot(ax, ay) || 1;
          var hx = ax / al, hy = ay / al, hs = Math.min(10, al * 0.3);
          ctx.strokeStyle = ctx.fillStyle = "#ffd23b";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(P[0], P[1]);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(P[0], P[1]);
          ctx.lineTo(P[0] - hx * hs - hy * hs * 0.6, P[1] - hy * hs + hx * hs * 0.6);
          ctx.lineTo(P[0] - hx * hs + hy * hs * 0.6, P[1] - hy * hs - hx * hs * 0.6);
          ctx.fill();
        }
        ctx.fillStyle = "#34e29b";
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#d8f5e8";
        ctx.fillText(p.id, sx, sy - r - 6);
      });
    }

    var running = false, last = 0, acc = 0;
    function step(now) {
      if (!running) return;
      var dt = Math.min(now - (last || now), 100);
      last = now;
      acc += dt;
      if (acc >= FRAME_MS) {
        var sec = acc / 1000;
        acc = 0;
        move(sec);
        clock += sec;
        azi = 0.85 + SWAY * Math.sin(clock * SWAY_SPEED);
        draw();
      }
      requestAnimationFrame(step);
    }

    resize();
    draw();
    // la toile suit sa taille réelle à l'écran, et l'échelle d'affichage quand
    // la fenêtre passe d'un écran à l'autre (100 %, 125 %, 150 %...)
    function refit() { resize(); draw(); }
    if ("ResizeObserver" in window) new ResizeObserver(refit).observe(canvas);
    window.addEventListener("resize", refit);
    (function watchScale() {
      var mq = window.matchMedia("(resolution: " + window.devicePixelRatio + "dppx)");
      var onChange = function () { mq.removeEventListener("change", onChange); refit(); watchScale(); };
      if (mq.addEventListener) mq.addEventListener("change", onChange);
    })();
    // sans animation demandée : une seule image, fixe
    if (reducedMotion) return;
    // la simulation ne tourne que lorsqu'elle est à l'écran
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

  var roomCanvas = document.querySelector(".room-sim");
  if (roomCanvas && roomCanvas.getContext) roomSim(roomCanvas);

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

  // Accueil : l'entrée du nom, du texte et de la photo est en CSS (main.css), jouée dès le
  // premier affichage ; ici seulement la photo qui glisse avec le défilement
  if (document.querySelector(".hero-name")) {
    gsap.fromTo(".hero-photo img", { yPercent: -3 }, {
      yPercent: 4, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
    });
  }

  // Titres de section : chaque ligne monte depuis un masque, comme le nom en haut de page.
  // Le titre n'est découpé qu'à son arrivée (la largeur est alors connue), puis il
  // retrouve son texte d'origine et se recompose librement si la fenêtre change.
  function splitTitle(title) {
    var text = title.textContent.trim().replace(/\s+/g, " ");
    title.textContent = "";
    var words = text.split(" ").map(function (w) {
      var span = document.createElement("span");
      span.style.display = "inline-block";
      span.textContent = w;
      title.append(span, " ");
      return span;
    });
    var lines = [];
    words.forEach(function (w) {
      var last = lines[lines.length - 1];
      if (last && Math.abs(last.top - w.offsetTop) < 4) last.words.push(w.textContent);
      else lines.push({ top: w.offsetTop, words: [w.textContent] });
    });
    title.textContent = "";
    return lines.map(function (line) {
      var mask = document.createElement("span"), inner = document.createElement("span");
      mask.className = "line";
      inner.textContent = line.words.join(" ");
      mask.appendChild(inner);
      title.append(mask, " ");
      return inner;
    });
  }
  function restoreTitle(title) {
    if (title.msDone) return;
    title.msDone = true;
    gsap.killTweensOf(title.querySelectorAll(".line > span"));
    title.textContent = title.msText;
    gsap.set(title, { opacity: 1 });
  }
  var titles = gsap.utils.toArray(".section-title");
  titles.forEach(function (title) {
    title.msText = title.textContent;
    gsap.set(title, { opacity: 0 });
    window.ScrollTrigger.create({
      trigger: title, start: "top 88%", once: true,
      onEnter: function () {
        if (title.msDone) return;
        var lines = splitTitle(title);
        gsap.set(title, { opacity: 1 });
        gsap.from(lines, {
          yPercent: 115, duration: 1.05, ease: ease, stagger: 0.1,
          onComplete: function () { restoreTitle(title); }
        });
      }
    });
  });

  // Photos : elles s'ouvrent comme un volet, de bas en haut, en se recadrant légèrement.
  // Les grandes images qui bougent déjà avec le défilement et le radar animé n'en ont pas.
  var shutters = gsap.utils.toArray(".media").filter(function (m) {
    return m.querySelector("img") && !m.closest(".hero-photo, .now-figure, .outside-hero, .radar-live");
  });
  gsap.set(shutters, { clipPath: "inset(100% 0% 0% 0%)" });
  gsap.set(shutters.map(function (m) { return m.querySelector("img"); }), { scale: 1.12, transition: "none" });
  function openShutter(m, delay) {
    // début et fin donnés tous les deux : le navigateur réécrit « inset(100% 0% 0% 0%) »
    // en trois valeurs, que GSAP n'interpolerait pas proprement vers quatre
    gsap.fromTo(m, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, delay: delay, ease: "power3.inOut", clearProps: "clipPath" });
    gsap.to(m.querySelector("img"), { scale: 1, duration: 1.5, delay: delay, ease: "power2.out", clearProps: "transform,transition" });
  }
  // un saut dans la page (menu, lien) fait entrer d'un coup tout ce qui a été dépassé :
  // seul ce qui est à l'écran s'anime, le reste est simplement affiché
  function onScreen(n) {
    var r = n.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  }
  window.ScrollTrigger.batch(shutters, {
    start: "top 90%", once: true,
    onEnter: function (batch) {
      var k = 0;
      batch.forEach(function (m) {
        if (onScreen(m)) { openShutter(m, k++ * 0.12); return; }
        gsap.set(m, { clearProps: "clipPath" });
        gsap.set(m.querySelector("img"), { clearProps: "transform,transition" });
      });
    }
  });

  // Entrées par section, selon le contenu : les blocs montent, les paragraphes
  // apparaissent sans bouger, les lignes du parcours arrivent l'une après l'autre
  // et les étiquettes d'outils une à une.
  function notHero(n) { return !n.closest(".hero"); }
  function holdsShutter(n) { return shutters.some(function (m) { return n === m || n.contains(m); }); }
  var groups = [
    { nodes: ".project-head, .path-col h3, .rail-demo, .radar-links, .contact-mail, .contact-actions, figure, .robot-main, .robot-side",
      from: { y: 28, opacity: 0 }, duration: 0.9, stagger: 0.08, skipShutters: true },
    { nodes: ".prose > *, .points li, .skills > div, .contact .lead, .contact-list li",
      from: { opacity: 0 }, duration: 0.9, stagger: 0.07 },
    { nodes: ".path-list li", from: { y: 16, opacity: 0 }, duration: 0.7, stagger: 0.06 },
    { nodes: ".tool-list li", from: { y: 8, opacity: 0 }, duration: 0.5, stagger: 0.04 }
  ];
  var parts = [];
  groups.forEach(function (g) {
    var nodes = gsap.utils.toArray(g.nodes).filter(notHero);
    if (g.skipShutters) {
      // une photo en volet ne glisse pas en plus : seule sa légende apparaît
      nodes = nodes.filter(function (n) { return !holdsShutter(n); });
      shutters.forEach(function (m) {
        var cap = m.closest("figure") && m.closest("figure").querySelector("figcaption");
        if (cap && nodes.indexOf(cap) < 0) nodes.push(cap);
      });
    }
    if (!nodes.length) return;
    parts = parts.concat(nodes);
    gsap.set(nodes, g.from);
    window.ScrollTrigger.batch(nodes, {
      start: "top 92%", once: true,
      onEnter: function (batch) {
        var shown = batch.filter(onScreen), passed = batch.filter(function (n) { return !onScreen(n); });
        if (passed.length) gsap.set(passed, { opacity: 1, clearProps: "transform" });
        if (shown.length) gsap.to(shown, { y: 0, opacity: 1, duration: g.duration, ease: ease, stagger: g.stagger, overwrite: true, clearProps: "transform" });
      }
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
    parts.forEach(function (n) {
      if (n.getBoundingClientRect().top < window.innerHeight && parseFloat(getComputedStyle(n).opacity) < 1) {
        gsap.killTweensOf(n);
        gsap.set(n, { opacity: 1, y: 0, yPercent: 0, clearProps: "transform" });
      }
    });
    titles.forEach(function (t) {
      if (t.getBoundingClientRect().top < window.innerHeight) restoreTitle(t);
    });
    shutters.forEach(function (m) {
      if (m.getBoundingClientRect().top < window.innerHeight && m.style.clipPath) {
        var img = m.querySelector("img");
        gsap.killTweensOf([m, img]);
        gsap.set(m, { clearProps: "clipPath" });
        gsap.set(img, { clearProps: "transform,transition" });
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
