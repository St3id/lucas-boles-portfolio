/* Démineur du portfolio.
   Clic : révéler. Clic droit ou appui long : drapeau. Clic sur un chiffre : ouvrir
   ses voisins quand ses drapeaux sont posés. Clavier : flèches, Entrée, touche drapeau.
   Réglages, records et pseudo du classement sont gardés dans le navigateur du joueur.
   La grille vient de MSCore (ms-core.js), le même code que le serveur du classement. */
(function () {
  "use strict";

  // Adresse du serveur du classement (Cloudflare Worker). Vide : pas de classement,
  // le jeu et les records locaux fonctionnent quand même.
  var LEADERBOARD_API = "https://demineur-classement.lucasboles.workers.dev";

  var params = new URLSearchParams(location.search);
  var LANG = params.get("lang") === "en" || (!params.get("lang") && /\/en\/?$/.test(new URL(document.referrer || location.href).pathname)) ? "en" : "fr";

  var TEXT = {
    fr: {
      pageTitle: "Démineur - Lucas Boles", skip: "Aller au jeu", back: "Retour au portfolio",
      title: "Démineur", lead: "Trouver toutes les cases sûres sans toucher une mine.",
      levels: "Difficulté", easy: "Bac à sable", medium: "Terrain glissant", hard: "Champ de mines", noflag: "Sans drapeau",
      closedCell: "Case fermée", puzzle: "Énigme : creuser toutes les cases sûres", puzzleMine: "Mine", hintNoflagMouse: "Clic : révéler. Pas de drapeau dans ce mode.", hintNoflagTouch: "Tap : révéler. Pas de drapeau dans ce mode.",
      minesLeft: "Mines restantes", time: "Temps", record: "Record", shovel: "Pelle", flag: "Drapeau", tapAction: "Action d'un tap", newGame: "Nouvelle partie",
      replay: "Rejouer", changeLevel: "Changer de niveau", go: "C'est parti", cancel: "Annuler",
      grid: "Grille", mines: "Mines", pickTop: "À battre : ", pickTopTime: " en {t}",
      pickFree: "Podium vide : la 1re place est à prendre.", pickMine: "Votre record : {t}", pickNoMine: "Pas encore de record à ce niveau.",
      podiumLevels: "Niveau du podium", prevLevel: "Niveau précédent", nextLevel: "Niveau suivant",
      board: "Grille du démineur", close: "Fermer",
      rules: "Règles", rulesSub: "Comment jouer, ce que veulent dire les chiffres",
      controls: "Commandes", controlsSub: "Drapeau, durée de l'appui long, raccourcis",
      ranking: "Classement", rankingSub: "Les meilleurs temps de chaque niveau",
      hintMouse: "Clic : révéler. Clic droit ou appui long : drapeau.",
      hintTouch: "Tap : révéler. Appui long ou Drapeau sous la grille : drapeau.",
      hintInvert: "Clics inversés : clic pour un drapeau, clic droit pour révéler.",
      rulesList: [
        "Le but : révéler toutes les cases qui ne cachent pas de mine.",
        "Trois niveaux : Bac à sable (grille de 9 × 9, 10 mines), Terrain glissant (16 × 16, 40 mines) et Champ de mines (22 × 22, 99 mines).",
        "Un chiffre indique combien de mines touchent la case, en comptant les diagonales.",
        "Un drapeau marque une mine supposée : clic droit, appui long, ou Drapeau sous la grille sur écran tactile.",
        "Clic sur un chiffre déjà révélé : si autant de drapeaux que le chiffre l'entourent, ses autres voisins s'ouvrent.",
        "La grille se déplace en la faisant glisser, dans tous les sens. Pour zoomer : pincer à deux doigts, ou Ctrl + molette sur ordinateur.",
        "Le premier clic ne tombe jamais sur une mine, ni sur une case voisine d'une mine. Les drapeaux se posent après ce premier clic.",
        "Au clavier : flèches pour se déplacer, Entrée pour révéler, la touche drapeau (F par défaut) pour marquer.",
        "Le record de chaque niveau est gardé dans ce navigateur.",
        "Les commandes se règlent dans la fenêtre Commandes."
      ],
      setHold: "Appui long pour poser un drapeau", setHoldMs: "Durée de l'appui long",
      setChord: "Clic sur un chiffre : ouvrir ses voisins", setTenths: "Chrono au dixième de seconde",
      setInvert: "Inverser les clics (clic : drapeau, clic droit : révéler)",
      setVibrate: "Vibration quand un drapeau est posé", setKey: "Touche drapeau au clavier",
      keyListen: "Appuyer sur une touche", reset: "Réinitialiser les réglages",
      testIdle: "Rester appuyé sur la case pour essayer.", testHold: "Tenu {ms} ms",
      testShort: "Relâché à {ms} ms : clic normal.", testFlag: "Drapeau posé à {ms} ms.",
      win: "Gagné", lose: "Perdu", winText: "Grille dégagée en {t}.", loseText: "Une mine, après {t}.",
      newRecord: "Nouveau record !",
      share: "Partager mon temps",
      shareText: "J'ai terminé le démineur du portfolio de Lucas Boles (niveau « {level} ») en {t}. À toi de battre ce temps :",
      shareCopied: "Message copié, il n'y a plus qu'à le coller.", shareManual: "Copier ce message : ",
      podiumTitle: "Meilleurs temps", seeAll: "Tout le classement",
      podiumEmpty: "Personne pour l'instant : le premier temps s'affichera ici.", podiumFree: "Place libre",
      lbLoading: "Chargement...", lbEmpty: "Personne pour l'instant. À vous de jouer !", lbError: "Classement indisponible pour le moment.",
      youAre: "Vos temps sont inscrits au nom de {p}.", youAreNot: "Gagnez une partie pour choisir votre pseudo.",
      meLine: "Votre pseudo : ", saveLink: "Sauvegarder mon pseudo",
      saveCopied: "Lien copié. Gardez-le pour vous : l'ouvrir plus tard, ici ou sur un autre appareil, redonne votre pseudo.",
      saveManual: "Copier ce lien et le garder pour vous : ",
      restored: "Pseudo {p} retrouvé dans ce navigateur.", restoreBad: "Lien de sauvegarde incomplet : le copier en entier.",
      tokenLost: "Ce navigateur n'a plus la clé de {p}. Ouvrir votre lien de sauvegarde, ou choisir un autre pseudo.",
      pseudoLabel: "Pseudo pour le classement", send: "Inscrire",
      sending: "Inscription au nom de {p}...",
      rankNew: "{p} : nouveau record au classement, {rank} sur ce niveau.",
      rankKept: "{p} : votre record de {best} reste {rank} sur ce niveau.",
      ordinal: function (n) { return n === 1 ? "1er" : n + "e"; },
      unrankedPeek: "Partie avec le code secret : hors classement.",
      unrankedLate: "Partie hors classement : le serveur n'a pas répondu à temps au début de la partie.",
      err: {
        "pseudo-invalid": "Pseudo de 3 à 16 caractères : lettres (accents compris), chiffres, _ . -",
        "pseudo-refused": "Ce pseudo n'est pas accepté, en choisir un autre.",
        "pseudo-taken": "Ce pseudo est déjà pris, en choisir un autre.",
        "expired": "Partie trop ancienne pour être classée.",
        "replay": "Partie refusée par le serveur.",
        "too-fast": "Temps refusé par le serveur.",
        "rate": "Trop d'envois, réessayer dans une minute.",
        "network": "Envoi impossible, vérifier la connexion."
      },
      cell: "Ligne {r}, colonne {c}", flagged: "drapeau", hidden: "cachée", mine: "mine", empty: "vide",
      up: "Haut", down: "Bas", left: "Gauche", right: "Droite"
    },
    en: {
      pageTitle: "Minesweeper - Lucas Boles", skip: "Skip to the game", back: "Back to the portfolio",
      title: "Minesweeper", lead: "Find every safe cell without hitting a mine.",
      levels: "Difficulty", easy: "Sandbox", medium: "Slippery slope", hard: "Minefield", noflag: "No flags",
      closedCell: "Closed cell", puzzle: "Puzzle: dig every safe cell", puzzleMine: "Mine", hintNoflagMouse: "Click: reveal. No flags in this mode.", hintNoflagTouch: "Tap: reveal. No flags in this mode.",
      minesLeft: "Mines left", time: "Time", record: "Best", shovel: "Shovel", flag: "Flag", tapAction: "What a tap does", newGame: "New game",
      replay: "Play again", changeLevel: "Change level", go: "Let's go", cancel: "Cancel",
      grid: "Grid", mines: "Mines", pickTop: "To beat: ", pickTopTime: " in {t}",
      pickFree: "Empty podium: first place is up for grabs.", pickMine: "Your best: {t}", pickNoMine: "No best time on this level yet.",
      podiumLevels: "Podium level", prevLevel: "Previous level", nextLevel: "Next level",
      board: "Minesweeper board", close: "Close",
      rules: "Rules", rulesSub: "How to play, what the numbers mean",
      controls: "Controls", controlsSub: "Flags, long-press timing, shortcuts",
      ranking: "Leaderboard", rankingSub: "Best times for each level",
      hintMouse: "Click: reveal. Right click or long press: flag.",
      hintTouch: "Tap: reveal. Long press or Flag below the board: flag.",
      hintInvert: "Swapped clicks: click to flag, right click to reveal.",
      rulesList: [
        "The goal: reveal every cell that does not hide a mine.",
        "Three levels: Sandbox (9 × 9 grid, 10 mines), Slippery slope (16 × 16, 40 mines) and Minefield (22 × 22, 99 mines).",
        "A number tells how many mines touch the cell, diagonals included.",
        "A flag marks a suspected mine: right click, long press, or Flag below the board on a touch screen.",
        "Click a revealed number: if it is surrounded by as many flags as its value, its other neighbours open.",
        "Drag the board to move it in any direction. To zoom: pinch with two fingers, or Ctrl + mouse wheel on a computer.",
        "The first click never lands on a mine, nor next to one. Flags can be placed after that first click.",
        "Keyboard: arrows to move, Enter to reveal, the flag key (F by default) to mark.",
        "Your best time for each level is kept in this browser.",
        "Controls can be changed in the Controls window."
      ],
      setHold: "Long press to place a flag", setHoldMs: "Long-press duration",
      setChord: "Click a number: open its neighbours", setTenths: "Timer to the tenth of a second",
      setInvert: "Swap clicks (click: flag, right click: reveal)",
      setVibrate: "Vibrate when a flag is placed", setKey: "Keyboard flag key",
      keyListen: "Press a key", reset: "Reset settings",
      testIdle: "Press and hold the cell to try it.", testHold: "Held {ms} ms",
      testShort: "Released at {ms} ms: normal click.", testFlag: "Flag placed at {ms} ms.",
      win: "You win", lose: "Game over", winText: "Board cleared in {t}.", loseText: "Hit a mine after {t}.",
      newRecord: "New personal best!",
      share: "Share my time",
      shareText: "I cleared the minesweeper on Lucas Boles's portfolio (level \"{level}\") in {t}. Can you beat it?",
      shareCopied: "Message copied, just paste it.", shareManual: "Copy this message: ",
      podiumTitle: "Best times", seeAll: "Full leaderboard",
      podiumEmpty: "No one yet: the first time will show up here.", podiumFree: "Open spot",
      lbLoading: "Loading...", lbEmpty: "Nobody yet. Your turn!", lbError: "Leaderboard unavailable right now.",
      youAre: "Your times are recorded as {p}.", youAreNot: "Win a game to choose your name.",
      meLine: "Your name: ", saveLink: "Save my name",
      saveCopied: "Link copied. Keep it to yourself: opening it later, here or on another device, brings your name back.",
      saveManual: "Copy this link and keep it to yourself: ",
      restored: "Name {p} restored in this browser.", restoreBad: "Incomplete save link: copy it in full.",
      tokenLost: "This browser no longer has the key for {p}. Open your save link, or pick another name.",
      pseudoLabel: "Name for the leaderboard", send: "Submit",
      sending: "Submitting as {p}...",
      rankNew: "{p}: new leaderboard best, {rank} on this level.",
      rankKept: "{p}: your best of {best} stays {rank} on this level.",
      ordinal: function (n) { var s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); },
      unrankedPeek: "Game played with the secret code: not ranked.",
      unrankedLate: "Not ranked: the server did not answer in time when the game started.",
      err: {
        "pseudo-invalid": "Name of 3 to 16 characters: Latin letters (accents allowed), digits, _ . -",
        "pseudo-refused": "This name is not allowed, please pick another one.",
        "pseudo-taken": "This name is already taken, please pick another one.",
        "expired": "This game is too old to be ranked.",
        "replay": "Game rejected by the server.",
        "too-fast": "Time rejected by the server.",
        "rate": "Too many submissions, try again in a minute.",
        "network": "Could not submit, check your connection."
      },
      cell: "Row {r}, column {c}", flagged: "flag", hidden: "hidden", mine: "mine", empty: "empty",
      up: "Up", down: "Down", left: "Left", right: "Right"
    }
  }[LANG];

  var MOVE_TOLERANCE = 10;
  // même règle que le serveur : alphabet latin (accents compris), chiffres 0-9, _ . -
  var PSEUDO_RE = /^[\p{Script=Latin}0-9_.-]{3,16}$/u;

  var $ = function (id) { return document.getElementById(id); };
  var boardEl = $("ms-board"), minesEl = $("ms-mines"), timeEl = $("ms-time"), bestEl = $("ms-best"), statusEl = $("ms-status");
  var toolEl = $("ms-tool"), endEl = $("ms-end");
  var coarse = window.matchMedia("(pointer: coarse)").matches;
  var canVibrate = "vibrate" in navigator && coarse;

  // mesure d'audience GoatCounter (sans cookie), comme sur le reste du site
  if (location.protocol === "https:") {
    var gc = document.createElement("script");
    gc.async = true;
    gc.src = "https://gc.zgo.at/count.js";
    gc.dataset.goatcounter = "https://lucasboles.goatcounter.com/count";
    document.head.appendChild(gc);
  }

  /* --- Données gardées dans le navigateur (aucun envoi) ------------------- */
  function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* stockage indisponible */ }
  }
  var DEFAULTS = { hold: true, holdMs: 500, chord: true, invert: false, vibrate: true, flagKey: "f", tenths: false };
  var settings = Object.assign({}, DEFAULTS, load("ms-settings-v1", {}));
  var records = load("ms-records-v1", {});            // { "easy:all": ms, "easy:noflag": ms, ... }
  var identity = load("ms-identity-v1", null);        // { pseudo, token } une fois le premier temps inscrit

  // lien de sauvegarde (#pseudo=...&cle=...) : redonne le pseudo dans ce navigateur.
  // La clé quitte aussitôt la barre d'adresse ; elle n'est vérifiée qu'au prochain envoi.
  var restoreNote = "";
  (function () {
    var h = new URLSearchParams(location.hash.slice(1)), p = h.get("pseudo"), k = h.get("cle");
    if (p === null && k === null) return;
    history.replaceState(null, "", location.pathname + location.search);
    if (!p || !PSEUDO_RE.test(p) || !/^[0-9a-f]{48}$/.test(k || "")) { restoreNote = "bad"; return; }
    identity = { pseudo: p, token: k };
    save("ms-identity-v1", identity);
    keepStorage();
    restoreNote = "ok";
  })();

  // demande au navigateur de ne pas effacer ces données de lui-même (Safari les efface
  // sinon après quelques jours sans visite). Chrome et Safari décident seuls, Firefox demande.
  function keepStorage() {
    try {
      if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persisted().then(function (on) { if (!on) navigator.storage.persist(); }).catch(function () {});
      }
    } catch (e) { /* stockage indisponible */ }
  }

  /* --- Serveur du classement -------------------------------------------------- */
  // mode développeur, uniquement sur localhost : le vrai code du serveur tourne
  // dans le navigateur avec une base en mémoire (localStorage "ms-api-dev" = "mock")
  var devMock = null;
  if (location.hostname === "localhost" && load("ms-api-dev", "") === "mock") {
    devMock = Promise.all([
      import(new URL("leaderboard/worker.js", document.baseURI).href),
      import(new URL("leaderboard/mem-repo.js", document.baseURI).href)
    ]).then(function (mods) {
      var repo = mods[1].memRepo();
      return function (path, init) {
        return mods[0].handle(new Request("https://mock" + path, init), { SALT: "dev" }, repo);
      };
    });
  }
  var rankingOn = !!LEADERBOARD_API || !!devMock;

  function api(path, init) {
    if (devMock) return devMock.then(function (call) { return call(path, init || {}); });
    return fetch(LEADERBOARD_API + path, init);
  }
  function postJson(path, body) {
    return api(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (d) { d._status = r.status; return d; }); });
  }

  /* --- Textes et liens selon la langue ----------------------------------- */
  document.documentElement.lang = LANG;
  document.title = TEXT.pageTitle;
  document.querySelectorAll("[data-i18n]").forEach(function (el) { el.textContent = TEXT[el.dataset.i18n]; });
  document.querySelectorAll("[data-i18n-aria]").forEach(function (el) { el.setAttribute("aria-label", TEXT[el.dataset.i18nAria]); });
  document.querySelectorAll("[data-back]").forEach(function (a) { a.href = LANG === "en" ? "en/" : "./"; });
  var switcher = document.querySelector("[data-lang-switch]");
  switcher.textContent = LANG === "en" ? "FR" : "EN";
  switcher.href = LANG === "en" ? "?lang=fr" : "?lang=en";
  TEXT.rulesList.forEach(function (line) {
    var li = document.createElement("li");
    li.textContent = line;
    $("ms-help-list").appendChild(li);
  });
  $("ms-ranking-tile").hidden = !rankingOn;

  function noFlags() { return !!MSCore.LEVELS[level].noflag; }
  function hint() {
    if (noFlags()) return coarse ? TEXT.hintNoflagTouch : TEXT.hintNoflagMouse;
    if (settings.invert) return TEXT.hintInvert;
    return coarse ? TEXT.hintTouch : TEXT.hintMouse;
  }

  /* --- État de la partie --------------------------------------------------- */
  // noflag : mode Sans drapeau, caché tant que sa case n'a pas été creusée (fenêtre Nouvelle partie)
  var LEVEL_KEYS = ["easy", "medium", "hard", "noflag"];
  var unlocked = load("ms-noflag-v1", false) === true;
  var level = load("ms-level-v1", "easy");
  if (LEVEL_KEYS.indexOf(level) < 0 || (level === "noflag" && !unlocked)) level = "easy";
  var size, mineTotal, cells, opened, flags, over, timer, startedAt;
  var started = false, finalMs = null, flagMode = false, peekNext = false, peek = false;
  var game = null, gameSeq = 0;

  // temps en millisecondes, affiché mm:ss ou mm:ss.d (dixièmes toujours affichés
  // pour les records et le classement)
  function elapsed() { return finalMs !== null ? finalMs : started ? performance.now() - startedAt : 0; }
  function fmt(ms, tenthsForced) {
    var tenths = Math.floor(ms / 100), s = Math.floor(tenths / 10);
    var out = String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
    return settings.tenths || tenthsForced ? out + "." + (tenths % 10) : out;
  }
  function renderTime() { timeEl.textContent = fmt(elapsed()); }
  function renderBest() {
    var best = records[level + ":all"];
    bestEl.textContent = best ? fmt(best, true) : "-";
  }

  function neighbours(i) { return MSCore.neighbours(i, size); }

  // taille des cases : la grille prend toute la place du panneau. Sur ordinateur, elle
  // tient aussi en hauteur dans l'écran, à tous les niveaux, sans défiler pour jouer.
  // Sur téléphone, seule la largeur compte (cases de 28 px au moins, pour le doigt).
  var wide = window.matchMedia("(min-width: 961px)"), lastCell = 0;
  // fresh : nouvelle grille (vue remise à zéro) ; sinon la vue ne repart de zéro que si
  // la taille des cases change (la barre d'adresse du téléphone qui se replie ne compte pas)
  function fitCells(fresh) {
    var gaps = (size - 1) * 3;
    var cell = Math.floor((boardEl.parentNode.clientWidth - 4 - gaps) / size);
    if (wide.matches) {
      // hauteur libre sous le haut du panneau, page en haut (en-tête et titre compris)
      var stage = boardEl.closest(".ms-stage"), cs = getComputedStyle(stage);
      var pad = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
      var top = stage.getBoundingClientRect().top + window.scrollY;
      var gap = parseFloat(cs.rowGap) || 0, above = $("ms-stage-level").offsetHeight + gap;
      var below = toolEl.hidden ? 0 : toolEl.offsetHeight + gap;
      var tall = window.innerHeight - top - pad - 16 - above - below;
      cell = Math.max(20, Math.min(72, cell, Math.floor((tall - gaps) / size)));
    } else {
      cell = Math.max(28, Math.min(56, cell));
    }
    boardEl.style.setProperty("--cell", cell + "px");
    if (fresh === true || cell !== lastCell) resetView(); else applyView();
    lastCell = cell;
  }

  /* --- Grille : la déplacer et la zoomer comme une carte ----------------------
     Un doigt (ou la souris) qui glisse déplace la grille dans tous les sens, deux
     doigts pincent pour zoomer ; sur ordinateur, Ctrl + molette (ou le pincement du
     pavé tactile) zoome et la molette déplace. Arrivée en butée en haut ou en bas,
     la grille laisse défiler la page. Un tap sans glisser reste un clic sur la case. */
  var wrapEl = boardEl.parentNode;
  var view = { s: 1, x: 0, y: 0, w: 0, h: 0 }, MAX_ZOOM = 3, flingRaf = 0;
  var touches = {}, gesture = null;
  function minZoom() { return Math.min(1, wrapEl.clientWidth / view.w, wrapEl.clientHeight / view.h); }
  // plus petite que le cadre : centrée ; plus grande : ses bords ne laissent pas de vide
  function clampAxis(pos, size, frame) { return size <= frame ? (frame - size) / 2 : Math.min(0, Math.max(frame - size, pos)); }
  function applyView() {
    if (!view.w) return;
    view.x = clampAxis(view.x, view.w * view.s, wrapEl.clientWidth);
    view.y = clampAxis(view.y, view.h * view.s, wrapEl.clientHeight);
    boardEl.style.transform = "translate(" + view.x.toFixed(1) + "px, " + view.y.toFixed(1) + "px) scale(" + view.s.toFixed(4) + ")";
  }
  // vue de départ : zoom 1, grille centrée ; le cadre prend la hauteur de la grille
  function resetView() {
    cancelAnimationFrame(flingRaf);
    view.w = boardEl.offsetWidth;
    view.h = boardEl.offsetHeight;
    view.s = 1;
    wrapEl.style.height = view.h + "px";
    view.x = (wrapEl.clientWidth - view.w) / 2;
    view.y = 0;
    applyView();
  }
  // déplace la grille ; renvoie la part du geste vertical qu'elle n'a pas pu prendre
  function panBy(dx, dy) {
    var y0 = view.y;
    view.x += dx;
    view.y += dy;
    applyView();
    return dy - (view.y - y0);
  }
  function zoomAt(k, px, py) {
    var s = Math.max(minZoom(), Math.min(MAX_ZOOM, view.s * k));
    view.x = px - (px - view.x) * s / view.s;
    view.y = py - (py - view.y) * s / view.s;
    view.s = s;
    applyView();
  }
  // défilement immédiat : avec le « scroll-behavior: smooth » de la page, chaque petit pas
  // deviendrait une animation coupée par la suivante et la page suivrait le doigt au ralenti
  var rootStyle = document.documentElement.style;
  function scrollPage(dy) {
    if (Math.abs(dy) <= 0.5) return;
    rootStyle.scrollBehavior = "auto";
    window.scrollBy(0, -dy);
    rootStyle.scrollBehavior = "";
  }
  function points() { return Object.keys(touches).map(function (k) { return touches[k]; }); }
  function pinchOf(p) {
    return { mode: "pinch", d: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) || 1, mx: (p[0].x + p[1].x) / 2, my: (p[0].y + p[1].y) / 2 };
  }
  // un glissé ou un pincement n'est pas un clic : l'appui en cours sur une case est annulé
  function cancelPress() {
    if (!press) return;
    stopHold(cells[press.i] && cells[press.i].el, press.timer);
    press.moved = true;
  }
  // élan au lâcher : la grille continue sur sa lancée et ralentit
  function fling(samples, now) {
    var recent = samples.filter(function (m) { return now - m.t < 100; });
    if (!recent.length || reduceMotion.matches) return;
    var span = Math.max(16, now - recent[0].t + 16), vx = 0, vy = 0, last = performance.now();
    recent.forEach(function (m) { vx += m.dx; vy += m.dy; });
    vx /= span;
    vy /= span;
    (function step(t) {
      var dt = Math.min(32, Math.max(0, t - last));
      last = t;
      scrollPage(panBy(vx * dt, vy * dt));
      var f = Math.pow(0.994, dt);
      vx *= f;
      vy *= f;
      if (Math.hypot(vx, vy) > 0.03) flingRaf = requestAnimationFrame(step);
    })(last);
  }
  wrapEl.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    cancelAnimationFrame(flingRaf);
    touches[e.pointerId] = { x: e.clientX, y: e.clientY };
    var p = points();
    if (p.length === 1) gesture = { mode: "wait", sx: e.clientX, sy: e.clientY, lx: e.clientX, ly: e.clientY, v: [] };
    else if (p.length === 2) { cancelPress(); gesture = pinchOf(p); wrapEl.classList.add("is-panning"); }
  });
  window.addEventListener("pointermove", function (e) {
    if (!touches[e.pointerId] || !gesture) return;
    touches[e.pointerId] = { x: e.clientX, y: e.clientY };
    var p = points();
    if (gesture.mode === "pinch") {
      if (p.length < 2) return;
      var g = pinchOf(p), r = wrapEl.getBoundingClientRect();
      zoomAt(g.d / gesture.d, g.mx - r.left, g.my - r.top);
      panBy(g.mx - gesture.mx, g.my - gesture.my);
      gesture = g;
      return;
    }
    if (gesture.mode === "wait") {
      if (Math.abs(e.clientX - gesture.sx) <= MOVE_TOLERANCE && Math.abs(e.clientY - gesture.sy) <= MOVE_TOLERANCE) return;
      gesture.mode = "pan";
      cancelPress();
      wrapEl.classList.add("is-panning");
    }
    var dx = e.clientX - gesture.lx, dy = e.clientY - gesture.ly;
    gesture.lx = e.clientX;
    gesture.ly = e.clientY;
    scrollPage(panBy(dx, dy));
    gesture.v.push({ t: e.timeStamp, dx: dx, dy: dy });
    if (gesture.v.length > 8) gesture.v.shift();
  });
  function endPointer(e) {
    if (!touches[e.pointerId]) return;
    delete touches[e.pointerId];
    var p = points();
    if (!gesture) return;
    if (gesture.mode === "pinch") {
      // un doigt reste posé après le pincement : il continue de déplacer la grille
      gesture = p.length ? { mode: "pan", lx: p[0].x, ly: p[0].y, v: [] } : null;
      if (!gesture) wrapEl.classList.remove("is-panning");
      return;
    }
    if (p.length) return;
    if (gesture.mode === "pan" && e.type === "pointerup") fling(gesture.v, e.timeStamp);
    gesture = null;
    wrapEl.classList.remove("is-panning");
  }
  window.addEventListener("pointerup", endPointer);
  window.addEventListener("pointercancel", endPointer);
  wrapEl.addEventListener("wheel", function (e) {
    var unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? wrapEl.clientHeight : 1;
    if (e.ctrlKey) {
      e.preventDefault();
      var r = wrapEl.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * unit * 0.003), e.clientX - r.left, e.clientY - r.top);
      return;
    }
    // la molette déplace la grille tant qu'elle peut, puis laisse défiler la page
    var x0 = view.x, y0 = view.y;
    panBy(-e.deltaX * unit, -e.deltaY * unit);
    if (view.x !== x0 || view.y !== y0) e.preventDefault();
  }, { passive: false });
  // clavier : la case qui prend le focus est ramenée dans le cadre
  boardEl.addEventListener("focusin", function (e) {
    var c = e.target;
    if (!c.classList.contains("ms-cell") || !view.w) return;
    var fw = wrapEl.clientWidth, fh = wrapEl.clientHeight, side = c.offsetWidth * view.s;
    var l = view.x + c.offsetLeft * view.s, t = view.y + c.offsetTop * view.s;
    if (l < 0) view.x -= l; else if (l + side > fw) view.x -= l + side - fw;
    if (t < 0) view.y -= t; else if (t + side > fh) view.y -= t + side - fh;
    wrapEl.scrollLeft = wrapEl.scrollTop = 0;
    applyView();
  });

  // rappel du niveau en cours, en haut du panneau de la grille
  function renderStageLevel() { $("ms-stage-level").textContent = TEXT[level]; }

  // commutateur Pelle / Drapeau : ce que fait un tap (les clics inversés des réglages
  // donnent le point de départ, le commutateur montre toujours l'action réelle)
  function renderTool() {
    var flagTap = flagMode !== settings.invert;
    toolEl.classList.toggle("is-flag", flagTap);
    toolEl.querySelectorAll("[data-tool]").forEach(function (b) {
      b.setAttribute("aria-pressed", String((b.dataset.tool === "flag") === flagTap));
    });
  }

  function randomSeed() { return crypto.getRandomValues(new Uint32Array(1))[0]; }

  function newGame() {
    clearInterval(timer);
    size = MSCore.LEVELS[level].size;
    mineTotal = MSCore.LEVELS[level].mines;
    cells = [];
    opened = flags = 0;
    finalMs = null;
    started = over = false;
    peek = peekNext;
    peekNext = false;
    statusEl.textContent = hint();
    statusEl.className = "ms-status";
    // chaque partie commence à la pelle
    flagMode = false;
    toolEl.hidden = !coarse || noFlags();
    renderTool();
    renderStageLevel();
    closeEnd();

    // la graine vient du serveur quand le classement est actif, sinon du navigateur
    game = { seq: ++gameSeq, id: null, seed: randomSeed(), ranked: false, actions: [], submitted: false };
    if (rankingOn && !peek) {
      var seq = game.seq, lvl = level;
      postJson("/start", { level: lvl }).then(function (d) {
        // reçue trop tard (partie déjà commencée) : la partie reste hors classement
        if (game.seq === seq && !started && d.id) {
          game.id = d.id;
          game.seed = d.seed;
          game.ranked = true;
        }
      }).catch(function () { /* hors ligne : partie non classée */ });
    }

    boardEl.textContent = "";
    boardEl.style.gridTemplateColumns = "repeat(" + size + ", var(--cell))";
    for (var i = 0; i < size * size; i++) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ms-cell";
      b.dataset.i = i;
      b.tabIndex = i === 0 ? 0 : -1;
      boardEl.appendChild(b);
      cells.push({ el: b, mine: false, open: false, flag: false, n: 0 });
    }
    cells.forEach(function (_, idx) { paint(idx); });
    updateMines();
    renderTime();
    renderBest();
    fitCells(true);
  }

  function placeMines(first) {
    var b = MSCore.makeBoard(level, game.seed, first);
    cells.forEach(function (cell, idx) { cell.mine = b.mine[idx]; cell.n = b.n[idx]; });
    if (peek) cells.forEach(function (_, idx) { paint(idx); });
  }

  function paint(i) {
    var cell = cells[i], el = cell.el, r = Math.floor(i / size) + 1, c = (i % size) + 1, state;
    el.className = "ms-cell";
    el.textContent = "";
    if (cell.open) {
      el.classList.add("is-open");
      if (cell.mine) { el.classList.add("is-mine"); el.textContent = "✹"; state = TEXT.mine; }
      else if (cell.n) { el.classList.add("n" + cell.n); el.textContent = cell.n; state = String(cell.n); }
      else state = TEXT.empty;
    } else if (cell.flag) {
      el.classList.add("is-flag");
      el.textContent = "⚑";
      state = TEXT.flagged;
    } else {
      state = TEXT.hidden;
      if (peek && cell.mine && !over) el.classList.add("is-peek");
    }
    el.setAttribute("aria-label", TEXT.cell.replace("{r}", r).replace("{c}", c) + " : " + state);
  }

  function updateMines() { minesEl.textContent = mineTotal - flags; }

  function startTimer() {
    started = true;
    startedAt = performance.now();
    timer = setInterval(renderTime, 100);
  }

  // chaque action du joueur est notée avec son instant : le serveur la rejouera
  function record(a, i) {
    var acts = game.actions, last = acts.length ? acts[acts.length - 1].t : 0;
    var t = acts.length ? Math.max(last, Math.round(performance.now() - startedAt)) : 0;
    acts.push({ a: a, i: i, t: t });
  }

  // révélation en largeur : les zones vides s'ouvrent sans récursion
  function reveal(i) {
    if (over || cells[i].open || cells[i].flag) return;
    if (cells[i].mine) { lose(i); return; }
    var queue = [i];
    while (queue.length) {
      var k = queue.shift(), cell = cells[k];
      if (cell.open || cell.flag) continue;
      cell.open = true;
      opened++;
      paint(k);
      if (cell.n === 0) neighbours(k).forEach(function (nb) { if (!cells[nb].open) queue.push(nb); });
    }
    if (opened === cells.length - mineTotal) win();
  }

  function userReveal(i) {
    if (over || cells[i].open || cells[i].flag) return;
    if (!started) {
      placeMines(i);
      record("r", i);
      startTimer();
    } else {
      record("r", i);
    }
    reveal(i);
  }

  // clic sur un chiffre : si autant de drapeaux que le chiffre, on ouvre le reste
  function chord(i) {
    if (!settings.chord || over) return;
    var around = neighbours(i);
    var flagged = around.filter(function (nb) { return cells[nb].flag; }).length;
    if (flagged !== cells[i].n) return;
    if (!around.some(function (nb) { return !cells[nb].open && !cells[nb].flag; })) return;
    record("c", i);
    around.forEach(function (nb) { if (!over && !cells[nb].open && !cells[nb].flag) reveal(nb); });
  }

  // les drapeaux se posent après le premier clic (la grille n'existe pas avant)
  function toggleFlag(i) {
    var cell = cells[i];
    if (over || cell.open || !started || noFlags()) return;
    cell.flag = !cell.flag;
    flags += cell.flag ? 1 : -1;
    record("f", i);
    paint(i);
    updateMines();
    if (cell.flag && canVibrate && settings.vibrate) navigator.vibrate(15);
  }

  // action principale (clic, tap, Entrée) et action secondaire (clic droit, appui long)
  function flagsFirst() { return started && !noFlags() && flagMode !== settings.invert; }
  function primary(i) {
    if (over) { showEnd(); return; }
    var cell = cells[i];
    if (cell.open) { if (cell.n) chord(i); return; }
    if (flagsFirst()) toggleFlag(i); else userReveal(i);
  }
  function secondary(i) {
    if (over) return;
    var cell = cells[i];
    if (cell.open) { if (cell.n) chord(i); return; }
    if (flagsFirst()) userReveal(i); else toggleFlag(i);
  }

  function finish() {
    over = true;
    clearInterval(timer);
    finalMs = elapsed();
  }

  function lose(i) {
    finish();
    renderTime();
    cells.forEach(function (cell, idx) {
      if (cell.mine && !cell.flag) { cell.open = true; paint(idx); }
      else if (cell.flag && !cell.mine) { paint(idx); cell.el.classList.add("is-wrong"); }
    });
    cells[i].el.classList.add("is-boom");
    statusEl.textContent = TEXT.lose;
    statusEl.className = "ms-status is-lose";
    showEnd(null);
  }

  function win() {
    finish();
    // le temps officiel est celui de la dernière action, comme sur le serveur
    finalMs = game.actions[game.actions.length - 1].t;
    renderTime();
    cells.forEach(function (cell, idx) {
      if (cell.mine && !cell.flag) { cell.flag = true; flags++; paint(idx); }
    });
    updateMines();
    var badges = [];
    if (!peek) {
      if (improve(level + ":all", finalMs)) badges.push(TEXT.newRecord);
      renderBest();
    }
    statusEl.textContent = TEXT.win + " - " + fmt(finalMs);
    statusEl.className = "ms-status is-win";
    showEnd(badges);
  }

  function improve(key, ms) {
    if (records[key] && records[key] <= ms) return false;
    records[key] = ms;
    save("ms-records-v1", records);
    return true;
  }

  /* --- Fenêtre de fin -------------------------------------------------------- */
  var lastFocus = null;
  // pendant une fenêtre posée sur la page (fin de partie, code), le reste devient inerte :
  // Tab reste dans la fenêtre et les lecteurs d'écran ne lisent qu'elle
  function pageInert(on) {
    document.querySelectorAll("body > header, body > main, body > footer").forEach(function (el) { el.inert = on; });
  }
  var rankBlock = $("ms-rank-block"), rankForm = $("ms-rank-form"), rankMsg = $("ms-rank-msg"), pseudoInput = $("ms-pseudo");

  function showEnd(badges) {
    var won = statusEl.classList.contains("is-win");
    $("ms-end-title").textContent = won ? TEXT.win : TEXT.lose;
    $("ms-end-text").textContent = (won ? TEXT.winText : TEXT.loseText).replace("{t}", fmt(finalMs, won));
    if (badges) $("ms-badges").textContent = badges.join(" - ");
    else if (!won) $("ms-badges").textContent = "";
    $("ms-share").hidden = !won;
    $("ms-share-note").textContent = "";
    lastFocus = document.activeElement;
    endEl.hidden = false;
    pageInert(true);
    if (won && badges) rankingOnWin(); else if (!won) rankBlock.hidden = true;
    $("ms-end-new").focus();
  }
  function closeEnd() {
    if (endEl.hidden) return;
    endEl.hidden = true;
    pageInert(false);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  // une seule colonne (téléphone) : après « Nouvelle partie » ou un changement de niveau,
  // la page descend pour montrer les compteurs et la grille, si la grille n'est pas
  // déjà entièrement à l'écran
  function showBoard() {
    if (window.matchMedia("(min-width: 961px)").matches) return;
    var b = boardEl.getBoundingClientRect();
    if (b.top >= 0 && b.bottom <= window.innerHeight) return;
    var top = $("ms-mines").closest(".ms-stats").getBoundingClientRect().top + window.scrollY - 12;
    window.scrollTo({ top: top, behavior: reduceMotion.matches ? "auto" : "smooth" });
  }
  $("ms-end-new").addEventListener("click", function () { newGame(); showBoard(); });
  $("ms-end-level").addEventListener("click", function () { closeEnd(); openPick(); });
  $("ms-end-close").addEventListener("click", closeEnd);
  endEl.addEventListener("click", function (e) { if (e.target === endEl) closeEnd(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && codeEl.hidden) closeEnd(); });

  /* --- Classement : inscription du temps --------------------------------------- */
  function setRankMsg(text, kind) {
    rankMsg.textContent = text;
    rankMsg.className = "ms-rank-msg" + (kind ? " is-" + kind : "");
  }

  function rankingOnWin() {
    rankBlock.hidden = true;
    if (!rankingOn) return;
    rankBlock.hidden = false;
    rankForm.hidden = true;
    if (peek) { setRankMsg(TEXT.unrankedPeek); return; }
    if (!game.ranked) { setRankMsg(TEXT.unrankedLate); return; }
    if (identity) {
      // pseudo déjà choisi dans ce navigateur : inscription directe à son nom
      submitScore(identity.pseudo, identity.token);
    } else {
      setRankMsg("");
      rankForm.hidden = false;
      pseudoInput.value = "";
      setTimeout(function () { pseudoInput.focus(); }, 50);
    }
  }

  function submitScore(pseudo, token) {
    if (game.submitted) return;
    game.submitted = true;
    var g = game;
    setRankMsg(TEXT.sending.replace("{p}", pseudo));
    postJson("/scores", { id: g.id, pseudo: pseudo, token: token || undefined, actions: g.actions }).then(function (d) {
      if (d.error) {
        g.submitted = false;
        var lost = d.error === "pseudo-taken" && identity && identity.pseudo === pseudo;
        if (lost) {
          // le jeton gardé ne correspond plus : on repart d'un pseudo à choisir
          identity = null;
          save("ms-identity-v1", null);
          renderMe();
        }
        var fixable = /^pseudo-/.test(d.error);
        setRankMsg(lost ? TEXT.tokenLost.replace("{p}", pseudo) : TEXT.err[d.error] || TEXT.err.replay, "error");
        rankForm.hidden = !fixable;
        if (fixable) pseudoInput.focus();
        return;
      }
      if (d.token) {
        identity = { pseudo: pseudo, token: d.token };
        save("ms-identity-v1", identity);
        keepStorage();
        renderMe();
      }
      rankForm.hidden = true;
      // une seule ligne par pseudo : elle n'est remplacée que par un meilleur temps
      var msg = (d.all.improved ? TEXT.rankNew : TEXT.rankKept).replace("{p}", pseudo)
        .replace("{rank}", TEXT.ordinal(d.all.rank)).replace("{best}", fmt(d.all.best, true));
      setRankMsg(msg, "ok");
      podiumCache = {};
      loadPodium();
    }).catch(function () {
      g.submitted = false;
      setRankMsg(TEXT.err.network, "error");
      rankForm.hidden = !!identity;
    });
  }

  rankForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var pseudo = pseudoInput.value.trim();
    if (!PSEUDO_RE.test(pseudo)) { setRankMsg(TEXT.err["pseudo-invalid"], "error"); return; }
    submitScore(pseudo, null);
  });

  /* --- Classement : affichage -------------------------------------------------- */
  var rankLevel = "easy", rankReq = 0;
  function sameName(a, b) {
    var k = function (s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); };
    return k(a) === k(b);
  }
  function loadRanking() {
    var list = $("ms-rank-list"), state = $("ms-rank-state"), req = ++rankReq;
    list.textContent = "";
    state.textContent = TEXT.lbLoading;
    $("ms-rank-me").textContent = identity ? TEXT.youAre.replace("{p}", identity.pseudo) : TEXT.youAreNot;
    api("/scores?level=" + rankLevel + "&cat=all").then(function (r) { return r.json(); }).then(function (d) {
      if (req !== rankReq) return;
      if (!d.scores) throw new Error("format");
      state.textContent = d.scores.length ? "" : TEXT.lbEmpty;
      d.scores.forEach(function (s) {
        var li = document.createElement("li"), who = document.createElement("span"), t = document.createElement("span");
        who.className = "who";
        who.textContent = s.pseudo;
        t.className = "t";
        t.textContent = fmt(s.timeMs, true);
        li.append(who, t);
        if (identity && sameName(s.pseudo, identity.pseudo)) li.classList.add("is-me");
        list.appendChild(li);
      });
    }).catch(function () {
      if (req === rankReq) state.textContent = TEXT.lbError;
    });
  }
  /* --- Rappel du pseudo et lien de sauvegarde -------------------------------- */
  // un pseudo long se coupe de préférence après _ . ou - (texte inséré tel quel, jamais en HTML)
  function nameInto(el, pseudo) {
    el.textContent = "";
    pseudo.split(/(?<=[_.-])/).forEach(function (part, n) {
      if (n) el.appendChild(document.createElement("wbr"));
      el.appendChild(document.createTextNode(part));
    });
  }
  function renderMe() {
    var me = $("ms-me");
    me.textContent = "";
    if (identity) {
      var b = document.createElement("strong");
      nameInto(b, identity.pseudo);
      me.append(TEXT.meLine, b);
    } else {
      me.textContent = TEXT.youAreNot;
    }
    $("ms-save").hidden = !identity;
  }
  function saveLink() {
    var h = new URLSearchParams({ pseudo: identity.pseudo, cle: identity.token });
    return location.href.split("#")[0] + "#" + h.toString();
  }
  $("ms-save").addEventListener("click", function () {
    if (!identity) return;
    var note = $("ms-save-note"), link = saveLink();
    var done = false, manual = function () { if (!done) { done = true; note.textContent = TEXT.saveManual + link; } };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      // un navigateur qui ne répond pas (autorisation en attente) : le lien s'affiche à copier
      var slow = setTimeout(manual, 1500);
      navigator.clipboard.writeText(link).then(function () {
        clearTimeout(slow);
        if (!done) { done = true; note.textContent = TEXT.saveCopied; }
      }, function () { clearTimeout(slow); manual(); });
    } else {
      manual();
    }
  });
  renderMe();
  if (restoreNote) $("ms-save-note").textContent = restoreNote === "ok" ? TEXT.restored.replace("{p}", identity.pseudo) : TEXT.restoreBad;

  /* --- Podium : les trois premiers, visibles dès l'arrivée ---------------------
     Il montre le niveau en cours ; les flèches sous les marches passent aux autres. */
  var podiumCache = {}, podiumReq = 0, podiumLevel = level;
  // meilleurs temps d'un niveau, gardés une minute : passer d'un niveau à l'autre
  // en boucle (podium, fenêtre Nouvelle partie) ne relance pas de requête
  function topScores(lvl) {
    var cached = podiumCache[lvl];
    if (cached && Date.now() - cached.at < 60000) return Promise.resolve(cached.scores);
    return api("/scores?level=" + lvl + "&cat=all").then(function (r) { return r.json(); }).then(function (d) {
      if (!d.scores) throw new Error("format");
      podiumCache[lvl] = { at: Date.now(), scores: d.scores };
      return d.scores;
    });
  }
  function loadPodium(lvl, dir) {
    var box = $("ms-podium"), name = $("ms-podium-level");
    if (!rankingOn) return;
    box.hidden = false;
    podiumLevel = lvl || level;
    $("ms-podium-title").textContent = TEXT.podiumTitle;
    name.textContent = TEXT[podiumLevel];
    swapIn(name, dir < 0 ? "is-from-left" : dir > 0 ? "is-from-right" : "");
    var req = ++podiumReq;
    topScores(podiumLevel).then(function (scores) {
      if (req === podiumReq) renderPodium(scores);
    }).catch(function () {
      // serveur injoignable : on retire le podium plutôt que d'afficher une erreur
      if (req === podiumReq) box.hidden = true;
    });
  }
  // relance l'animation d'entrée d'un texte qui vient de changer
  function swapIn(el, extra) {
    el.classList.remove("is-swap", "is-from-left", "is-from-right");
    void el.offsetWidth;
    el.classList.add("is-swap");
    if (extra) el.classList.add(extra);
  }
  [["ms-podium-prev", -1], ["ms-podium-next", 1]].forEach(function (a) {
    $(a[0]).addEventListener("click", function () {
      // Sans drapeau reste secret tant que l'énigme n'est pas résolue
      var keys = LEVEL_KEYS.filter(function (k) { return unlocked || k !== "noflag"; });
      var n = (keys.indexOf(podiumLevel) + a[1] + keys.length) % keys.length;
      loadPodium(keys[n], a[1]);
    });
  });
  // trois marches toujours présentes : une place vide donne envie de la prendre.
  // Chaque place porte le laurier du démineur, dessiné case par case par tools/make_podium_art.py.
  var STEP_ROWS = [8, 6, 4], CELL = 14;
  var CONFETTI = ["1", "2", "3", "4", "5", "6", "7", "8", "1", "2", "3", "", "", "", ""];   // chiffres du jeu, et des cases
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var podiumIO = null, podiumTimer = 0;
  function laurel() {
    var svg = $("ms-laurel-tpl").content.firstElementChild.cloneNode(true);
    // chaque branche pousse feuille après feuille, du nœud vers la pointe
    svg.querySelectorAll(".lr-seg").forEach(function (g) { g.style.setProperty("--k", g.getAttribute("data-k")); });
    return svg;
  }
  // la marche est un morceau de grille ; ses cases s'ouvrent en cascade depuis le haut
  function fillCells(block) {
    var grid = block.firstChild, rows = STEP_ROWS[+block.getAttribute("data-rank")];
    var cols = Math.max(1, Math.ceil(block.clientWidth / CELL)), mid = (cols - 1) / 2;
    if (grid.childElementCount === cols * rows) return;
    grid.textContent = "";
    grid.style.setProperty("--cols", cols);
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var cell = document.createElement("i");
        cell.style.setProperty("--d", Math.round(Math.abs(c - mid)) + r);
        grid.appendChild(cell);
      }
    }
  }
  // pour le premier : une gerbe de chiffres du démineur et de cases
  function confetti() {
    var wrap = document.createElement("span");
    wrap.className = "ms-confetti";
    wrap.setAttribute("aria-hidden", "true");
    CONFETTI.forEach(function (ch, n) {
      var p = document.createElement("i"), a = Math.PI * (1.08 + 0.84 * n / (CONFETTI.length - 1)) + (Math.random() - 0.5) * 0.25;
      var dist = 56 + Math.random() * 64;
      p.className = ch ? "n" + ch : "is-cell";
      p.textContent = ch;
      p.style.setProperty("--x", Math.round(Math.cos(a) * dist * 1.25) + "px");
      p.style.setProperty("--y", Math.round(Math.sin(a) * dist) + "px");
      p.style.setProperty("--r", Math.round((Math.random() - 0.5) * 300) + "deg");
      p.style.setProperty("--n", n % 5);
      wrap.appendChild(p);
    });
    return wrap;
  }
  function startPodium(box) {
    box.classList.remove("is-wait");
    void box.offsetWidth;
    box.classList.add("is-in");
    podiumTimer = setTimeout(function () {
      box.classList.add("is-done");
      var c = box.querySelector(".ms-confetti");
      if (c) c.remove();
    }, 4200);
  }
  function renderPodium(scores) {
    var list = $("ms-podium-list"), box = $("ms-podium");
    list.textContent = "";
    $("ms-podium-empty").textContent = scores.length ? "" : TEXT.podiumEmpty;
    for (var k = 0; k < 3; k++) {
      var s = scores[k], li = document.createElement("li");
      li.className = "ms-step" + (s ? "" : " is-empty");
      var crown = document.createElement("span"), who = document.createElement("span"), t = document.createElement("span"),
        block = document.createElement("span"), cells = document.createElement("span"), rank = document.createElement("span");
      crown.className = "ms-step-crown";
      crown.appendChild(laurel());
      if (s && k === 0) crown.appendChild(confetti());
      who.className = "ms-step-who";
      if (s) nameInto(who, s.pseudo); else who.textContent = TEXT.podiumFree;
      if (s) who.title = s.pseudo;
      if (s && s.pseudo.length > 9) who.classList.add("is-long");
      t.className = "ms-step-time";
      t.textContent = s ? fmt(s.timeMs, true) : "--:--.-";
      block.className = "ms-step-block";
      block.setAttribute("data-rank", k);
      cells.className = "ms-step-cells";
      rank.className = "ms-step-rank";
      rank.textContent = String(k + 1);
      rank.setAttribute("aria-hidden", "true");
      block.append(cells, rank);
      li.append(crown, who, t, block);
      li.setAttribute("aria-label", TEXT.ordinal(k + 1) + " : " + (s ? s.pseudo + ", " + fmt(s.timeMs, true) : TEXT.podiumFree));
      if (s && identity && sameName(s.pseudo, identity.pseudo)) li.classList.add("is-me");
      list.appendChild(li);
    }
    list.querySelectorAll(".ms-step-block").forEach(fillCells);
    // la cérémonie : le 3e, puis le 2e, puis le 1er ; elle attend que le podium soit à l'écran
    clearTimeout(podiumTimer);
    box.classList.remove("is-in", "is-done");
    if (reduceMotion.matches) { box.classList.add("is-done"); return; }
    box.classList.add("is-wait");
    var r = box.getBoundingClientRect();
    if (!("IntersectionObserver" in window) || (r.top < innerHeight * 0.8 && r.bottom > 0)) { startPodium(box); return; }
    if (!podiumIO) {
      podiumIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting && e.target.classList.contains("is-wait")) startPodium(e.target); });
      }, { threshold: 0.3 });
      podiumIO.observe(box);
    }
  }
  // la largeur des marches change avec la fenêtre : on recompte les cases
  if ("ResizeObserver" in window) {
    new ResizeObserver(function () { $("ms-podium-list").querySelectorAll(".ms-step-block").forEach(fillCells); }).observe($("ms-podium-list"));
  }

  function setTabs(attr, value) {
    document.querySelectorAll("[" + attr + "]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute(attr) === value)); });
  }
  document.querySelectorAll("[data-rank-level]").forEach(function (b) {
    b.addEventListener("click", function () { rankLevel = b.dataset.rankLevel; setTabs("data-rank-level", rankLevel); loadRanking(); });
  });

  /* --- Appui long ------------------------------------------------------------
     Partagé par la grille et la case d'essai des réglages : une barre se remplit
     sous la case pendant settings.holdMs, puis onHold() est appelé. */
  function startHold(el, onHold) {
    el.style.setProperty("--hold", settings.holdMs + "ms");
    el.classList.add("is-holding");
    return setTimeout(function () {
      el.classList.remove("is-holding");
      onHold();
    }, settings.holdMs);
  }
  function stopHold(el, t) {
    clearTimeout(t);
    if (el) el.classList.remove("is-holding");
  }

  /* --- Souris et tactile (Pointer Events) ------------------------------------ */
  var press = null, lastPointer = "mouse";
  function cellIndex(target) {
    var el = target.closest && target.closest(".ms-cell");
    return el && boardEl.contains(el) ? Number(el.dataset.i) : -1;
  }

  boardEl.addEventListener("pointerdown", function (e) {
    lastPointer = e.pointerType;
    var i = cellIndex(e.target);
    if (i < 0 || e.button !== 0) return;
    press = { i: i, x: e.clientX, y: e.clientY, long: false, timer: null };
    // appui long sur une case fermée, partie commencée : action secondaire
    if (settings.hold && started && !over && !cells[i].open && !noFlags()) {
      press.timer = startHold(cells[i].el, function () {
        if (!press) return;
        press.long = true;
        secondary(press.i);
      });
    }
  });
  boardEl.addEventListener("pointermove", function (e) {
    if (!press) return;
    if (Math.abs(e.clientX - press.x) > MOVE_TOLERANCE || Math.abs(e.clientY - press.y) > MOVE_TOLERANCE) {
      stopHold(cells[press.i].el, press.timer);
      press.moved = true;
    }
  });
  boardEl.addEventListener("pointerup", function (e) {
    if (!press) return;
    var p = press;
    press = null;
    stopHold(cells[p.i] && cells[p.i].el, p.timer);
    if (p.long || p.moved || cellIndex(e.target) !== p.i) return;
    primary(p.i);
  });
  boardEl.addEventListener("pointercancel", function () {
    if (press) stopHold(cells[press.i] && cells[press.i].el, press.timer);
    press = null;
  });
  boardEl.addEventListener("contextmenu", function (e) {
    e.preventDefault();
    var i = cellIndex(e.target);
    if (i >= 0 && lastPointer === "mouse") secondary(i);
  });
  // clavier : Entrée et Espace déclenchent un « click » sans pointeur (detail = 0)
  boardEl.addEventListener("click", function (e) {
    var i = cellIndex(e.target);
    if (i >= 0 && e.detail === 0) primary(i);
  });
  boardEl.addEventListener("keydown", function (e) {
    var i = cellIndex(e.target);
    if (i < 0) return;
    var r = Math.floor(i / size), c = i % size, next = -1;
    if (e.key === "ArrowUp" && r > 0) next = i - size;
    if (e.key === "ArrowDown" && r < size - 1) next = i + size;
    if (e.key === "ArrowLeft" && c > 0) next = i - 1;
    if (e.key === "ArrowRight" && c < size - 1) next = i + 1;
    if (next >= 0) {
      e.preventDefault();
      cells[i].el.tabIndex = -1;
      cells[next].el.tabIndex = 0;
      cells[next].el.focus();
    } else if (e.key.toLowerCase() === settings.flagKey) {
      e.preventDefault();
      toggleFlag(i);
    }
  });

  /* --- Commandes de la page ---------------------------------------------------- */
  toolEl.querySelectorAll("[data-tool]").forEach(function (b) {
    b.addEventListener("click", function () {
      flagMode = (b.dataset.tool === "flag") !== settings.invert;
      renderTool();
    });
  });
  $("ms-new").addEventListener("click", openPick);
  window.addEventListener("resize", function () { fitCells(false); });

  // partage : menu natif sur téléphone, sinon copie du message ; ?ref=partage
  // permet de compter dans GoatCounter les visites venues d'un partage
  $("ms-share").addEventListener("click", function () {
    var url = new URL("minesweeper.html", location.href);
    url.search = "?ref=partage" + (LANG === "en" ? "&lang=en" : "");
    var text = TEXT.shareText.replace("{level}", TEXT[level]).replace("{t}", fmt(finalMs, true));
    var note = $("ms-share-note");
    if (navigator.share && coarse) {
      navigator.share({ title: TEXT.pageTitle, text: text, url: url.href }).catch(function () { /* partage annulé */ });
      return;
    }
    var full = text + " " + url.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(full).then(function () { note.textContent = TEXT.shareCopied; },
        function () { note.textContent = TEXT.shareManual + full; });
    } else {
      note.textContent = TEXT.shareManual + full;
    }
  });

  /* --- Fenêtres Règles, Commandes, Classement (élément dialog natif) ---------- */
  document.querySelectorAll("[data-open]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      $(btn.dataset.open).showModal();
      if (btn.dataset.open === "ms-ranking") {
        rankLevel = podiumLevel;
        setTabs("data-rank-level", rankLevel);
        loadRanking();
      }
    });
  });
  document.querySelectorAll(".ms-sheet").forEach(function (dlg) {
    dlg.querySelector("[data-close]").addEventListener("click", function () { dlg.close(); });
    // clic sur le fond assombri (en dehors de la fenêtre) : on ferme, si l'appui y a
    // aussi commencé (un glissé du slider relâché dehors ne ferme rien)
    var outside = function (e) {
      var r = dlg.getBoundingClientRect();
      return e.target === dlg && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom);
    };
    var downOut = false;
    dlg.addEventListener("pointerdown", function (e) { downOut = outside(e); });
    dlg.addEventListener("click", function (e) {
      if (outside(e) && (downOut || e.detail === 0)) dlg.close();
      downOut = false;
    });
  });

  /* --- Fenêtre Nouvelle partie : un slider de 3 crans pour la difficulté ------
     Le curseur suit le doigt, s'aimante au cran le plus proche au relâcher (avec un
     petit dépassement), et chauffe du vert au rouge. Au-dessus, un aperçu suit en
     direct : mini-grille à la taille du niveau, mines qui tombent, chiffres qui
     défilent, temps à battre et record personnel. */
  // pendant un glissé, seules des transformations changent (curseur, remplissage, trait) :
  // le navigateur les déplace sans recalculer la mise en page de la fenêtre
  var pick = $("ms-pick"), pickRange = $("ms-pick-range"), pickSlider = pick.querySelector(".ms-pick-slider");
  var pickThumb = pick.querySelector(".ms-pick-thumb"), pickFill = pick.querySelector(".ms-pick-fill");
  var pickHeat = pick.querySelector(".ms-pick-heat"), pickW = 0;
  var HEAT = [[47, 158, 110], [224, 138, 30], [210, 52, 44]], NOFLAG_HEAT = "rgb(124 58 237)";
  // hauteur du rail principal et du chemin parallèle, au centre du curseur (voir le CSS)
  var RAIL_Y = 28, BRANCH_Y = 82;
  // énigme : un petit démineur de 10 colonnes × 5 lignes (cases de 20 px, pas de 22 px), la
  // 6e colonne sous le cran du milieu. Il commence fermé : au premier clic, la grille est tirée
  // dans une réserve cherchée par tools/puzzle_pool.py, parmi celles où cette case est un bon
  // départ : ce premier coup ouvre la case et ses voisines sûres, et l'on finit sans deviner,
  // en croisant des chiffres. Les mines guident le serpent : aucun raccourci. Dans chaque grille se cache un
  // serpent, d'une case du haut jusqu'au bord droit, qui passe partout ; les mines sont dans
  // ses creux. Résolue, le serpent perd ses chiffres et devient le chemin. Chaque grille :
  // ses lignes (M : mine ; P : chemin ; . : sûre, hors du chemin) et ses bons départs (numéro
  // de case : ligne × 10 + colonne).
  var PZ_POOL = [
    [[".MPPPMPPP.", "PPPM.MPMP.", "PMM.MPPMPM", "PPPPPPM.PP", "M......M.."], [37]],
    [["MPPPPPPMPP", "PPMMM.M.PM", "PM...M.MP.", "PPPPPPPPP.", ".........."], [17,  47]],
    [["MPPPM.....", "PPMM.MPPP.", "PM...MPMPM", "PPPPPMPMPP", "...MPPPM.."], [22,  32,  33,  34,  42,  44]],
    [["MMPPPPPPP.", ".PPMM..MMM", ".PM..MM.PP", ".PPMPPPMPM", ".MPPPMPPP."], [36,  46]],
    [["MPPPPM....", "PPMMMPPPP.", "PMM.MPMMP.", "PPPPPP.MPM", "......M.PP"], [10,  11,  20,  23,  25,  30,  31,  32,  33,  34,  35,  40,  41,  42,  43,  44,  45]],
    [["....MP.M..", "PPPPPPM.PP", "PM...M.MPM", "PPMMMMPPPM", "MPPPPPPM.."], [15]],
    [[".PM...M.PP", ".PMPPP.MPM", ".PMPMPMMP.", ".PMPMPPPP.", ".PPPM....."], [33]],
    [["PM...M....", "PM.PPPM.PP", "PM.PMPPMPM", "PPMP.MPPP.", "MPPP.M...M"], [15]],
    [[".MPM......", ".PP.MPPPP.", ".PMM.PMMP.", ".PPPMPM.PM", "..MPPP.MPP"], [24,  25,  37]],
    [["MPPPM.....", "PPMM.PPPP.", "PM..MPMMP.", "PPPPPP.MPM", "......M.PP"], [5,  20,  22,  23,  25,  30,  31,  32,  33,  34,  35,  40,  41,  42,  43,  44,  45]],
    [["PPPMMPPPP.", "PMMMPPMMP.", "PM.PPMPPP.", "PMMPM.PMMM", "PPPP.MPPPP"], [24,  35]],
    [["MPPPP.MPPP", "PPMMMM.PM.", "PM....MPPM", "PPPPPPPMP.", ".....MPPP."], [36,  46]],
    [["MPPPPPPPP.", "PPM...MMMM", "PMM..MPPP.", "PPPMMPPMPM", ".MPPPPM.PP"], [36]],
    [["MPPP.MPPP.", "PPMM.MPMP.", "PM..MPPMPM", "PPPPPPM.PP", ".......M.."], [37]],
    [["MPPP.M....", "PPMMMPPPP.", "PMM.MPMMP.", "PMPPPP.MPM", "PPPM..M.PP"], [32]],
    [["..MPPPPMPP", ".PPPM.M.PM", "MPMM.M.MP.", ".PPPPPPPP.", ".........."], [17]],
    [["MPPPPPPPM.", "PPMMMMMMPP", "PM.MPPPMPM", "PPPPPMPPP.", "....M....."], [25]],
    [["..MPPPM...", ".PPPMM..PP", ".PMM..MMPM", ".PPPPMPPP.", "...MPPPM.M"], [32,  33,  42]],
    [["MPPMPPPPP.", ".PMMPMMMP.", ".PMPPMPPPM", "MPMPM.PMM.", "MPPPM.PPPP"], [27]],
    [["MPPPM...M.", "PPMMPPPMPP", "PM.MPMPMPM", "PPPPPMPPP.", "......M..."], [36,  45]],
    [[".MPPPPPPP.", ".PPMM...MM", ".PM..M.MPP", ".PPPPPMMPM", "...MMPPPPM"], [3,  4,  24]],
    [["PM.PPPM.PP", "PPMPMPPMPM", "MPMP.MPMP.", ".PPPM.PPP.", ".....M...."], [24]],
    [["MPPP.MPPP.", "PPM..MPMP.", "PM..MPPMPM", "PPMMPPM.PP", "MPPPPM...."], [35]],
    [["MPPPPP.M.M", "PPMMMMM.PP", "PM.PPPMMPM", "PPMPMPPPPM", "MPPP.M...M"], [24,  35]],
    [[".MPPPPMMP.", "PPPMMPPPPM", "PMMM.M.MM.", "PPPPPPM...", "M...MPPPPP"], [35]],
    [[".MPPPPPPP.", ".PPMMMMM.M", ".PMM.PPPM.", ".PPPMPMPPP", "..MPPP.M.."], [37]],
    [["MPPPMPPPM.", "PPMM.PMPP.", "PM..MPMMPM", "PPPPPP.MPP", "M.......M."], [38]],
    [[".PPPMMPPP.", ".PMM.PPMP.", ".PM.MPMPP.", ".PMPPPMPMM", ".PPPM.MPPP"], [6,  16]],
    [["PPPPMPPPM.", "PMMM.PMPP.", "PM..MP.MP.", "PPMPPP.MPM", "MPPPM.M.PP"], [17]],
    [["PPPPMPPPP.", "PMMM.PMMP.", "PM..MP.MP.", "PMMPPPM.PM", "PPPPMM..PP"], [34]],
    [[".MPPPP.M..", "PPPMM.M.PP", "PMM..M.MPM", "PPMMPPPPP.", "MPPPPM...."], [17,  26]],
    [["PPPPPPPMPP", "PMM.MMM.PM", "PM.M...MP.", "PMPPPPPPPM", "PPPMM..M.."], [33,  34]],
    [["PPP.M.M..M", "PMMM.PPPPM", "PM..MPMMP.", "PMMPPP.MPM", "PPPPM.M.PP"], [16,  17,  36]],
    [["MPPPMPPPM.", "PPMM.PMPP.", "PM..MP.MP.", "PPMPPP.MPM", "MPPPM.M.PP"], [17]],
    [["..MPPPM.M.", ".PPPM.M.PP", ".PMM.M.MPM", ".PPPPPPMP.", ".....MPPP."], [28,  38]],
    [["MPPPM.MPP.", "PPMPPPPPMM", "PM..M..MPP", "PPMM.MMMPM", "MPPPPPPPPM"], [16,  17]],
    [["MPPP.M....", "PPMM.MPPP.", "PM..MPPMP.", "PPPPPPM.PM", ".M..M..MPP"], [37]],
    [[".PPPPPM.PP", ".PMMMM..PM", "MPMPPPM.P.", ".PPPMPPMP.", "M....MPPP."], [35]],
    [[".MPPPPM.P.", ".PPMMPPMP.", ".PM..MPPP.", ".PPM..MMMM", ".MPPPPPPPP"], [16]],
    [["PPM..MPPP.", "PMM.PPPMPM", "PM.MPMMPP.", "PPPPP.MPMM", "M....M.PPP"], [6]],
    [[".P..MPPPP.", ".PMMPPMMPM", ".PMPPMPPP.", ".PPPM.PMMM", ".....MPPPP"], [24]],
    [[".MPM.PPPMM", ".PP.MPMPP.", ".PMM.P.MPM", ".PPPMP.MPP", "M.MPPPM..M"], [36]],
    [["...MMPPPP.", "PPPPPPM.MM", "PMM.MM.MPP", "PPPMPPPPPM", ".MPPPM...."], [34]],
    [["PPPPPPPPM.", "PMMMMMMMPP", "PM.....MPM", "PPMPPPPPP.", "MPPPM....."], [25,  34,  35,  45]],
    [["PP.MPPP.M.", "PMMMPMPMPP", "PM.PPMPMPM", "PMMPMMPPP.", "PPPP..M..."], [45]],
    [["M......MPM", ".PPPPPPPPM", "MPMMMM.MM.", ".PPPM.MPPP", "..MPPPPPM."], [35]],
    [[".PMPPPM.PP", ".PMPMP.MPM", "MPMPMPM.P.", ".PPPMPPMP.", ".....MPPP."], [36]],
    [["PPPPPPM..M", "PMMMMMPPP.", "PMPPPMPMPM", "PMPMPPPMPP", "PPP.M..M.."], [23]],
    [["MPPPPM.MPM", "PPMMPPPPPM", "PMM.MM.MM.", "PPPPPPMPPP", "....MPPPM."], [35]],
    [["MMPP.MPPP.", "PPPMMPPMP.", "PMM.MPM.P.", "PPPPPPM.PM", "....MM..PP"], [35]],
    [["PPPPPPPPM.", "PM.M.MMMPP", "PPM.M..MPM", "MPPPPPPPP.", "....M....."], [12]],
    [["MPPPPPM...", "PPMMM.M.PP", "PM...M.MPM", "PPPPMMPPP.", "..MPPPPM.."], [31,  32]],
    [[".PPPPPM...", ".PMM.MM.PP", ".PM.M..MPM", ".PMPPPPPP.", ".PPPM....."], [7,  8,  9,  43,  47]],
    [["PPPPM.....", "PM.M.PPPPM", "PMMMMPMMP.", "PPPPPPM.PM", "......M.PP"], [2,  12]],
    [["MPPPPPPPMM", "PPM.MMMMPP", "PM.MPPPMPM", "PPPPPMPPP.", "....M....."], [25]],
    [["PPPPPPM...", "PMMMMM..PP", "PM.PPPM.PM", "PPMPMPPMP.", "MPPP.MPPP."], [35]],
    [["MPPPPMPPP.", "PPM..MPMP.", "PM..MPPMPM", "PPMMPPM.PP", "MPPPPM...."], [35]],
    [["PPPP..M...", "PM...MPPP.", "PM..MPPMPM", "PPMMPPMMPP", "MPPPPMM..M"], [25]],
    [["PM......M.", "PM.PPP.MPP", "PM.PMPM.PM", "PPMPMPPMP.", "MPPP.MPPP."], [18]],
    [[".PPPPPM.PP", ".PMMMM.MPM", ".PMPPPPMP.", ".PPPMMPPPM", "...M......"], [24]],
    [[".PPPPPM.PP", ".PM...M.PM", ".PMM.M.MP.", "MPPPMMPPP.", "..MPPPPM.."], [31]],
    [["PPPM..M.PP", "PMM.PPPMPM", "PM.MPMPMP.", "PPPPPMPPP.", "....M....."], [16]],
    [[".MPMPPPPP.", ".PPMPMMMP.", ".PMPPMPPP.", ".PPPM.PMMM", ".M.M..PPPP"], [33]],
    [["......MPPM", "PPPPPPPPMM", "PM.....M.M", "PPMMMMMMPP", "MPPPPPPPPM"], [17]],
    [[".MPPPPPM.M", ".PPMM.M.PP", ".PM..M.MPM", ".PMMPPPPP.", ".PPPPM...."], [17]],
    [["..MPPPPPP.", ".PPPMMMM..", ".PMM.PPPM.", ".PPMMPMPPM", ".MPPPP.MPP"], [37]],
    [["P.M...M.PP", "PMPPPP.MPM", "PMPMMPMMP.", "PPPM.PPPP.", "....M....."], [12,  22]],
    [["PMPPPPM.PP", "PMPMMP.MPM", "PMPM.PM.P.", "PMP.MPPMP.", "PPP..MPPP."], [36]],
    [[".MPMPPPPP.", "PPPMPMMMPM", "PMMPPMPPP.", "PPPPM.PMMM", "...M..PPPP"], [33]],
    [["PM...M....", "PM.PPPM.PP", "PM.PMPPMPM", "PPMP.MPPP.", "MPPP..M.M."], [26]],
    [["MPPPPPPPP.", "PPMMM...MM", "PMPPPM.MPP", "PPPMPPMMPM", "....MPPPP."], [34]],
    [["PPPPMPPMPP", "PMMPPPM.PM", "PM...M.MP.", "PMMMMMPPP.", "PPPPPPPM.."], [15]],
    [["MPPPPPPPPM", "PPMMM.MM.M", "PMM.M..MM.", "PPPPPMMPPP", "...MPPPPM."], [33,  34]],
    [["MPP.M.M.PP", "PPMMPPPMPM", "PMMPPMPMP.", "PPPPM.PPP.", ".....M...."], [24]],
    [[".MPPPPM.M.", "PPPMMM.MPP", "PMM.PPPMPM", "PPMMPMPPP.", "MPPPP.M..."], [23,  24,  25,  34,  36,  42,  43,  44,  45]],
    [[".PPP.MPPPP", "MMMPM.PMMM", ".PPPM.PPP.", ".PMM.MMMPM", ".PPPPPPPP."], [15]],
    [["PPPPM.....", "PMMM.MPPP.", "PMPPPMPMPM", "PPPMPPPMPP", "..M.....M."], [23]],
    [["MPPPMPPPM.", "PPMM.PMPP.", "PM..MP.MPM", "PPMPPP.MPP", "MPPPM.M..."], [15]],
    [["MPPPPPPPP.", "PPMMMMMM.M", "PMM.....M.", "PPPMPPPPPP", ".MPPPMM.M."], [35,  36]],
    [["PPPPM.....", "MMMP.MPPP.", ".PPPMPPMPM", ".PMMPPM.PP", ".PPPPM...."], [35]],
    [[".MP.MPPPP.", "PPPM.PMMP.", "PMM.MPM.PM", "PPPPPP.MPP", "........M."], [38]],
    [["PPPMPPPPP.", "PMMMPMMMPM", "PM.PPMPPP.", "PPMPMMPMMM", "MPPPM.PPPP"], [6,  7,  27]],
    [[".......MP.", ".PPPPPPPP.", ".PMM.M.M..", ".PPPM.M.MM", "..MPPPPPPP"], [35]],
    [[".MPPPMPPPM", "PPPMMPPMP.", "PMM.MPM.PM", "PPPPPP.MPP", "M.......MM"], [27,  28]],
    [["MPPPPPM..M", "PPM..MPPP.", "PM..MPPMPM", "PMMMPPM.PP", "PPPPPM...."], [25]],
    [["MPPPPMPPPP", "PPMMM.PMMM", "PMPPPMPPP.", "PPPMPPMMP.", "....MPPPP."], [34]],
    [["PPPP..M..M", "MMMP.MPPP.", ".PPPMPPMPM", ".PMMPPMMPP", ".PPPPMM..."], [25]],
    [[".PPPPPPMP.", ".PMMMMPPP.", ".PM...M.MM", ".PMMPPPM..", ".PPPPMPPPP"], [46]],
    [["MPPPPPPMP.", "PPMM.MPPP.", "PM..M.M..M", "PMMPPPMMM.", "PPPPMPPPPP"], [16]],
    [["PPPPPPM.PP", "PMM.MM.MPM", "PM.MPPPMP.", "PPPPPMPPP.", "......M..."], [22]],
    [["PPPPPPM.MM", "PM..MM.MPP", "PPMMPPPMPM", "MPPPPMPPP.", ".....M...."], [0,  1,  2,  10,  12]],
    [["MPPPMMPPP.", "PPMM.PPMP.", "PM..MPM.PM", "PPPPPPM.PP", ".......M.."], [37,  46]],
    [["PPPPPPP.M.", "PMMMMMMMPP", "PMPPPM.MPM", "PMPMPPPPP.", "PPP.M....M"], [23]],
    [["M...MPPMPP", "PPPPPPM.PM", "PMM.MM.MP.", "PPPMPPPPP.", ".MPPPM...."], [34]],
    [["PPPPM.....", "PMMM.MPPP.", "PMPPPMPMPM", "PPPMPMPMPP", "..M.PPPM.."], [23]],
    [[".MPPPM...M", "PPPMMPPPP.", "PMM.MPMMPM", "PPPPPPM.PP", "......MMM."], [15]],
    [["PP.M..MM.M", "PMMPPPM.PP", "PMPPMPMMPM", "PPPM.PPPP.", "....MM...M"], [23]],
    [["..MPPPPPM.", "PPPPM.MMPP", "PM.M.M.MPM", "PMMMPPPPP.", "PPPPPM...."], [13]],
    [["MPP.M.....", ".MPM.PPPP.", "PPP.MPMMPM", "PMMMPPM.PP", "PPPPPMM.M."], [3,  23]],
    [["MPPPPM.M..", "PPMMM.PPP.", "PM...MPMPM", "PPMPPPPMPP", "MPPPM..M.."], [34,  35]],
    [["....MP.MPP", "PPPPPPM.PM", "PMM.MM.MP.", "PPPMPPPPPM", ".MPPPM...."], [34]],
    [["....MPM...", "PPPMPPM.PP", "PMPPPM.MPM", "PPMMMMPPP.", "MPPPPPPM.."], [14]],
    [["PPPPM..M..", "PMMMPPPMPP", "PM.MPMPMPM", "PPPPPMPPP.", ".M...M...M"], [40,  42]],
    [["PPM....M..", "PM.PPPPMPP", "PPMPMMPMPM", "MPPP.MPPP.", "M....M.M.."], [12,  21]],
    [["PPPPPPM...", "PM..MM.MPP", "PM.MPPPMPM", "PPMMPMPPP.", "MPPPP.M..."], [12,  22]],
    [["PM.MPPP.M.", "PP.MPMPMPP", "MPMPPMPMPM", ".PPPMMPPP.", "...M......"], [33]],
    [["PPPPM....M", "PM.M.MPPP.", "PPM..MPMPM", "MPPPPPPMPP", "....M..M.."], [12]],
    [[".MPPPPPM..", ".PPMMMM.PP", ".PM.PPPMPM", ".PPMPMPPP.", ".MPPP.M..."], [36]],
    [["PPM...M.PP", "PM.PPP.MPM", "PM.PMPMMP.", "PPMPMPPPP.", "MPPPM....."], [33]],
    [[".MPPPM...M", ".PPMM.PPP.", ".PM..MPMPM", ".PPMPPPMPP", ".MPPPMM..."], [26,  28,  36,  38]],
    [["PM....M.PP", "P.MPPP.MPM", "PMPPMPMMP.", "PMPM.PPPP.", "PPPM......"], [11]],
    [["...MPPM...", "PPPPPM..PP", "PM....MMPM", "PMMMMMPPP.", "PPPPPPPM.."], [2,  12,  13,  22]],
    [["PP..MPPPP.", "PMMMPPMMP.", "PM.PPMPPP.", "PMMPM.PMMM", "PPPP.MPPPP"], [24]],
    [[".P..M..M..", ".P.MPPPMPP", ".PMPPMPMPM", ".PMPMMPPP.", ".PPP..M..."], [3]],
    [[".MPPPPPPP.", "PPPMMM..MM", "PMM...MMPP", "PPPPPPPMPM", "..M..MPPP."], [46]],
    [["PPP.MPPPP.", "PMMMPPMMPM", "PM.MPMPPP.", "PPPPPMPMMM", "....M.PPPP"], [34]],
    [["MMPPPPMMPM", "PPPMMPPPPM", "PMM..M.MM.", "PPPPPPM.MM", "M.M.MPPPPP"], [35]],
    [[".PPMPPPPP.", ".PMMPMMMP.", ".PMPPMPPP.", ".PPPM.PMMM", "....M.PPPP"], [6,  7,  27]],
    [["PPPPPPPPP.", "PMMMM...MM", "PMPPPM.MPP", "PMPMPPMMPM", "PPP.MPPPP."], [23]],
    [[".PPPPPPM.M", "MPMMM.M.PP", ".PM..M.MPM", ".PMMPPPPP.", ".PPPPMM..."], [26]],
    [["MPPPMM.M..", "PPMM.MPPP.", "PMPPPMPMPM", "PPPMPPPMPP", "MM..MM.M.."], [10,  11,  20,  30,  31]],
    [[".MPPPM....", "PPPMM.PPPM", "PMM..MPMPM", "PPPPPPPMPP", "M......M.."], [28]],
    [[".MPPPP.M..", "PPPMM.M.PP", "PMM..M.MPM", "PMPPPPPPP.", "PPPM......"], [42]],
    [[".PM....M..", ".PMPPPM.PP", ".PMPMPPMPM", ".PMP.MPPP.", ".PPP.M.M.."], [26]],
    [["MPPPPPPM..", "PPMMMMM.PP", "PMMPPPMMPM", "PPPPMPPPP.", "...M......"], [24]],
    [[".MPPPPPPP.", "PPPMM...MM", "PMM..MMMPP", "PPMMPPPMPM", "MPPPPMPPP."], [36,  46]],
    [["MPPPPPPM..", ".PMMMMM.PP", ".PM....MPM", ".PPMPPPPP.", ".MPPPM...."], [26,  35,  36,  46]],
    [["PPPP.M....", "PMMMMPPPP.", "PM..MPMMPM", "PMMPPPM.PP", "PPPPM.M.MM"], [15]],
    [["PPPPMMPPP.", "PMMM.PPMP.", "PM..MPM.PM", "PPPPPPM.PP", ".......M.."], [37,  46]],
    [["MPPM..M.PP", "PPMPPP.MPM", "PMPPMPMMP.", "PPPMMPPPP.", "...M......"], [11]],
    [["PPM...M.PP", "PM.MPPPMPM", "PM.PPMPMP.", "PPMPM.PPP.", "MPPP.M...."], [23]],
    [["MPPPPPM.PP", "PPMMMM..PM", "PMMPPPM.P.", "PPPPMPPMPM", ".....MPPP."], [35]],
    [["PPPPPPMMMM", "PMMMMMM.PP", "PMPPPMMMPM", "PPPMPPPPPM", "....M....M"], [23]],
    [["MPPM..M.PP", "PPM.PPPMPM", "PM.MPMPMP.", "PPPPPMPPP.", ".....M...."], [16]],
    [["PPPPPPMPPP", "PMMMMM.PM.", "PM....MPPM", "PPPPPPPMP.", "M....MPPP."], [36,  46]],
    [["MPPPM....M", "PPM..MPPP.", "PM..MPPMPM", "PPMMPPMMPP", "MPPPPM...."], [25]],
    [["..MPPPPPP.", ".PPPMMMM..", ".PMM.PPPM.", ".PPMMPMPPM", ".MPPPP.MPP"], [37]],
    [["PM.....M..", "P.MPPPM.PP", "PMMPMPPMPM", "PPPP.MPMP.", ".....MPPP."], [17]],
    [["PPPM......", "MMPM.PPPP.", ".PPM.PMMP.", ".PM.MP.MPM", ".PPPPPM.PP"], [33,  43]],
    [["MPPPMPPPP.", "PPMM.PMMP.", "PM..MPM.PM", "PPPPPPM.PP", ".....M...."], [34]],
    [["MPPPPPPPPM", "PPMMMM...M", "PM.PPPM.M.", "PMMPMPMMPP", "PPPPMPPPPM"], [4]],
    [["MPPPM..M.M", "PPMM.PPPP.", "PM..MPMMPM", "PPPPPPM.PP", "......M.M."], [16,  17,  18,  19,  28,  38]],
    [["MPPPMPPPP.", "PPMMPPMMP.", "PM.MPM.PPM", "PPPPP.MPM.", "M....M.PPP"], [35]],
    [["MPPPM.....", "PPMM.MPPP.", "PMPPPMPMPM", "PPPMPPPMPP", "M.M.M..M.."], [32]],
    [["...MMPPPPM", ".PPPPPMMM.", ".PMM.M....", ".PPPM..MPP", "..MPPPPPPM"], [24,  35]],
    [["MPPPPM.MP.", "PPMMPPPPP.", "PM..MM.MMM", "PPM...MPPP", "MPPPPPPPM."], [37]],
    [[".MPPPPM.PP", ".PPMMM.MPM", ".PM....MP.", ".PM.MPPPP.", ".PPPPPM..."], [0,  10,  11,  12]],
    [["MPPPPPPPP.", "PPMMM...MM", "PMPPPM.MPP", "PPPMPPMMPM", "....MPPPP."], [34]],
    [["MPPPPPPPP.", "PPMMMM.MMM", "PMMPPPM...", "PPPPMPPPPP", ".....M...."], [24]],
    [["MPPPPPPPP.", "PPM...M..M", "PM..MM.MM.", "PPMMPPPPPP", "MPPPPM...."], [15,  17]],
    [[".MPPPPM..M", "PPPMMM.MPP", "PM.MPPPMPM", "PMMMPMPPP.", "PPPPPM...M"], [0,  2,  10,  11,  12]],
    [["PPPPPPM.PP", "PMMM.M.MPM", "PM..M..MP.", "PPMPPPPPP.", "MPPPM....."], [14,  16,  25,  26]],
    [["MPPP.M....", ".PMMMPPPP.", ".PM.MPMMPM", ".PMPPPM.PP", ".PPPM..M.."], [45]],
    [["MPPPM...M.", "PPMM.PPPP.", "PM..MPMMP.", "PMMPPP.MPM", "PPPPM.M.PP"], [7,  9,  17,  18,  19]],
    [["PM......M.", "PM.PPP.MPP", "PM.PMPM.PM", "PPMPMPPMP.", "MPPP.MPPP."], [18]],
    [[".P.M...M..", ".P.MPPPMPP", ".PM.PMPMPM", ".PPMPMPPP.", ".MPPPM.M.."], [32]],
    [["MPPPPMPPP.", "PPMMM.PMP.", "PM.M.MPMP.", "PPPPPPPMPM", "......M.PP"], [36]],
    [[".PPM.MM.PP", ".PM.PPPMPM", ".PMMPMPMP.", "MPPPPMPPP.", "....M....."], [16]],
    [["PPPPM.PPPP", "PMMM.MPMMM", "PMPPPMPPP.", "PPPMPPMMP.", "....MPPPP."], [34]],
    [[".......MPM", "PPPPPPMPPM", "PMM.MPPPM.", "PPPM.MMMPP", ".MPPPPPPPM"], [17]],
    [[".MPPPPPM..", "PPPMMMM.PP", "PMMMPPPMPM", "PPPPPMPPP.", "...MM....."], [34]],
    [["MPPPPM....", "PPMMMPPPP.", "PMM.MPMMPM", "PPPPPPM.PP", "...M..M..."], [34,  44]],
    [["MPPPPPM...", "PPM.MM.MPP", "PM.MPPPMPM", "PPPPPMPPP.", "...M.M...."], [11]],
    [[".PPPPPPMPP", ".PMMMMM.PM", ".PM...M.PM", ".PMMPPPMP.", ".PPPPMPPP."], [46]],
    [[".PPP.MPPP.", ".PM.M.PMP.", ".PMM.MPMP.", ".PPPPPPMPM", "......M.PP"], [36]],
    [["PPM....M..", "PM.MPPPMPP", "PM.PPMPMPM", "PPMPM.PPP.", "MPPPM..M.."], [12]],
    [["P.M....M..", "P.MPPPM.PP", "PMMPMPPMPM", "PPPP.MPMP.", "M...M.PPP."], [17]],
    [[".MPPPPPPP.", "PPPMM.MMMM", "PMM..MPPP.", "PPMMPPPMPM", "MPPPPMM.PP"], [36]],
    [["MPPPMP..M.", "PPMPPP.MPP", "PM..M..MPM", "PPMM.MMMP.", "MPPPPPPPP."], [18]],
    [[".M....MPP.", "PPPPPPPPM.", "PM.....M.M", "PPMMMMMPPP", "MPPPPPPPM."], [17]],
    [["MPPPM.....", "PPMM..PPP.", "PM..MMPMP.", "PM.MPPPMPM", "PPPPPMM.PP"], [20,  22,  30,  32]],
    [[".PPPPPM...", "MPMMMM.MPP", "PPM.PPPMPM", "PM.MPMPPP.", "PPPPPM...M"], [32,  42]],
    [[".PPPPPM...", ".PMMMMPPP.", ".PM..MPMPM", ".PPMPPPMPP", ".MPPPM.M.."], [35,  36]],
    [[".PPM.PPPM.", ".PMM.PMPP.", ".PM.MP.MPM", ".PMPPPM.PP", ".PPPMM...."], [35]],
    [[".PPPPPM.PP", "MPM..M.MPM", ".PM.M..MP.", ".PMMPPPPPM", ".PPPPMM..."], [14,  25]],
    [["PPPM.MPPPM", "PMPPPPPM.M", "PM......M.", "PMMMMMMMPP", "PPPPPPPPPM"], [24]],
    [[".MPPPPM...", ".PPM.MPPPM", ".PM..MPMP.", ".PMMMPPMPM", ".PPPPPM.PP"], [16]],
    [["MPPPPPPPP.", "PPM..MMM..", "PM..MPPPMM", "PPMMPPMPPP", "MPPPPM...."], [35]],
    [["MPPPPP.MPP", "PPMM.MM.PM", "PM..M..MP.", "PMPPPPPPP.", "PPPM......"], [32]],
    [["....MPPPP.", "PPPPPPM.MM", "PMM.M..MPP", "PPPM.MMMPM", ".MPPPPPPPM"], [32,  34]],
    [["MPPMPPPPP.", "PPMMPMMMP.", "PMMPPMPPP.", "PPPPM.PMMM", "....M.PPPP"], [6,  7,  27]],
    [["MPP.MMPPP.", ".PMM.PPMP.", "MPM.MPM.P.", ".PPPPPM.PM", ".M..M..MPP"], [37,  38,  48]],
    [[".MPPPPPPP.", ".PPM..M.MM", ".PM..M.MPP", ".PPMMPPPPM", ".MPPPPMM.."], [26]],
    [["MPPPMPM..M", "PPMPPPM.PP", "PM...M.MPM", "PMMMMMPPP.", "PPPPPPPMM."], [14,  15]],
    [[".MPPPPPM..", ".PPM.MM.PP", ".PM.M..MPM", ".PMPPPPPP.", ".PPPM....."], [43]],
    [["MPPPM.PPPP", "PPMM.MPMMM", "PMPPPMPPP.", "PPPMPPMMP.", "....MPPPP."], [34]],
    [["PP.MPPPPP.", "MPM.PMMMP.", ".P.MPMPPP.", ".PMPPMPMMM", ".PPPM.PPPP"], [33]],
    [[".MPPPPPPP.", "PPPM....MM", "PMM.MM.MPP", "PPPPPPMMPM", "....MPPPP."], [14]],
    [[".MPPPPMMP.", "PPPMMPPPP.", "PMM..M...M", "PPM...MMM.", "MPPPPPPPPP"], [26]],
    [["..M.MPPM.M", ".PPPPPM.PP", "MPM..M.MPM", ".PPMMMPPP.", "MMPPPPPM.M"], [15]],
    [["...MPPM...", ".PPPPM..PP", ".PMM..MMPM", ".PPPMMPPP.", "..MPPPPM.."], [2,  12,  13]],
    [["PPP.MPPPP.", "PMMMPPMMP.", "PM.PPMPPP.", "PPMPM.PMMM", "MPPP.MPPPP"], [24,  35]],
    [[".MP.M.M.PP", ".PPMPPPMPM", ".PMPPMPMP.", ".PMPM.PPP.", ".PPP.M...."], [14]],
    [[".PM..M....", ".PMPPPM.PP", ".PMPMPPMPM", ".PMP.MPPP.", ".PPP.M.M.M"], [15]],
    [["P.MPPP.MPP", "P.MPMPM.PM", "PMMPMPPMPM", "PPPP.MPPP.", "....M....."], [34,  45]],
    [["MPPPM.....", "PPMM.PPPP.", "PM..MPMMPM", "PPMPPP.MPP", "MPPPM..M.."], [28,  34,  35,  36,  38,  39]],
    [[".PPPPPM...", ".PM..MPPP.", ".PMMMPPMPM", "MPPPPPM.PP", "......M..."], [16]],
    [["..MPPPM.PP", ".PPPMM.MPM", ".PMM...MP.", ".PM.MPPPP.", ".PPPPPM..."], [33,  43]],
    [["MPPPPPPPP.", ".PMM.MM.MM", ".PM.M..MPP", ".PPPPPPMPM", ".M...MPPP."], [36]],
    [["PPPP..MM.M", "PM...MPPP.", "PM.MMPPMPM", "PMMPPPM.PP", "PPPPM.MM.."], [16]],
    [["PPPPM..M..", "PMMMPPPMPP", "PM.MPMPMPM", "PPPPPMPPP.", "..M.MMMM.."], [43]],
    [["MPPPPPPM..", "PPM...M.PP", "PM..MM.MPM", "PPMMPPPPP.", "MPPPPM...."], [17,  26]],
    [["PPP.MM.M..", "PMMMPPPMPP", "PM.PPMPMPM", "PPMPMMPPP.", "MPPP..MM.."], [24]],
    [[".MPPMMPPP.", ".PPM.PPMP.", ".PM.MPMPP.", ".PPPPPMPMM", "M.....MPPP"], [6,  16]],
    [["MMPPPP..MM", ".PPMMMMMPP", "MPMMPPPMPM", ".PPPPMPPP.", "....M....."], [25]],
    [[".MPPPPM...", "PPPMMM..PP", "PMM...MMPM", "PPPPPPPPP.", "..M....M.."], [18,  19,  28,  38,  39]],
    [[".PPPPPM.PP", ".PM.MM.MPM", ".P.MPPPMP.", ".PMMPMPPP.", ".PPPP.M..."], [0,  1,  2,  3,  10,  11,  13,  20,  21,  22,  30,  31,  40,  41,  42,  43]],
    [["MMPPPPM.M.", "PPPMM.M.PP", "PMM..M.MPM", "PPPPPPPPP.", ".....MM..M"], [26,  36]],
    [["MPPPPM.PPP", "PPMM.M.PM.", "PM..M.MPPM", "PMMPPPMMPM", "PPPPMPPPP."], [27,  28]],
    [[".MPPPPM...", "PPPM.MPPP.", "PMM.MPPMPM", "PPPPPPM.PP", ".....M...."], [26]],
    [["PPPPPMPPP.", "PMMMMMPMPM", "PM..MPPMP.", "PMMPPPMMPM", "PPPPMM..PP"], [35]],
    [["..MPPPMMPP", ".PPPMM..PM", ".PMM..MMP.", ".PMPPPPPP.", ".PPPM....."], [43]],
    [["MMPPPPPPM.", ".PPMMMMMPP", ".PMM...MPM", ".PMPPPPPP.", ".PPPM....M"], [43]],
    [[".MPM.PPPP.", "PPPM.PMMP.", "PMM.MPM.PM", "PPPPPP.MPM", "......M.PP"], [27]],
    [[".MPPPPM.PP", "PPPMMM.MPM", "PM.MPPPMP.", "PPMMPMPPP.", "MPPPP.M..."], [0,  2,  10,  11,  12]],
    [[".PPPPPP.M.", ".PMMMMMMPP", ".PM.PPPMPM", ".PPMPMPPP.", ".MPPP.M..."], [25,  36]],
    [[".MPPPMM...", ".PPMMPPPP.", ".PM.MPMMP.", ".PPPPPM.PM", ".......MPP"], [37]],
    [[".MPPPMPPP.", ".PPMPPPM..", ".PMM..M.MM", ".PPPMMPPPP", "..MPPPPMM."], [16]],
    [["MMPPPPPPP.", ".PPM..M...", ".PM..M.MM.", ".PPMMPPPPM", "MMPPPPMMPP"], [15,  26]],
    [[".MPPPPM.PP", ".PPMMM.MPM", ".PMMPPPMP.", ".PPPPMPMP.", "..M..MPPP."], [0,  10]],
    [["MMPPPPM...", "PPPMMM.MPP", "PMM....MPM", "PPMPPPPPP.", "MPPPMM...."], [24,  25]],
    [["PPPPPP..M.", "PMMMMMMMPP", "PM.....MPM", "PMMPPPPPP.", "PPPPM....."], [25]],
    [[".MPPMPPPP.", ".PPMPPMMP.", ".PMPPMPPP.", ".PMPM.PMMM", "MPPP.MPPPP"], [14]],
    [[".MP.MPPPP.", ".PPMPPMMP.", ".PMPPMPPP.", ".PMPM.PMMM", ".PPPM.PPPP"], [14]],
    [[".......MP.", "PPPPPPMPP.", "PMM.MPPPM.", "PPPM.MMM.M", ".MPPPPPPPP"], [17]],
    [["MPP.M.....", "PPMM.PPPP.", "PM..MPMMP.", "PMMPPPM.PM", "PPPPM.M.PP"], [28,  29,  37,  38,  48,  49]],
    [["MPP.M..MM.", "PPMM.PPPP.", "PM..MPMMP.", "PPMPPP.MPM", "MPPPM.M.PP"], [17]],
    [["M.....MMP.", ".PPPPMPPPM", ".PMMPPPMM.", ".PPPMMM..M", "MMMPPPPPPP"], [16]],
    [["PPPPM.....", "PMMM.MPPP.", "PM...MPMPM", "PMMPPPPMPP", "PPPPM..M.."], [41,  42]],
    [["MPPPPPM.PP", "PPMMMM..PM", "PMMPPPMMP.", "PPPPMPPPP.", ".....M...."], [35]],
    [[".MPM.PPPP.", "PPPM.PMMP.", "PMM.MP.MPM", "PPPPPPM.PP", ".....M...."], [34]],
    [["......MPP.", "MPPPPPPPMM", ".PMMM.MM..", ".PM..MPPPM", ".PPPPPPMPP"], [36,  46]],
    [["PPPP.M....", ".MMP.MPPP.", "MPPPMPPMPM", ".PMMMPMMPP", ".PPPPPM..."], [22]],
    [["MPPPPPPPPM", ".PMMM.MMM.", ".PM..M..M.", ".PPMPPPMPP", ".MPPPMPPPM"], [34,  36]],
    [["MPPPM.PPP.", "MMMP.MPMP.", ".PPPMPPMPM", ".PMMPPM.PP", "MPPPPM...."], [35]],
    [["MPPM..M.PP", "PPMPPP.MPM", "PMPPMPMMP.", "PMPM.PPPPM", "PPPM......"], [13]]
  ];
  var PZ_TOP = 40, PZ_STEP = 22, PZ_ROWS = 5;
  // PUZZLE : null tant que le joueur n'a pas creusé sa première case
  var PUZZLE = null, PZ_PATH = [], pzPath = {}, pzIndex = 0;
  var pzDug = {}, pzBusy = false;
  // pickGoal : cran visé pendant que le curseur glisse vers lui (Entrée lance ce niveau-là ;
  // 3 = mode Sans drapeau). onBranch : curseur sur le chemin parallèle.
  var pickAt = 0, pickGoal = null, pickShown = -1, snapRaf = 0, rolls = {}, onBranch = false;
  function heat(p) {
    var k = Math.min(1, Math.floor(p)), f = p - k, a = HEAT[k], b = HEAT[k + 1];
    return "rgb(" + a.map(function (v, n) { return Math.round(v + (b[n] - v) * f); }).join(" ") + ")";
  }
  // centre du curseur en (x, y), en pixels dans le slider
  function placeThumb(x, y) {
    pickThumb.style.transform = "translate(" + (x - 24).toFixed(1) + "px, " + (y - RAIL_Y).toFixed(1) + "px)";
  }
  function notchX(q) { return 24 + q / 2 * (pickW - 48); }
  // remplissage du rail et trait au-dessus du nom, pour une position q de 0 à 2
  function paintMain(q) {
    var x = q / 2, h = heat(q);
    if (Number(pickRange.value) !== Math.round(q * 100)) pickRange.value = Math.round(q * 100);
    pickFill.style.transform = "scaleX(" + x.toFixed(4) + ")";
    pickFill.style.backgroundColor = h;
    pickHeat.style.transform = "scaleX(" + (0.28 + 0.72 * x).toFixed(4) + ")";
    pickHeat.style.backgroundColor = h;
  }
  // p va de 0 (premier cran) à 2 (dernier), valeurs intermédiaires pendant un glissé
  function setPick(p) {
    pickAt = p;
    var q = Math.max(0, Math.min(2, p));
    paintMain(q);
    placeThumb(notchX(q), RAIL_Y);
    var n = Math.round(q);
    if (n !== pickShown) showPick(n);
  }
  // le curseur suit un trajet (liste de points), pour passer d'un rail à l'autre
  function travel(pts) {
    cancelAnimationFrame(snapRaf);
    var segs = [], total = 0, i;
    for (i = 1; i < pts.length; i++) {
      segs.push(Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      total += segs[i - 1];
    }
    var end = pts[pts.length - 1];
    if (reduceMotion.matches || !total) { placeThumb(end[0], end[1]); return; }
    var dur = Math.min(1400, 300 + total * 1.3), t0 = performance.now();
    (function step(now) {
      var k = Math.max(0, Math.min(1, (now - t0) / dur));
      var d = (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2) * total;
      for (i = 0; i < segs.length - 1 && d > segs[i]; i++) d -= segs[i];
      var f = segs[i] ? Math.min(1, d / segs[i]) : 1;
      placeThumb(pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f);
      if (k < 1) snapRaf = requestAnimationFrame(step);
    })(t0);
  }
  // centres des cases du chemin, dans l'ordre, en pixels dans le slider
  function pathPoints() {
    return PZ_PATH.map(function (p) { return [pickW / 2 - 120 + p[1] * PZ_STEP + 10, PZ_TOP + p[0] * PZ_STEP + 10]; });
  }
  // vers le mode Sans drapeau : le long du rail jusqu'au-dessus de l'entrée, puis le long du
  // chemin de l'énigme
  function goBranch() {
    if (!unlocked || onBranch) return;
    var x0 = notchX(Math.max(0, Math.min(2, pickAt)));
    onBranch = true;
    pickGoal = 3;
    pickAt = 1;
    pick.classList.add("is-branch");
    paintMain(1);
    showPick(3);
    var pts = pathPoints();
    travel([[x0, RAIL_Y], [pts[0][0], RAIL_Y]].concat(pts, [[pickW - 24, BRANCH_Y]]));
  }
  // retour sur le rail principal, au cran n, par le même chemin
  function leaveBranch(n, instant) {
    onBranch = false;
    pick.classList.remove("is-branch");
    if (instant) return;
    pickGoal = n;
    pickAt = n;
    paintMain(n);
    showPick(n);
    var pts = pathPoints().reverse();
    travel([[pickW - 24, BRANCH_Y]].concat(pts, [[pts[pts.length - 1][0], RAIL_Y], [notchX(n), RAIL_Y]]));
  }
  function showPick(n) {
    var lvl = LEVEL_KEYS[n], L = MSCore.LEVELS[lvl], first = pickShown < 0;
    pickShown = n;
    pick.dataset.level = lvl;
    pickRange.setAttribute("aria-valuetext", TEXT[lvl]);
    if (L.noflag) {
      pickHeat.style.transform = "scaleX(1)";
      pickHeat.style.backgroundColor = NOFLAG_HEAT;
    }
    $("ms-pick-name").textContent = TEXT[lvl];
    swapIn($("ms-pick-name"));
    if (!first) swapIn(pickThumb);
    roll("ms-pick-size", L.size, first);
    roll("ms-pick-size2", L.size, first);
    roll("ms-pick-mines", L.mines, first);
    miniGrid(L.size, L.mines);
    pickScores(lvl);
  }
  // un chiffre défile jusqu'à sa nouvelle valeur
  function roll(id, to, fromZero) {
    var el = $(id), from = fromZero ? 0 : Number(el.textContent) || 0, t0 = performance.now();
    cancelAnimationFrame(rolls[id]);
    if (reduceMotion.matches || from === to) { el.textContent = to; return; }
    (function step(now) {
      var k = Math.max(0, Math.min(1, (now - t0) / 450));
      el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
      if (k < 1) rolls[id] = requestAnimationFrame(step);
    })(t0);
  }
  // mini-grille, dessinée dans un canvas (484 cases en Champ de mines : en éléments
  // HTML, le glissé ramait) : les cases apparaissent en vague depuis un coin, puis les
  // mines tombent une à une (positions au hasard, juste pour l'aperçu)
  var miniCanvas = $("ms-pick-grid"), miniCtx = miniCanvas.getContext("2d"), miniRaf = 0;
  function miniGrid(n, mines) {
    var total = n * n, spots = [], taken = {};
    while (spots.length < mines) {
      var r = Math.floor(Math.random() * total);
      if (!taken[r]) { taken[r] = true; spots.push(r); }
    }
    var side = miniCanvas.clientWidth, dpr = window.devicePixelRatio || 1;
    if (!side) return;
    if (miniCanvas.width !== Math.round(side * dpr)) miniCanvas.width = miniCanvas.height = Math.round(side * dpr);
    var gap = 18 / n, cell = (side - gap * (n - 1)) / n, wave = 260 / (2 * n - 2), drop = 420 / mines;
    var t0 = performance.now();
    var easeOut = function (k) { return 1 - Math.pow(1 - k, 3); };
    cancelAnimationFrame(miniRaf);
    (function draw(now) {
      var t = reduceMotion.matches ? 1e6 : Math.max(0, now - t0), k, i;
      miniCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      miniCtx.clearRect(0, 0, side, side);
      miniCtx.fillStyle = "#2b3631";
      for (i = 0; i < total; i++) {
        k = Math.min(1, (t - (Math.floor(i / n) + i % n) * wave) / 300);
        if (k <= 0) continue;
        var sz = cell * easeOut(k), x = (i % n) * (cell + gap) + (cell - sz) / 2, y = Math.floor(i / n) * (cell + gap) + (cell - sz) / 2;
        miniCtx.globalAlpha = k;
        miniCtx.fillRect(x, y, sz, sz);
      }
      miniCtx.fillStyle = "#e5484d";
      spots.forEach(function (i, m) {
        var k = Math.min(1, (t - 260 - m * drop) / 420);
        if (k <= 0) return;
        // chute avec un léger rebond : petite et haute, puis grosse, puis à sa place
        var scale = k < 0.6 ? 0.4 + 0.9 * (k / 0.6) : 1.3 - 0.3 * ((k - 0.6) / 0.4);
        var fall = (1 - easeOut(Math.min(1, k / 0.6))) * cell * 1.6;
        miniCtx.globalAlpha = Math.min(1, k / 0.6);
        miniCtx.beginPath();
        miniCtx.arc((i % n) * (cell + gap) + cell / 2, Math.floor(i / n) * (cell + gap) + cell / 2 - fall, cell * 0.36 * scale, 0, Math.PI * 2);
        miniCtx.fill();
      });
      miniCtx.globalAlpha = 1;
      if (t < 1200) miniRaf = requestAnimationFrame(draw);
    })(t0);
  }
  function pickScores(lvl) {
    var top = $("ms-pick-top"), best = records[lvl + ":all"];
    $("ms-pick-me").textContent = best ? TEXT.pickMine.replace("{t}", fmt(best, true)) : TEXT.pickNoMine;
    top.textContent = "";
    if (!rankingOn) return;
    topScores(lvl).then(function (scores) {
      if (LEVEL_KEYS[pickShown] !== lvl) return;
      top.textContent = "";
      if (!scores.length) { top.textContent = TEXT.pickFree; return; }
      var who = document.createElement("strong");
      nameInto(who, scores[0].pseudo);
      top.append(TEXT.pickTop, who, TEXT.pickTopTime.replace("{t}", fmt(scores[0].timeMs, true)));
      swapIn(top);
    }).catch(function () { /* serveur injoignable : rien à battre affiché */ });
  }
  // le curseur rejoint un cran : courbe qui dépasse un peu puis revient (ease-out-back)
  function snapTo(n) {
    cancelAnimationFrame(snapRaf);
    var from = pickAt, t0 = performance.now();
    pickGoal = n;
    if (reduceMotion.matches || from === n) { setPick(n); return; }
    (function step(now) {
      var k = Math.max(0, Math.min(1, (now - t0) / 420)), c = 1.9;
      var e = 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2);
      setPick(from + (n - from) * e);
      if (k < 1) snapRaf = requestAnimationFrame(step);
    })(t0);
  }
  function openPick() {
    cancelAnimationFrame(snapRaf);
    pickGoal = null;
    pickShown = -1;
    // une énigme commencée puis abandonnée repart de zéro, toute fermée
    if (!unlocked) {
      pzDug = {};
      PUZZLE = null;
    }
    renderUnlock();
    leaveBranch(0, true);
    // ouverte d'abord : la largeur du slider et du canvas se mesure à l'écran
    pick.showModal();
    pickW = pickSlider.clientWidth;
    if (level === "noflag") {
      onBranch = true;
      pickGoal = 3;
      pickAt = 1;
      pick.classList.add("is-branch");
      paintMain(1);
      placeThumb(pickW - 24, BRANCH_Y);
      showPick(3);
    } else {
      setPick(LEVEL_KEYS.indexOf(level));
    }
    pickRange.focus();
  }

  // l'énigme : une mini-grille de démineur sous le rail. Toutes les cases sûres creusées, le
  // chemin se dessine et mène au mode Sans drapeau ; une mine, et tout recommence.
  // choisit la grille n : met son serpent dans l'ordre (le curseur le suivra), de l'entrée,
  // sur la ligne du haut, à la sortie, sur le bord droit, et place la sortie
  function choosePuzzle(n) {
    pzIndex = n;
    PUZZLE = PZ_POOL[n][0];
    pzPath = {};
    var cells = [], ends = [];
    PUZZLE.forEach(function (row, r) {
      row.split("").forEach(function (kind, c) {
        if (kind === "P" || kind === "p") { pzPath[r + "," + c] = true; cells.push([r, c]); }
      });
    });
    var side = function (x) {
      return [[1, 0], [-1, 0], [0, 1], [0, -1]].map(function (d) { return [x[0] + d[0], x[1] + d[1]]; })
        .filter(function (y) { return pzPath[y[0] + "," + y[1]]; });
    };
    cells.forEach(function (x) { if (side(x).length === 1) ends.push(x); });
    var exit = ends[0][1] === 9 ? ends[0] : ends[1];
    var x = exit === ends[0] ? ends[1] : ends[0], seen = {};
    PZ_PATH = [];
    while (x) {
      PZ_PATH.push(x);
      seen[x[0] + "," + x[1]] = true;
      x = side(x).filter(function (y) { return !seen[y[0] + "," + y[1]]; })[0];
    }
    BRANCH_Y = PZ_TOP + exit[0] * PZ_STEP + 10;
    pick.querySelector(".ms-pick-end").style.top = (BRANCH_Y - 4) + "px";
    pick.querySelector(".ms-pick-stop").style.top = (BRANCH_Y - 6) + "px";
    $("ms-pick-nf").style.top = (BRANCH_Y - 24) + "px";
    // le petit trait qui relie le rail à l'entrée du serpent
    pick.querySelector(".ms-pick-link").style.left = "calc(50% + " + (PZ_PATH[0][1] * PZ_STEP - 114) + "px)";
  }
  // premier clic en (r, c) : une grille où cette case est un bon départ (on finit sans deviner
  // après l'ouverture du premier coup ; à défaut, une grille où elle est sûre)
  function startPuzzle(r, c) {
    var good = [], safe = [];
    PZ_POOL.forEach(function (g, i) {
      if (g[1].indexOf(r * 10 + c) >= 0) good.push(i);
      if (g[0][r][c] !== "M") safe.push(i);
    });
    var from = good.length ? good : safe;
    choosePuzzle(from[Math.floor(Math.random() * from.length)]);
  }
  // creuse (r, c) ; une case sans mine autour ouvre ses voisines, comme au démineur
  function pzDig(r, c) {
    var k = r + "," + c;
    if (pzDug[k] || !PUZZLE[r] || PUZZLE[r][c] === undefined || PUZZLE[r][c] === "M") return;
    pzDug[k] = true;
    if (pzMines(r, c)) return;
    for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) if (dr || dc) pzDig(r + dr, c + dc);
  }
  function pzMines(r, c) {
    var n = 0;
    for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
      var row = PUZZLE[r + dr];
      if ((dr || dc) && row && row[c + dc] === "M") n++;
    }
    return n;
  }
  function buildPuzzle() {
    var box = pick.querySelector(".ms-pick-dig");
    box.textContent = "";
    // pas encore de grille : toutes les cases fermées
    var rows = PUZZLE || Array(PZ_ROWS + 1).join("..........,").split(",").slice(0, PZ_ROWS);
    rows.forEach(function (row, r) {
      row.split("").forEach(function (kind, c) {
        var onPath = PUZZLE && pzPath[r + "," + c];
        var open = PUZZLE && kind !== "M" && (pzDug[r + "," + c] || unlocked);
        var el;
        if (open) {
          el = document.createElement("span");
          // énigme résolue : le serpent perd ses chiffres, c'est le chemin
          var n = onPath && unlocked ? 0 : pzMines(r, c);
          el.className = "ms-pick-cell is-open" + (n ? " n" + n : "") + (onPath ? " is-path" : "");
          el.textContent = n || "";
          el.setAttribute("aria-label", String(n));
        } else if (unlocked) {
          // énigme résolue : les mines restent fermées, sans réaction
          el = document.createElement("span");
          el.className = "ms-pick-cell";
          el.setAttribute("aria-hidden", "true");
        } else {
          el = document.createElement("button");
          el.type = "button";
          el.className = "ms-pick-cell";
          el.dataset.r = r;
          el.dataset.c = c;
          el.setAttribute("aria-label", TEXT.closedCell);
        }
        box.appendChild(el);
      });
    });
  }
  function renderUnlock() {
    pick.classList.toggle("is-unlocked", unlocked);
    $("ms-pick-nf").hidden = !unlocked;
    document.querySelector('[data-rank-level="noflag"]').hidden = !unlocked;
    buildPuzzle();
  }
  // pas de drapeau dans l'énigme : le clic droit ne fait rien
  pick.querySelector(".ms-pick-dig").addEventListener("contextmenu", function (e) { e.preventDefault(); });
  pick.querySelector(".ms-pick-dig").addEventListener("click", function (e) {
    var cell = e.target.closest(".ms-pick-cell");
    if (!cell) return;
    if (unlocked) { if (cell.classList.contains("is-path")) goBranch(); return; }
    if (pzBusy || cell.tagName !== "BUTTON") return;
    var r = Number(cell.dataset.r), c = Number(cell.dataset.c), box = cell.parentNode;
    var first = !PUZZLE;
    if (first) startPuzzle(r, c);
    if (PUZZLE[r][c] === "M") {
      // une mine : elle s'affiche, la grille tremble, puis tout revient au départ
      pzBusy = true;
      cell.classList.add("is-boom");
      cell.textContent = "✹";
      cell.setAttribute("aria-label", TEXT.puzzleMine);
      box.classList.remove("is-nope");
      void box.offsetWidth;
      box.classList.add("is-nope");
      setTimeout(function () { pzDug = {}; PUZZLE = null; pzBusy = false; box.classList.remove("is-nope"); buildPuzzle(); }, reduceMotion.matches ? 200 : 900);
      return;
    }
    pzDig(r, c);
    // le premier coup ouvre aussi les voisines sûres : un vrai départ, d'où l'on peut réfléchir
    if (first) for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) pzDig(r + dr, c + dc);
    var done = PUZZLE.every(function (row, r) {
      return row.split("").every(function (kind, c) { return kind === "M" || pzDug[r + "," + c]; });
    });
    if (!done) {
      buildPuzzle();
      // le focus reste au même endroit : la case à droite, ou la première encore fermée
      var next = box.querySelector('button[data-r="' + r + '"][data-c="' + (c + 1) + '"]') || box.querySelector("button.ms-pick-cell");
      if (next) next.focus();
      return;
    }
    // toutes les cases sûres sont creusées : le chemin s'éclaire, puis le curseur le parcourt
    unlocked = true;
    save("ms-noflag-v1", true);
    // la grille résolue est gardée : c'est elle qu'on retrouve, chemin éclairé
    save("ms-noflag-pz", pzIndex);
    keepStorage();
    pick.classList.add("is-digging");
    renderUnlock();
    pickRange.focus();
    setTimeout(function () { pick.classList.remove("is-digging"); goBranch(); }, reduceMotion.matches ? 0 : 700);
  });
  // énigme déjà résolue : on retrouve sa grille, chemin éclairé
  var savedPz = load("ms-noflag-pz", 0);
  if (unlocked) choosePuzzle(savedPz >= 0 && savedPz < PZ_POOL.length ? savedPz : 0);
  renderUnlock();
  $("ms-pick-nf").addEventListener("click", function () { if (!branchDragged) goBranch(); });
  // sur le chemin parallèle, le curseur est dessiné sous le rail principal, hors de la
  // zone du vrai curseur : on l'attrape ici, et un glissé le ramène sur le rail principal
  var branchDrag = null, branchDragged = false;
  $("ms-pick-nf").addEventListener("pointerdown", function (e) {
    if (!onBranch) return;
    branchDrag = { id: e.pointerId, x: e.clientX, y: e.clientY };
    branchDragged = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  });
  $("ms-pick-nf").addEventListener("pointermove", function (e) {
    if (!branchDrag || e.pointerId !== branchDrag.id) return;
    if (!branchDragged && Math.hypot(e.clientX - branchDrag.x, e.clientY - branchDrag.y) < 8) return;
    branchDragged = true;
    cancelAnimationFrame(snapRaf);
    pickGoal = null;
    if (onBranch) leaveBranch(0, true);
    var r = pickSlider.getBoundingClientRect();
    setPick(Math.max(0, Math.min(2, (e.clientX - r.left - 24) / (pickW - 48) * 2)));
  });
  function endBranchDrag(e) {
    if (!branchDrag || e.pointerId !== branchDrag.id) return;
    branchDrag = null;
    if (branchDragged) snapTo(Math.round(pickAt));
    // le clic qui suit un glissé ne doit pas renvoyer sur le chemin parallèle
    setTimeout(function () { branchDragged = false; }, 0);
  }
  $("ms-pick-nf").addEventListener("pointerup", endBranchDrag);
  $("ms-pick-nf").addEventListener("pointercancel", endBranchDrag);
  function pickGo() {
    cancelAnimationFrame(snapRaf);
    level = onBranch ? "noflag" : LEVEL_KEYS[pickGoal !== null ? pickGoal : Math.max(0, Math.min(2, Math.round(pickAt)))];
    save("ms-level-v1", level);
    pick.close();
    newGame();
    loadPodium();
    showBoard();
  }
  // branchLock : le glissé en cours a déjà emmené le curseur sur le chemin parallèle ; la
  // suite de ce glissé ne doit plus le ramener sur le rail principal
  var branchLock = false;
  pickRange.addEventListener("input", function () {
    if (branchLock) { pickRange.value = 100; return; }
    cancelAnimationFrame(snapRaf);
    pickGoal = null;
    if (onBranch) leaveBranch(0, true);
    setPick(pickRange.value / 100);
  });
  pickRange.addEventListener("change", function () { if (!onBranch && !branchLock) snapTo(Math.round(pickRange.value / 100)); });
  // le glissé commence sur le curseur mais le pointeur peut descendre sous lui :
  // on le suit sur toute la fenêtre jusqu'au relâchement
  var rangeDown = false;
  pickRange.addEventListener("pointerdown", function () { rangeDown = true; });
  window.addEventListener("pointermove", function (e) {
    if (!rangeDown || !unlocked || onBranch || branchLock || !pick.open) return;
    var r = pickSlider.getBoundingClientRect();
    if (e.clientY - r.top > PZ_TOP + 14) { branchLock = true; goBranch(); }
  });
  function releaseBranchLock() { rangeDown = false; branchLock = false; }
  window.addEventListener("pointerup", releaseBranchLock);
  window.addEventListener("pointercancel", releaseBranchLock);
  // clavier : un cran par flèche, Entrée lance la partie ; flèche bas vers le chemin
  // parallèle une fois débloqué, flèche haut ou gauche pour en revenir
  pickRange.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); pickGo(); return; }
    if (onBranch) {
      if (/^(ArrowUp|ArrowLeft|PageDown|Home)$/.test(e.key)) leaveBranch(e.key === "Home" ? 0 : 1);
      if (/^(Arrow|Page|Home|End)/.test(e.key)) e.preventDefault();
      return;
    }
    if (e.key === "ArrowDown" && unlocked) { e.preventDefault(); goBranch(); return; }
    var n = pickGoal !== null ? pickGoal : Math.round(pickAt), to = null;
    if (e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "PageUp") to = Math.min(2, n + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown" || e.key === "PageDown") to = Math.max(0, n - 1);
    else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = 2;
    if (to === null) return;
    e.preventDefault();
    snapTo(to);
  });
  $("ms-pick-go").addEventListener("click", pickGo);
  $("ms-pick-cancel").addEventListener("click", function () { pick.close(); });
  pick.addEventListener("close", function () {
    cancelAnimationFrame(snapRaf);
    cancelAnimationFrame(miniRaf);
    // énigme commencée mais pas finie : elle repart de zéro à la prochaine ouverture
    if (!unlocked) { pzDug = {}; PUZZLE = null; }
  });
  function refitPick() {
    if (!pick.open || pickSlider.clientWidth === pickW) return;
    pickW = pickSlider.clientWidth;
    if (onBranch) placeThumb(pickW - 24, BRANCH_Y); else setPick(pickAt);
  }
  window.addEventListener("resize", refitPick);
  if (window.ResizeObserver) new ResizeObserver(refitPick).observe(pickSlider);

  var holdBox = $("set-hold"), holdMs = $("set-hold-ms"), holdOut = $("set-hold-out"), holdBlock = $("ms-hold-block");
  var chordBox = $("set-chord"), invertBox = $("set-invert"), vibrateBox = $("set-vibrate"), keyBtn = $("set-key");
  var tenthsBox = $("set-tenths");
  if (!canVibrate) $("ms-vibrate-block").hidden = true;

  function showSettings() {
    holdBox.checked = settings.hold;
    holdMs.value = settings.holdMs;
    holdOut.textContent = settings.holdMs + " ms";
    holdBlock.classList.toggle("is-off", !settings.hold);
    chordBox.checked = settings.chord;
    invertBox.checked = settings.invert;
    vibrateBox.checked = settings.vibrate;
    tenthsBox.checked = settings.tenths;
    keyBtn.textContent = settings.flagKey.toUpperCase();
    if (cells) renderTime();
    if (!over) statusEl.textContent = hint();
    renderTool();
  }
  function setSetting(name, value) {
    settings[name] = value;
    save("ms-settings-v1", settings);
    showSettings();
  }
  holdBox.addEventListener("change", function () { setSetting("hold", holdBox.checked); });
  holdMs.addEventListener("input", function () { setSetting("holdMs", Number(holdMs.value)); });
  chordBox.addEventListener("change", function () { setSetting("chord", chordBox.checked); });
  invertBox.addEventListener("change", function () { setSetting("invert", invertBox.checked); });
  vibrateBox.addEventListener("change", function () { setSetting("vibrate", vibrateBox.checked); });
  tenthsBox.addEventListener("change", function () { setSetting("tenths", tenthsBox.checked); });
  $("set-reset").addEventListener("click", function () {
    settings = Object.assign({}, DEFAULTS);
    save("ms-settings-v1", settings);
    showSettings();
  });

  // touche drapeau : on écoute la prochaine touche « simple » (lettre ou chiffre)
  var listening = false;
  keyBtn.addEventListener("click", function () {
    listening = true;
    keyBtn.classList.add("is-listening");
    keyBtn.textContent = TEXT.keyListen;
  });
  keyBtn.addEventListener("blur", function () {
    if (!listening) return;
    listening = false;
    keyBtn.classList.remove("is-listening");
    showSettings();
  });
  keyBtn.addEventListener("keydown", function (e) {
    if (!listening) return;
    if (e.key === "Escape" || e.key === "Tab") return;
    e.preventDefault();
    e.stopPropagation();
    if (/^[a-z0-9]$/i.test(e.key)) {
      listening = false;
      keyBtn.classList.remove("is-listening");
      setSetting("flagKey", e.key.toLowerCase());
    }
  });

  // case d'essai : affiche le temps tenu et si le drapeau serait posé
  var testCell = $("ms-test-cell"), testText = $("ms-test-text"), test = null;
  function testTick() {
    if (!test) return;
    testText.textContent = TEXT.testHold.replace("{ms}", Math.round(performance.now() - test.t0));
    test.raf = requestAnimationFrame(testTick);
  }
  testCell.addEventListener("pointerdown", function (e) {
    if (e.button !== 0) return;
    testCell.textContent = "";
    testCell.classList.remove("is-flag");
    test = { t0: performance.now(), done: false };
    test.timer = startHold(testCell, function () {
      if (!test) return;
      test.done = true;
      testCell.textContent = "⚑";
      testCell.classList.add("is-flag");
      testText.textContent = TEXT.testFlag.replace("{ms}", settings.holdMs);
      cancelAnimationFrame(test.raf);
      if (canVibrate && settings.vibrate) navigator.vibrate(15);
    });
    testTick();
  });
  function endTest() {
    if (!test) return;
    stopHold(testCell, test.timer);
    cancelAnimationFrame(test.raf);
    if (!test.done) testText.textContent = TEXT.testShort.replace("{ms}", Math.round(performance.now() - test.t0));
    test = null;
  }
  testCell.addEventListener("pointerup", endTest);
  testCell.addEventListener("pointerleave", endTest);
  testCell.addEventListener("pointercancel", endTest);
  testCell.addEventListener("contextmenu", function (e) { e.preventDefault(); });

  /* --- Easter egg : 30 clics rapides sur le titre, puis le code Konami ------
     haut haut bas bas gauche droite gauche droite B A. Réussi, il lance une
     partie où les mines restent visibles, hors records et hors classement. */
  var CODE = ["up", "up", "down", "down", "left", "right", "left", "right", "b", "a"];
  var KEYS = {
    ArrowUp: "up", z: "up", Z: "up", ArrowDown: "down", s: "down", S: "down",
    ArrowLeft: "left", q: "left", Q: "left", ArrowRight: "right", d: "right", D: "right",
    a: "a", A: "a", b: "b", B: "b"
  };
  var codeEl = $("ms-code"), codeCard = codeEl.querySelector(".ms-code-card");
  var codePos = 0, codeFocus = null, eggCount = 0, eggLast = 0, codeOpenedAt = 0;
  // un clic de trop sur le titre ne doit pas refermer la fenêtre tout de suite
  var OUTSIDE_CLICK_GRACE_MS = 2500;

  function openCode() {
    codePos = 0;
    codeCard.classList.remove("is-ok", "is-wrong");
    codeFocus = document.activeElement;
    codeOpenedAt = Date.now();
    codeEl.hidden = false;
    pageInert(true);
    $("ms-code-close").focus();
  }
  function closeCode() {
    codeEl.hidden = true;
    pageInert(false);
    if (codeFocus && codeFocus.focus) codeFocus.focus();
  }
  function flash(key) {
    var btn = codeEl.querySelector('[data-key="' + key + '"]');
    btn.classList.add("is-down");
    setTimeout(function () { btn.classList.remove("is-down"); }, 140);
  }
  function codeInput(key) {
    if (codeCard.classList.contains("is-ok")) return;
    flash(key);
    if (key === CODE[codePos]) {
      codePos++;
      if (codePos === CODE.length) {
        codeCard.classList.add("is-ok");
        setTimeout(function () {
          closeCode();
          peekNext = true;
          newGame();
        }, 650);
      }
      return;
    }
    // erreur : on repart du début (un « haut » compte déjà comme premier appui)
    codePos = key === CODE[0] ? 1 : 0;
    codeCard.classList.remove("is-wrong");
    void codeCard.offsetWidth;
    codeCard.classList.add("is-wrong");
  }

  codeEl.querySelectorAll("[data-key]").forEach(function (btn) {
    btn.addEventListener("click", function () { codeInput(btn.dataset.key); });
  });
  $("ms-code-close").addEventListener("click", closeCode);
  codeEl.addEventListener("click", function (e) {
    if (e.target === codeEl && Date.now() - codeOpenedAt > OUTSIDE_CLICK_GRACE_MS) closeCode();
  });
  document.addEventListener("keydown", function (e) {
    if (codeEl.hidden) return;
    if (e.key === "Escape") { closeCode(); return; }
    var key = KEYS[e.key];
    if (!key) return;
    e.preventDefault();
    e.stopPropagation();
    if (!e.repeat) codeInput(key);
  }, true);

  document.querySelector(".ms-title").addEventListener("click", function () {
    var now = Date.now();
    eggCount = now - eggLast < 2000 ? eggCount + 1 : 1;
    eggLast = now;
    if (eggCount >= 30) { eggCount = 0; openCode(); }
  });

  showSettings();
  newGame();
  loadPodium();

  // mode développeur uniquement : lecture de la partie en cours pour les tests
  if (devMock) window.__ms = { game: function () { return game; }, level: function () { return level; }, api: api, podium: function () { podiumCache = {}; loadPodium(); },
    puzzle: function () {
      if (!PUZZLE) return null;
      var safe = [];
      PUZZLE.forEach(function (row, r) { row.split("").forEach(function (k, c) { if (k !== "M") safe.push(r + "," + c); }); });
      return { rows: PUZZLE, path: PZ_PATH.map(function (p) { return p.join(","); }), safe: safe };
    },
    // un bon départ de la 1re grille de la réserve, pour les tests
    puzzleStart: function () { var k = PZ_POOL[0][1][0]; return Math.floor(k / 10) + "," + k % 10; } };
})();
