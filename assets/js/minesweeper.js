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
      levels: "Difficulté", easy: "Facile", medium: "Moyen", hard: "Difficile",
      minesLeft: "Mines restantes", time: "Temps", record: "Record", flagMode: "Mode drapeau", newGame: "Nouvelle partie",
      board: "Grille du démineur", close: "Fermer",
      rules: "Règles", rulesSub: "Comment jouer, ce que veulent dire les chiffres",
      controls: "Commandes", controlsSub: "Drapeau, durée de l'appui long, raccourcis",
      ranking: "Classement", rankingSub: "Les meilleurs temps, avec ou sans drapeau",
      hintMouse: "Clic : révéler. Clic droit ou appui long : drapeau.",
      hintTouch: "Tap : révéler. Appui long ou Mode drapeau : drapeau.",
      hintInvert: "Clics inversés : clic pour un drapeau, clic droit pour révéler.",
      rulesList: [
        "Le but : révéler toutes les cases qui ne cachent pas de mine.",
        "Un chiffre indique combien de mines touchent la case, en comptant les diagonales.",
        "Un drapeau marque une mine supposée : clic droit, appui long ou Mode drapeau.",
        "Clic sur un chiffre déjà révélé : si autant de drapeaux que le chiffre l'entourent, ses autres voisins s'ouvrent.",
        "Le premier clic ne tombe jamais sur une mine, ni sur une case voisine d'une mine. Les drapeaux se posent après ce premier clic.",
        "Au clavier : flèches pour se déplacer, Entrée pour révéler, la touche drapeau (F par défaut) pour marquer.",
        "Le record de chaque niveau est gardé dans ce navigateur. Une partie gagnée sans poser un seul drapeau compte aussi dans le classement Sans drapeau.",
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
      newRecord: "Nouveau record !", noflagWin: "Sans drapeau !",
      share: "Partager mon temps", levelName: { easy: "Facile", medium: "Moyen", hard: "Difficile" },
      shareText: "J'ai terminé le démineur du portfolio de Lucas Boles en niveau {level} en {t}. À toi de battre ce temps :",
      shareCopied: "Message copié, il n'y a plus qu'à le coller.", shareManual: "Copier ce message : ",
      category: "Catégorie", catAll: "Tous", catNoflag: "Sans drapeau",
      podiumTitle: "Meilleurs temps en {level}", seeAll: "Tout le classement",
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
      rankNoflag: " En Sans drapeau : {rank}.",
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
      levels: "Difficulty", easy: "Easy", medium: "Medium", hard: "Hard",
      minesLeft: "Mines left", time: "Time", record: "Best", flagMode: "Flag mode", newGame: "New game",
      board: "Minesweeper board", close: "Close",
      rules: "Rules", rulesSub: "How to play, what the numbers mean",
      controls: "Controls", controlsSub: "Flags, long-press timing, shortcuts",
      ranking: "Leaderboard", rankingSub: "Best times, with or without flags",
      hintMouse: "Click: reveal. Right click or long press: flag.",
      hintTouch: "Tap: reveal. Long press or Flag mode: flag.",
      hintInvert: "Swapped clicks: click to flag, right click to reveal.",
      rulesList: [
        "The goal: reveal every cell that does not hide a mine.",
        "A number tells how many mines touch the cell, diagonals included.",
        "A flag marks a suspected mine: right click, long press or Flag mode.",
        "Click a revealed number: if it is surrounded by as many flags as its value, its other neighbours open.",
        "The first click never lands on a mine, nor next to one. Flags can be placed after that first click.",
        "Keyboard: arrows to move, Enter to reveal, the flag key (F by default) to mark.",
        "Your best time for each level is kept in this browser. A game won without placing a single flag also counts in the No-flag leaderboard.",
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
      newRecord: "New personal best!", noflagWin: "No flags!",
      share: "Share my time", levelName: { easy: "Easy", medium: "Medium", hard: "Hard" },
      shareText: "I cleared the minesweeper on Lucas Boles's portfolio on {level} in {t}. Can you beat it?",
      shareCopied: "Message copied, just paste it.", shareManual: "Copy this message: ",
      category: "Category", catAll: "All", catNoflag: "No flags",
      podiumTitle: "Best times on {level}", seeAll: "Full leaderboard",
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
      rankNoflag: " No flags: {rank}.",
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
  var flagModeBtn = $("ms-flag-mode"), endEl = $("ms-end");
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
  if (!coarse) flagModeBtn.hidden = true;
  $("ms-ranking-tile").hidden = !rankingOn;

  function hint() {
    if (settings.invert) return TEXT.hintInvert;
    return coarse ? TEXT.hintTouch : TEXT.hintMouse;
  }

  /* --- État de la partie --------------------------------------------------- */
  var level = "easy", size, mineTotal, cells, opened, flags, over, timer, startedAt;
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
  var wide = window.matchMedia("(min-width: 961px)");
  function fitCells() {
    var gaps = (size - 1) * 3;
    var cell = Math.floor((boardEl.parentNode.clientWidth - 4 - gaps) / size);
    if (wide.matches) {
      // hauteur libre sous le haut du panneau, page en haut (en-tête et titre compris)
      var stage = boardEl.closest(".ms-stage"), pad = parseFloat(getComputedStyle(stage).paddingTop) || 0;
      var top = stage.getBoundingClientRect().top + window.scrollY;
      var tall = window.innerHeight - top - 2 * pad - 16;
      cell = Math.max(20, Math.min(72, cell, Math.floor((tall - gaps) / size)));
    } else {
      cell = Math.max(28, Math.min(56, cell));
    }
    boardEl.style.setProperty("--cell", cell + "px");
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
    fitCells();
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
    if (over || cell.open || !started) return;
    cell.flag = !cell.flag;
    flags += cell.flag ? 1 : -1;
    record("f", i);
    paint(i);
    updateMines();
    if (cell.flag && canVibrate && settings.vibrate) navigator.vibrate(15);
  }

  // action principale (clic, tap, Entrée) et action secondaire (clic droit, appui long)
  function flagsFirst() { return started && flagMode !== settings.invert; }
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
    var noflag = !game.actions.some(function (x) { return x.a === "f"; });
    cells.forEach(function (cell, idx) {
      if (cell.mine && !cell.flag) { cell.flag = true; flags++; paint(idx); }
    });
    updateMines();
    var badges = [];
    if (!peek) {
      if (improve(level + ":all", finalMs)) badges.push(TEXT.newRecord);
      if (noflag) improve(level + ":noflag", finalMs);
      renderBest();
    }
    if (noflag) badges.push(TEXT.noflagWin);
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
    if (won && badges) rankingOnWin(); else if (!won) rankBlock.hidden = true;
    $("ms-end-new").focus();
  }
  function closeEnd() {
    if (endEl.hidden) return;
    endEl.hidden = true;
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
      if (d.nf) msg += TEXT.rankNoflag.replace("{rank}", TEXT.ordinal(d.nf.rank));
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
  var rankLevel = "easy", rankCat = "all", rankReq = 0;
  function sameName(a, b) {
    var k = function (s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); };
    return k(a) === k(b);
  }
  function loadRanking() {
    var list = $("ms-rank-list"), state = $("ms-rank-state"), req = ++rankReq;
    list.textContent = "";
    state.textContent = TEXT.lbLoading;
    $("ms-rank-me").textContent = identity ? TEXT.youAre.replace("{p}", identity.pseudo) : TEXT.youAreNot;
    api("/scores?level=" + rankLevel + "&cat=" + rankCat).then(function (r) { return r.json(); }).then(function (d) {
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

  /* --- Podium : les trois premiers du niveau choisi, visibles dès l'arrivée --- */
  var podiumCache = {}, podiumReq = 0;
  function loadPodium() {
    var box = $("ms-podium");
    if (!rankingOn) return;
    box.hidden = false;
    $("ms-podium-title").textContent = TEXT.podiumTitle.replace("{level}", TEXT.levelName[level]);
    var lvl = level, req = ++podiumReq, cached = podiumCache[lvl];
    // gardé une minute : changer de niveau en boucle ne relance pas de requête
    if (cached && Date.now() - cached.at < 60000) { renderPodium(cached.scores); return; }
    api("/scores?level=" + lvl + "&cat=all").then(function (r) { return r.json(); }).then(function (d) {
      if (!d.scores) throw new Error("format");
      podiumCache[lvl] = { at: Date.now(), scores: d.scores };
      if (req === podiumReq) renderPodium(d.scores);
    }).catch(function () {
      // serveur injoignable : on retire le podium plutôt que d'afficher une erreur
      if (req === podiumReq) box.hidden = true;
    });
  }
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
  document.querySelectorAll("[data-rank-cat]").forEach(function (b) {
    b.addEventListener("click", function () { rankCat = b.dataset.rankCat; setTabs("data-rank-cat", rankCat); loadRanking(); });
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
    if (settings.hold && started && !over && !cells[i].open) {
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
  document.querySelectorAll(".ms-level").forEach(function (btn) {
    btn.addEventListener("click", function () {
      level = btn.dataset.level;
      document.querySelectorAll(".ms-level").forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
      newGame();
      loadPodium();
      showBoard();
    });
  });
  flagModeBtn.addEventListener("click", function () {
    flagMode = !flagMode;
    flagModeBtn.setAttribute("aria-pressed", String(flagMode));
  });
  $("ms-new").addEventListener("click", function () { newGame(); showBoard(); });
  window.addEventListener("resize", fitCells);

  // partage : menu natif sur téléphone, sinon copie du message ; ?ref=partage
  // permet de compter dans GoatCounter les visites venues d'un partage
  $("ms-share").addEventListener("click", function () {
    var url = new URL("minesweeper.html", location.href);
    url.search = "?ref=partage" + (LANG === "en" ? "&lang=en" : "");
    var text = TEXT.shareText.replace("{level}", TEXT.levelName[level]).replace("{t}", fmt(finalMs, true));
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
        rankLevel = level;
        setTabs("data-rank-level", rankLevel);
        loadRanking();
      }
    });
  });
  document.querySelectorAll(".ms-sheet").forEach(function (dlg) {
    dlg.querySelector("[data-close]").addEventListener("click", function () { dlg.close(); });
    // clic sur le fond assombri (en dehors de la fenêtre) : on ferme
    dlg.addEventListener("click", function (e) {
      var r = dlg.getBoundingClientRect();
      if (e.target === dlg && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) dlg.close();
    });
  });

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
    $("ms-code-close").focus();
  }
  function closeCode() {
    codeEl.hidden = true;
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
  if (devMock) window.__ms = { game: function () { return game; }, level: function () { return level; }, api: api, podium: function () { podiumCache = {}; loadPodium(); } };
})();
