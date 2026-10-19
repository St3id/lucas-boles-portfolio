/* Démineur du portfolio.
   Souris : clic pour révéler, clic droit pour un drapeau, clic sur un chiffre pour
   ouvrir les voisins quand ses drapeaux sont posés. Tactile : tap pour révéler,
   appui long ou « Mode drapeau » pour un drapeau. Clavier : flèches, Entrée, F. */
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
      board: "Grille du démineur", close: "Fermer", howTo: "Comment jouer",
      hintMouse: "Clic : révéler. Clic droit : drapeau.",
      hintTouch: "Tap : révéler. Appui long ou Mode drapeau : drapeau.",
      helpMouse: ["Clic pour révéler une case, clic droit pour poser ou retirer un drapeau.", "Clic sur un chiffre déjà révélé : ouvre ses voisins si le bon nombre de drapeaux est posé autour."],
      helpTouch: ["Tap pour révéler une case, appui long pour poser ou retirer un drapeau.", "Le bouton Mode drapeau transforme chaque tap en drapeau, pratique sur petit écran.", "Tap sur un chiffre déjà révélé : ouvre ses voisins si le bon nombre de drapeaux est posé autour."],
      helpCommon: ["Un chiffre indique combien de mines touchent la case.", "Le premier clic ne tombe jamais sur une mine.", "Au clavier : flèches pour se déplacer, Entrée pour révéler, F pour un drapeau.", "La partie est gagnée quand toutes les cases sûres sont révélées."],
      win: "Gagné", lose: "Perdu", winText: "Grille dégagée en {t}.", loseText: "Une mine, après {t}.",
      cell: "Ligne {r}, colonne {c}", flagged: "drapeau", hidden: "cachée", mine: "mine", empty: "vide",
      up: "Haut", down: "Bas", left: "Gauche", right: "Droite"
    },
    en: {
      pageTitle: "Minesweeper - Lucas Boles", skip: "Skip to the game", back: "Back to the portfolio",
      title: "Minesweeper", lead: "Find every safe cell without hitting a mine.",
      levels: "Difficulty", easy: "Easy", medium: "Medium", hard: "Hard",
      minesLeft: "Mines left", time: "Time", flagMode: "Flag mode", newGame: "New game",
      board: "Minesweeper board", close: "Close", howTo: "How to play",
      hintMouse: "Click: reveal. Right click: flag.",
      hintTouch: "Tap: reveal. Long press or Flag mode: flag.",
      helpMouse: ["Click to reveal a cell, right click to place or remove a flag.", "Click a revealed number to open its neighbours once the right number of flags is around it."],
      helpTouch: ["Tap to reveal a cell, long press to place or remove a flag.", "Flag mode turns every tap into a flag, handy on a small screen.", "Tap a revealed number to open its neighbours once the right number of flags is around it."],
      helpCommon: ["A number tells how many mines touch that cell.", "The first click is never a mine.", "Keyboard: arrows to move, Enter to reveal, F to flag.", "You win once every safe cell is revealed."],
      win: "You win", lose: "Game over", winText: "Board cleared in {t}.", loseText: "Hit a mine after {t}.",
      cell: "Row {r}, column {c}", flagged: "flag", hidden: "hidden", mine: "mine", empty: "empty",
      up: "Up", down: "Down", left: "Left", right: "Right"
    }
  }[LANG];

  var LEVELS = { easy: { size: 9, mines: 10 }, medium: { size: 16, mines: 40 }, hard: { size: 22, mines: 99 } };
  var LONG_PRESS_MS = 450, MOVE_TOLERANCE = 10;

  var $ = function (id) { return document.getElementById(id); };
  var boardEl = $("ms-board"), minesEl = $("ms-mines"), timeEl = $("ms-time"), statusEl = $("ms-status");
  var flagModeBtn = $("ms-flag-mode"), endEl = $("ms-end");
  var coarse = window.matchMedia("(pointer: coarse)").matches;

  /* --- Textes et liens selon la langue ----------------------------------- */
  document.documentElement.lang = LANG;
  document.title = TEXT.pageTitle;
  document.querySelectorAll("[data-i18n]").forEach(function (el) { el.textContent = TEXT[el.dataset.i18n]; });
  document.querySelectorAll("[data-i18n-aria]").forEach(function (el) { el.setAttribute("aria-label", TEXT[el.dataset.i18nAria]); });
  document.querySelectorAll("[data-back]").forEach(function (a) { a.href = LANG === "en" ? "en/" : "./"; });
  var switcher = document.querySelector("[data-lang-switch]");
  switcher.textContent = LANG === "en" ? "FR" : "EN";
  switcher.href = LANG === "en" ? "?lang=fr" : "?lang=en";
  var helpList = $("ms-help-list");
  (coarse ? TEXT.helpTouch : TEXT.helpMouse).concat(TEXT.helpCommon).forEach(function (line) {
    var li = document.createElement("li");
    li.textContent = line;
    helpList.appendChild(li);
  });
  if (!coarse) flagModeBtn.hidden = true;

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
    statusEl.textContent = coarse ? TEXT.hintTouch : TEXT.hintMouse;
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
  }

  function act(i) {
    if (over) { showEnd(); return; }
    var cell = cells[i];
    if (cell.open) { if (cell.n) chord(i); return; }
    if (flagMode) toggleFlag(i); else reveal(i);
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

  /* --- Souris et tactile (Pointer Events) ------------------------------------ */
  var press = null, lastPointer = "mouse";
  function cellIndex(target) {
    var el = target.closest && target.closest(".ms-cell");
    return el ? Number(el.dataset.i) : -1;
  }

  boardEl.addEventListener("pointerdown", function (e) {
    lastPointer = e.pointerType;
    var i = cellIndex(e.target);
    if (i < 0 || e.button !== 0) return;
    press = { i: i, x: e.clientX, y: e.clientY, long: false, timer: null };
    if (e.pointerType !== "mouse") {
      press.timer = setTimeout(function () {
        press.long = true;
        toggleFlag(press.i);
        if (navigator.vibrate) navigator.vibrate(15);
      }, LONG_PRESS_MS);
    }
  });
  boardEl.addEventListener("pointermove", function (e) {
    if (!press) return;
    if (Math.abs(e.clientX - press.x) > MOVE_TOLERANCE || Math.abs(e.clientY - press.y) > MOVE_TOLERANCE) {
      clearTimeout(press.timer);
      press.moved = true;
    }
  });
  boardEl.addEventListener("pointerup", function (e) {
    if (!press) return;
    clearTimeout(press.timer);
    var p = press;
    press = null;
    if (p.long || p.moved || cellIndex(e.target) !== p.i) return;
    act(p.i);
  });
  boardEl.addEventListener("pointercancel", function () {
    if (press) clearTimeout(press.timer);
    press = null;
  });
  boardEl.addEventListener("contextmenu", function (e) {
    e.preventDefault();
    var i = cellIndex(e.target);
    if (i >= 0 && lastPointer === "mouse") toggleFlag(i);
  });
  // clavier : Entrée et Espace déclenchent un « click » sans pointeur (detail = 0)
  boardEl.addEventListener("click", function (e) {
    var i = cellIndex(e.target);
    if (i >= 0 && e.detail === 0) act(i);
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
    } else if (e.key === "f" || e.key === "F") {
      toggleFlag(i);
    }
  });

  /* --- Commandes ---------------------------------------------------------------- */
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
  var codePos = 0, codeFocus = null, eggCount = 0, eggLast = 0;

  function openCode() {
    codePos = 0;
    codeCard.classList.remove("is-ok", "is-wrong");
    codeFocus = document.activeElement;
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
  codeEl.addEventListener("click", function (e) { if (e.target === codeEl) closeCode(); });
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
