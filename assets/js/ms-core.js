/* Cœur du démineur : génération de la grille et vérification d'une partie.
   Le même code tourne dans le navigateur et sur le serveur du classement :
   tools/build.py recopie le bloc ci-dessous dans leaderboard/worker.js.
   Ne rien mettre ici qui dépende du navigateur. */
// --- CORE START
var MSCore = (function () {
  var LEVELS = { easy: { size: 9, mines: 10 }, medium: { size: 16, mines: 40 }, hard: { size: 22, mines: 99 } };

  // générateur pseudo-aléatoire déterministe (mulberry32) : même graine, même grille
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function neighbours(i, size) {
    var r = Math.floor(i / size), c = i % size, out = [];
    for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      var rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < size && cc >= 0 && cc < size) out.push(rr * size + cc);
    }
    return out;
  }

  // mines placées après le premier clic : jamais sur lui ni autour de lui
  function makeBoard(level, seed, first) {
    var L = LEVELS[level], size = L.size, total = size * size, rand = rng(seed);
    var safe = neighbours(first, size).concat(first), pool = [], i;
    for (i = 0; i < total; i++) if (safe.indexOf(i) === -1) pool.push(i);
    for (var k = pool.length - 1; k > 0; k--) {
      var j = Math.floor(rand() * (k + 1)), t = pool[k];
      pool[k] = pool[j];
      pool[j] = t;
    }
    var mine = [];
    for (i = 0; i < total; i++) mine.push(false);
    for (i = 0; i < L.mines; i++) mine[pool[i]] = true;
    var n = mine.map(function (_, idx) {
      return neighbours(idx, size).filter(function (nb) { return mine[nb]; }).length;
    });
    return { size: size, mines: L.mines, mine: mine, n: n };
  }

  /* Rejoue une partie. actions : [{ a: "r" | "f" | "c", i: case, t: ms depuis le
     premier clic }] (r : révéler, f : drapeau posé ou retiré, c : clic sur un
     chiffre). La première action est la révélation qui lance le chrono (t = 0).
     Renvoie { ok, timeMs, noflag, count } ou { ok: false, why }. */
  function replay(level, seed, actions) {
    if (!LEVELS[level] || !Array.isArray(actions) || !actions.length || actions.length > 5000) return { ok: false, why: "format" };
    var size = LEVELS[level].size, total = size * size;
    var valid = function (x) {
      return x && (x.a === "r" || x.a === "f" || x.a === "c") && Number.isInteger(x.i) && x.i >= 0 && x.i < total &&
        Number.isInteger(x.t) && x.t >= 0;
    };
    if (!valid(actions[0]) || actions[0].a !== "r" || actions[0].t !== 0) return { ok: false, why: "first" };
    var b = makeBoard(level, seed, actions[0].i);
    var open = [], flag = [], opened = 0, flagsUsed = 0, last = 0, won = false, i;
    for (i = 0; i < total; i++) { open.push(false); flag.push(false); }

    function reveal(start) {
      if (open[start] || flag[start]) return true;
      if (b.mine[start]) return false;
      var queue = [start];
      while (queue.length) {
        var k = queue.shift();
        if (open[k] || flag[k]) continue;
        open[k] = true;
        opened++;
        if (b.n[k] === 0) neighbours(k, size).forEach(function (nb) { if (!open[nb]) queue.push(nb); });
      }
      return true;
    }

    for (i = 0; i < actions.length; i++) {
      var x = actions[i];
      if (won) return { ok: false, why: "after-win" };
      if (!valid(x) || x.t < last) return { ok: false, why: "action" };
      last = x.t;
      if (x.a === "r") {
        if (!reveal(x.i)) return { ok: false, why: "mine" };
      } else if (x.a === "f") {
        if (open[x.i]) return { ok: false, why: "action" };
        flag[x.i] = !flag[x.i];
        if (flag[x.i]) flagsUsed++;
      } else {
        if (!open[x.i] || !b.n[x.i]) return { ok: false, why: "action" };
        var around = neighbours(x.i, size);
        if (around.filter(function (nb) { return flag[nb]; }).length !== b.n[x.i]) return { ok: false, why: "action" };
        for (var m = 0; m < around.length; m++) {
          if (!open[around[m]] && !flag[around[m]] && !reveal(around[m])) return { ok: false, why: "mine" };
        }
      }
      if (opened === total - b.mines) won = true;
    }
    if (!won) return { ok: false, why: "not-won" };
    return { ok: true, timeMs: last, noflag: flagsUsed === 0, count: actions.length };
  }

  return { LEVELS: LEVELS, rng: rng, neighbours: neighbours, makeBoard: makeBoard, replay: replay };
})();
// --- CORE END
