/* Démineur du portfolio.
   Clic : révéler. Clic droit ou appui long : drapeau. Clic sur un chiffre : ouvrir
   ses voisins quand ses drapeaux sont posés. Clavier : flèches, Entrée, touche drapeau.
   Les réglages (fenêtre « Commandes ») sont gardés dans le navigateur du joueur. */
(function () {
  "use strict";

  var params = new URLSearchParams(location.search);
  var LANG = params.get("lang") === "en" || (!params.get("lang") && /\/en\/?$/.test(new URL(document.referrer || location.href).pathname)) ? "en" : "fr";

  var TEXT = {
    fr: {
      pageTitle: "Démineur - Lucas Boles", skip: "Aller au jeu", back: "Retour au portfolio",
      title: "Démineur", lead: "Trouver toutes les cases sûres sans toucher une mine.",
      levels: "Difficulté", easy: "Facile", medium: "Moyen", hard: "Difficile",
      minesLeft: "Mines restantes", time: "Temps", flagMode: "Mode drapeau", newGame: "Nouvelle partie",
      board: "Grille du démineur", close: "Fermer",
      rules: "Règles", rulesSub: "Comment jouer, ce que veulent dire les chiffres",
      controls: "Commandes", controlsSub: "Drapeau, durée de l'appui long, raccourcis",
      hintMouse: "Clic : révéler. Clic droit ou appui long : drapeau.",
      hintTouch: "Tap : révéler. Appui long ou Mode drapeau : drapeau.",
      hintInvert: "Clics inversés : clic pour un drapeau, clic droit pour révéler.",
      rulesList: [
        "Le but : révéler toutes les cases qui ne cachent pas de mine.",
        "Un chiffre indique combien de mines touchent la case, en comptant les diagonales.",
        "Un drapeau marque une mine supposée : clic droit, appui long ou Mode drapeau.",
        "Clic sur un chiffre déjà révélé : si autant de drapeaux que le chiffre l'entourent, ses autres voisins s'ouvrent.",
        "Le premier clic ne tombe jamais sur une mine, ni sur une case voisine d'une mine.",
        "Au clavier : flèches pour se déplacer, Entrée pour révéler, la touche drapeau (F par défaut) pour marquer.",
        "Les commandes se règlent dans la fenêtre Commandes."
      ],
      setHold: "Appui long pour poser un drapeau", setHoldMs: "Durée de l'appui long",
      setChord: "Clic sur un chiffre : ouvrir ses voisins",
      setInvert: "Inverser les clics (clic : drapeau, clic droit : révéler)",
      setVibrate: "Vibration quand un drapeau est posé", setKey: "Touche drapeau au clavier",
      keyListen: "Appuyer sur une touche", reset: "Réinitialiser les réglages",
      testIdle: "Rester appuyé sur la case pour essayer.", testHold: "Tenu {ms} ms",
      testShort: "Relâché à {ms} ms : clic normal.", testFlag: "Drapeau posé à {ms} ms.",
      win: "Gagné", lose: "Perdu", winText: "Grille dégagée en {t}.", loseText: "Une mine, après {t}.",
      cell: "Ligne {r}, colonne {c}", flagged: "drapeau", hidden: "cachée", mine: "mine", empty: "vide",
      up: "Haut", down: "Bas", left: "Gauche", right: "Droite"
    },
    en: {
      pageTitle: "Minesweeper - Lucas Boles", skip: "Skip to the game", back: "Back to the portfolio",
      title: "Minesweeper", lead: "Find every safe cell without hitting a mine.",
      levels: "Difficulty", easy: "Easy", medium: "Medium", hard: "Hard",
      minesLeft: "Mines left", time: "Time", flagMode: "Flag mode", newGame: "New game",
      board: "Minesweeper board", close: "Close",
      rules: "Rules", rulesSub: "How to play, what the numbers mean",
      controls: "Controls", controlsSub: "Flags, long-press timing, shortcuts",
      hintMouse: "Click: reveal. Right click or long press: flag.",
      hintTouch: "Tap: reveal. Long press or Flag mode: flag.",
      hintInvert: "Swapped clicks: click to flag, right click to reveal.",
      rulesList: [
        "The goal: reveal every cell that does not hide a mine.",
        "A number tells how many mines touch the cell, diagonals included.",
        "A flag marks a suspected mine: right click, long press or Flag mode.",
        "Click a revealed number: if it is surrounded by as many flags as its value, its other neighbours open.",
        "The first click never lands on a mine, nor next to one.",
        "Keyboard: arrows to move, Enter to reveal, the flag key (F by default) to mark.",
        "Controls can be changed in the Controls window."
      ],
      setHold: "Long press to place a flag", setHoldMs: "Long-press duration",
      setChord: "Click a number: open its neighbours",
      setInvert: "Swap clicks (click: flag, right click: reveal)",
      setVibrate: "Vibrate when a flag is placed", setKey: "Keyboard flag key",
      keyListen: "Press a key", reset: "Reset settings",
      testIdle: "Press and hold the cell to try it.", testHold: "Held {ms} ms",
      testShort: "Released at {ms} ms: normal click.", testFlag: "Flag placed at {ms} ms.",
      win: "You win", lose: "Game over", winText: "Board cleared in {t}.", loseText: "Hit a mine after {t}.",
      cell: "Row {r}, column {c}", flagged: "flag", hidden: "hidden", mine: "mine", empty: "empty",
      up: "Up", down: "Down", left: "Left", right: "Right"
    }
  }[LANG];

  var LEVELS = { easy: { size: 9, mines: 10 }, medium: { size: 16, mines: 40 }, hard: { size: 22, mines: 99 } };
  var MOVE_TOLERANCE = 10;

  var $ = function (id) { return document.getElementById(id); };
  var boardEl = $("ms-board"), minesEl = $("ms-mines"), timeEl = $("ms-time"), statusEl = $("ms-status");
  var flagModeBtn = $("ms-flag-mode"), endEl = $("ms-end");
  var coarse = window.matchMedia("(pointer: coarse)").matches;
  var canVibrate = "vibrate" in navigator && coarse;

  /* --- Réglages, gardés dans le navigateur (aucun envoi) ------------------- */
  var STORE = "ms-settings-v1";
  var DEFAULTS = { hold: true, holdMs: 500, chord: true, invert: false, vibrate: true, flagKey: "f" };
  var settings = Object.assign({}, DEFAULTS);
  try { Object.assign(settings, JSON.parse(localStorage.getItem(STORE)) || {}); } catch (e) { /* stockage indisponible */ }
  function saveSettings() {
    try { localStorage.setItem(STORE, JSON.stringify(settings)); } catch (e) { /* stockage indisponible */ }
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

  function hint() {
    if (settings.invert) return TEXT.hintInvert;
    return coarse ? TEXT.hintTouch : TEXT.hintMouse;
  }

  /* --- État de la partie --------------------------------------------------- */
  var level = "easy", size, mineTotal, cells, opened, flags, started, over, timer, seconds;
  var flagMode = false, peekNext = false, peek = false;

  function fmt(s) { return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); }

  function neighbours(i) {
    var r = Math.floor(i / size), c = i % size, out = [];
    for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      var rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < size && cc >= 0 && cc < size) out.push(rr * size + cc);
    }
    return out;
  }

  function fitCells() {
    var avail = boardEl.parentNode.clientWidth - 4;
    var cell = Math.floor((avail - (size - 1) * 2) / size);
    boardEl.style.setProperty("--cell", Math.max(28, Math.min(40, cell)) + "px");
  }

  function newGame() {
    clearInterval(timer);
    size = LEVELS[level].size;
    mineTotal = LEVELS[level].mines;
    cells = [];
    opened = flags = seconds = 0;
    started = over = false;
    peek = peekNext;
    peekNext = false;
    timeEl.textContent = fmt(0);
    statusEl.textContent = hint();
    statusEl.className = "ms-status";
    closeEnd();

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
    fitCells();
  }

  function placeMines(first) {
    var safe = neighbours(first).concat(first), pool = [];
    for (var i = 0; i < cells.length; i++) if (safe.indexOf(i) === -1) pool.push(i);
    for (var k = pool.length - 1; k > 0; k--) {
      var j = Math.floor(Math.random() * (k + 1)), t = pool[k];
      pool[k] = pool[j];
      pool[j] = t;
    }
    pool.slice(0, mineTotal).forEach(function (idx) { cells[idx].mine = true; });
    cells.forEach(function (cell, idx) {
      cell.n = neighbours(idx).filter(function (nb) { return cells[nb].mine; }).length;
    });
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
    timer = setInterval(function () { seconds++; timeEl.textContent = fmt(seconds); }, 1000);
  }

  // révélation en largeur : les zones vides s'ouvrent sans récursion
  function reveal(i) {
    if (over || cells[i].open || cells[i].flag) return;
    if (!started) { placeMines(i); startTimer(); }
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

  // clic sur un chiffre : si autant de drapeaux que le chiffre, on ouvre le reste
  function chord(i) {
    if (!settings.chord) return;
    var around = neighbours(i);
    var flagged = around.filter(function (nb) { return cells[nb].flag; }).length;
    if (flagged !== cells[i].n) return;
    around.forEach(function (nb) { if (!over && !cells[nb].open && !cells[nb].flag) reveal(nb); });
  }

  function toggleFlag(i) {
    var cell = cells[i];
    if (over || cell.open) return;
    cell.flag = !cell.flag;
    flags += cell.flag ? 1 : -1;
    paint(i);
    updateMines();
    if (cell.flag && canVibrate && settings.vibrate) navigator.vibrate(15);
  }

  // action principale (clic, tap, Entrée) et action secondaire (clic droit, appui long)
  function flagsFirst() { return flagMode !== settings.invert; }
  function primary(i) {
    if (over) { showEnd(); return; }
    var cell = cells[i];
    if (cell.open) { if (cell.n) chord(i); return; }
    if (flagsFirst()) toggleFlag(i); else reveal(i);
  }
  function secondary(i) {
    if (over) return;
    var cell = cells[i];
    if (cell.open) { if (cell.n) chord(i); return; }
    if (flagsFirst()) reveal(i); else toggleFlag(i);
  }

  function finish() {
    over = true;
    clearInterval(timer);
  }

  function lose(i) {
    finish();
    cells.forEach(function (cell, idx) {
      if (cell.mine && !cell.flag) { cell.open = true; paint(idx); }
      else if (cell.flag && !cell.mine) { paint(idx); cell.el.classList.add("is-wrong"); }
    });
    cells[i].el.classList.add("is-boom");
    statusEl.textContent = TEXT.lose;
    statusEl.className = "ms-status is-lose";
    showEnd();
  }

  function win() {
    finish();
    cells.forEach(function (cell, idx) {
      if (cell.mine && !cell.flag) { cell.flag = true; flags++; paint(idx); }
    });
    updateMines();
    statusEl.textContent = TEXT.win + " - " + fmt(seconds);
    statusEl.className = "ms-status is-win";
    showEnd();
  }

  /* --- Fenêtre de fin -------------------------------------------------------- */
  var lastFocus = null;
  function showEnd() {
    var won = statusEl.classList.contains("is-win");
    $("ms-end-title").textContent = won ? TEXT.win : TEXT.lose;
    $("ms-end-text").textContent = (won ? TEXT.winText : TEXT.loseText).replace("{t}", fmt(seconds));
    lastFocus = document.activeElement;
    endEl.hidden = false;
    $("ms-end-new").focus();
  }
  function closeEnd() {
    if (endEl.hidden) return;
    endEl.hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  $("ms-end-new").addEventListener("click", newGame);
  $("ms-end-close").addEventListener("click", closeEnd);
  endEl.addEventListener("click", function (e) { if (e.target === endEl) closeEnd(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && codeEl.hidden) closeEnd(); });

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
    // appui long sur une case fermée, à la souris comme au doigt : action secondaire
    if (settings.hold && !over && !cells[i].open) {
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
    });
  });
  flagModeBtn.addEventListener("click", function () {
    flagMode = !flagMode;
    flagModeBtn.setAttribute("aria-pressed", String(flagMode));
  });
  $("ms-new").addEventListener("click", newGame);
  window.addEventListener("resize", fitCells);

  /* --- Fenêtres Règles et Commandes (élément dialog natif) -------------------- */
  document.querySelectorAll("[data-open]").forEach(function (btn) {
    btn.addEventListener("click", function () { $(btn.dataset.open).showModal(); });
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
  if (!canVibrate) $("ms-vibrate-block").hidden = true;

  function showSettings() {
    holdBox.checked = settings.hold;
    holdMs.value = settings.holdMs;
    holdOut.textContent = settings.holdMs + " ms";
    holdBlock.classList.toggle("is-off", !settings.hold);
    chordBox.checked = settings.chord;
    invertBox.checked = settings.invert;
    vibrateBox.checked = settings.vibrate;
    keyBtn.textContent = settings.flagKey.toUpperCase();
    if (!over) statusEl.textContent = hint();
  }
  function setSetting(name, value) {
    settings[name] = value;
    saveSettings();
    showSettings();
  }
  holdBox.addEventListener("change", function () { setSetting("hold", holdBox.checked); });
  holdMs.addEventListener("input", function () { setSetting("holdMs", Number(holdMs.value)); });
  chordBox.addEventListener("change", function () { setSetting("chord", chordBox.checked); });
  invertBox.addEventListener("change", function () { setSetting("invert", invertBox.checked); });
  vibrateBox.addEventListener("change", function () { setSetting("vibrate", vibrateBox.checked); });
  $("set-reset").addEventListener("click", function () {
    settings = Object.assign({}, DEFAULTS);
    saveSettings();
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
    test = { t0: performance.now(), done: false };
    test.timer = startHold(testCell, function () {
      if (!test) return;
      test.done = true;
      testCell.textContent = "⚑";
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

  showSettings();

  /* --- Easter egg : 30 clics rapides sur le titre, puis le code Konami ------
     haut haut bas bas gauche droite gauche droite B A. Réussi, il lance une
     partie où les mines restent visibles. */
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

  newGame();
})();
