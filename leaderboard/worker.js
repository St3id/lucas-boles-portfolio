/* Serveur du classement du démineur (Cloudflare Worker + base D1).
 *
 * Routes :
 *   POST /start   { level }                        -> { id, seed }
 *   POST /scores  { id, pseudo, token?, actions }  -> { rank, noflag, timeMs, token? }
 *   GET  /scores?level=easy&cat=all|noflag         -> { scores: [{ pseudo, timeMs }] }
 *
 * Anti-triche : le serveur choisit la graine de chaque partie, rejoue la liste
 * des clics reçue (même code que le jeu, bloc CORE ci-dessous) et compare le temps
 * annoncé avec sa propre horloge. Un robot qui lit la grille reste possible :
 * c'est la limite d'un jeu qui tourne dans le navigateur.
 *
 * Fichier autonome, à coller tel quel dans l'éditeur Cloudflare.
 * Le bloc CORE est recopié depuis assets/js/ms-core.js par tools/build.py :
 * ne pas le modifier ici.
 */

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

/* --- Réglages ---------------------------------------------------------------- */
const GAME_TTL_MS = 2 * 60 * 60 * 1000;   // une partie doit être envoyée dans les 2 h
const CLOCK_MARGIN_MS = 1500;             // tolérance entre l'horloge du joueur et la nôtre
const MIN_ACTION_GAP_MS = 40;             // en dessous, ce n'est plus une main humaine
const FLOOR_MS = { easy: 1000, medium: 6000, hard: 25000 };  // temps plancher par niveau
const RATE = { start: 30, submit: 10, read: 60 };             // requêtes par minute et par visiteur
const BOARD_SIZE = 20;
const MAX_BODY = 200000;

/* --- Pseudos -------------------------------------------------------------------- */
const PSEUDO_RE = /^[\p{L}\p{N}_.-]{3,16}$/u;
const RESERVED = ["admin", "administrateur", "moderateur", "moderator", "modo", "root", "system", "systeme",
  "lucasboles", "boles", "st3id", "anonyme", "anonymous", "null", "undefined"];
// mots refusés, français et anglais ; comparés après normalisation (voir pseudoKey)
const BANNED = [
  // français
  "connard", "connasse", "conne", "con", "salope", "salaud", "pute", "putain", "pouffiasse", "catin",
  "encule", "enculer", "batard", "bite", "couille", "chatte", "nique", "niquer", "ntm", "fdp", "pd",
  "pede", "tapette", "gouine", "negre", "negresse", "bougnoule", "youpin", "bamboula", "raton",
  "merde", "foutre", "branleur", "branlette", "suceur", "suceuse", "trouduc", "cul", "grognasse",
  "zizi", "teub", "chibre", "nazi", "hitler", "pedophile", "pedo", "viol", "violeur", "terroriste",
  // anglais
  "fuck", "fucker", "motherfucker", "shit", "bitch", "asshole", "ass", "dick", "cock", "pussy", "cunt",
  "whore", "slut", "bastard", "nigger", "nigga", "faggot", "fag", "retard", "rape", "rapist", "porn",
  "penis", "vagina", "wank", "twat", "prick", "dildo", "cum", "kkk", "isis"
];
// mots courts sans ambiguïté : refusés n'importe où (« xxfuckxx »)
const ANYWHERE = ["fuck", "shit", "nazi", "porn", "bitch", "whore", "pussy", "nigga", "slut", "kkk"];
// mots courts qui peuvent cacher un mot normal (« pute » dans « computer », « cunt »
// dans « Scunthorpe ») : refusés seulement en début ou en fin de pseudo
const EDGES = ["cunt", "pute", "fdp", "ntm", "merde"];
const LEET = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "9": "g", "@": "a", "$": "s", "!": "i" };

// clé de comparaison : minuscules, sans accents, chiffres « l33t » remplacés,
// seulement les lettres, sans lettres doublées (« connnard » -> « conard »)
function pseudoKey(pseudo, digitsAsLetters, dedup) {
  const key = pseudo.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[0-9@$!]/g, (c) => (digitsAsLetters ? LEET[c] || c : ""))
    .replace(/[^a-z]/g, "");
  return dedup ? key.replace(/(.)\1+/g, "$1") : key;
}
// clé d'identité : deux pseudos de même clé sont le même joueur
function identityKey(pseudo) {
  return pseudo.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function checkPseudo(pseudo) {
  if (typeof pseudo !== "string" || !PSEUDO_RE.test(pseudo)) return "pseudo-invalid";
  // quatre lectures du pseudo : chiffres lus comme des lettres (« c0nnard ») ou
  // retirés (« fdp38 »), lettres doublées réduites (« connnard ») ou gardées (« kkk »)
  const squeeze = (w) => w.replace(/(.)\1+/g, "$1");
  const readings = [];
  for (const digits of [true, false]) for (const dedup of [true, false]) {
    readings.push({ key: pseudoKey(pseudo, digits, dedup), word: dedup ? squeeze : (w) => w });
  }
  for (const { key, word } of readings) {
    if (RESERVED.some((r) => key === word(r))) return "pseudo-refused";
    for (const raw of BANNED) {
      const w = word(raw);
      if (w.length < 3) continue;   // « kkk » réduit à « k » bloquerait tout pseudo avec un k
      // mots longs et mots courts sans ambiguïté : n'importe où. Autres mots courts :
      // en entier seulement (pour ne pas bloquer « Calcul », « Conrad », « Technique »,
      // « Violon », « Dickens »), ou en début / fin de pseudo pour ceux de EDGES.
      const hit = w.length >= 6 || ANYWHERE.includes(raw) ? key.includes(w)
        : key === w || (EDGES.includes(raw) && (key.startsWith(w) || key.endsWith(w)));
      if (hit) return "pseudo-refused";
    }
  }
  return null;
}

/* --- Outils ------------------------------------------------------------------------ */
async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function randomHex(bytes) {
  return [...crypto.getRandomValues(new Uint8Array(bytes))].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* --- Accès à la base D1 ----------------------------------------------------------- */
export function d1Repo(db) {
  return {
    async hit(key, bucket, minute) {
      const row = await db.prepare(
        "INSERT INTO hits (key, bucket, minute, count) VALUES (?1, ?2, ?3, 1) " +
        "ON CONFLICT (key, bucket, minute) DO UPDATE SET count = count + 1 RETURNING count"
      ).bind(key, bucket, minute).first();
      return row.count;
    },
    insertGame(id, level, seed, now) {
      return db.prepare("INSERT INTO games (id, level, seed, created_at, used) VALUES (?1, ?2, ?3, ?4, 0)")
        .bind(id, level, seed, now).run();
    },
    getGame(id) {
      return db.prepare("SELECT id, level, seed, created_at, used FROM games WHERE id = ?1").bind(id).first();
    },
    async useGame(id) {
      const res = await db.prepare("UPDATE games SET used = 1 WHERE id = ?1 AND used = 0").bind(id).run();
      return res.meta.changes === 1;
    },
    getPlayer(key) {
      return db.prepare("SELECT key, display, token_hash FROM players WHERE key = ?1").bind(key).first();
    },
    insertPlayer(key, display, tokenHash, now) {
      return db.prepare("INSERT INTO players (key, display, token_hash, created_at) VALUES (?1, ?2, ?3, ?4)")
        .bind(key, display, tokenHash, now).run();
    },
    insertScore(gameId, playerKey, level, timeMs, noflag, now) {
      return db.prepare("INSERT INTO scores (game_id, player_key, level, time_ms, noflag, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)")
        .bind(gameId, playerKey, level, timeMs, noflag ? 1 : 0, now).run();
    },
    async rank(level, noflag, timeMs) {
      // joueurs dont le meilleur temps est strictement meilleur, plus un
      const row = await db.prepare(
        "SELECT COUNT(*) AS better FROM (SELECT player_key, MIN(time_ms) AS best FROM scores " +
        "WHERE level = ?1 AND (?2 = 0 OR noflag = 1) GROUP BY player_key) WHERE best < ?3"
      ).bind(level, noflag ? 1 : 0, timeMs).first();
      return row.better + 1;
    },
    async board(level, noflag, limit) {
      const res = await db.prepare(
        "SELECT p.display AS pseudo, MIN(s.time_ms) AS timeMs FROM scores s JOIN players p ON p.key = s.player_key " +
        "WHERE s.level = ?1 AND (?2 = 0 OR s.noflag = 1) GROUP BY s.player_key ORDER BY timeMs ASC LIMIT ?3"
      ).bind(level, noflag ? 1 : 0, limit).all();
      return res.results;
    },
    async cleanup(now) {
      await db.prepare("DELETE FROM games WHERE created_at < ?1").bind(now - GAME_TTL_MS).run();
      await db.prepare("DELETE FROM hits WHERE minute < ?1").bind(Math.floor(now / 60000) - 60).run();
    }
  };
}

/* --- Traitement des requêtes ---------------------------------------------------- */
export async function handle(request, env, repo, now = Date.now()) {
  const allowed = (env.ALLOWED_ORIGINS || "https://st3id.github.io").split(",").map((s) => s.trim());
  const origin = request.headers.get("Origin") || "";
  const cors = {
    "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0],
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
  const json = (body, status = 200) => new Response(JSON.stringify(body), {
    status, headers: { ...cors, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  const url = new URL(request.url);
  // l'adresse IP ne sert qu'à limiter les abus, et seulement sous forme d'empreinte
  const visitor = (await sha256((request.headers.get("CF-Connecting-IP") || "local") + (env.SALT || ""))).slice(0, 32);
  const minute = Math.floor(now / 60000);
  const limited = async (bucket) => (await repo.hit(visitor, bucket, minute)) > RATE[bucket];

  try {
    if (url.pathname === "/start" && request.method === "POST") {
      if (await limited("start")) return json({ error: "rate" }, 429);
      const body = await readJson(request);
      if (!body || !MSCore.LEVELS[body.level]) return json({ error: "format" }, 400);
      const id = crypto.randomUUID();
      const seed = crypto.getRandomValues(new Uint32Array(1))[0];
      await repo.insertGame(id, body.level, seed, now);
      if (Math.random() < 0.02) await repo.cleanup(now);
      return json({ id, seed });
    }

    if (url.pathname === "/scores" && request.method === "GET") {
      if (await limited("read")) return json({ error: "rate" }, 429);
      const level = url.searchParams.get("level");
      if (!MSCore.LEVELS[level]) return json({ error: "format" }, 400);
      const scores = await repo.board(level, url.searchParams.get("cat") === "noflag", BOARD_SIZE);
      return json({ scores });
    }

    if (url.pathname === "/scores" && request.method === "POST") {
      if (await limited("submit")) return json({ error: "rate" }, 429);
      const body = await readJson(request);
      if (!body || typeof body.id !== "string") return json({ error: "format" }, 400);

      const pseudoError = checkPseudo(body.pseudo);
      if (pseudoError) return json({ error: pseudoError }, 400);

      const game = await repo.getGame(body.id);
      if (!game || game.used || now - game.created_at > GAME_TTL_MS) return json({ error: "expired" }, 400);

      const result = MSCore.replay(game.level, game.seed, body.actions);
      if (!result.ok) return json({ error: "replay", why: result.why }, 400);
      // temps plancher, horloge du serveur, cadence humaine
      if (result.timeMs < FLOOR_MS[game.level] ||
          result.timeMs > now - game.created_at + CLOCK_MARGIN_MS ||
          (result.count > 1 && result.timeMs / (result.count - 1) < MIN_ACTION_GAP_MS)) {
        return json({ error: "too-fast" }, 400);
      }

      // un pseudo appartient à celui qui l'a pris en premier (jeton gardé dans son navigateur)
      const key = identityKey(body.pseudo);
      const player = await repo.getPlayer(key);
      let token = null;
      if (player) {
        if (typeof body.token !== "string" || (await sha256(body.token)) !== player.token_hash) return json({ error: "pseudo-taken" }, 409);
      } else {
        token = randomHex(24);
        await repo.insertPlayer(key, body.pseudo, await sha256(token), now);
      }

      if (!(await repo.useGame(game.id))) return json({ error: "expired" }, 400);
      await repo.insertScore(game.id, key, game.level, result.timeMs, result.noflag, now);
      const rank = await repo.rank(game.level, false, result.timeMs);
      const rankNoflag = result.noflag ? await repo.rank(game.level, true, result.timeMs) : null;
      return json({ rank, rankNoflag, noflag: result.noflag, timeMs: result.timeMs, token });
    }

    return json({ error: "not-found" }, 404);
  } catch (err) {
    return json({ error: "server" }, 500);
  }
}

async function readJson(request) {
  const text = await request.text();
  if (text.length > MAX_BODY) return null;
  try { return JSON.parse(text); } catch (e) { return null; }
}

export default {
  fetch(request, env) {
    return handle(request, env, d1Repo(env.DB));
  },
  // nettoyage quotidien (déclencheur « Cron » à ajouter dans Cloudflare)
  scheduled(event, env) {
    return d1Repo(env.DB).cleanup(Date.now());
  }
};
