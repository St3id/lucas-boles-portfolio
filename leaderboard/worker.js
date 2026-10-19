/* Serveur du classement du démineur (Cloudflare Worker + base D1).
 *
 * Routes :
 *   POST /start   { level }                        -> { id, seed }
 *   POST /scores  { id, pseudo, token?, actions }  -> { timeMs, noflag, all, nf, token? }
 *                 all / nf : { improved, best, rank } (nf seulement pour une partie sans drapeau)
 *   GET  /scores?level=easy&cat=all|noflag         -> { scores: [{ pseudo, timeMs }] }
 *
 * Anti-triche : le serveur choisit la graine de chaque partie, rejoue la liste
 * des clics reçue (même code que le jeu, bloc CORE ci-dessous) et compare le temps
 * annoncé avec sa propre horloge. Un robot qui lit la grille reste possible :
 * c'est la limite d'un jeu qui tourne dans le navigateur.
 *
 * Modération : quand le top 3 d'un niveau change, un e-mail détaillé part vers
 * NOTIFY_EMAIL (service Resend, clé RESEND_API_KEY), avec les commandes SQL pour
 * retirer ou bannir le pseudo. Les mots de la table « bans » sont refusés dans
 * tout nouveau pseudo, sans republier ce code.
 *
 * Fichier autonome, à coller tel quel dans l'éditeur Cloudflare.
 * Le bloc CORE est recopié depuis assets/js/ms-core.js par tools/build.py :
 * ne pas le modifier ici.
 */

// --- CORE START
var MSCore = (function () {
  var LEVELS = { easy: { size: 9, mines: 10 }, medium: { size: 16, mines: 40 }, hard: { size: 22, mines: 99 } };

  // vrai niveau seulement : LEVELS["constructor"] ou LEVELS["__proto__"] existent aussi en JavaScript
  function isLevel(level) {
    return typeof level === "string" && Object.prototype.hasOwnProperty.call(LEVELS, level);
  }

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
    if (!isLevel(level) || !Array.isArray(actions) || !actions.length || actions.length > 5000) return { ok: false, why: "format" };
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

  return { LEVELS: LEVELS, isLevel: isLevel, rng: rng, neighbours: neighbours, makeBoard: makeBoard, replay: replay };
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
const SITE_URL = "https://st3id.github.io/lucas-boles-portfolio/minesweeper.html";
const LEVEL_NAME = { easy: "Facile", medium: "Moyen", hard: "Difficile" };

/* --- Pseudos -------------------------------------------------------------------- */
// alphabet latin (accents compris) et chiffres 0-9 seulement : pas de lettres
// d'autres alphabets qui imitent un pseudo existant (« Lucаs » avec un а cyrillique),
// pas de caractères invisibles ni de chiffres exotiques
const PSEUDO_RE = /^[\p{Script=Latin}0-9_.-]{3,16}$/u;
const RESERVED = ["admin", "administrateur", "moderateur", "moderator", "modo", "root", "system", "systeme",
  "lucasboles", "boles", "st3id", "anonyme", "anonymous", "null", "undefined", "constructor", "prototype"];
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

// mots ajoutés à la main dans la table « bans » (console D1) : refusés dans tout pseudo,
// en clair (« kodama » bloque « Kodama38 ») comme sous les variantes l33t ou doublées
export function isBanned(pseudo, words) {
  const plain = identityKey(pseudo), letters = pseudoKey(pseudo, true, true);
  return words.some((raw) => {
    if (typeof raw !== "string" || !raw.trim()) return false;
    const w = identityKey(raw.trim()), wl = pseudoKey(raw.trim(), true, true);
    return plain.includes(w) || (wl.length >= 3 && letters.includes(wl));
  });
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
      return db.prepare("SELECT key, display, token_hash, created_at FROM players WHERE key = ?1").bind(key).first();
    },
    insertPlayer(key, display, tokenHash, now) {
      return db.prepare("INSERT INTO players (key, display, token_hash, created_at) VALUES (?1, ?2, ?3, ?4)")
        .bind(key, display, tokenHash, now).run();
    },
    // un seul record par pseudo, niveau et catégorie : la ligne n'est remplacée
    // que par un temps meilleur
    getBest(playerKey, level, noflag) {
      return db.prepare("SELECT time_ms FROM bests WHERE player_key = ?1 AND level = ?2 AND noflag = ?3")
        .bind(playerKey, level, noflag ? 1 : 0).first();
    },
    saveBest(playerKey, level, noflag, timeMs, gameId, now) {
      return db.prepare(
        "INSERT INTO bests (player_key, level, noflag, time_ms, game_id, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6) " +
        "ON CONFLICT (player_key, level, noflag) DO UPDATE SET time_ms = excluded.time_ms, game_id = excluded.game_id, " +
        "updated_at = excluded.updated_at WHERE excluded.time_ms < bests.time_ms"
      ).bind(playerKey, level, noflag ? 1 : 0, timeMs, gameId, now).run();
    },
    async rank(level, noflag, timeMs) {
      // records strictement meilleurs, plus un
      const row = await db.prepare("SELECT COUNT(*) AS better FROM bests WHERE level = ?1 AND noflag = ?2 AND time_ms < ?3")
        .bind(level, noflag ? 1 : 0, timeMs).first();
      return row.better + 1;
    },
    async board(level, noflag, limit) {
      // à égalité, le premier à avoir réalisé le temps passe devant
      const res = await db.prepare(
        "SELECT p.display AS pseudo, b.time_ms AS timeMs FROM bests b JOIN players p ON p.key = b.player_key " +
        "WHERE b.level = ?1 AND b.noflag = ?2 ORDER BY b.time_ms ASC, b.updated_at ASC LIMIT ?3"
      ).bind(level, noflag ? 1 : 0, limit).all();
      return res.results;
    },
    // mots bannis à la main ; table absente (pas encore créée) : aucun
    async bans() {
      try {
        const res = await db.prepare("SELECT word FROM bans").all();
        return res.results.map((r) => r.word);
      } catch (e) {
        return [];
      }
    },
    async cleanup(now) {
      await db.prepare("DELETE FROM games WHERE created_at < ?1").bind(now - GAME_TTL_MS).run();
      await db.prepare("DELETE FROM hits WHERE minute < ?1").bind(Math.floor(now / 60000) - 60).run();
    }
  };
}

/* --- Traitement des requêtes ---------------------------------------------------- */
export async function handle(request, env, repo, now = Date.now(), ctx = null) {
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
    status,
    headers: {
      ...cors,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      // la réponse n'est que des données : jamais interprétée comme une page
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
      "Referrer-Policy": "no-referrer"
    }
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
      if (!body || !MSCore.isLevel(body.level)) return json({ error: "format" }, 400);
      const id = crypto.randomUUID();
      const seed = crypto.getRandomValues(new Uint32Array(1))[0];
      await repo.insertGame(id, body.level, seed, now);
      if (Math.random() < 0.02) await repo.cleanup(now);
      return json({ id, seed });
    }

    if (url.pathname === "/scores" && request.method === "GET") {
      if (await limited("read")) return json({ error: "rate" }, 429);
      const level = url.searchParams.get("level");
      if (!MSCore.isLevel(level)) return json({ error: "format" }, 400);
      const scores = await repo.board(level, url.searchParams.get("cat") === "noflag", BOARD_SIZE);
      return json({ scores });
    }

    if (url.pathname === "/scores" && request.method === "POST") {
      if (await limited("submit")) return json({ error: "rate" }, 429);
      const body = await readJson(request);
      if (!body || typeof body.id !== "string" || body.id.length > 64) return json({ error: "format" }, 400);

      const pseudoError = checkPseudo(body.pseudo);
      if (pseudoError) return json({ error: pseudoError }, 400);
      if (isBanned(body.pseudo, await repo.bans())) return json({ error: "pseudo-refused" }, 400);

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

      // record du joueur : remplacé seulement si ce temps est meilleur.
      // Si le top 3 change (arrivée, changement d'ordre), on le note pour l'e-mail.
      const changes = [];
      const keep = async (noflag) => {
        const before = await repo.getBest(key, game.level, noflag);
        const improved = !before || result.timeMs < before.time_ms;
        const top = improved ? await repo.board(game.level, noflag, 3) : null;
        if (improved) await repo.saveBest(key, game.level, noflag, result.timeMs, game.id, now);
        const best = improved ? result.timeMs : before.time_ms;
        const rank = await repo.rank(game.level, noflag, best);
        if (improved && rank <= 3) {
          const after = await repo.board(game.level, noflag, 3);
          if (after.map((x) => x.pseudo).join("|") !== top.map((x) => x.pseudo).join("|")) {
            changes.push({ noflag, rank, before: top, after, previous: before ? before.time_ms : null,
              players: (await repo.rank(game.level, noflag, Number.MAX_SAFE_INTEGER)) - 1 });
          }
        }
        return { improved, best, rank };
      };
      const all = await keep(false);
      const nf = result.noflag ? await keep(true) : null;
      if (changes.length) {
        const mail = topMail({ level: game.level, pseudo: body.pseudo, key, changes, timeMs: result.timeMs,
          count: result.count, noflag: result.noflag, since: player ? player.created_at : null, now });
        await later(ctx, sendMail(env, mail));
      }
      return json({ timeMs: result.timeMs, noflag: result.noflag, all, nf, token });
    }

    return json({ error: "not-found" }, 404);
  } catch (err) {
    return json({ error: "server" }, 500);
  }
}

/* --- E-mail de modération ------------------------------------------------------ */
function fmtTime(ms) {
  const tenths = Math.floor(ms / 100), s = Math.floor(tenths / 10);
  return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0") + "." + (tenths % 10);
}
const ord = (n) => (n === 1 ? "1er" : n + "e");
const sqlText = (v) => "'" + String(v).replace(/'/g, "''") + "'";
const parisDate = (ms) => new Date(ms).toLocaleString("fr-FR", { timeZone: "Europe/Paris" });

// texte de l'e-mail : nouveau top 3, ancien top 3, qui a remplacé qui, la partie,
// et les commandes prêtes à coller dans la console D1
export function topMail(info) {
  const level = LEVEL_NAME[info.level], first = info.changes[0];
  const cat = (c) => (c.noflag ? "Sans drapeau" : "Tous");
  const where = first.rank === 1 ? "prend la 1re place" : "entre à la " + ord(first.rank) + " place";
  const lines = [info.pseudo + " " + where + " en " + level + " (" + cat(first) + ") avec " + fmtTime(info.timeMs) + ".", ""];
  for (const c of info.changes) {
    lines.push("Nouveau top 3, " + level + ", " + cat(c) + " :");
    c.after.forEach((x, i) => {
      const was = c.before.findIndex((y) => y.pseudo === x.pseudo);
      const note = was < 0 ? "nouveau dans le top 3" : was > i ? "monte, était " + ord(was + 1)
        : was < i ? "descend, était " + ord(was + 1) : "";
      lines.push("  " + ord(i + 1) + "  " + x.pseudo + "  " + fmtTime(x.timeMs) + (note ? "  (" + note + ")" : ""));
    });
    c.before.forEach((y, i) => {
      if (!c.after.some((x) => x.pseudo === y.pseudo)) {
        lines.push("  Sort du top 3 : " + y.pseudo + " (était " + ord(i + 1) + ", " + fmtTime(y.timeMs) + ")");
      }
    });
    lines.push("Avant :");
    if (!c.before.length) lines.push("  personne");
    c.before.forEach((y, i) => lines.push("  " + ord(i + 1) + "  " + y.pseudo + "  " + fmtTime(y.timeMs)));
    lines.push("  " + c.players + " joueur" + (c.players > 1 ? "s classés" : " classé") + " dans cette catégorie.", "");
  }
  const secs = info.timeMs / 1000;
  lines.push("La partie :",
    "  Pseudo : " + info.pseudo + " (clé « " + info.key + " »), " +
      (info.since ? "inscrit depuis le " + parisDate(info.since) : "nouveau pseudo, créé avec cette partie"),
    "  Temps : " + fmtTime(info.timeMs) + (first.previous ? ", ancien record " + fmtTime(first.previous) : ", premier temps sur ce niveau"),
    "  Clics : " + info.count + (secs > 0 ? ", " + (info.count / secs).toFixed(1).replace(".", ",") + " par seconde" : "") +
      (info.noflag ? ", sans aucun drapeau" : ", avec des drapeaux"),
    "  Date : " + parisDate(info.now) + " (heure de Paris)", "");
  lines.push("Modération, dans la console D1 de la base « demineur » :",
    "  Retirer ce pseudo et ses temps :",
    "    DELETE FROM bests WHERE player_key = " + sqlText(info.key) + ";",
    "    DELETE FROM players WHERE key = " + sqlText(info.key) + ";",
    "  Le bannir (refusé dans tout nouveau pseudo, variantes comprises) :",
    "    INSERT OR IGNORE INTO bans (word) VALUES (" + sqlText(info.key) + ");", "",
    "Classement : " + SITE_URL);
  return {
    subject: "Démineur : " + info.pseudo + " " + where + " en " + level + " (" + fmtTime(info.timeMs) + ")",
    text: lines.join("\n")
  };
}

// envoi par Resend (https://resend.com) ; sans clé ni adresse, rien n'est envoyé.
// Une panne d'envoi ne touche jamais le classement.
async function sendMail(env, mail) {
  try {
    if (env.sendMail) return await env.sendMail(mail);   // tests
    if (!env.RESEND_API_KEY || !env.NOTIFY_EMAIL) return;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ from: env.MAIL_FROM || "Démineur <onboarding@resend.dev>", to: [env.NOTIFY_EMAIL],
        subject: mail.subject, text: mail.text })
    });
    if (!res.ok) console.log("e-mail non envoyé : " + res.status + " " + (await res.text()).slice(0, 200));
  } catch (e) {
    console.log("e-mail non envoyé : " + e.message);
  }
}

// travail après la réponse (Cloudflare) ; sans contexte (tests), on attend la fin
function later(ctx, promise) {
  if (ctx && ctx.waitUntil) { ctx.waitUntil(promise); return null; }
  return promise;
}

// corps JSON d'un objet simple, refusé avant lecture s'il annonce une taille excessive
async function readJson(request) {
  if (Number(request.headers.get("Content-Length") || 0) > MAX_BODY) return null;
  const text = await request.text();
  if (text.length > MAX_BODY) return null;
  try {
    const body = JSON.parse(text);
    return body && typeof body === "object" && !Array.isArray(body) ? body : null;
  } catch (e) {
    return null;
  }
}

export default {
  fetch(request, env, ctx) {
    return handle(request, env, d1Repo(env.DB), Date.now(), ctx);
  },
  // nettoyage quotidien (déclencheur « Cron » à ajouter dans Cloudflare)
  scheduled(event, env) {
    return d1Repo(env.DB).cleanup(Date.now());
  }
};
